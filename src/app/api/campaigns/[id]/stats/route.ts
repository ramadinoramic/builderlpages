import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const campaignId = params.id;

  // Get campaign stats from the view
  const { data: stats, error } = await supabase
    .from("campaign_stats")
    .select("*")
    .eq("campaign_id", campaignId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get daily click/conversion data for charts
  const { data: dailyClicks } = await supabase
    .from("clicks")
    .select("variant_id, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  const { data: dailyConversions } = await supabase
    .from("conversions")
    .select("variant_id, created_at, payout")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  // Aggregate by day
  const dailyData: Record<string, Record<string, { clicks: number; conversions: number; payout: number }>> = {};

  for (const click of dailyClicks || []) {
    const day = click.created_at.split("T")[0];
    if (!dailyData[day]) dailyData[day] = {};
    if (!dailyData[day][click.variant_id]) dailyData[day][click.variant_id] = { clicks: 0, conversions: 0, payout: 0 };
    dailyData[day][click.variant_id].clicks++;
  }

  for (const conv of dailyConversions || []) {
    const day = conv.created_at.split("T")[0];
    if (!dailyData[day]) dailyData[day] = {};
    if (!dailyData[day][conv.variant_id]) dailyData[day][conv.variant_id] = { clicks: 0, conversions: 0, payout: 0 };
    dailyData[day][conv.variant_id].conversions++;
    dailyData[day][conv.variant_id].payout += Number(conv.payout || 0);
  }

  return NextResponse.json({ stats, daily: dailyData });
}
