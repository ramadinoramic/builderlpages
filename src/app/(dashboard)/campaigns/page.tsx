import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CampaignsPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: campaigns }, { data: stats }] = await Promise.all([
    supabase.from("campaigns").select("*").order("updated_at", { ascending: false }),
    supabase.from("campaign_stats").select("*"),
  ]);

  const perCampaign: Record<string, { clicks: number; conversions: number; payout: number }> = {};
  for (const s of stats || []) {
    if (!perCampaign[s.campaign_id]) perCampaign[s.campaign_id] = { clicks: 0, conversions: 0, payout: 0 };
    perCampaign[s.campaign_id].clicks += Number(s.clicks);
    perCampaign[s.campaign_id].conversions += Number(s.conversions);
    perCampaign[s.campaign_id].payout += Number(s.total_payout);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>Campaigns</h1>
        <Link href="/campaigns/new" style={{
          padding: "8px 16px", background: "#6366f1", color: "#fff",
          borderRadius: 6, textDecoration: "none", fontWeight: 500, fontSize: 13,
        }}>
          + New Campaign
        </Link>
      </div>

      <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
              {["Campaign", "Status", "GEO", "Operator", "Source", "Clicks", "Conv.", "CR", "Revenue"].map((h) => (
                <th key={h} style={{
                  padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500,
                  color: "#6b6b80", textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(campaigns || []).map((c) => {
              const s = perCampaign[c.id] || { clicks: 0, conversions: 0, payout: 0 };
              const cr = s.clicks > 0 ? (s.conversions / s.clicks * 100).toFixed(2) : "0.00";
              const statusColor = c.status === "active" ? "#22c55e" : c.status === "paused" ? "#eab308" : c.status === "draft" ? "#6b6b80" : "#ef4444";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                  <td style={{ padding: "9px 14px" }}>
                    <Link href={`/campaigns/${c.id}`} style={{ color: "#e4e4f0", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
                      {c.name}
                    </Link>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>/lp/{c.slug}</div>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>{c.status}</span>
                  </td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#8b8ba0" }}>{c.geo || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#8b8ba0" }}>{c.operator || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: "#8b8ba0" }}>{c.traffic_source || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>{s.clicks.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>{s.conversions.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>{cr}%</td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>${s.payout.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!campaigns || campaigns.length === 0) && (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b80", fontSize: 13 }}>
            No campaigns yet
          </div>
        )}
      </div>
    </div>
  );
}
