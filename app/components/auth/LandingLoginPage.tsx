"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingLoginPage() {
  const [mode,     setMode]     = useState<Mode>("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  function switchMode(next: Mode) { setMode(next); setError(null); setDone(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
        });
        if (error) throw error;
        setDone(true);
      } else {
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

  async function handleOAuth(provider: "google" | "facebook") {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) setError(error.message);
  }

  const titles: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create account",
    forgot: "Reset password",
  };
  const subtitles: Record<Mode, string> = {
    signin: "Sign in to continue.",
    signup: "Find your next home — with AI.",
    forgot: "We'll send you a reset link.",
  };
  const submitLabel = loading ? "Please wait…"
    : mode === "signin" ? "Sign in"
    : mode === "signup" ? "Create account"
    : "Send reset link";

  // ── Done state ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <PageWrap>
        <AuthCard>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="22" height="22" fill="none" stroke="#30D158" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 8, letterSpacing: "-0.02em" }}>
              {mode === "forgot" ? "Email sent" : "Confirm your email"}
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 24 }}>
              {mode === "forgot"
                ? `We sent a reset link to ${email}.`
                : `We sent a confirmation link to ${email}.`}
            </p>
            <button onClick={() => switchMode("signin")} style={{
              fontSize: 13, color: "var(--color-primary)", background: "none",
              border: "none", cursor: "pointer", fontWeight: 600,
            }}>
              ← Back to sign in
            </button>
          </div>
        </AuthCard>
      </PageWrap>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <PageWrap>
      <AuthCard>
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 28, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg, #7C6EF2, #9B8BF5)",
            boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 4px 12px rgba(124,110,242,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            habi<span style={{ color: "var(--color-primary)" }}>no</span>
          </span>
        </Link>

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          {titles[mode]}
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>
          {subtitles[mode]}
        </p>

        {/* OAuth */}
        {mode !== "forgot" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <OAuthBtn label="Continue with Google" onClick={() => handleOAuth("google")}>
                <GoogleIcon />
              </OAuthBtn>
              <OAuthBtn label="Continue with Facebook" onClick={() => handleOAuth("facebook")}>
                <FacebookIcon />
              </OAuthBtn>
            </div>
            <Divider />
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email">
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,110,242,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,110,242,0.1)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </Field>

          {mode !== "forgot" && (
            <Field label="Password" action={mode === "signin"
              ? <button type="button" onClick={() => switchMode("forgot")}
                  style={{ fontSize: 12, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>
                  Forgot?
                </button>
              : undefined
            }>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,110,242,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,110,242,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 2,
                    color: "var(--text-3)", display: "flex", alignItems: "center",
                  }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </Field>
          )}

          {error && (
            <div style={{
              background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.2)",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "var(--err)", display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "11px",
            background: "var(--color-primary)",
            border: "none", borderRadius: 9,
            color: "white", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4, opacity: loading ? 0.65 : 1,
            transition: "all 0.14s",
            boxShadow: "0 0 0 1px rgba(124,110,242,0.35), 0 4px 16px rgba(124,110,242,0.2)",
            letterSpacing: "0.01em",
          }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--color-secondary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; }}
          >
            {submitLabel}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          {mode === "signin" && (
            <p style={{ fontSize: 13, color: "var(--text-2)" }}>
              Don&apos;t have an account?{" "}
              <button onClick={() => switchMode("signup")} style={{ color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Sign up
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p style={{ fontSize: 13, color: "var(--text-2)" }}>
              Already have an account?{" "}
              <button onClick={() => switchMode("signin")} style={{ color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button onClick={() => switchMode("signin")} style={{ fontSize: 13, color: "var(--text-2)", background: "none", border: "none", cursor: "pointer" }}>
              ← Back to sign in
            </button>
          )}
        </div>
      </AuthCard>
    </PageWrap>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 9,
  fontSize: 14,
  color: "var(--text-1)",
  outline: "none",
  transition: "border-color 0.14s, box-shadow 0.14s",
  fontFamily: "inherit",
};

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Radial glow background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,110,242,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(124,110,242,0.06) 0%, transparent 60%)",
      }} />
      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 80%)",
      }} />
      {children}
    </div>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "relative",
      width: "100%", maxWidth: 400,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: "32px",
      boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
    }}>
      {/* top shine */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
      }} />
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>or</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function OAuthBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
      padding: "10px 14px",
      background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9,
      color: "var(--text-1)", fontSize: 13.5, fontWeight: 500,
      cursor: "pointer", transition: "all 0.14s", fontFamily: "inherit",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      {children}
      {label}
    </button>
  );
}
