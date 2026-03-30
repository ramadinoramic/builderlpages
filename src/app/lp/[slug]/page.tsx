import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PageProps {
  params: { slug: string };
  searchParams: { preview?: string };
}

export default async function LandingPage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabaseClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!campaign) return notFound();

  // Determine variant
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

  // Build the click-tracked CTA URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const ctaUrl = variant.cta_url
    ? `${baseUrl}/api/click?campaign_id=${campaign.id}&variant_id=${variant.id}&redirect=${encodeURIComponent(variant.cta_url)}`
    : "#";

  // If campaign uses a lander from the repository, serve raw HTML
  if (campaign.lander_id) {
    const { data: lander } = await supabase
      .from("landers")
      .select("html, variables, defaults")
      .eq("id", campaign.lander_id)
      .single();

    if (lander) {
      const overrides: Record<string, string> = {
        ...(lander.defaults as Record<string, string> || {}),
        ...((variant.custom_fields as Record<string, string>) || {}),
        CTA_URL: ctaUrl,
      };

      // Also map standard variant fields into variables
      if (variant.headline) overrides.HEADLINE = variant.headline;
      if (variant.subheadline) overrides.SUBHEADLINE = variant.subheadline;
      if (variant.cta_text) overrides.CTA_TEXT = variant.cta_text;
      if (variant.cta_subtext) overrides.CTA_SUBTEXT = variant.cta_subtext;
      if (variant.cta_color) overrides.CTA_COLOR = variant.cta_color;
      if (variant.hero_image_url) overrides.HERO_IMAGE = variant.hero_image_url;
      if (variant.body_text) overrides.BODY_TEXT = variant.body_text;

      let html = lander.html as string;

      // Replace all {{VARIABLE}} placeholders
      for (const [key, value] of Object.entries(overrides)) {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      // Remove any remaining unreplaced variables
      html = html.replace(/\{\{[A-Z_]+\}\}/g, "");

      return (
        <html>
          <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
          <body dangerouslySetInnerHTML={{ __html: html }} />
        </html>
      );
    }
  }

  // Fallback: built-in templates (legacy support)
  const { getTemplateComponent } = await import("@/components/templates/TemplateRegistry");
  const TemplateComponent = getTemplateComponent(campaign.template);
  if (!TemplateComponent) return notFound();

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
