"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ── Supabase browser client ───────────────────────────────────────────────────
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Google-coloured icon ──────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Facebook icon ─────────────────────────────────────────────────────────────
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export function LandingLoginPage() {
  const [mode,     setMode]     = useState<"signin" | "signup">("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false); // email confirmation sent

  const supabase = getSupabase();

  // ── Email / password ────────────────────────────────────────────────────────
  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/explore";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/explore` },
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

  // ── OAuth ───────────────────────────────────────────────────────────────────
  async function handleOAuth(provider: "google" | "facebook") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/explore`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Video background ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        {/* YouTube aerial city video — muted, autoplay, loop */}
        <iframe
          className="absolute w-full h-full"
          style={{
            // Scale up to cover the full viewport regardless of aspect ratio
            width: "calc(100% + 200px)",
            height: "calc(100% + 200px)",
            top: "-100px",
            left: "-100px",
            border: "none",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          src="https://www.youtube.com/embed/E1RzP8Os-XE?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=E1RzP8Os-XE&disablekb=1&iv_load_policy=3"
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          title="Background"
          aria-hidden
        />
        {/* Animated gradient fallback + overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(0,30,60,0.75) 0%, rgba(0,168,132,0.45) 50%, rgba(15,31,61,0.85) 100%)",
          }}
        />
      </div>

      {/* ── Glassmorphism login card ─────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-sm mx-4"
        style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.20)",
          borderRadius: 24,
          padding: "36px 32px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 shadow-lg"
            style={{ background: "linear-gradient(135deg, #00A884, #0F1F3D)" }}>
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Habino</h1>
          <p className="text-white/60 text-sm mt-1">Real estate in Addis Ababa</p>
        </div>

        {done ? (
          /* ── Email confirmation sent state ── */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">Check your inbox</p>
            <p className="text-white/60 text-sm">We sent a confirmation link to <span className="text-white/90">{email}</span></p>
            <button onClick={() => { setDone(false); setMode("signin"); }}
              className="mt-6 text-sm text-white/60 hover:text-white transition-colors underline underline-offset-2">
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            {/* ── OAuth buttons ── */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.95)", color: "#1e293b" }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuth("facebook")}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#1877F2", color: "#fff" }}
              >
                <FacebookIcon />
                Continue with Facebook
              </button>
            </div>

            {/* ── Divider ── */}
            <div className="relative flex items-center mb-6">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span className="px-3 text-xs text-white/40 font-medium">or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* ── Email / password form ── */}
            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  caretColor: "#fff",
                }}
                autoComplete="email"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  caretColor: "#fff",
                }}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />

              {error && (
                <div className="px-4 py-3 rounded-2xl text-xs text-red-200"
                  style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-1"
                style={{ background: "linear-gradient(135deg, #00A884 0%, #00c49a 100%)" }}
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {/* ── Mode toggle ── */}
            <p className="text-center text-xs text-white/50 mt-5">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); }}
                    className="text-white/80 font-semibold hover:text-white transition-colors underline underline-offset-2">
                    Create one for free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => { setMode("signin"); setError(null); }}
                    className="text-white/80 font-semibold hover:text-white transition-colors underline underline-offset-2">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>

      {/* ── Tagline at bottom ────────────────────────────────────────────── */}
      <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/30 z-10">
        Find your home in Addis Ababa — powered by AI
      </p>
    </div>
  );
}
