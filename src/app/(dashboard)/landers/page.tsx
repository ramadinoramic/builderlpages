import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LandersPage() {
  const supabase = createServerSupabaseClient();

  const { data: landers } = await supabase
    .from("landers")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>Landers</h1>
          <p style={{ fontSize: 13, color: "#6b6b80", margin: "4px 0 0" }}>Upload and manage your landing page templates</p>
        </div>
        <Link
          href="/landers/upload"
          style={{
            padding: "8px 16px",
            background: "#6366f1",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          + Upload Lander
        </Link>
      </div>

      {/* Landers table */}
      <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
              {["Name", "Variables", "Notes", "Created", ""].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left", fontSize: 11,
                  fontWeight: 500, color: "#6b6b80", textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(landers || []).map((lander) => {
              const vars = Array.isArray(lander.variables) ? lander.variables : [];
              return (
                <tr key={lander.id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <Link href={`/landers/${lander.id}`} style={{ color: "#e4e4f0", textDecoration: "none", fontWeight: 500, fontSize: 13 }}>
                      {lander.name}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {vars.slice(0, 5).map((v: string) => (
                        <span key={v} style={{
                          padding: "2px 6px", background: "#1e1e2e", borderRadius: 3,
                          fontSize: 11, color: "#8b8ba0", fontFamily: "monospace",
                        }}>
                          {`{{${v}}}`}
                        </span>
                      ))}
                      {vars.length > 5 && <span style={{ fontSize: 11, color: "#6b6b80" }}>+{vars.length - 5}</span>}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b6b80", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lander.notes || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b6b80", fontFamily: "monospace" }}>
                    {new Date(lander.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Link
                      href={`/landers/${lander.id}`}
                      style={{
                        padding: "4px 10px", background: "#1e1e2e", borderRadius: 4,
                        fontSize: 11, color: "#8b8ba0", textDecoration: "none",
                        border: "1px solid #2a2a3a",
                      }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!landers || landers.length === 0) && (
          <div style={{ textAlign: "center", padding: 48, color: "#6b6b80" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>No landers uploaded yet</p>
            <Link href="/landers/upload" style={{ color: "#6366f1", textDecoration: "none", fontSize: 13 }}>
              Upload your first lander
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
