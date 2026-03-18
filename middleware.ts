import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getTenantSlug, isCustomDomain } from "@/lib/tenant";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals only
  // Note: /api/ routes are NOT skipped — they need x-tenant-id injected too
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── 1. Resolve tenant ──────────────────────────────────────
  let tenantId: string | null = null;
  let tenantSlug: string | null = null;

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Create a Supabase client to look up tenant
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const slug = getTenantSlug(hostname);

  if (slug) {
    // Subdomain-based lookup
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (tenant) {
      tenantId   = tenant.id;
      tenantSlug = tenant.slug;
    }
  } else if (isCustomDomain(hostname)) {
    // Custom domain lookup
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, is_active")
      .eq("custom_domain", hostname)
      .eq("is_active", true)
      .single();

    if (tenant) {
      tenantId   = tenant.id;
      tenantSlug = tenant.slug;
    }
  }

  // ── 2. Inject tenant info into request headers ─────────────
  if (tenantId) {
    response.headers.set("x-tenant-id",   tenantId);
    response.headers.set("x-tenant-slug", tenantSlug || "");
  } else {
    // No tenant found for this domain — could show a 404 or marketing page
    // For now, continue without tenant (root domain shows marketing page)
    response.headers.set("x-tenant-id",   "");
    response.headers.set("x-tenant-slug", "");
  }

  // ── 3. Refresh session token (required for server components to read auth) ─
  // This call refreshes/syncs the Supabase session cookies so that any
  // Server Component that calls supabase.auth.getUser() will see a valid session.
  // We do NOT redirect here — auth protection is handled inside each page.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
