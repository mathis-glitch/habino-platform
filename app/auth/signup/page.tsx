"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const G = "#2D6A4F";

const INPUT: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "13px 16px",
  border: "1.5px solid #E5E7EB",
  borderRadius: 12, fontSize: 15,
  color: "#1A1A2E", outline: "none",
  background: "#FAFAFA",
  fontFamily: "'Inter',-apple-system,sans-serif",
  transition: "border-color 0.15s",
};

function SignupForm() {
  const params     = useSearchParams();
  const redirectTo = params.get("redirect") || "/explore";
  const router     = useRouter();

  const [oauthLoad, setOauthLoad] = useState<"google" | "facebook" | null>(null);
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [name,      setName]      = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [step,      setStep]      = useState<"form" | "verify">("form");

  async function signInWith(provider: "google" | "facebook") {
    setOauthLoad(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setStep("verify");
    setLoading(false);
  }

  if (step === "verify") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: "#fff", fontFamily: "'Inter',-apple-system,sans-serif", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(45,106,79,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="28" height="28" fill="none" stroke={G} strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Check your email</h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 300, marginBottom: 28 }}>
          We sent a confirmation link to <strong style={{ color: "#1A1A2E" }}>{email}</strong>. Click the link to activate your account.
        </p>
        <button onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)}
          style={{ padding: "13px 32px", borderRadius: 12, background: G, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Back to Sign in
        </button>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "#fff", fontFamily: "'Inter',-apple-system,sans-serif",
      overflowY: "auto",
    }}>
      {/* Top bar */}
      <div style={{ padding: "52px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: G, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: G, letterSpacing: -0.4 }}>habino</span>
          </div>
        </Link>
        <Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
          style={{ fontSize: 13, fontWeight: 600, color: G, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 24px 40px", maxWidth: 420, width: "100%", margin: "0 auto" }}>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A2E", letterSpacing: -0.6, marginBottom: 6 }}>
          Create account
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          Join Habino — find your perfect property
        </p>

        {/* Social buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <button onClick={() => signInWith("google")} disabled={!!oauthLoad}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E5E7EB",
              background: "#fff", cursor: oauthLoad ? "not-allowed" : "pointer",
              fontSize: 15, fontWeight: 600, color: "#1A1A2E",
              opacity: oauthLoad && oauthLoad !== "google" ? 0.5 : 1,
            }}>
            {oauthLoad === "google"
              ? <div style={{ width: 20, height: 20, border: "2px solid #E5E7EB", borderTopColor: "#4285F4", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Continue with Google
          </button>

          <button onClick={() => signInWith("facebook")} disabled={!!oauthLoad}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E5E7EB",
              background: "#fff", cursor: oauthLoad ? "not-allowed" : "pointer",
              fontSize: 15, fontWeight: 600, color: "#1A1A2E",
              opacity: oauthLoad && oauthLoad !== "facebook" ? 0.5 : 1,
            }}>
            {oauthLoad === "facebook"
              ? <div style={{ width: 20, height: 20, border: "2px solid #E5E7EB", borderTopColor: "#1877F2", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            }
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>or sign up with email</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="Abebe Girma" style={INPUT}
              onFocus={e => (e.target.style.borderColor = G)}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" style={INPUT}
              onFocus={e => (e.target.style.borderColor = G)}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                style={{ ...INPUT, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = G)}
                onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
                {showPw
                  ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#B91C1C" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px",
            background: loading ? "#40916C" : G,
            border: "none", borderRadius: 12,
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", marginTop: 2,
          }}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: "#6B7280", textAlign: "center" }}>
          Already have an account?{" "}
          <Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
            style={{ color: G, fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>

        <p style={{ marginTop: 16, fontSize: 11, color: "#9CA3AF", textAlign: "center", lineHeight: 1.6 }}>
          By creating an account you agree to our{" "}
          <Link href="/terms" style={{ color: G, textDecoration: "none" }}>Terms</Link> and{" "}
          <Link href="/privacy" style={{ color: G, textDecoration: "none" }}>Privacy Policy</Link>.
          We process data per GDPR, Kenya DPA 2019 & UAE PDPL.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
