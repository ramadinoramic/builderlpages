import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PageProps {
  params: { slug: string };
  searchParams: { preview?: string };
}

function getOrigin(): string {
  // Read the actual domain from the request
  const h = headers();
  // On Vercel, x-forwarded-host contains the PUBLIC domain the user typed
  // (e.g. builderlpages.vercel.app), while host may contain the deployment URL
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
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
  const origin = getOrigin();

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("slug", params.slug).single();
  if (!campaign) return notFound();

  const variant = await getVariant(supabase, campaign.id, params.slug, searchParams.preview);
  if (!variant) return notFound();

  const cf = (variant.custom_fields || {}) as Record<string, string>;

  // Get raw CTA URLs
  let ctaUrls: string[] = [];
  try {
    const raw = cf.CTA_URLS;
    if (raw) ctaUrls = JSON.parse(raw).filter(Boolean);
  } catch {}
  if (ctaUrls.length === 0) {
    const single = variant.cta_url || cf.CTA_URL || "";
    if (single) ctaUrls = [single];
  }

  // Build tracked CTA URLs
  const trackedUrls = ctaUrls.map((url) =>
    `${origin}/api/click?campaign_id=${campaign.id}&variant_id=${variant.id}&redirect=${encodeURIComponent(url)}`
  );

  // --- Lander repository ---
  if (campaign.lander_id) {
    const { data: lander } = await supabase.from("landers").select("html, defaults").eq("id", campaign.lander_id).single();
    if (!lander) return notFound();

    const overrides: Record<string, string> = {
      ...(lander.defaults as Record<string, string> || {}),
      ...cf,
    };
    // Set tracked CTA URLs
    if (trackedUrls[0]) overrides.CTA_URL = trackedUrls[0];
    if (trackedUrls[1]) overrides.CTA_URL_2 = trackedUrls[1];
    if (trackedUrls[2]) overrides.CTA_URL_3 = trackedUrls[2];
    delete overrides.CTA_URLS;
    // Standard fields
    if (variant.headline) overrides.HEADLINE = variant.headline;
    if (variant.subheadline) overrides.SUBHEADLINE = variant.subheadline;
    if (variant.cta_text) overrides.CTA_TEXT = variant.cta_text;
    if (variant.cta_color) overrides.CTA_COLOR = variant.cta_color;

    let html = lander.html as string;

    // Replace all {{VARIABLE}} placeholders
    for (const [key, value] of Object.entries(overrides)) {
      if (!value) continue;
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    html = html.replace(/\{\{[A-Z][A-Z0-9_]*\}\}/g, "");

    // Inject CTA rotation script for class/data-attribute based CTAs
    if (trackedUrls.length > 0) {
      const script = trackedUrls.length === 1
        ? `<script>(function(){var u=${JSON.stringify(trackedUrls[0])};document.querySelectorAll('a[data-cta],a.cta,a.cta-btn,a.cta-button,.cta a,.cta-link a').forEach(function(a){a.href=u});})();<\/script>`
        : `<script>(function(){var urls=${JSON.stringify(trackedUrls)};function pick(){return urls[Math.floor(Math.random()*urls.length)];}document.querySelectorAll('a[data-cta],a.cta,a.cta-btn,a.cta-button,.cta a,.cta-link a').forEach(function(a){a.href=pick();a.addEventListener("click",function(e){e.preventDefault();window.open(pick(),"_self");});});})();<\/script>`;
      if (html.includes("</body>")) {
        html = html.replace("</body>", script + "</body>");
      } else {
        html += script;
      }
    }

    // DEBUG: Add a comment showing what origin was detected
    // Remove this line once the URL issue is confirmed fixed
    html = html.replace("<head>", `<head><!-- LP Builder origin: ${origin} -->`);

    // Serve directly — dangerouslySetInnerHTML renders the complete HTML
    // without wrapping in additional <html><body> tags
    return (
      <html suppressHydrationWarning>
        <body
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ margin: 0, padding: 0 }}
        />
      </html>
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
        cta_url: trackedUrls[0] || "#",
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
