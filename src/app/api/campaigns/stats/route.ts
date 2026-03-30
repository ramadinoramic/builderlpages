import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Quick Stats API - can be called from Slack/Make.com for morning briefs
export async function GET() {
  const supabase = createAdminClient();

  const { data: stats } = await supabase
    .from("campaign_stats")
    .select("*");

  if (!stats) {
    return NextResponse.json({ campaigns: [] });
  }

  // Aggregate per campaign
  const campaigns: Record<string, {
    name: string;
    status: string;
    clicks: number;
    conversions: number;
    cr: number;
    payout: number;
    variants: Array<{ name: string; clicks: number; conversions: number; cr: number; payout: number }>;
  }> = {};

  for (const s of stats) {
    if (!campaigns[s.campaign_id]) {
      campaigns[s.campaign_id] = {
        name: s.campaign_name,
        status: s.status,
        clicks: 0,
        conversions: 0,
        cr: 0,
        payout: 0,
        variants: [],
      };
    }
    const c = campaigns[s.campaign_id];
    c.clicks += Number(s.clicks);
    c.conversions += Number(s.conversions);
    c.payout += Number(s.total_payout);
    c.variants.push({
      name: s.variant_name,
      clicks: Number(s.clicks),
      conversions: Number(s.conversions),
      cr: Number(s.conversion_rate),
      payout: Number(s.total_payout),
    });
  }

  for (const c of Object.values(campaigns)) {
    c.cr = c.clicks > 0 ? Math.round((c.conversions / c.clicks) * 10000) / 100 : 0;
  }

  return NextResponse.json({ campaigns: Object.values(campaigns) });
}
