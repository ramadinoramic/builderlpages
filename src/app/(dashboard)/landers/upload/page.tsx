"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function detectVariables(html: string): string[] {
  const matches = html.match(/\{\{([A-Z][A-Z0-9_]*)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, "")))).sort();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function UploadLanderPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"upload" | "code" | "images" | "variables">("upload");

  const variables = detectVariables(html);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    let htmlContent = "";
    let cssContent = "";
    let jsContent = "";
    const newAssets: Record<string, string> = { ...assets };

    for (const file of Array.from(files)) {
      if (file.name.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
        // Image file → convert to base64
        const b64 = await fileToBase64(file);
        newAssets[file.name] = b64;
      } else if (file.name.endsWith(".css")) {
        const text = await file.text();
        cssContent += text + "\n";
      } else if (file.name.endsWith(".js")) {
        const text = await file.text();
        jsContent += text + "\n";
      } else if (file.name.match(/\.(html|htm)$/i)) {
        htmlContent = await file.text();
        if (!name) setName(file.name.replace(/\.(html|htm)$/i, ""));
      }
    }

    // Combine HTML + CSS + JS
    if (htmlContent) {
      let combined = htmlContent;
      if (cssContent) {
        const style = `<style>\n${cssContent}</style>`;
        combined = combined.includes("</head>")
          ? combined.replace("</head>", `${style}\n</head>`)
          : style + "\n" + combined;
      }
      if (jsContent) {
        const script = `<script>\n${jsContent}<\/script>`;
        combined = combined.includes("</body>")
          ? combined.replace("</body>", `${script}\n</body>`)
          : combined + "\n" + script;
      }
      setHtml(combined);
    }

    setAssets(newAssets);
  }, [name, assets]);

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const newAssets = { ...assets };
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        newAssets[file.name] = await fileToBase64(file);
      }
    }
    setAssets(newAssets);
  };

  const removeAsset = (filename: string) => {
    const next = { ...assets };
    delete next[filename];
    setAssets(next);
  };

  // Build preview HTML with images inlined
  const getPreviewHtml = () => {
    let preview = html;
    // Replace image references with base64 data URIs
    for (const [filename, dataUri] of Object.entries(assets)) {
      // Replace src="filename", src="./filename", src="images/filename" etc.
      const escapedName = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      preview = preview.replace(
        new RegExp(`(src|href)=["']([^"']*?)${escapedName}["']`, "gi"),
        `$1="${dataUri}"`
      );
      // Also replace url(filename) in CSS
      preview = preview.replace(
        new RegExp(`url\\(["']?([^"')]*?)${escapedName}["']?\\)`, "gi"),
        `url("${dataUri}")`
      );
    }
    return preview;
  };

  const handleSave = async () => {
    if (!name || !html) return;
    setSaving(true);

    // Inline all asset references into the HTML before saving
    const finalHtml = getPreviewHtml();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("landers")
      .insert({
        name,
        html: finalHtml,
        variables: detectVariables(finalHtml),
        defaults,
        assets,
        notes: notes || null,
        created_by: user?.id || null,
      })
      .select("id")
      .single();

    if (error) {
      alert("Error: " + error.message);
      setSaving(false);
      return;
    }

    router.push(`/landers/${data.id}`);
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "8px 12px", background: "#13131b", border: "1px solid #1e1e2e",
    borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box", outline: "none",
  };

  const assetCount = Object.keys(assets).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>Upload Lander</h1>
          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
            Upload HTML, CSS, JS, and images. Use {"{{VARIABLES}}"} for content that changes per variant.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/landers")} style={{
            padding: "7px 14px", background: "transparent", color: "#6b6b80",
            border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 12, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name || !html} style={{
            padding: "7px 18px", background: !name || !html ? "#2a2a3a" : "#6366f1",
            color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500,
            cursor: !name || !html ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Saving..." : "Save Lander"}
          </button>
        </div>
      </div>

      {/* Name + Notes row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 3, display: "block" }}>Lander Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="e.g. Bahigo Casino TR v2" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 3, display: "block" }}>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} style={input} placeholder="Dark theme, TR language" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 1, marginBottom: 0, background: "#111118", borderRadius: "8px 8px 0 0", overflow: "hidden", border: "1px solid #1e1e2e", borderBottom: "none" }}>
        {[
          { id: "upload" as const, label: "Upload Files" },
          { id: "code" as const, label: `HTML${html ? ` (${(html.length / 1024).toFixed(1)}KB)` : ""}` },
          { id: "images" as const, label: `Images${assetCount > 0 ? ` (${assetCount})` : ""}` },
          { id: "variables" as const, label: `Variables${variables.length > 0 ? ` (${variables.length})` : ""}` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 18px", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: tab === t.id ? "#16161e" : "transparent",
            color: tab === t.id ? "#e4e4f0" : "#6b6b80",
            borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderTop: "none", borderRadius: "0 0 8px 8px", minHeight: 400 }}>

        {/* Upload tab */}
        {tab === "upload" && (
          <div style={{ padding: 20 }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#6366f108"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.background = "transparent"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "#1e1e2e";
                e.currentTarget.style.background = "transparent";
                processFiles(e.dataTransfer.files);
              }}
              style={{
                border: "2px dashed #1e1e2e", borderRadius: 12, padding: "48px 20px",
                textAlign: "center", cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "#6b6b80" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, color: "#8b8ba0", marginBottom: 6 }}>
                Drop all your lander files here
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>
                HTML, CSS, JS, and images (.png, .jpg, .gif, .svg, .webp)
              </div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
                Images will be embedded as base64 — no external hosting needed
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico" multiple onChange={(e) => processFiles(e.target.files)} style={{ display: "none" }} />

            {/* Status */}
            {(html || assetCount > 0) && (
              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {html && (
                  <div style={{ padding: "6px 12px", background: "#16161e", borderRadius: 6, fontSize: 12, color: "#22c55e", border: "1px solid #22c55e20" }}>
                    HTML loaded ({(html.length / 1024).toFixed(1)} KB)
                  </div>
                )}
                {assetCount > 0 && (
                  <div style={{ padding: "6px 12px", background: "#16161e", borderRadius: 6, fontSize: 12, color: "#6366f1", border: "1px solid #6366f120" }}>
                    {assetCount} image{assetCount > 1 ? "s" : ""} loaded
                  </div>
                )}
                {variables.length > 0 && (
                  <div style={{ padding: "6px 12px", background: "#16161e", borderRadius: 6, fontSize: 12, color: "#eab308", border: "1px solid #eab30820" }}>
                    {variables.length} variable{variables.length > 1 ? "s" : ""} detected
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {html && (
              <div style={{ marginTop: 20, borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "#16161e", borderBottom: "1px solid #1e1e2e", fontSize: 11, color: "#6b6b80", display: "flex", justifyContent: "space-between" }}>
                  <span>Preview</span>
                  <span style={{ fontFamily: "monospace" }}>{name || "untitled"}.html</span>
                </div>
                <iframe
                  srcDoc={getPreviewHtml()}
                  style={{ width: "100%", height: 400, border: "none", display: "block" }}
                  sandbox="allow-same-origin allow-scripts"
                  title="Preview"
                />
              </div>
            )}
          </div>
        )}

        {/* Code tab */}
        {tab === "code" && (
          <div style={{ padding: 20 }}>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%", height: 500, padding: "12px 14px",
                background: "#0c0c14", border: "1px solid #1e1e2e", borderRadius: 8,
                color: "#a5b4c8", fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                resize: "vertical", boxSizing: "border-box", outline: "none",
                lineHeight: 1.6, tabSize: 2,
              }}
              placeholder="Paste your HTML here..."
            />
          </div>
        )}

        {/* Images tab */}
        {tab === "images" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "#6b6b80", margin: 0 }}>
                Images are embedded as base64 into your HTML. Reference them by filename in your code.
              </p>
              <button onClick={() => imgRef.current?.click()} style={{
                padding: "6px 14px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer",
              }}>
                + Add Images
              </button>
              <input ref={imgRef} type="file" accept="image/*" multiple onChange={(e) => addImages(e.target.files)} style={{ display: "none" }} />
            </div>

            {assetCount === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555", border: "1px dashed #1e1e2e", borderRadius: 8 }}>
                <p style={{ fontSize: 13, margin: "0 0 6px" }}>No images uploaded yet</p>
                <p style={{ fontSize: 11, margin: 0 }}>Upload images, then reference them as src=&quot;filename.png&quot; in your HTML</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {Object.entries(assets).map(([filename, dataUri]) => (
                  <div key={filename} style={{
                    background: "#16161e", borderRadius: 8, border: "1px solid #1e1e2e",
                    overflow: "hidden", position: "relative",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dataUri}
                      alt={filename}
                      style={{ width: "100%", height: 100, objectFit: "cover", display: "block", background: "#222" }}
                    />
                    <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#8b8ba0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                        {filename}
                      </span>
                      <button onClick={() => removeAsset(filename)} style={{
                        background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, padding: 2,
                      }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {assetCount > 0 && (
              <div style={{ marginTop: 16, padding: 12, background: "#16161e", borderRadius: 8, border: "1px solid #1e1e2e" }}>
                <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 6 }}>Reference in your HTML:</div>
                <div style={{ fontSize: 11, color: "#8b8ba0", fontFamily: "monospace", lineHeight: 1.8 }}>
                  {Object.keys(assets).map((f) => (
                    <div key={f}>&lt;img src=&quot;{f}&quot; /&gt;</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variables tab */}
        {tab === "variables" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Detected variables */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 500, color: "#8b8ba0", margin: "0 0 12px" }}>
                  Detected Variables ({variables.length})
                </h3>
                {variables.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#555", border: "1px dashed #1e1e2e", borderRadius: 8 }}>
                    <p style={{ fontSize: 12, margin: 0 }}>No variables found in HTML</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {variables.map((v) => (
                      <div key={v} style={{ background: "#16161e", padding: "10px 12px", borderRadius: 6, border: "1px solid #1e1e2e" }}>
                        <div style={{ fontSize: 11, color: "#6366f1", fontFamily: "monospace", marginBottom: 4 }}>
                          {`{{${v}}}`}
                        </div>
                        <input
                          value={defaults[v] || ""}
                          onChange={(e) => setDefaults({ ...defaults, [v]: e.target.value })}
                          style={{ ...input, background: "#0c0c14", fontSize: 12 }}
                          placeholder="Default value (optional)"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Help */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 500, color: "#8b8ba0", margin: "0 0 12px" }}>How it works</h3>
                <div style={{ background: "#16161e", padding: 14, borderRadius: 8, border: "1px solid #1e1e2e", fontSize: 12, color: "#6b6b80", lineHeight: 1.7 }}>
                  <p style={{ margin: "0 0 10px" }}>
                    Add <span style={{ color: "#6366f1", fontFamily: "monospace" }}>{"{{VARIABLE_NAME}}"}</span> placeholders in your HTML wherever you want to customize content per A/B test variant.
                  </p>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8b8ba0", lineHeight: 2 }}>
                    <div><span style={{ color: "#6366f1" }}>{"{{CTA_URL}}"}</span> — auto-injected tracked URL</div>
                    <div><span style={{ color: "#6366f1" }}>{"{{HEADLINE}}"}</span> — main offer text</div>
                    <div><span style={{ color: "#6366f1" }}>{"{{SUBHEADLINE}}"}</span> — secondary text</div>
                    <div><span style={{ color: "#6366f1" }}>{"{{CTA_TEXT}}"}</span> — button text</div>
                    <div><span style={{ color: "#6366f1" }}>{"{{CTA_COLOR}}"}</span> — button color</div>
                    <div><span style={{ color: "#6366f1" }}>{"{{HERO_IMAGE}}"}</span> — image URL</div>
                    <div><span style={{ color: "#6366f1" }}>{"{{BODY_TEXT}}"}</span> — body copy</div>
                    <div><span style={{ color: "#555" }}>or any custom name like {"{{BONUS_AMOUNT}}"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
