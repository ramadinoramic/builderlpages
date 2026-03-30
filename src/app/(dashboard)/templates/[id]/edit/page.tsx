"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type HtmlTemplate, type EditableRegion, type HtmlOverrides } from "@/lib/html-template-types";
import { ArrowLeft, Save, MousePointer, Undo2 } from "lucide-react";

export default function VisualEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = params.id as string;
  const variantId = searchParams.get("variant");
  // campaignId available from searchParams.get("campaign") if needed

  const [template, setTemplate] = useState<HtmlTemplate | null>(null);
  const [overrides, setOverrides] = useState<HtmlOverrides>({});
  const [selectedRegion, setSelectedRegion] = useState<EditableRegion | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load template and existing overrides
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: tmpl } = await supabase
        .from("html_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (tmpl) {
        setTemplate(tmpl as HtmlTemplate);
      }

      // Load existing overrides from variant if specified
      if (variantId) {
        const { data: variant } = await supabase
          .from("variants")
          .select("custom_fields")
          .eq("id", variantId)
          .single();

        const fields = variant?.custom_fields as Record<string, unknown> | null;
        if (fields?.html_overrides) {
          setOverrides(fields.html_overrides as HtmlOverrides);
        }
      }

      setLoading(false);
    }
    load();
  }, [templateId, variantId]);

  const getPreviewHtml = useCallback(() => {
    if (!template) return "";

    let html = template.html_content;
    if (template.css_content) {
      const styleTag = `<style>${template.css_content}</style>`;
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${styleTag}</head>`);
      } else {
        html = styleTag + html;
      }
    }

    // Inject the editing overlay script
    const editorScript = `
<style>
  [data-region-highlight] {
    outline: 2px dashed rgba(0, 202, 107, 0.6) !important;
    outline-offset: 2px;
    cursor: pointer !important;
    position: relative;
  }
  [data-region-highlight]:hover {
    outline: 2px solid #00ca6b !important;
    background: rgba(0, 202, 107, 0.05) !important;
  }
  [data-region-highlight]::after {
    content: attr(data-region-label);
    position: absolute;
    top: -20px;
    left: 0;
    background: #00ca6b;
    color: white;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    white-space: nowrap;
    font-family: sans-serif;
    z-index: 10000;
    pointer-events: none;
  }
  [data-region-selected] {
    outline: 3px solid #00ca6b !important;
    background: rgba(0, 202, 107, 0.08) !important;
  }
</style>
<script>
(function() {
  var overrides = ${JSON.stringify(overrides)};
  var regions = ${JSON.stringify(template.editable_regions || [])};

  // Apply current overrides
  regions.forEach(function(region) {
    var value = overrides[region.id];
    if (!value) return;
    var els = document.querySelectorAll(region.selector);
    els.forEach(function(el) {
      switch (region.type) {
        case 'text': case 'html': el.innerHTML = value; break;
        case 'image':
          if (el.tagName === 'IMG') el.src = value;
          else el.style.backgroundImage = 'url(' + value + ')';
          break;
        case 'background-image': el.style.backgroundImage = 'url(' + value + ')'; break;
        case 'link': if (el.tagName === 'A') el.href = value; break;
        case 'color': el.style.backgroundColor = value; break;
      }
    });
  });

  // Highlight mode handler
  window.addEventListener('message', function(e) {
    if (e.data.type === 'toggle-highlights') {
      regions.forEach(function(region) {
        var els = document.querySelectorAll(region.selector);
        els.forEach(function(el) {
          if (e.data.enabled) {
            el.setAttribute('data-region-highlight', '');
            el.setAttribute('data-region-label', region.label);
            el.setAttribute('data-region-id', region.id);
          } else {
            el.removeAttribute('data-region-highlight');
            el.removeAttribute('data-region-label');
          }
        });
      });
    }
    if (e.data.type === 'select-region') {
      document.querySelectorAll('[data-region-selected]').forEach(function(el) {
        el.removeAttribute('data-region-selected');
      });
      if (e.data.regionId) {
        var els = document.querySelectorAll('[data-region-id="' + e.data.regionId + '"]');
        els.forEach(function(el) { el.setAttribute('data-region-selected', ''); });
      }
    }
    if (e.data.type === 'apply-override') {
      var region = regions.find(function(r) { return r.id === e.data.regionId; });
      if (!region) return;
      var els = document.querySelectorAll(region.selector);
      els.forEach(function(el) {
        switch (region.type) {
          case 'text': case 'html': el.innerHTML = e.data.value; break;
          case 'image':
            if (el.tagName === 'IMG') el.src = e.data.value;
            else el.style.backgroundImage = 'url(' + e.data.value + ')';
            break;
          case 'background-image': el.style.backgroundImage = 'url(' + e.data.value + ')'; break;
          case 'link': if (el.tagName === 'A') el.href = e.data.value; break;
          case 'color': el.style.backgroundColor = e.data.value; break;
        }
      });
    }
  });

  // Click handler for selecting regions
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && !el.hasAttribute('data-region-id')) {
      el = el.parentElement;
    }
    if (el && el.hasAttribute('data-region-id')) {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: 'region-clicked', regionId: el.getAttribute('data-region-id') }, '*');
    }
  }, true);
})();
</script>`;

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${editorScript}</body>`);
    } else {
      html += editorScript;
    }

    return html;
  }, [template, overrides]);

  // Listen for region clicks from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data.type === "region-clicked") {
        const region = template?.editable_regions?.find((r: EditableRegion) => r.id === e.data.regionId);
        if (region) {
          setSelectedRegion(region);
          iframeRef.current?.contentWindow?.postMessage({ type: "select-region", regionId: region.id }, "*");
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [template]);

  // Toggle highlights in iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "toggle-highlights", enabled: highlightMode }, "*");
  }, [highlightMode]);

  const updateOverride = (regionId: string, value: string) => {
    const newOverrides = { ...overrides, [regionId]: value };
    setOverrides(newOverrides);
    iframeRef.current?.contentWindow?.postMessage({ type: "apply-override", regionId, value }, "*");
  };

  const resetOverride = (regionId: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[regionId];
    setOverrides(newOverrides);
    // Reload iframe to reset
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = getPreviewHtml();
      setTimeout(() => {
        iframe.contentWindow?.postMessage({ type: "toggle-highlights", enabled: highlightMode }, "*");
      }, 500);
    }
  };

  const handleSave = async () => {
    if (!variantId) {
      alert("No variant selected. Open this editor from a campaign variant.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const { data: variant } = await supabase
      .from("variants")
      .select("custom_fields")
      .eq("id", variantId)
      .single();

    const existingFields = (variant?.custom_fields as Record<string, unknown>) || {};

    await supabase
      .from("variants")
      .update({
        custom_fields: {
          ...existingFields,
          html_template_id: templateId,
          html_overrides: overrides,
        },
      })
      .eq("id", variantId);

    setSaving(false);
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#666688" }}>Loading editor...</div>;
  if (!template) return <div style={{ padding: 48, textAlign: "center", color: "#666688" }}>Template not found</div>;

  const regions = (template.editable_regions || []) as EditableRegion[];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", margin: "-24px -32px", background: "#0f0f1a" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 16px", background: "#1a1a2e", borderBottom: "1px solid #2a2a40",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer", display: "flex" }}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{template.name}</span>
          <span style={{ fontSize: 12, color: "#666688" }}>Visual Editor</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setHighlightMode(!highlightMode)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
              background: highlightMode ? "#0a2e1a" : "#242438",
              color: highlightMode ? "#00ca6b" : "#8888aa",
              border: `1px solid ${highlightMode ? "#0a5a2a" : "#2a2a40"}`,
            }}
          >
            <MousePointer size={14} /> {highlightMode ? "Editing Mode ON" : "Enable Editing Mode"}
          </button>
          <button onClick={handleSave} disabled={saving || !variantId} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 16px", background: variantId ? "#00ca6b" : "#666688", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: saving || !variantId ? "not-allowed" : "pointer",
          }}>
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Canvas */}
        <div style={{ flex: 1, overflow: "auto", background: "#0a0a12", padding: 16 }}>
          <div style={{ maxWidth: 480, margin: "0 auto", borderRadius: 12, border: "2px solid #2a2a40", overflow: "hidden" }}>
            <iframe
              ref={iframeRef}
              srcDoc={getPreviewHtml()}
              style={{ width: "100%", height: 700, border: "none", display: "block" }}
              title="Visual Editor"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>

        {/* Right panel — Regions & Editor */}
        <div style={{
          width: 320, background: "#1a1a2e", borderLeft: "1px solid #2a2a40",
          padding: 16, overflowY: "auto", flexShrink: 0,
        }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "#8888aa", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
            Editable Regions ({regions.length})
          </h3>

          {!highlightMode && (
            <div style={{
              background: "#242438", borderRadius: 8, padding: 12, marginBottom: 16,
              fontSize: 12, color: "#8888aa", lineHeight: 1.5,
            }}>
              Click &quot;Enable Editing Mode&quot; above to highlight editable areas on the page. Then click any highlighted area to edit it.
            </div>
          )}

          {/* Selected region editor */}
          {selectedRegion && (
            <div style={{
              background: "#242438", borderRadius: 10, padding: 14, marginBottom: 16,
              border: "1px solid #00ca6b40",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#00ca6b" }}>{selectedRegion.label}</span>
                <button
                  onClick={() => resetOverride(selectedRegion.id)}
                  style={{ background: "none", border: "none", color: "#8888aa", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontSize: 11 }}
                >
                  <Undo2 size={12} /> Reset
                </button>
              </div>
              <span style={{ fontSize: 10, color: "#666688", fontFamily: "monospace" }}>
                Type: {selectedRegion.type} | {selectedRegion.selector}
              </span>

              <div style={{ marginTop: 8 }}>
                {selectedRegion.type === "color" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="color"
                      value={overrides[selectedRegion.id] || selectedRegion.defaultValue || "#ffffff"}
                      onChange={(e) => updateOverride(selectedRegion.id, e.target.value)}
                      style={{ width: 40, height: 32, border: "none", borderRadius: 4, cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      value={overrides[selectedRegion.id] || ""}
                      onChange={(e) => updateOverride(selectedRegion.id, e.target.value)}
                      placeholder={selectedRegion.defaultValue || "Enter color"}
                      style={{
                        flex: 1, padding: "6px 10px", background: "#1a1a2e", border: "1px solid #2a2a40",
                        borderRadius: 6, color: "#fff", fontSize: 12, fontFamily: "monospace",
                      }}
                    />
                  </div>
                ) : selectedRegion.type === "image" || selectedRegion.type === "background-image" ? (
                  <input
                    type="url"
                    value={overrides[selectedRegion.id] || ""}
                    onChange={(e) => updateOverride(selectedRegion.id, e.target.value)}
                    placeholder={selectedRegion.defaultValue || "Enter image URL"}
                    style={{
                      width: "100%", padding: "6px 10px", background: "#1a1a2e", border: "1px solid #2a2a40",
                      borderRadius: 6, color: "#fff", fontSize: 12, boxSizing: "border-box",
                    }}
                  />
                ) : selectedRegion.type === "html" ? (
                  <textarea
                    value={overrides[selectedRegion.id] || ""}
                    onChange={(e) => updateOverride(selectedRegion.id, e.target.value)}
                    placeholder={selectedRegion.defaultValue || "Enter HTML content"}
                    rows={4}
                    style={{
                      width: "100%", padding: "6px 10px", background: "#1a1a2e", border: "1px solid #2a2a40",
                      borderRadius: 6, color: "#fff", fontSize: 12, fontFamily: "monospace",
                      resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <textarea
                    value={overrides[selectedRegion.id] || ""}
                    onChange={(e) => updateOverride(selectedRegion.id, e.target.value)}
                    placeholder={selectedRegion.defaultValue || "Enter text"}
                    rows={3}
                    style={{
                      width: "100%", padding: "6px 10px", background: "#1a1a2e", border: "1px solid #2a2a40",
                      borderRadius: 6, color: "#fff", fontSize: 12, resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* All regions list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {regions.map((region: EditableRegion) => {
              const hasOverride = !!overrides[region.id];
              return (
                <button
                  key={region.id}
                  onClick={() => {
                    setSelectedRegion(region);
                    setHighlightMode(true);
                    iframeRef.current?.contentWindow?.postMessage({ type: "toggle-highlights", enabled: true }, "*");
                    iframeRef.current?.contentWindow?.postMessage({ type: "select-region", regionId: region.id }, "*");
                  }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", borderRadius: 6, border: "none",
                    background: selectedRegion?.id === region.id ? "#0a2e1a" : "#242438",
                    color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{region.label}</div>
                    <div style={{ fontSize: 10, color: "#666688" }}>{region.type}</div>
                  </div>
                  {hasOverride && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ca6b", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>

          {regions.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: "#666688", fontSize: 12 }}>
              No editable regions defined for this template. Go to Templates and re-upload with editable regions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
