import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: campaigns }, { data: stats }, { data: landers }] = await Promise.all([
    supabase.from("campaigns").select("*").order("updated_at", { ascending: false }).limit(10),
    supabase.from("campaign_stats").select("*"),
    supabase.from("landers").select("id").eq("is_archived", false),
  ]);

  // Aggregate stats
  const totals = { clicks: 0, conversions: 0, payout: 0 };
  const perCampaign: Record<string, typeof totals> = {};

  for (const s of stats || []) {
    totals.clicks += Number(s.clicks);
    totals.conversions += Number(s.conversions);
    totals.payout += Number(s.total_payout);
    if (!perCampaign[s.campaign_id]) perCampaign[s.campaign_id] = { clicks: 0, conversions: 0, payout: 0 };
    perCampaign[s.campaign_id].clicks += Number(s.clicks);
    perCampaign[s.campaign_id].conversions += Number(s.conversions);
    perCampaign[s.campaign_id].payout += Number(s.total_payout);
  }

  const cr = totals.clicks > 0 ? (totals.conversions / totals.clicks * 100).toFixed(2) : "0.00";
  const activeCampaigns = (campaigns || []).filter((c) => c.status === "active").length;

  const statCards = [
    { label: "Active", value: activeCampaigns, sub: "campaigns" },
    { label: "Clicks", value: totals.clicks.toLocaleString(), sub: "total" },
    { label: "Conversions", value: totals.conversions.toLocaleString(), sub: "total" },
    { label: "CR", value: `${cr}%`, sub: "overall", highlight: true },
    { label: "Revenue", value: `$${totals.payout.toLocaleString()}`, sub: "total" },
    { label: "Landers", value: landers?.length || 0, sub: "in repository" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4f0", margin: 0 }}>Dashboard</h1>
        <Link href="/campaigns/new" style={{
          padding: "8px 16px", background: "#6366f1", color: "#fff",
          borderRadius: 6, textDecoration: "none", fontWeight: 500, fontSize: 13,
        }}>
          + New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ background: "#111118", borderRadius: 8, padding: "12px 14px", border: "1px solid #1e1e2e" }}>
            <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.highlight ? "#6366f1" : "#e4e4f0", fontFamily: "monospace" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "#555" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Campaigns */}
      <h2 style={{ fontSize: 14, fontWeight: 500, color: "#6b6b80", marginBottom: 10 }}>Recent Campaigns</h2>
      <div style={{ background: "#111118", borderRadius: 8, border: "1px solid #1e1e2e", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
              {["Campaign", "Status", "Clicks", "Conv.", "CR", "Revenue"].map((h) => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#6b6b80", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(campaigns || []).map((c) => {
              const s = perCampaign[c.id] || { clicks: 0, conversions: 0, payout: 0 };
              const cCr = s.clicks > 0 ? (s.conversions / s.clicks * 100).toFixed(2) : "0.00";
              const statusColor = c.status === "active" ? "#22c55e" : c.status === "paused" ? "#eab308" : "#6b6b80";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                  <td style={{ padding: "9px 14px" }}>
                    <Link href={`/campaigns/${c.id}`} style={{ color: "#e4e4f0", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
                      {c.name}
                    </Link>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                      {c.geo && <span>{c.geo}</span>}
                      {c.operator && <span> &middot; {c.operator}</span>}
                    </div>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>
                    {s.clicks.toLocaleString()}
                  </td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>
                    {s.conversions.toLocaleString()}
                  </td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>
                    {cCr}%
                  </td>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: "#e4e4f0" }}>
                    ${s.payout.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!campaigns || campaigns.length === 0) && (
          <div style={{ textAlign: "center", padding: 40, color: "#6b6b80", fontSize: 13 }}>
            No campaigns yet. <Link href="/campaigns/new" style={{ color: "#6366f1", textDecoration: "none" }}>Create one</Link>
          </div>
        )}
      </div>
    </div>
  );
}
