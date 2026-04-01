"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ── Shared input / label styles ───────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  color: "#1a1a1a",
  outline: "none",
  background: "white",
  transition: "border-color 0.15s",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 5,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingLoginPage() {
  const [mode,    setMode]    = useState<Mode>("signin");
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setDone(false);
  }

  // ── Email / password / reset ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/map";
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/map` },
        });
        if (error) throw error;
        setDone(true);
      } else {
        // forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
        });
        if (error) throw error;
        setDone(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── OAuth ────────────────────────────────────────────────────────────────
  async function handleOAuth(provider: "google" | "facebook") {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/map` },
    });
    if (error) setError(error.message);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const title: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create account",
    forgot: "Reset password",
  };

  const subtitle: Record<Mode, string> = {
    signin: "Sign in to your Habino account.",
    signup: "Find your home in Addis Ababa — powered by AI.",
    forgot: "We'll send a reset link to your email.",
  };

  const submitLabel = loading
    ? "Please wait…"
    : mode === "signin" ? "Sign in"
    : mode === "signup" ? "Create account"
    : "Send reset link";

  // ── "Done" state (email sent) ─────────────────────────────────────────────
  if (done) {
    const doneTitle   = mode === "forgot" ? "Check your inbox" : "Confirm your email";
    const doneMessage = mode === "forgot"
      ? `We sent a password reset link to ${email}.`
      : `We sent a confirmation link to ${email}. Click it to activate your account.`;

    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 bg-white flex flex-col px-8 md:px-12 py-8">
          <Logo />
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-[380px] text-center">
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
                {doneTitle}
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
                {doneMessage}
              </p>
              <button
                onClick={() => switchMode("signin")}
                style={{ fontSize: 13, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                ← Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* RIGHT — form */}
      <div className="flex-1 bg-white flex flex-col px-8 md:px-12 py-8 overflow-y-auto">
        <Logo />

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-[380px]">

            {/* Heading */}
            <h1 style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 30, fontWeight: 700, color: "#1a1a1a",
              marginBottom: 8, letterSpacing: "-0.02em",
            }}>
              {title[mode]}
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>
              {subtitle[mode]}
            </p>

            {/* OAuth — only for signin / signup */}
            {mode !== "forgot" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  <OAuthButton label="Continue with Google" onClick={() => handleOAuth("google")}>
                    <GoogleIcon />
                  </OAuthButton>
                  <OAuthButton label="Continue with Facebook" onClick={() => handleOAuth("facebook")}>
                    <FacebookIcon />
                  </OAuthButton>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Email */}
              <div>
                <label style={LABEL}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={INPUT}
                />
              </div>

              {/* Password — not shown for forgot */}
              {mode !== "forgot" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <label style={{ ...LABEL, marginBottom: 0 }}>Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        style={{ fontSize: 12, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 13, color: "#b91c1c", display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: "var(--color-primary)",
                  border: "none", borderRadius: 8,
                  color: "white", fontSize: 15, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4, opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.15s",
                  letterSpacing: "0.01em",
                }}
              >
                {submitLabel}
              </button>
            </form>

            {/* Footer links */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              {mode === "signin" && (
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  New to Habino?{" "}
                  <button onClick={() => switchMode("signup")}
                    style={{ color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}>
                    Create account
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  Already have an account?{" "}
                  <button onClick={() => switchMode("signin")}
                    style={{ color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}>
                    Sign in
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <button onClick={() => switchMode("signin")}
                  style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
                  ← Back to sign in
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div className="hidden md:block md:w-[46%] relative overflow-hidden shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=85"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="absolute bottom-8 left-8 right-8">
        <p style={{ color: "white", fontSize: 15, fontWeight: 500, opacity: 0.9, fontStyle: "italic", lineHeight: 1.6 }}>
          "Find your perfect space in Addis Ababa — powered by AI."
        </p>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div>
      <Link href="/" className="inline-block">
        <span style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 22, fontWeight: 700, color: "#1a1a1a",
          letterSpacing: "-0.02em",
        }}>
          habino
        </span>
      </Link>
    </div>
  );
}

function OAuthButton({ label, onClick, children }: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "11px 14px",
        border: "1px solid #d1d5db", borderRadius: 8,
        background: "white", color: "#1a1a1a",
        fontSize: 14, fontWeight: 500, cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseOver={e => (e.currentTarget.style.background = "#f9fafb")}
      onMouseOut={e => (e.currentTarget.style.background = "white")}
    >
      {children}
      {label}
    </button>
  );
}
