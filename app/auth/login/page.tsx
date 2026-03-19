import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params     = await searchParams;
  const redirectTo = params.redirect || "/admin";
  const errorMsg   = params.error ? decodeURIComponent(params.error) : null;

  async function handleLogin(formData: FormData) {
    "use server";

    const email    = formData.get("email")      as string;
    const password = formData.get("password")   as string;
    const dest     = formData.get("redirectTo") as string || "/admin";

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(
        `/auth/login?redirect=${encodeURIComponent(dest)}&error=${encodeURIComponent(error.message)}`
      );
    }

    redirect(dest);
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm " +
    "focus:outline-none focus:ring-2 focus:border-transparent bg-white";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-primary">Habino</span>
          </Link>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form action={handleLogin} className="flex flex-col gap-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-2.5 rounded-lg font-medium"
            >
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
