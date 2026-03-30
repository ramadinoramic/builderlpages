"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Code, Eye, FileCode2 } from "lucide-react";

export default function UploadTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "preview" | "regions">("upload");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"casino" | "sports" | "both">("casino");
  const [htmlContent, setHtmlContent] = useState("");
  const [cssContent, setCssContent] = useState("");
  const [editableRegions, setEditableRegions] = useState<Array<{
    id: string; selector: string; type: string; label: string; defaultValue: string;
  }>>([]);
  const [saving, setSaving] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const handleMultiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (file.name.endsWith(".css")) {
          setCssContent((prev) => prev + "\n" + content);
        } else if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
          setHtmlContent(content);
          if (!name) setName(file.name.replace(/\.(html|htm)$/i, ""));
        }
      };
      reader.readAsText(file);
    });
  };

  const getPreviewHtml = () => {
    let html = htmlContent;
    if (cssContent && !html.includes("<style>")) {
      const styleTag = `<style>${cssContent}</style>`;
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${styleTag}</head>`);
      } else {
        html = styleTag + html;
      }
    }
    return html;
  };

  const autoDetectRegions = () => {
    setAutoDetecting(true);

    // Use the iframe to detect editable elements
    const iframe = previewIframeRef.current;
    if (!iframe?.contentDocument) {
      setAutoDetecting(false);
      return;
    }

    const doc = iframe.contentDocument;
    const detected: typeof editableRegions = [];
    let counter = 0;

    // 1. Elements with data-editable attribute (manual markers)
    doc.querySelectorAll("[data-editable]").forEach((el) => {
      counter++;
      const label = el.getAttribute("data-editable") || `Element ${counter}`;
      const type = el.getAttribute("data-type") || "text";
      detected.push({
        id: `region-${counter}`,
        selector: `[data-editable="${label}"]`,
        type,
        label,
        defaultValue: el.tagName === "IMG" ? (el as HTMLImageElement).src : el.innerHTML.trim().substring(0, 200),
      });
    });

    // 2. Auto-detect headings
    doc.querySelectorAll("h1, h2, h3").forEach((el) => {
      if (el.closest("[data-editable]")) return;
      counter++;
      const tag = el.tagName.toLowerCase();
      const idx = Array.from(doc.querySelectorAll(tag)).indexOf(el);
      detected.push({
        id: `region-${counter}`,
        selector: `${tag}:nth-of-type(${idx + 1})`,
        type: "text",
        label: `${tag.toUpperCase()} - "${el.textContent?.substring(0, 40)}..."`,
        defaultValue: el.innerHTML.trim().substring(0, 200),
      });
    });

    // 3. Auto-detect buttons and CTA links
    doc.querySelectorAll("a.btn, a.cta, button, a[class*='cta'], a[class*='button'], a[class*='btn']").forEach((el) => {
      if (el.closest("[data-editable]")) return;
      counter++;
      const classes = el.className || "";
      const text = el.textContent?.trim().substring(0, 40) || "Button";
      detected.push({
        id: `region-${counter}`,
        selector: classes ? `.${classes.split(/\s+/)[0]}` : `a:nth-of-type(${counter})`,
        type: "text",
        label: `Button - "${text}"`,
        defaultValue: el.innerHTML.trim().substring(0, 200),
      });
      // Also add as link type
      if (el.tagName === "A") {
        counter++;
        detected.push({
          id: `region-${counter}`,
          selector: classes ? `.${classes.split(/\s+/)[0]}` : `a:nth-of-type(${counter})`,
          type: "link",
          label: `Link URL - "${text}"`,
          defaultValue: (el as HTMLAnchorElement).href || "",
        });
      }
    });

    // 4. Auto-detect images
    doc.querySelectorAll("img").forEach((el, idx) => {
      if (el.closest("[data-editable]")) return;
      counter++;
      const alt = (el as HTMLImageElement).alt || `Image ${idx + 1}`;
      detected.push({
        id: `region-${counter}`,
        selector: `img:nth-of-type(${idx + 1})`,
        type: "image",
        label: `Image - "${alt}"`,
        defaultValue: (el as HTMLImageElement).src || "",
      });
    });

    // 5. Auto-detect paragraphs with substantial text
    doc.querySelectorAll("p, span.desc, span.subtitle, .description").forEach((el) => {
      if (el.closest("[data-editable]")) return;
      const text = el.textContent?.trim() || "";
      if (text.length < 10) return;
      counter++;
      detected.push({
        id: `region-${counter}`,
        selector: `p:nth-of-type(${Array.from(doc.querySelectorAll("p")).indexOf(el as HTMLParagraphElement) + 1})`,
        type: "text",
        label: `Text - "${text.substring(0, 40)}..."`,
        defaultValue: el.innerHTML.trim().substring(0, 200),
      });
    });

    setEditableRegions(detected);
    setAutoDetecting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/html-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          html_content: htmlContent,
          css_content: cssContent || null,
          editable_regions: editableRegions,
          category,
        }),
      });

      if (res.ok) {
        router.push("/templates");
      } else {
        const data = await res.json();
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Failed to save template");
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "#242438", border: "1px solid #2a2a40",
    borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Upload HTML Template</h1>
      <p style={{ color: "#666688", fontSize: 14, marginBottom: 24 }}>
        Upload your HTML/CSS landing page design. Add <code style={{ background: "#242438", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>data-editable=&quot;label&quot;</code> attributes to mark editable areas, or we&apos;ll auto-detect them.
      </p>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {[
          { id: "upload" as const, label: "Upload", icon: <Upload size={14} /> },
          { id: "preview" as const, label: "Preview & Detect", icon: <Eye size={14} /> },
          { id: "regions" as const, label: "Editable Regions", icon: <Code size={14} /> },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            disabled={s.id !== "upload" && !htmlContent}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: step === s.id ? "#00ca6b" : "#242438",
              color: step === s.id ? "#fff" : "#8888aa",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: s.id !== "upload" && !htmlContent ? 0.5 : 1,
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>Template Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Bahigo Dark Casino" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="Brief description" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="casino">Casino</option>
                <option value="sports">Sports</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* File upload */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>Upload Files</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #2a2a40", borderRadius: 12, padding: 32,
                  textAlign: "center", cursor: "pointer", transition: "border-color 0.15s",
                  background: "#1a1a2e",
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#00ca6b"; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a40"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "#2a2a40";
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleMultiFileUpload(fakeEvent);
                  }
                }}
              >
                <FileCode2 size={32} style={{ color: "#666688", marginBottom: 8 }} />
                <p style={{ color: "#8888aa", fontSize: 14, margin: "0 0 4px" }}>
                  Drop HTML & CSS files here, or click to browse
                </p>
                <p style={{ color: "#666688", fontSize: 12, margin: 0 }}>
                  Supports .html, .htm, .css files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.css"
                multiple
                onChange={handleMultiFileUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Code editors */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>
                HTML {htmlContent && <span style={{ color: "#00ca6b" }}>({htmlContent.length} chars)</span>}
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                style={{ ...inputStyle, height: 250, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                placeholder="Paste your HTML here or upload a file..."
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8888aa", marginBottom: 6 }}>
                CSS (optional) {cssContent && <span style={{ color: "#00ca6b" }}>({cssContent.length} chars)</span>}
              </label>
              <textarea
                value={cssContent}
                onChange={(e) => setCssContent(e.target.value)}
                style={{ ...inputStyle, height: 150, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                placeholder="Paste additional CSS here (if not inline in HTML)..."
              />
            </div>
          </div>

          {htmlContent && (
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setStep("preview")} style={{
                padding: "10px 24px", background: "#00ca6b", color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
                Next: Preview & Detect Regions
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview & Auto-detect */}
      {step === "preview" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ color: "#8888aa", fontSize: 13, margin: 0 }}>
              Preview your template below. Click &quot;Auto-Detect&quot; to find editable regions, or manually mark them with <code style={{ background: "#242438", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>data-editable</code> attributes.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={autoDetectRegions} disabled={autoDetecting} style={{
                padding: "8px 16px", background: "#242438", color: "#00ca6b",
                border: "1px solid #0a5a2a", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                {autoDetecting ? "Detecting..." : `Auto-Detect Regions (${editableRegions.length} found)`}
              </button>
              <button onClick={() => setStep("regions")} style={{
                padding: "8px 16px", background: "#00ca6b", color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                Next: Configure Regions ({editableRegions.length})
              </button>
            </div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 12, border: "1px solid #2a2a40", overflow: "hidden" }}>
            <iframe
              ref={previewIframeRef}
              srcDoc={getPreviewHtml()}
              style={{ width: "100%", height: 600, border: "none" }}
              title="Template Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Step 3: Editable Regions */}
      {step === "regions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>
                Editable Regions ({editableRegions.length})
              </h2>
              <p style={{ fontSize: 12, color: "#666688", margin: 0 }}>
                These regions will be editable in the visual editor when creating variants.
              </p>
            </div>
            <button
              onClick={() => {
                const id = `region-${editableRegions.length + 1}`;
                setEditableRegions([...editableRegions, {
                  id, selector: "", type: "text", label: "New Region", defaultValue: "",
                }]);
              }}
              style={{
                padding: "6px 12px", background: "#242438", color: "#00ca6b",
                border: "1px solid #0a5a2a", borderRadius: 6, fontSize: 12, cursor: "pointer",
              }}
            >
              + Add Region
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {editableRegions.map((region, i) => (
              <div key={region.id} style={{
                background: "#1a1a2e", borderRadius: 10, padding: 14,
                border: "1px solid #2a2a40", display: "grid",
                gridTemplateColumns: "1fr 140px 120px 1fr auto", gap: 8, alignItems: "center",
              }}>
                <input
                  value={region.label}
                  onChange={(e) => {
                    const updated = [...editableRegions];
                    updated[i] = { ...region, label: e.target.value };
                    setEditableRegions(updated);
                  }}
                  placeholder="Label"
                  style={{ ...inputStyle, fontSize: 12, padding: "6px 10px" }}
                />
                <input
                  value={region.selector}
                  onChange={(e) => {
                    const updated = [...editableRegions];
                    updated[i] = { ...region, selector: e.target.value };
                    setEditableRegions(updated);
                  }}
                  placeholder="CSS Selector"
                  style={{ ...inputStyle, fontSize: 11, padding: "6px 10px", fontFamily: "monospace" }}
                />
                <select
                  value={region.type}
                  onChange={(e) => {
                    const updated = [...editableRegions];
                    updated[i] = { ...region, type: e.target.value as EditableRegion["type"] };
                    setEditableRegions(updated);
                  }}
                  style={{ ...inputStyle, fontSize: 12, padding: "6px 10px", cursor: "pointer" }}
                >
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="image">Image</option>
                  <option value="link">Link URL</option>
                  <option value="color">Color</option>
                  <option value="background-image">BG Image</option>
                </select>
                <input
                  value={region.defaultValue}
                  onChange={(e) => {
                    const updated = [...editableRegions];
                    updated[i] = { ...region, defaultValue: e.target.value };
                    setEditableRegions(updated);
                  }}
                  placeholder="Default value"
                  style={{ ...inputStyle, fontSize: 12, padding: "6px 10px" }}
                />
                <button
                  onClick={() => setEditableRegions(editableRegions.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 16, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            ))}
            {editableRegions.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "#666688", background: "#1a1a2e", borderRadius: 10, border: "1px dashed #2a2a40" }}>
                No editable regions defined. Go back to Preview and click Auto-Detect, or add them manually.
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep("preview")} style={{
              padding: "10px 24px", background: "#242438", color: "#8888aa",
              border: "1px solid #2a2a40", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: "pointer",
            }}>
              Back
            </button>
            <button onClick={handleSave} disabled={saving || !name || !htmlContent} style={{
              padding: "10px 24px", background: name && htmlContent ? "#00ca6b" : "#666688",
              color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
              cursor: saving || !name || !htmlContent ? "not-allowed" : "pointer",
            }}>
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Import type for editable regions
type EditableRegion = { id: string; selector: string; type: string; label: string; defaultValue: string };
