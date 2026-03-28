import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params     = await searchParams;
  const redirectTo = params.redirect || "/admin";
  const errorMsg   = params.error ? decodeURIComponent(params.error) : null;

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — photo ────────────────────────────────────────────────────── */}
      <div className="hidden md:block md:w-[46%] relative overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* ── RIGHT — form ────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col px-10 py-8">

        {/* Logo — top left */}
        <div>
          <Link href="/" className="inline-block">
            <span style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
            }}>
              habino
            </span>
          </Link>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-[380px]">

            <h1 style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}>
              Sign in
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 }}>
              Enter your credentials to access your Habino dashboard.
            </p>

            <form method="POST" action="/api/auth/login" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="olivia@mail.com"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "11px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    color: "#1a1a1a",
                    outline: "none",
                    background: "white",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                    Password
                  </label>
                  <Link href="/auth/reset" style={{ fontSize: 12, color: "#4a7c59", textDecoration: "none" }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "11px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    color: "#1a1a1a",
                    outline: "none",
                    background: "white",
                  }}
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 6, padding: "10px 14px",
                  fontSize: 13, color: "#b91c1c",
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                style={{
                  width: "100%", padding: "13px",
                  background: "#4a7c59",
                  border: "none", borderRadius: 6,
                  color: "white", fontSize: 15, fontWeight: 600,
                  cursor: "pointer", marginTop: 4,
                  letterSpacing: "0.01em",
                }}
              >
                Continue
              </button>
            </form>

            {/* Register link */}
            <p style={{ marginTop: 24, fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              New to Habino?{" "}
              <Link href="/auth/register" style={{ color: "#4a7c59", fontWeight: 600, textDecoration: "none" }}>
                Create account
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
