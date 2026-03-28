"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({
    full_name:     "",
    email:         "",
    password:      "",
    confirm:       "",
    platform_name: "",
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm " +
    "focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all";

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (step === "success") {
    return (
      <div className="min-h-screen flex">
        {/* Left */}
        <div className="w-full md:w-[480px] lg:w-[520px] flex flex-col items-center justify-center px-8 py-12 bg-white shrink-0">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, #00A884, #0F4C75)" }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Habino!</h2>
            <p className="text-slate-500 text-sm mb-1">
              Your platform <strong>{form.platform_name}</strong> is ready.
            </p>
            <p className="text-slate-400 text-xs mb-8">
              Slug: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{created?.slug}</code>
            </p>

            <div className="bg-slate-50 rounded-xl p-5 text-left mb-6 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Next steps</p>
              {["Add your first listing", "Customise brand & colours", "Test the AI agent"].map((s, i) => (
                <div key={s} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #00A884, #0F4C75)" }}>
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>

            <button onClick={() => router.push("/admin")}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #00A884, #0F4C75)" }}>
              Go to Dashboard →
            </button>
          </div>
        </div>
        {/* Right photo */}
        <div className="hidden md:block flex-1 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=85" alt=""
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/10" />
        </div>
      </div>
    );
  }

  /* ── Register form ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — form ─────────────────────────────────────────────── */}
      <div className="w-full md:w-[480px] lg:w-[520px] flex flex-col justify-between px-8 py-10 bg-white shrink-0 overflow-y-auto">

        <div>
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #00A884, #0F4C75)" }}>
              H
            </div>
            <span className="text-xl font-bold text-slate-900">Habino</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-6">Set up your real estate platform in under 2 minutes.</p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mb-7">
            {["AI Agent", "Listing management", "Viewing requests", "Market data"].map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-semibold">
                ✓ {f}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Platform name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={form.platform_name}
                onChange={(e) => set("platform_name", e.target.value)}
                className={inputClass} placeholder="e.g. Bole Properties" />
              <p className="text-xs text-slate-400 mt-1">Name of your platform — you can change this later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className={inputClass} placeholder="Abebe Girma" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input type="email" required value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass} placeholder="you@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input type="password" required minLength={8} value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={inputClass} placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm <span className="text-red-500">*</span>
                </label>
                <input type="password" required value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  className={inputClass} placeholder="Repeat password" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all mt-1"
              style={{ background: "linear-gradient(135deg, #00A884, #0F4C75)" }}>
              {loading ? "Setting up…" : "Get started for free →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#00A884" }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-8">
          By registering you agree to Habino&apos;s{" "}
          <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
        </p>
      </div>

      {/* ── Right panel — photo ───────────────────────────────────────────── */}
      <div className="hidden md:block flex-1 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/10" />

        {/* Stats overlay */}
        <div className="absolute top-10 right-10 flex flex-col gap-3">
          {[
            { value: "2,400+", label: "Active listings" },
            { value: "340+",   label: "Verified brokers" },
            { value: "4.9★",   label: "Avg. agent rating" },
          ].map(({ value, label }) => (
            <div key={label}
              className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20 text-right">
              <p className="text-white font-bold text-lg leading-none">{value}</p>
              <p className="text-white/70 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quote card */}
        <div className="absolute bottom-10 left-10 right-10">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md">
            <p className="text-white font-semibold text-base leading-relaxed mb-3">
              &ldquo;Setting up my Habino platform took 5 minutes. Within a week I had my first viewing booked online.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm">
                F
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Feven A.</p>
                <p className="text-white/70 text-xs">Real Estate Agent · Bole, Addis Ababa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
