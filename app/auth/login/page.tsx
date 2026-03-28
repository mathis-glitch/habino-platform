"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const INPUT: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  color: "#1a1a1a",
  outline: "none",
  background: "white",
};

export default function LoginPage() {
  const params     = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const rawError   = params.get("error");
  const errorMsg   = rawError ? decodeURIComponent(rawError) : null;
  const [showPw, setShowPw] = useState(false);

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
        {/* subtle dark gradient at bottom for brand credibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <p style={{ color: "white", fontSize: 15, fontWeight: 500, opacity: 0.9, fontStyle: "italic", lineHeight: 1.6 }}>
            "Find your perfect space in Addis Ababa — powered by AI."
          </p>
        </div>
      </div>

      {/* ── RIGHT — form ────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col px-8 md:px-12 py-8">

        {/* Logo */}
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
              fontSize: 30,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>
              Sign in to your Habino account.
            </p>

            <form method="POST" action="/api/auth/login" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  style={INPUT}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                    Password
                  </label>
                  <Link href="/auth/reset" style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    style={{ ...INPUT, paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", padding: 2,
                      color: "#9ca3af", display: "flex", alignItems: "center",
                    }}
                  >
                    {showPw ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 6, padding: "10px 14px",
                  fontSize: 13, color: "#b91c1c", display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                style={{
                  width: "100%", padding: "13px",
                  background: "var(--color-primary)",
                  border: "none", borderRadius: 6,
                  color: "white", fontSize: 15, fontWeight: 600,
                  cursor: "pointer", marginTop: 4,
                  letterSpacing: "0.01em",
                  transition: "opacity 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Continue
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>

            {/* Register link */}
            <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              New to Habino?{" "}
              <Link href="/auth/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                Create account
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
