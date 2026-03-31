import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PageProps {
  params: { slug: string };
  searchParams: { preview?: string };
}

function getBaseUrl(): string {
  // 1. Explicit env var (always wins)
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  // 2. Request host header — this is the ACTUAL domain the user is visiting
  //    (not VERCEL_URL which is the preview/deployment domain)
  const headersList = headers();
  const host = headersList.get("host");
  if (host) {
    const proto = headersList.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  // 3. Fallback
  return "http://localhost:3000";
}

async function getVariant(supabase: ReturnType<typeof createServerSupabaseClient>, campaignId: string, slug: string, preview?: string | null) {
  let variantId = preview || null;
  if (!variantId) {
    const cookieStore = cookies();
    variantId = cookieStore.get(`ab_${slug}`)?.value || null;
  }

  if (variantId) {
    const { data } = await supabase.from("variants").select("*").eq("id", variantId).eq("campaign_id", campaignId).single();
    if (data) return data;
  }

  const { data } = await supabase.from("variants").select("*").eq("campaign_id", campaignId).eq("status", "active").order("is_control", { ascending: false }).limit(1).single();
  return data;
}

export default async function LandingPage({ params, searchParams }: PageProps) {
  const supabase = createServerSupabaseClient();
  const baseUrl = getBaseUrl();

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("slug", params.slug).single();
  if (!campaign) return notFound();

  const variant = await getVariant(supabase, campaign.id, params.slug, searchParams.preview);
  if (!variant) return notFound();

  const cf = (variant.custom_fields || {}) as Record<string, string>;

  // --- Multi-CTA support ---
  // CTA URLs can be stored as:
  //   cta_url (single, legacy) OR
  //   custom_fields.CTA_URLS (JSON array of up to 3 URLs for rotation)
  //   custom_fields.CTA_URL (single)
  let ctaUrls: string[] = [];
  try {
    const raw = cf.CTA_URLS;
    if (raw) ctaUrls = JSON.parse(raw).filter(Boolean);
  } catch {}
  if (ctaUrls.length === 0) {
    const single = variant.cta_url || cf.CTA_URL || "";
    if (single) ctaUrls = [single];
  }

  // Build tracked URLs for all CTAs
  const trackedCtaUrls = ctaUrls.map((url) =>
    `${baseUrl}/api/click?campaign_id=${campaign.id}&variant_id=${variant.id}&redirect=${encodeURIComponent(url)}`
  );
  const primaryTrackedUrl = trackedCtaUrls[0] || "";

  // --- Lander repository ---
  if (campaign.lander_id) {
    const { data: lander } = await supabase.from("landers").select("html, defaults").eq("id", campaign.lander_id).single();
    if (!lander) return notFound();

    const overrides: Record<string, string> = {
      ...(lander.defaults as Record<string, string> || {}),
      ...cf,
    };
    // Always set CTA_URL to the primary tracked URL
    if (primaryTrackedUrl) overrides.CTA_URL = primaryTrackedUrl;
    // Also set CTA_URL_2, CTA_URL_3 if available
    if (trackedCtaUrls[1]) overrides.CTA_URL_2 = trackedCtaUrls[1];
    if (trackedCtaUrls[2]) overrides.CTA_URL_3 = trackedCtaUrls[2];
    // Standard variant fields
    if (variant.headline) overrides.HEADLINE = variant.headline;
    if (variant.subheadline) overrides.SUBHEADLINE = variant.subheadline;
    if (variant.cta_text) overrides.CTA_TEXT = variant.cta_text;
    if (variant.cta_color) overrides.CTA_COLOR = variant.cta_color;

    // Remove CTA_URLS from overrides (it's JSON, not a display value)
    delete overrides.CTA_URLS;

    let html = lander.html as string;

    // Replace all {{VARIABLE}} placeholders
    for (const [key, value] of Object.entries(overrides)) {
      if (!value) continue;
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    html = html.replace(/\{\{[A-Z][A-Z0-9_]*\}\}/g, "");

    // Inject CTA rotation script — randomly picks from available URLs on each click
    if (trackedCtaUrls.length > 0) {
      const script = trackedCtaUrls.length === 1
        ? `<script>(function(){var u=${JSON.stringify(primaryTrackedUrl)};document.querySelectorAll('a[data-cta],a.cta,a.cta-btn,a.cta-button,.cta a,.cta-link a').forEach(function(a){a.href=u});})();<\/script>`
        : `<script>(function(){var urls=${JSON.stringify(trackedCtaUrls)};function pick(){return urls[Math.floor(Math.random()*urls.length)];}document.querySelectorAll('a[data-cta],a.cta,a.cta-btn,a.cta-button,.cta a,.cta-link a').forEach(function(a){a.href=pick();a.addEventListener("click",function(e){e.preventDefault();window.location.href=pick();});});})();<\/script>`;

      if (html.includes("</body>")) {
        html = html.replace("</body>", script + "</body>");
      } else {
        html += script;
      }
    }

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
        cta_url: primaryTrackedUrl || "#",
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
