import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TemplatesPage() {
  const supabase = createServerSupabaseClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 24 }}>Templates</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {(templates || []).map((template) => (
          <div key={template.id} style={{
            background: "#1a1a2e", borderRadius: 12, padding: 20, border: "1px solid #2a2a40",
          }}>
            <div style={{
              height: 140, background: "#242438", borderRadius: 8, marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
            }}>
              {template.category === "casino" ? "🎰" : template.category === "sports" ? "⚽" : "🎮"}
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

      {(!templates || templates.length === 0) && (
        <div style={{ textAlign: "center", padding: 48, color: "#666688" }}>
          No templates available. Run the seed script to add default templates.
        </div>
      )}
    </div>
  );
}
