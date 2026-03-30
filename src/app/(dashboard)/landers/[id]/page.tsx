"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Lander } from "@/lib/types";

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

export default function LanderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const imgRef = useRef<HTMLInputElement>(null);
  const landerId = params.id as string;

  const [lander, setLander] = useState<Lander | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"code" | "preview" | "images" | "variables">("preview");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("landers").select("*").eq("id", landerId).single();
      if (data) {
        const l = data as Lander & { assets?: Record<string, string> };
        setLander(l);
        setName(l.name);
        setNotes(l.notes || "");
        setHtml(l.html);
        setDefaults(l.defaults || {});
        setAssets((l.assets as Record<string, string>) || {});
      }
      setLoading(false);
    }
    load();
  }, [landerId]);

  const variables = detectVariables(html);

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const next = { ...assets };
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) next[file.name] = await fileToBase64(file);
    }
    setAssets(next);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("landers")
      .update({ name, notes: notes || null, html, variables, defaults, assets, updated_at: new Date().toISOString() })
      .eq("id", landerId);
    setSaving(false);
  };

  const handleArchive = async () => {
    const supabase = createClient();
    await supabase.from("landers").update({ is_archived: true }).eq("id", landerId);
    router.push("/landers");
  };

  if (loading) return <div style={{ padding: 40, color: "#6b6b80" }}>Loading...</div>;
  if (!lander) return <div style={{ padding: 40, color: "#6b6b80" }}>Lander not found</div>;

  const input: React.CSSProperties = {
    width: "100%", padding: "8px 12px", background: "#13131b", border: "1px solid #1e1e2e",
    borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box", outline: "none",
  };

  const assetCount = Object.keys(assets).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>{lander.name}</h1>
          </div>
          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
            {variables.length} variables &middot; {assetCount} images &middot; {(html.length / 1024).toFixed(1)} KB
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleArchive} style={{
            padding: "7px 14px", background: "transparent", color: "#6b6b80",
            border: "1px solid #1e1e2e", borderRadius: 6, fontSize: 12, cursor: "pointer",
          }}>
            Archive
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "7px 16px", background: "#6366f1", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Name/Notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 3, display: "block" }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 3, display: "block" }}>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} style={input} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 1, background: "#111118", borderRadius: "8px 8px 0 0", overflow: "hidden", border: "1px solid #1e1e2e", borderBottom: "none" }}>
        {[
          { id: "preview" as const, label: "Preview" },
          { id: "code" as const, label: "HTML" },
          { id: "images" as const, label: `Images (${assetCount})` },
          { id: "variables" as const, label: `Variables (${variables.length})` },
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

      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderTop: "none", borderRadius: "0 0 8px 8px", minHeight: 400 }}>
        {tab === "preview" && (
          <iframe srcDoc={html} style={{ width: "100%", height: 600, border: "none", display: "block", borderRadius: "0 0 8px 8px" }} sandbox="allow-same-origin allow-scripts" title="Preview" />
        )}

        {tab === "code" && (
          <div style={{ padding: 16 }}>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%", height: 500, padding: "12px 14px",
                background: "#0c0c14", border: "1px solid #1e1e2e", borderRadius: 8,
                color: "#a5b4c8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                resize: "vertical", boxSizing: "border-box", outline: "none",
                lineHeight: 1.6, tabSize: 2,
              }}
            />
          </div>
        )}

        {tab === "images" && (
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "#6b6b80", margin: 0 }}>Images embedded as base64 into your lander HTML.</p>
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
                No images uploaded
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {Object.entries(assets).map(([fn, uri]) => (
                  <div key={fn} style={{ background: "#16161e", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden", position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uri} alt={fn} style={{ width: "100%", height: 90, objectFit: "cover", display: "block", background: "#222" }} />
                    <div style={{ padding: "5px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#8b8ba0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>{fn}</span>
                      <button onClick={() => { const n = { ...assets }; delete n[fn]; setAssets(n); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: 2 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "variables" && (
          <div style={{ padding: 16 }}>
            {variables.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555" }}>No variables detected in HTML</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {variables.map((v) => (
                  <div key={v} style={{ background: "#16161e", padding: "10px 12px", borderRadius: 6, border: "1px solid #1e1e2e" }}>
                    <div style={{ fontSize: 11, color: "#6366f1", fontFamily: "monospace", marginBottom: 4 }}>{`{{${v}}}`}</div>
                    <input
                      value={defaults[v] || ""}
                      onChange={(e) => setDefaults({ ...defaults, [v]: e.target.value })}
                      style={{ ...input, background: "#0c0c14", fontSize: 12 }}
                      placeholder="Default value"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
