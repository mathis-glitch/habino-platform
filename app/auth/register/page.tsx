"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  color: "#1a1a1a",
  outline: "none",
  background: "white",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "#374151", marginBottom: 6,
};

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm: "", platform_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [created, setCreated] = useState<{ slug: string } | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);

    const res  = await fetch("/api/auth/register-operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email, password: form.password,
        full_name: form.full_name, platform_name: form.platform_name,
      }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error || "Registration failed. Please try again."); setLoading(false); return; }

    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password });

    setCreated({ slug: data.slug });
    setStep("success");
    setLoading(false);
  }

  /* ── Success ───────────────────────────────────────────────────────────── */
  if (step === "success") {
    return (
      <div className="min-h-screen flex">
        <div className="hidden md:block md:w-[46%] relative overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=85"
            alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="flex-1 bg-white flex flex-col px-10 py-8">
          <div>
            <Link href="/" className="inline-block">
              <span style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>habino</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-[380px] text-center">
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: "#4a7c59",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: 28, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
                Welcome to Habino!
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Your platform <strong style={{ color: "#1a1a1a" }}>{form.platform_name}</strong> is ready.
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 28 }}>
                Slug: <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{created?.slug}</code>
              </p>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 20, textAlign: "left", marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Next steps</p>
                {["Add your first listing", "Customise brand & colours", "Test the AI agent"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151", marginBottom: i < 2 ? 10 : 0 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#4a7c59", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/admin")}
                style={{ width: "100%", padding: "13px", background: "#4a7c59", border: "none", borderRadius: 6, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Register form ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex">

      {/* LEFT — photo */}
      <div className="hidden md:block md:w-[46%] relative overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 bg-white flex flex-col px-10 py-8 overflow-y-auto">

        {/* Logo */}
        <div className="shrink-0">
          <Link href="/" className="inline-block">
            <span style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 22, fontWeight: 700, color: "#1a1a1a",
            }}>
              habino
            </span>
          </Link>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-[380px]">

            <h1 style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 32, fontWeight: 700, color: "#1a1a1a",
              marginBottom: 10, letterSpacing: "-0.02em",
            }}>
              Create account
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>
              Set up your real estate platform in under 2 minutes.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={LABEL_STYLE}>Platform name</label>
                <input type="text" required value={form.platform_name}
                  onChange={(e) => set("platform_name", e.target.value)}
                  style={INPUT_STYLE} placeholder="e.g. Bole Properties" />
              </div>

              <div>
                <label style={LABEL_STYLE}>Your name</label>
                <input type="text" required value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  style={INPUT_STYLE} placeholder="Abebe Girma" />
              </div>

              <div>
                <label style={LABEL_STYLE}>Email</label>
                <input type="email" required value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  style={INPUT_STYLE} placeholder="olivia@mail.com" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Password</label>
                  <input type="password" required minLength={8} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    style={INPUT_STYLE} placeholder="Min. 8 chars" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Confirm</label>
                  <input type="password" required value={form.confirm}
                    onChange={(e) => set("confirm", e.target.value)}
                    style={INPUT_STYLE} placeholder="Repeat" />
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#b91c1c" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "#86a896" : "#4a7c59",
                  border: "none", borderRadius: 6,
                  color: "white", fontSize: 15, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4,
                }}>
                {loading ? "Setting up…" : "Continue"}
              </button>
            </form>

            <p style={{ marginTop: 20, fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{ color: "#4a7c59", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
