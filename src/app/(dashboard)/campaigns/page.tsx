import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function CampaignsPage() {
  const supabase = createServerSupabaseClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: stats } = await supabase
    .from("campaign_stats")
    .select("*");

  // Aggregate stats per campaign
  const campaignStatsMap: Record<string, { clicks: number; conversions: number; conversion_rate: number; total_payout: number }> = {};
  for (const s of stats || []) {
    if (!campaignStatsMap[s.campaign_id]) {
      campaignStatsMap[s.campaign_id] = { clicks: 0, conversions: 0, conversion_rate: 0, total_payout: 0 };
    }
    campaignStatsMap[s.campaign_id].clicks += Number(s.clicks);
    campaignStatsMap[s.campaign_id].conversions += Number(s.conversions);
    campaignStatsMap[s.campaign_id].total_payout += Number(s.total_payout);
  }
  for (const id of Object.keys(campaignStatsMap)) {
    const c = campaignStatsMap[id];
    c.conversion_rate = c.clicks > 0 ? Math.round((c.conversions / c.clicks) * 10000) / 100 : 0;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Campaigns</h1>
        <Link
          href="/campaigns/new"
          style={{
            padding: "10px 20px", background: "#00ca6b", color: "#fff", borderRadius: 8,
            textDecoration: "none", fontWeight: 600, fontSize: 14,
          }}
        >
          + New Campaign
        </Link>
      </div>

      <div style={{ background: "#1a1a2e", borderRadius: 12, border: "1px solid #2a2a40", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a40" }}>
              {["Campaign", "Status", "Geo", "Operator", "Clicks", "Conv.", "CR", "Payout"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#666688", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(campaigns || []).map((campaign) => {
              const s = campaignStatsMap[campaign.id] || { clicks: 0, conversions: 0, conversion_rate: 0, total_payout: 0 };
              return (
                <tr key={campaign.id} style={{ borderBottom: "1px solid #2a2a40" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/campaigns/${campaign.id}`} style={{ color: "#fff", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
                      {campaign.name}
                    </Link>
                    <div style={{ fontSize: 11, color: "#666688", marginTop: 2 }}>/lp/{campaign.slug}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge status={campaign.status} /></td>
                  <td style={{ padding: "12px 16px", color: "#8888aa", fontSize: 13 }}>{campaign.geo || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#8888aa", fontSize: 13 }}>{campaign.operator || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="stat-number" style={{ color: "#fff", fontSize: 14 }}>{s.clicks.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="stat-number" style={{ color: "#fff", fontSize: 14 }}>{s.conversions.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="stat-number" style={{ color: "#00ca6b", fontSize: 14, fontWeight: 600 }}>{s.conversion_rate}%</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="stat-number" style={{ color: "#fff", fontSize: 14 }}>${s.total_payout.toLocaleString()}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!campaigns || campaigns.length === 0) && (
          <div style={{ textAlign: "center", padding: 48, color: "#666688" }}>No campaigns yet</div>
        )}
      </div>
    </div>
  );
}
