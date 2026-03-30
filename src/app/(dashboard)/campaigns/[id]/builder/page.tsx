"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";
import { type BuilderPageData, type BuilderComponentType, getComponentDefinition, getDefaultPageData } from "@/components/builder/builder-types";
import BuilderCanvas from "@/components/builder/BuilderCanvas";
import ComponentPalette from "@/components/builder/ComponentPalette";
import PropertiesPanel from "@/components/builder/PropertiesPanel";
import { ArrowLeft, Save, Eye, Undo2, Redo2, Smartphone, Monitor } from "lucide-react";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaignName, setCampaignName] = useState("");
  const [campaignSlug, setCampaignSlug] = useState("");
  const [variantId, setVariantId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState("");
  const [pageData, setPageData] = useState<BuilderPageData>(getDefaultPageData());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");

  // Undo/Redo
  const [history, setHistory] = useState<BuilderPageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((data: BuilderPageData) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(data)));
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPageData(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPageData(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Load campaign and variant data
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name, slug")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        setCampaignName(campaign.name);
        setCampaignSlug(campaign.slug);
      }

      // Get first variant or the one with builder data
      const { data: variants } = await supabase
        .from("variants")
        .select("id, name, custom_fields")
        .eq("campaign_id", campaignId)
        .order("is_control", { ascending: false })
        .limit(1);

      if (variants && variants.length > 0) {
        const v = variants[0];
        setVariantId(v.id);
        setVariantName(v.name);

        const fields = v.custom_fields as Record<string, unknown> | null;
        if (fields && fields.builder_data) {
          const data = fields.builder_data as BuilderPageData;
          setPageData(data);
          setHistory([JSON.parse(JSON.stringify(data))]);
          setHistoryIndex(0);
        } else {
          const defaultData = getDefaultPageData();
          setHistory([JSON.parse(JSON.stringify(defaultData))]);
          setHistoryIndex(0);
        }
      }

      setLoading(false);
    }
    load();
  }, [campaignId]);

  // ─── Actions ──────────────────────────────────────────

  const updatePageData = (newData: BuilderPageData) => {
    setPageData(newData);
    pushHistory(newData);
  };

  const addComponent = (type: BuilderComponentType) => {
    const def = getComponentDefinition(type);
    if (!def) return;
    const newComponent = {
      id: nanoid(8),
      type,
      props: { ...def.defaultProps },
    };
    const newData = { ...pageData, components: [...pageData.components, newComponent] };
    updatePageData(newData);
    setSelectedId(newComponent.id);
  };

  const dropNewComponent = (type: BuilderComponentType, index: number) => {
    const def = getComponentDefinition(type);
    if (!def) return;
    const newComponent = {
      id: nanoid(8),
      type,
      props: { ...def.defaultProps },
    };
    const newComponents = [...pageData.components];
    newComponents.splice(index, 0, newComponent);
    const newData = { ...pageData, components: newComponents };
    updatePageData(newData);
    setSelectedId(newComponent.id);
  };

  const updateComponent = (id: string, props: Record<string, unknown>) => {
    const newData = {
      ...pageData,
      components: pageData.components.map((c) => c.id === id ? { ...c, props } : c),
    };
    updatePageData(newData);
  };

  const deleteComponent = (id: string) => {
    const newData = {
      ...pageData,
      components: pageData.components.filter((c) => c.id !== id),
    };
    if (selectedId === id) setSelectedId(null);
    updatePageData(newData);
  };

  const duplicateComponent = (id: string) => {
    const idx = pageData.components.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const original = pageData.components[idx];
    const newComponent = {
      ...original,
      id: nanoid(8),
      props: { ...original.props },
    };
    const newComponents = [...pageData.components];
    newComponents.splice(idx + 1, 0, newComponent);
    const newData = { ...pageData, components: newComponents };
    updatePageData(newData);
    setSelectedId(newComponent.id);
  };

  const moveComponent = (id: string, direction: "up" | "down") => {
    const idx = pageData.components.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= pageData.components.length) return;
    const newComponents = [...pageData.components];
    [newComponents[idx], newComponents[newIdx]] = [newComponents[newIdx], newComponents[idx]];
    const newData = { ...pageData, components: newComponents };
    updatePageData(newData);
  };

  const reorderComponents = (activeId: string, overId: string) => {
    const oldIndex = pageData.components.findIndex((c) => c.id === activeId);
    const newIndex = pageData.components.findIndex((c) => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newComponents = [...pageData.components];
    const [moved] = newComponents.splice(oldIndex, 1);
    newComponents.splice(newIndex, 0, moved);
    const newData = { ...pageData, components: newComponents };
    updatePageData(newData);
  };

  const updateGlobalStyles = (styles: Partial<BuilderPageData["globalStyles"]>) => {
    const newData = { ...pageData, globalStyles: { ...pageData.globalStyles, ...styles } };
    updatePageData(newData);
  };

  const handleSave = async () => {
    if (!variantId) return;
    setSaving(true);
    const supabase = createClient();

    // Save builder_data into custom_fields
    const { data: variant } = await supabase
      .from("variants")
      .select("custom_fields")
      .eq("id", variantId)
      .single();

    const existingFields = (variant?.custom_fields as Record<string, unknown>) || {};

    await supabase
      .from("variants")
      .update({
        custom_fields: { ...existingFields, builder_data: pageData },
      })
      .eq("id", variantId);

    // Also update the campaign template to custom-builder if not already
    await supabase
      .from("campaigns")
      .update({ template: "custom-builder" })
      .eq("id", campaignId);

    setSaving(false);
  };

  const selectedComponent = selectedId
    ? pageData.components.find((c) => c.id === selectedId) ?? null
    : null;

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "#666688" }}>Loading builder...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", margin: "-24px -32px", background: "#0f0f1a" }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px",
        background: "#1a1a2e",
        borderBottom: "1px solid #2a2a40",
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(`/campaigns/${campaignId}`)}
            style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{campaignName}</span>
            <span style={{ fontSize: 12, color: "#666688", marginLeft: 8 }}>{variantName}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Undo/Redo */}
          <button onClick={undo} disabled={historyIndex <= 0} style={{ background: "#242438", border: "1px solid #2a2a40", borderRadius: 6, padding: "5px 8px", color: historyIndex <= 0 ? "#444" : "#8888aa", cursor: "pointer", display: "flex" }}>
            <Undo2 size={16} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} style={{ background: "#242438", border: "1px solid #2a2a40", borderRadius: 6, padding: "5px 8px", color: historyIndex >= history.length - 1 ? "#444" : "#8888aa", cursor: "pointer", display: "flex" }}>
            <Redo2 size={16} />
          </button>

          <div style={{ width: 1, height: 20, background: "#2a2a40" }} />

          {/* View mode */}
          <button onClick={() => setViewMode("mobile")} style={{
            background: viewMode === "mobile" ? "#242438" : "transparent", border: "1px solid #2a2a40", borderRadius: 6,
            padding: "5px 8px", color: viewMode === "mobile" ? "#00ca6b" : "#666", cursor: "pointer", display: "flex",
          }}>
            <Smartphone size={16} />
          </button>
          <button onClick={() => setViewMode("desktop")} style={{
            background: viewMode === "desktop" ? "#242438" : "transparent", border: "1px solid #2a2a40", borderRadius: 6,
            padding: "5px 8px", color: viewMode === "desktop" ? "#00ca6b" : "#666", cursor: "pointer", display: "flex",
          }}>
            <Monitor size={16} />
          </button>

          <div style={{ width: 1, height: 20, background: "#2a2a40" }} />

          {/* Preview */}
          <a
            href={`/lp/${campaignSlug}?preview=${variantId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", background: "#242438", color: "#8888aa",
              border: "1px solid #2a2a40", borderRadius: 6, fontSize: 12, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <Eye size={14} /> Preview
          </a>

          {/* Save */}
          <button onClick={handleSave} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 16px", background: "#00ca6b", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main builder area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel — Components */}
        <div style={{
          width: 220,
          background: "#1a1a2e",
          borderRight: "1px solid #2a2a40",
          padding: 12,
          overflowY: "auto",
          flexShrink: 0,
        }}>
          <ComponentPalette onAddComponent={addComponent} />
        </div>

        {/* Center — Canvas */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
        }}>
          <div style={{
            maxWidth: viewMode === "mobile" ? 480 : 1024,
            margin: "0 auto",
            transition: "max-width 0.3s",
          }}>
            <BuilderCanvas
              pageData={pageData}
              selectedId={selectedId}
              onSelectComponent={setSelectedId}
              onReorder={reorderComponents}
              onDeleteComponent={deleteComponent}
              onDropNewComponent={dropNewComponent}
            />
          </div>
        </div>

        {/* Right panel — Properties */}
        <div style={{
          width: 280,
          background: "#1a1a2e",
          borderLeft: "1px solid #2a2a40",
          padding: 12,
          overflowY: "auto",
          flexShrink: 0,
        }}>
          <PropertiesPanel
            selectedComponent={selectedComponent}
            pageData={pageData}
            onUpdateComponent={updateComponent}
            onDeleteComponent={deleteComponent}
            onDuplicateComponent={duplicateComponent}
            onMoveComponent={moveComponent}
            onUpdateGlobalStyles={updateGlobalStyles}
          />
        </div>
      </div>
    </div>
  );
}
