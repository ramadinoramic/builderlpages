import { createServerSupabaseClient } from "@/lib/supabase/server";
import CampaignCard from "@/components/dashboard/CampaignCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(10);

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

  // Overall totals
  const totalClicks = Object.values(campaignStatsMap).reduce((s, c) => s + c.clicks, 0);
  const totalConversions = Object.values(campaignStatsMap).reduce((s, c) => s + c.conversions, 0);
  const totalPayout = Object.values(campaignStatsMap).reduce((s, c) => s + c.total_payout, 0);
  const overallCR = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0;

  const activeCampaigns = (campaigns || []).filter((c) => c.status === "active").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Dashboard</h1>
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

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Active Campaigns", value: activeCampaigns, color: "#00ca6b" },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), color: "#fff" },
          { label: "Total Conversions", value: totalConversions.toLocaleString(), color: "#fff" },
          { label: "Avg. CR", value: `${overallCR}%`, color: "#00ca6b" },
          { label: "Total Payout", value: `$${totalPayout.toLocaleString()}`, color: "#fff" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#1a1a2e", borderRadius: 12, padding: 16, border: "1px solid #2a2a40" }}>
            <div style={{ fontSize: 12, color: "#666688", marginBottom: 4 }}>{stat.label}</div>
            <div className="stat-number" style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Campaign Cards */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#8888aa", marginBottom: 16 }}>Recent Campaigns</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {(campaigns || []).map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            stats={campaignStatsMap[campaign.id]}
          />
        ))}
      </div>

      {(!campaigns || campaigns.length === 0) && (
        <div style={{ textAlign: "center", padding: 48, color: "#666688" }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No campaigns yet</p>
          <Link href="/campaigns/new" style={{ color: "#00ca6b", textDecoration: "none", fontWeight: 600 }}>
            Create your first campaign
          </Link>
        </div>
      )}
    </div>
  );
}
