"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Lander } from "@/lib/types";

function detectVariables(html: string): string[] {
  const matches = html.match(/\{\{([A-Z][A-Z0-9_]*)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, "")))).sort();
}

export default function LanderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const landerId = params.id as string;

  const [lander, setLander] = useState<Lander | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"editor" | "preview">("editor");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("landers").select("*").eq("id", landerId).single();
      if (data) {
        const l = data as Lander;
        setLander(l);
        setName(l.name);
        setNotes(l.notes || "");
        setHtml(l.html);
        setDefaults(l.defaults || {});
      }
      setLoading(false);
    }
    load();
  }, [landerId]);

  const variables = detectVariables(html);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("landers")
      .update({ name, notes: notes || null, html, variables, defaults, updated_at: new Date().toISOString() })
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
    width: "100%", padding: "8px 12px", background: "#16161e", border: "1px solid #1e1e2e",
    borderRadius: 6, color: "#e4e4f0", fontSize: 13, boxSizing: "border-box",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>{lander.name}</h1>
          <p style={{ fontSize: 12, color: "#6b6b80", margin: "4px 0 0" }}>
            {variables.length} variables &middot; Created {new Date(lander.created_at).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {(["editor", "preview"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 16px", borderRadius: 4, border: "none",
            background: tab === t ? "#1e1e2e" : "transparent",
            color: tab === t ? "#e4e4f0" : "#6b6b80",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            textTransform: "capitalize",
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          {/* HTML editor */}
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 4, display: "block" }}>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 4, display: "block" }}>Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} style={input} />
              </div>
            </div>
            <label style={{ fontSize: 11, color: "#6b6b80", marginBottom: 4, display: "block" }}>
              HTML <span style={{ color: "#555" }}>({html.length.toLocaleString()} chars)</span>
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              style={{ ...input, height: 500, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
            />
          </div>

          {/* Variables panel */}
          <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", padding: 14, alignSelf: "start" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#8b8ba0", display: "block", marginBottom: 10 }}>
              Variables ({variables.length})
            </span>
            {variables.length === 0 ? (
              <p style={{ fontSize: 12, color: "#555", margin: 0 }}>No variables detected.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {variables.map((v) => (
                  <div key={v}>
                    <label style={{ fontSize: 10, color: "#6b6b80", fontFamily: "monospace", display: "block", marginBottom: 2 }}>
                      {`{{${v}}}`}
                    </label>
                    <input
                      value={defaults[v] || ""}
                      onChange={(e) => setDefaults({ ...defaults, [v]: e.target.value })}
                      style={{ ...input, fontSize: 11 }}
                      placeholder="Default value"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "preview" && (
        <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: 700, border: "none", display: "block" }}
            sandbox="allow-same-origin allow-scripts"
            title="Lander Preview"
          />
        </div>
      )}
    </div>
  );
}
