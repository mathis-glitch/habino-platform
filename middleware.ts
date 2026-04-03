import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getTenantSlug, isCustomDomain } from "@/lib/tenant";

// ── Tenant cache — avoids a Supabase round-trip on every request ──────────────
// TTL: 5 minutes. Safe because tenant config rarely changes.
const tenantCache = new Map<string, { id: string; slug: string; exp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function lookupTenantCached(column: string, value: string, serviceKey: string, supabaseUrl: string) {
  const cacheKey = `${column}:${value}`;
  const cached = tenantCache.get(cacheKey);
  if (cached && cached.exp > Date.now()) return cached;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/tenants?${column}=eq.${encodeURIComponent(value)}&is_active=eq.true&select=id,slug&limit=1`,
    { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
  ).catch(() => null);
  if (!res?.ok) return null;
  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const tenant = { id: rows[0].id, slug: rows[0].slug, exp: Date.now() + CACHE_TTL };
  tenantCache.set(cacheKey, tenant);
  return tenant;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, Next.js internals, and auth API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── 1. Resolve tenant ──────────────────────────────────────
  let tenantId: string | null = null;
  let tenantSlug: string | null = null;

  // Use the official Supabase Next.js SSR pattern:
  // When session tokens are refreshed, we must forward the new cookies
  // to server components via the request — not just the browser response.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Step 1: update the request cookies so server components see the fresh session
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Step 2: rebuild the response with the updated request cookies
          supabaseResponse = NextResponse.next({ request });
          // Step 3: also set cookies on the response so the browser stores them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const slug = getTenantSlug(hostname);

  if (slug) {
    const tenant = await lookupTenantCached("slug", slug, serviceKey, supabaseUrl);
    if (tenant) { tenantId = tenant.id; tenantSlug = tenant.slug; }
  } else if (isCustomDomain(hostname)) {
    const tenant = await lookupTenantCached("custom_domain", hostname, serviceKey, supabaseUrl);
    if (tenant) { tenantId = tenant.id; tenantSlug = tenant.slug; }
  }

  // ── 2. Refresh session (must happen before tenant headers are set) ───────────
  // getUser() validates + refreshes the session. If tokens were rotated,
  // setAll() above already updated supabaseResponse with the new cookies.
  const { data: { user } } = await supabase.auth.getUser();

  // ── 3. Route handling ─────────────────────────────────────────────────────
  // "/" always redirects to /explore (no login wall)
  if (pathname === "/") {
    const exploreUrl = request.nextUrl.clone();
    exploreUrl.pathname = "/explore";
    return NextResponse.redirect(exploreUrl);
  }

  // ── 4. Inject tenant info into request headers ─────────────
  // Set on supabaseResponse so server components can read via headers()
  supabaseResponse.headers.set("x-tenant-id",   tenantId   ?? "");
  supabaseResponse.headers.set("x-tenant-slug", tenantSlug ?? "");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
