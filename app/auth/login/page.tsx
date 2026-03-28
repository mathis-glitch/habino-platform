import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params     = await searchParams;
  const redirectTo = params.redirect || "/admin";
  const errorMsg   = params.error ? decodeURIComponent(params.error) : null;

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm " +
    "focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold" style={{ color: "#00A884" }}>Habino</span>
          </Link>
          <p className="text-slate-500 mt-1.5 text-sm">Sign in to your admin account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <form method="POST" action="/api/auth/login" className="flex flex-col gap-5">
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
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #00A884, #0F1F3D)" }}
            >
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            No account yet?{" "}
            <Link href="/auth/register" className="font-medium hover:underline" style={{ color: "#00A884" }}>
              Register for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
