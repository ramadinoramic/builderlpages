import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateClickId } from "@/lib/click-id";
import { getGeoFromHeaders } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("campaign_id");
  const variantId = searchParams.get("variant_id");
  const redirect = searchParams.get("redirect");

  if (!campaignId || !variantId || !redirect) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const clickId = generateClickId();
  const geo = getGeoFromHeaders(request);

  // Fire-and-forget: insert click record
  const supabase = createAdminClient();
  supabase
    .from("clicks")
    .insert({
      click_id: clickId,
      campaign_id: campaignId,
      variant_id: variantId,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
      user_agent: request.headers.get("user-agent") || null,
      referer: request.headers.get("referer") || null,
      geo_country: geo.country,
      geo_city: geo.city,
    })
    .then(() => {});

  // Build redirect URL with click_id
  const url = new URL(redirect);
  url.searchParams.set("click_id", clickId);

  return NextResponse.redirect(url.toString(), 302);
}
