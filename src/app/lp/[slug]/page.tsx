import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTemplateComponent } from "@/components/templates/TemplateRegistry";

interface PageProps {
  params: { slug: string };
  searchParams: { preview?: string };
}

export default async function LandingPage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabaseClient();

  // Fetch campaign by slug
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!campaign) return notFound();

  // Determine variant: preview override > cookie > first active variant
  let variantId = searchParams.preview || null;

  if (!variantId) {
    const cookieStore = cookies();
    const variantCookie = cookieStore.get(`ab_${params.slug}`);
    variantId = variantCookie?.value || null;
  }

  let variant;
  if (variantId) {
    const { data } = await supabase
      .from("variants")
      .select("*")
      .eq("id", variantId)
      .eq("campaign_id", campaign.id)
      .single();
    variant = data;
  }

  // Fallback: get any active variant
  if (!variant) {
    const { data } = await supabase
      .from("variants")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("status", "active")
      .order("is_control", { ascending: false })
      .limit(1)
      .single();
    variant = data;
  }

  if (!variant) return notFound();

  const TemplateComponent = getTemplateComponent(campaign.template);
  if (!TemplateComponent) return notFound();

  // Build click-tracked CTA URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const ctaUrl = `${baseUrl}/api/click?campaign_id=${campaign.id}&variant_id=${variant.id}&redirect=${encodeURIComponent(variant.cta_url || "")}`;

  const steps = typeof variant.steps === "string" ? JSON.parse(variant.steps) : variant.steps || [];
  const paymentMethods = typeof variant.payment_methods === "string" ? JSON.parse(variant.payment_methods) : variant.payment_methods || [];

  return (
    <TemplateComponent
      variant={{
        headline: variant.headline || "",
        subheadline: variant.subheadline || "",
        cta_text: variant.cta_text || "",
        cta_subtext: variant.cta_subtext || "",
        cta_color: variant.cta_color || "#00ca6b",
        cta_url: ctaUrl,
        hero_image_url: variant.hero_image_url || undefined,
        body_text: variant.body_text || undefined,
        steps,
        payment_methods: paymentMethods,
        custom_css: variant.custom_css || undefined,
        custom_fields: variant.custom_fields || {},
      }}
      campaign={{
        operator: campaign.operator || "",
        geo: campaign.geo || "",
      }}
    />
  );
}
