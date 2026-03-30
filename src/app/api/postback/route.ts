import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clickId = searchParams.get("click_id");
  const type = searchParams.get("type") || "registration";
  const payout = searchParams.get("payout");
  const currency = searchParams.get("currency") || "USD";
  const externalId = searchParams.get("external_id");
  const secret = searchParams.get("secret");

  // Validate postback secret if configured
  const postbackSecret = process.env.POSTBACK_SECRET;
  if (postbackSecret && secret !== postbackSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!clickId) {
    return NextResponse.json({ error: "Missing click_id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Look up the click
  const { data: click, error: clickError } = await supabase
    .from("clicks")
    .select("click_id, campaign_id, variant_id")
    .eq("click_id", clickId)
    .single();

  if (clickError || !click) {
    return NextResponse.json({ error: "Click not found" }, { status: 404 });
  }

  // Store raw postback data
  const postbackRaw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    postbackRaw[key] = value;
  });

  // Insert conversion
  const { error: convError } = await supabase
    .from("conversions")
    .insert({
      click_id: click.click_id,
      campaign_id: click.campaign_id,
      variant_id: click.variant_id,
      conversion_type: type,
      payout: payout ? parseFloat(payout) : null,
      currency,
      external_id: externalId,
      postback_raw: postbackRaw,
    });

  if (convError) {
    return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", click_id: clickId });
}
