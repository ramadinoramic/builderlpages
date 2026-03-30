import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { selectVariant } from "@/lib/traffic-split";

// Simple in-memory cache for campaign configs
const campaignCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle LP routes — traffic splitting
  if (pathname.startsWith("/lp/")) {
    return handleLPRoute(request);
  }

  // Handle auth for dashboard routes
  return handleAuth(request);
}

async function handleLPRoute(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/lp/")[1]?.split("/")[0];
  if (!slug) return NextResponse.next();

  // Check for preview mode — bypass splitting
  const previewVariantId = request.nextUrl.searchParams.get("preview");
  if (previewVariantId) return NextResponse.next();

  // Check for existing variant cookie
  const cookieName = `ab_${slug}`;
  const existingVariant = request.cookies.get(cookieName)?.value;
  if (existingVariant) return NextResponse.next();

  // Fetch campaign config (with cache)
  const cacheKey = `campaign_${slug}`;
  let campaignData = campaignCache.get(cacheKey);

  if (!campaignData || Date.now() - campaignData.timestamp > CACHE_TTL) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() {},
          },
        }
      );

      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, status")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (!campaign) return NextResponse.next();

      const { data: variants } = await supabase
        .from("variants")
        .select("id, traffic_weight, status")
        .eq("campaign_id", campaign.id)
        .eq("status", "active");

      campaignData = {
        data: { campaign, variants: variants || [] },
        timestamp: Date.now(),
      };
      campaignCache.set(cacheKey, campaignData);
    } catch {
      return NextResponse.next();
    }
  }

  const { variants } = campaignData.data as {
    campaign: { id: string };
    variants: Array<{ id: string; traffic_weight: number }>;
  };

  if (!variants || variants.length === 0) return NextResponse.next();

  // Weighted random selection
  const selectedVariantId = selectVariant(variants);
  if (!selectedVariantId) return NextResponse.next();

  // Set cookie and continue
  const response = NextResponse.next();
  response.cookies.set(cookieName, selectedVariantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return response;
}

async function handleAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — skip auth
  if (
    pathname.startsWith("/lp/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check Supabase session
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
