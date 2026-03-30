"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function detectVariables(html: string): string[] {
  const matches = html.match(/\{\{([A-Z][A-Z0-9_]*)\}\}/g);
  if (!matches) return [];
  const unique = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ""))));
  return unique.sort();
}

export default function UploadLanderPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});

  const variables = detectVariables(html);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    let htmlParts = "";
    let cssParts = "";
    let jsParts = "";

    const readPromises = Array.from(files).map(
      (file) =>
        new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            if (file.name.endsWith(".css")) cssParts += text + "\n";
            else if (file.name.endsWith(".js")) jsParts += text + "\n";
            else {
              htmlParts = text;
              if (!name) setName(file.name.replace(/\.(html|htm)$/i, ""));
            }
            resolve();
          };
          reader.readAsText(file);
        })
    );

    Promise.all(readPromises).then(() => {
      let combined = htmlParts;
      // Inject CSS into <head> if separate
      if (cssParts) {
        const style = `<style>\n${cssParts}</style>`;
        combined = combined.includes("</head>")
          ? combined.replace("</head>", `${style}\n</head>`)
          : style + "\n" + combined;
      }
      // Inject JS before </body> if separate
      if (jsParts) {
        const script = `<script>\n${jsParts}</script>`;
        combined = combined.includes("</body>")
          ? combined.replace("</body>", `${script}\n</body>`)
          : combined + "\n" + script;
      }
      setHtml(combined);
    });
  };

  const handleSave = async () => {
    if (!name || !html) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("landers")
      .insert({
        name,
        html,
        variables,
        defaults,
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
    width: "100%", padding: "8px 12px", background: "#16161e", border: "1px solid #1e1e2e",
    borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box",
  };

  const label: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "#6b6b80", marginBottom: 4,
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", marginBottom: 4 }}>Upload Lander</h1>
      <p style={{ fontSize: 13, color: "#6b6b80", marginBottom: 24 }}>
        Upload your complete HTML landing page. Use <code style={{ background: "#1e1e2e", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>{"{{VARIABLE_NAME}}"}</code> placeholders for content you want to change per variant.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: Upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={label}>Lander Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="e.g. Bahigo Casino TR Dark" />
          </div>

          <div>
            <label style={label}>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} style={input} placeholder="Optional notes" />
          </div>

          {/* Drop zone */}
          <div>
            <label style={label}>Upload Files</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#6366f1"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e2e"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "#1e1e2e";
                handleFiles(e.dataTransfer.files);
              }}
              style={{
                border: "2px dashed #1e1e2e", borderRadius: 8, padding: "28px 20px",
                textAlign: "center", cursor: "pointer", background: "#111118",
              }}
            >
              <div style={{ fontSize: 13, color: "#6b6b80", marginBottom: 4 }}>
                Drop .html, .css, .js files here
              </div>
              <div style={{ fontSize: 11, color: "#555" }}>or click to browse</div>
            </div>
            <input ref={fileRef} type="file" accept=".html,.htm,.css,.js" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: "none" }} />
          </div>

          {/* HTML editor */}
          <div>
            <label style={label}>
              HTML {html && <span style={{ color: "#6366f1" }}>({html.length.toLocaleString()} chars)</span>}
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              style={{ ...input, height: 280, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
              placeholder="Paste HTML here or upload files above..."
            />
          </div>
        </div>

        {/* Right: Variables + Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Auto-detected variables */}
          <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#8b8ba0" }}>
                Detected Variables ({variables.length})
              </span>
            </div>
            {variables.length === 0 ? (
              <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
                No variables found. Add placeholders like {"{{CTA_URL}}"}, {"{{HEADLINE}}"} to your HTML.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {variables.map((v) => (
                  <div key={v}>
                    <label style={{ fontSize: 11, color: "#6b6b80", fontFamily: "monospace", marginBottom: 2, display: "block" }}>
                      {`{{${v}}}`}
                    </label>
                    <input
                      value={defaults[v] || ""}
                      onChange={(e) => setDefaults({ ...defaults, [v]: e.target.value })}
                      style={{ ...input, fontSize: 12 }}
                      placeholder="Default value (optional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Common variables hint */}
          <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#8b8ba0", display: "block", marginBottom: 8 }}>
              Common Variables
            </span>
            <div style={{ fontSize: 11, color: "#6b6b80", lineHeight: 1.8, fontFamily: "monospace" }}>
              <div>{"{{CTA_URL}}"} — auto-injected click tracking URL</div>
              <div>{"{{HEADLINE}}"} — main bonus/offer text</div>
              <div>{"{{SUBHEADLINE}}"} — secondary text</div>
              <div>{"{{CTA_TEXT}}"} — button text</div>
              <div>{"{{CTA_COLOR}}"} — button color</div>
              <div>{"{{HERO_IMAGE}}"} — hero image URL</div>
              <div>{"{{BODY_TEXT}}"} — body copy</div>
            </div>
          </div>

          {/* Preview */}
          {html && (
            <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e1e2e", fontSize: 12, color: "#6b6b80" }}>
                Preview
              </div>
              <iframe
                srcDoc={html}
                style={{ width: "100%", height: 350, border: "none", display: "block" }}
                sandbox="allow-same-origin"
                title="Preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20, paddingBottom: 40 }}>
        <button
          onClick={() => router.push("/landers")}
          style={{
            padding: "8px 16px", background: "transparent", color: "#6b6b80",
            border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 13, cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name || !html}
          style={{
            padding: "8px 20px", background: !name || !html ? "#333" : "#6366f1",
            color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: !name || !html ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Lander"}
        </button>
      </div>
    </div>
  );
}
