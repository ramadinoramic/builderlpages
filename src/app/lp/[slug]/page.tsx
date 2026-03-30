import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PageProps {
  params: { slug: string };
  searchParams: { preview?: string };
}

async function getVariant(supabase: ReturnType<typeof createServerSupabaseClient>, campaign: { id: string }, slug: string, preview?: string | null) {
  let variantId = preview || null;
  if (!variantId) {
    const cookieStore = cookies();
    variantId = cookieStore.get(`ab_${slug}`)?.value || null;
  }

  if (variantId) {
    const { data } = await supabase.from("variants").select("*").eq("id", variantId).eq("campaign_id", campaign.id).single();
    if (data) return data;
  }

  const { data } = await supabase.from("variants").select("*").eq("campaign_id", campaign.id).eq("status", "active").order("is_control", { ascending: false }).limit(1).single();
  return data;
}

function buildTrackedUrl(baseUrl: string, campaignId: string, variantId: string, rawCtaUrl: string): string {
  if (!rawCtaUrl) return "";
  return `${baseUrl}/api/click?campaign_id=${campaignId}&variant_id=${variantId}&redirect=${encodeURIComponent(rawCtaUrl)}`;
}

function processLanderHtml(rawHtml: string, overrides: Record<string, string>, trackedCtaUrl: string): string {
  let html = rawHtml;

  // Replace all {{VARIABLE}} placeholders
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) continue;
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Remove any remaining unreplaced variables
  html = html.replace(/\{\{[A-Z][A-Z0-9_]*\}\}/g, "");

  // Inject CTA script for data-cta / class-based CTA links
  if (trackedCtaUrl) {
    const script = `<script>(function(){var u=${JSON.stringify(trackedCtaUrl)};document.querySelectorAll('a[data-cta],a.cta,a.cta-btn,a.cta-button,.cta a,.cta-link a').forEach(function(a){a.href=u});})();<\/script>`;
    if (html.includes("</body>")) {
      html = html.replace("</body>", script + "</body>");
    } else {
      html += script;
    }
  }

  return html;
}

export default async function LandingPage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabaseClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("slug", params.slug).single();
  if (!campaign) return notFound();

  const variant = await getVariant(supabase, campaign, params.slug, searchParams.preview);
  if (!variant) return notFound();

  const cf = (variant.custom_fields || {}) as Record<string, string>;
  const rawCtaUrl = variant.cta_url || cf.CTA_URL || "";
  const trackedCtaUrl = buildTrackedUrl(baseUrl, campaign.id, variant.id, rawCtaUrl);

  // --- Lander repository: serve raw HTML ---
  if (campaign.lander_id) {
    const { data: lander } = await supabase.from("landers").select("html, defaults").eq("id", campaign.lander_id).single();
    if (!lander) return notFound();

    const overrides: Record<string, string> = {
      ...(lander.defaults as Record<string, string> || {}),
      ...cf,
    };
    if (trackedCtaUrl) overrides.CTA_URL = trackedCtaUrl;
    if (variant.headline) overrides.HEADLINE = variant.headline;
    if (variant.subheadline) overrides.SUBHEADLINE = variant.subheadline;
    if (variant.cta_text) overrides.CTA_TEXT = variant.cta_text;
    if (variant.cta_color) overrides.CTA_COLOR = variant.cta_color;

    const html = processLanderHtml(lander.html as string, overrides, trackedCtaUrl);

    // Serve via iframe to preserve the lander's complete DOM structure
    // (its own <html>, <head>, <body>, CSS, JS) without Next.js interference
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0;padding:0;height:100%;overflow:hidden}` }} />
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          title="Landing Page"
        />
      </>
    );
  }

  // --- Legacy: built-in templates ---
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
        cta_url: trackedCtaUrl || "#",
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
