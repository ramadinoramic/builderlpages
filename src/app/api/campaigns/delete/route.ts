import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/campaigns/delete — delete one or more campaigns
// Body: { ids: string[] }
export async function POST(request: NextRequest) {
  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Delete in FK order: conversions → clicks → variants → campaigns
  for (const id of ids) {
    await supabase.from("conversions").delete().eq("campaign_id", id);
    await supabase.from("clicks").delete().eq("campaign_id", id);
    await supabase.from("variants").delete().eq("campaign_id", id);
    await supabase.from("campaigns").delete().eq("id", id);
  }

  return NextResponse.json({ deleted: ids.length });
}
