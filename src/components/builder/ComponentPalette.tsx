"use client";

import { COMPONENT_DEFINITIONS, type BuilderComponentType } from "./builder-types";
import { useState } from "react";

interface ComponentPaletteProps {
  onAddComponent: (type: BuilderComponentType) => void;
}

const CATEGORIES = [
  { id: "layout", label: "Layout" },
  { id: "content", label: "Content" },
  { id: "conversion", label: "Conversion" },
  { id: "social-proof", label: "Social Proof" },
] as const;

export default function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = activeCategory === "all"
    ? COMPONENT_DEFINITIONS
    : COMPONENT_DEFINITIONS.filter((d) => d.category === activeCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: "#8888aa", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
        Components
      </h3>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {[{ id: "all", label: "All" }, ...CATEGORIES].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "none",
              background: activeCategory === cat.id ? "#00ca6b" : "#242438",
              color: activeCategory === cat.id ? "#fff" : "#8888aa",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Component grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {filtered.map((def) => (
          <button
            key={def.type}
            onClick={() => onAddComponent(def.type)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("builder-component-type", def.type);
              e.dataTransfer.effectAllowed = "copy";
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 6px",
              borderRadius: 8,
              border: "1px solid #2a2a40",
              background: "#1a1a2e",
              color: "#ccc",
              cursor: "grab",
              fontSize: 11,
              textAlign: "center",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00ca6b";
              e.currentTarget.style.background = "#242438";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a40";
              e.currentTarget.style.background = "#1a1a2e";
            }}
          >
            <span style={{ fontSize: 20 }}>{def.icon}</span>
            <span style={{ fontWeight: 500 }}>{def.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
