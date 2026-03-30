import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: list all html templates
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("html_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create a new html template
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("html_templates")
    .insert({
      name: body.name,
      description: body.description || null,
      html_content: body.html_content,
      css_content: body.css_content || null,
      editable_regions: body.editable_regions || [],
      category: body.category || "casino",
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also register it in the templates table so it appears in campaign creation
  await supabase
    .from("templates")
    .upsert({
      id: `html-${data.id}`,
      name: data.name,
      description: data.description || "Uploaded HTML template",
      category: data.category,
      editable_fields: JSON.stringify([
        { key: "cta_url", label: "CTA URL", type: "url" },
        { key: "cta_text", label: "CTA Text", type: "text" },
        { key: "headline", label: "Headline", type: "text" },
        { key: "subheadline", label: "Subheadline", type: "text" },
      ]),
      is_active: true,
    });

  return NextResponse.json(data);
}
