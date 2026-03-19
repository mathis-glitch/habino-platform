import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const formData   = await request.formData();
  const email      = formData.get("email")      as string;
  const password   = formData.get("password")   as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/admin";

  const loginUrl = new URL(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`, request.url);
  const adminUrl = new URL(redirectTo, request.url);

  // Build the success redirect response first so Supabase can attach cookies to it
  const successResponse = NextResponse.redirect(adminUrl, { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Set cookies directly on the redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const errorUrl = new URL(loginUrl);
    errorUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errorUrl, { status: 303 });
  }

  // successResponse already has the session cookies attached by setAll above
  return successResponse;
}
