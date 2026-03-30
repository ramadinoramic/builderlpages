"use client";

import { type BuilderComponent, type BuilderPageData, type PropField, getComponentDefinition } from "./builder-types";
import { Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";

interface PropertiesPanelProps {
  selectedComponent: BuilderComponent | null;
  pageData: BuilderPageData;
  onUpdateComponent: (id: string, props: Record<string, unknown>) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onMoveComponent: (id: string, direction: "up" | "down") => void;
  onUpdateGlobalStyles: (styles: Partial<BuilderPageData["globalStyles"]>) => void;
}

export default function PropertiesPanel({
  selectedComponent,
  pageData,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onMoveComponent,
  onUpdateGlobalStyles,
}: PropertiesPanelProps) {
  if (!selectedComponent) {
    return <GlobalStylesEditor globalStyles={pageData.globalStyles} onUpdate={onUpdateGlobalStyles} />;
  }

  const def = getComponentDefinition(selectedComponent.type);
  if (!def) return null;

  const handleChange = (key: string, value: unknown) => {
    onUpdateComponent(selectedComponent.id, { ...selectedComponent.props, [key]: value });
  };

  // For features/faq/logo-bar, we need a special items editor
  const hasComplexItems = ["features", "faq", "logo-bar"].includes(selectedComponent.type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>
          {def.icon} {def.label}
        </h3>
        <div style={{ display: "flex", gap: 4 }}>
          <IconButton onClick={() => onMoveComponent(selectedComponent.id, "up")} title="Move Up">
            <ChevronUp size={14} />
          </IconButton>
          <IconButton onClick={() => onMoveComponent(selectedComponent.id, "down")} title="Move Down">
            <ChevronDown size={14} />
          </IconButton>
          <IconButton onClick={() => onDuplicateComponent(selectedComponent.id)} title="Duplicate">
            <Copy size={14} />
          </IconButton>
          <IconButton onClick={() => onDeleteComponent(selectedComponent.id)} title="Delete" danger>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {/* Props */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {def.propsSchema.map((field) => (
          <PropFieldEditor
            key={field.key}
            field={field}
            value={selectedComponent.props[field.key]}
            onChange={(val) => handleChange(field.key, val)}
          />
        ))}
      </div>

      {/* Complex items editor */}
      {hasComplexItems && (
        <ComplexItemsEditor
          type={selectedComponent.type}
          items={selectedComponent.props.items as unknown[]}
          onChange={(items) => handleChange("items", items)}
        />
      )}
    </div>
  );
}

function PropFieldEditor({ field, value, onChange }: { field: PropField; value: unknown; onChange: (val: unknown) => void }) {
  const labelEl = (
    <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#8888aa", marginBottom: 4 }}>
      {field.label}
    </label>
  );

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    background: "#242438",
    border: "1px solid #2a2a40",
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    boxSizing: "border-box",
  };

  switch (field.type) {
    case "text":
    case "url":
      return (
        <div>
          {labelEl}
          <input
            type={field.type === "url" ? "url" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            style={inputBase}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          {labelEl}
          <textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            style={{ ...inputBase, resize: "vertical" }}
          />
        </div>
      );

    case "number":
      return (
        <div>
          {labelEl}
          <input
            type="number"
            value={value !== undefined ? Number(value) : 0}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ ...inputBase, width: 80 }}
          />
        </div>
      );

    case "color":
      return (
        <div>
          {labelEl}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="color"
              value={(value as string) || "#ffffff"}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 32, height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "transparent", padding: 0 }}
            />
            <input
              type="text"
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
              style={{ ...inputBase, flex: 1, fontFamily: "monospace" }}
            />
          </div>
        </div>
      );

    case "select":
      return (
        <div>
          {labelEl}
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputBase, cursor: "pointer" }}
          >
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case "range":
      return (
        <div>
          {labelEl}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              value={value !== undefined ? Number(value) : field.min ?? 0}
              onChange={(e) => onChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#00ca6b" }}
            />
            <span style={{ fontSize: 11, color: "#8888aa", fontFamily: "monospace", minWidth: 32, textAlign: "right" }}>
              {value !== undefined ? Number(value) : field.min ?? 0}
            </span>
          </div>
        </div>
      );

    case "toggle":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: "#8888aa" }}>{field.label}</label>
          <button
            onClick={() => onChange(!value)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              border: "none",
              background: value ? "#00ca6b" : "#2a2a40",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 2,
              left: value ? 18 : 2,
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      );

    case "list": {
      const items = Array.isArray(value) ? value : [];
      return (
        <div>
          {labelEl}
          <textarea
            value={items.join("\n")}
            onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
            rows={3}
            placeholder="One item per line"
            style={{ ...inputBase, resize: "vertical" }}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

function ComplexItemsEditor({ type, items, onChange }: {
  type: string;
  items: unknown[];
  onChange: (items: unknown[]) => void;
}) {
  const safeItems = Array.isArray(items) ? items : [];

  const addItem = () => {
    if (type === "features") {
      onChange([...safeItems, { icon: "⭐", title: "New Feature", desc: "Description" }]);
    } else if (type === "faq") {
      onChange([...safeItems, { question: "New Question?", answer: "Answer here." }]);
    } else if (type === "logo-bar") {
      onChange([...safeItems, { src: "", label: "New Brand" }]);
    }
  };

  const updateItem = (index: number, updated: unknown) => {
    const newItems = [...safeItems];
    newItems[index] = updated;
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(safeItems.filter((_, i) => i !== index));
  };

  return (
    <div style={{ borderTop: "1px solid #2a2a40", paddingTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#8888aa", textTransform: "uppercase" }}>Items</label>
        <button onClick={addItem} style={{
          padding: "3px 8px", background: "#00ca6b", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer",
        }}>
          + Add
        </button>
      </div>
      {safeItems.map((item, i) => {
        const obj = item as Record<string, string>;
        return (
          <div key={i} style={{ background: "#242438", borderRadius: 6, padding: 8, marginBottom: 6, position: "relative" }}>
            <button
              onClick={() => removeItem(i)}
              style={{ position: "absolute", top: 4, right: 4, background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 12 }}
            >
              ✕
            </button>
            {Object.keys(obj).map((key) => (
              <div key={key} style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 10, color: "#666", textTransform: "capitalize" }}>{key}</label>
                <input
                  value={obj[key] || ""}
                  onChange={(e) => updateItem(i, { ...obj, [key]: e.target.value })}
                  style={{
                    width: "100%", padding: "4px 8px", background: "#1a1a2e", border: "1px solid #2a2a40",
                    borderRadius: 4, color: "#fff", fontSize: 11, boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function GlobalStylesEditor({ globalStyles, onUpdate }: {
  globalStyles: BuilderPageData["globalStyles"];
  onUpdate: (styles: Partial<BuilderPageData["globalStyles"]>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: "#8888aa", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
        Page Settings
      </h3>
      <p style={{ fontSize: 11, color: "#666688", margin: 0 }}>Select a component to edit its properties, or configure global page settings below.</p>

      <PropFieldEditor
        field={{ key: "backgroundColor", label: "Background Color", type: "color" }}
        value={globalStyles.backgroundColor}
        onChange={(val) => onUpdate({ backgroundColor: val as string })}
      />
      <PropFieldEditor
        field={{ key: "textColor", label: "Text Color", type: "color" }}
        value={globalStyles.textColor}
        onChange={(val) => onUpdate({ textColor: val as string })}
      />
      <PropFieldEditor
        field={{ key: "accentColor", label: "Accent Color", type: "color" }}
        value={globalStyles.accentColor}
        onChange={(val) => onUpdate({ accentColor: val as string })}
      />
      <PropFieldEditor
        field={{ key: "maxWidth", label: "Max Width (px)", type: "range", min: 320, max: 1200, step: 40 }}
        value={globalStyles.maxWidth}
        onChange={(val) => onUpdate({ maxWidth: val as number })}
      />
      <PropFieldEditor
        field={{ key: "fontFamily", label: "Font Family", type: "select", options: [
          { label: "Inter", value: "'Inter', sans-serif" },
          { label: "System UI", value: "system-ui, sans-serif" },
          { label: "Georgia", value: "Georgia, serif" },
          { label: "Roboto", value: "'Roboto', sans-serif" },
        ]}}
        value={globalStyles.fontFamily}
        onChange={(val) => onUpdate({ fontFamily: val as string })}
      />
    </div>
  );
}

function IconButton({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: 4,
        background: "#242438",
        border: "1px solid #2a2a40",
        borderRadius: 4,
        color: danger ? "#ff6b6b" : "#8888aa",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}
