import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TemplatesPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: templates }, { data: htmlTemplates }] = await Promise.all([
    supabase.from("templates").select("*").order("created_at", { ascending: true }),
    supabase.from("html_templates").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Templates</h1>
        <Link
          href="/templates/upload"
          style={{
            padding: "10px 20px", background: "linear-gradient(135deg, #00ca6b, #0ea5e9)",
            color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14,
          }}
        >
          + Upload HTML Template
        </Link>
      </div>

      {/* Built-in Templates */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#8888aa", marginBottom: 12 }}>Built-in Templates</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        {(templates || []).map((template) => (
          <div key={template.id} style={{
            background: "#1a1a2e", borderRadius: 12, padding: 20, border: "1px solid #2a2a40",
          }}>
            <div style={{
              height: 120, background: "#242438", borderRadius: 8, marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
            }}>
              {template.id === "custom-builder" ? "🎨" : template.category === "casino" ? "🎰" : template.category === "sports" ? "⚽" : "🎮"}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>{template.name}</h3>
            <p style={{ fontSize: 13, color: "#666688", margin: "0 0 12px", lineHeight: 1.5 }}>{template.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                padding: "4px 8px", borderRadius: 6, fontSize: 11,
                background: template.is_active ? "#0a2e1a" : "#2a1a1a",
                color: template.is_active ? "#00ca6b" : "#aa5555",
              }}>
                {template.is_active ? "Active" : "Inactive"}
              </span>
              <span style={{ fontSize: 12, color: "#666688", fontFamily: "monospace" }}>{template.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Uploaded HTML Templates */}
      {htmlTemplates && htmlTemplates.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#8888aa", marginBottom: 12 }}>Uploaded HTML Templates</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {htmlTemplates.map((tmpl) => (
              <div key={tmpl.id} style={{
                background: "#1a1a2e", borderRadius: 12, padding: 20, border: "1px solid #2a2a40",
              }}>
                <div style={{
                  height: 120, background: "#242438", borderRadius: 8, marginBottom: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#666688", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontSize: 32 }}>📄</span>
                  <span>HTML Upload</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>{tmpl.name}</h3>
                <p style={{ fontSize: 13, color: "#666688", margin: "0 0 8px", lineHeight: 1.5 }}>
                  {tmpl.description || "Uploaded HTML template"}
                </p>
                <div style={{ fontSize: 12, color: "#666688", marginBottom: 12 }}>
                  {(tmpl.editable_regions as unknown[])?.length || 0} editable regions &middot; {tmpl.category}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/templates/${tmpl.id}/edit`}
                    style={{
                      padding: "6px 12px", background: "#242438", color: "#00ca6b",
                      border: "1px solid #0a5a2a", borderRadius: 6, fontSize: 12,
                      textDecoration: "none", fontWeight: 500,
                    }}
                  >
                    Visual Editor
                  </Link>
                  <span style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 11,
                    background: tmpl.is_active ? "#0a2e1a" : "#2a1a1a",
                    color: tmpl.is_active ? "#00ca6b" : "#aa5555",
                    display: "flex", alignItems: "center",
                  }}>
                    {tmpl.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(!templates || templates.length === 0) && (!htmlTemplates || htmlTemplates.length === 0) && (
        <div style={{ textAlign: "center", padding: 48, color: "#666688" }}>
          No templates available. Run the seed script or upload an HTML template.
        </div>
      )}
    </div>
  );
}
