"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm " +
  "focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all";

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
    if (form.password !== form.confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register-operator", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:         form.email,
        password:      form.password,
        full_name:     form.full_name,
        platform_name: form.platform_name,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    // Auto-sign in after registration
    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password });

    setCreated({ slug: data.slug });
    setStep("success");
    setLoading(false);
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #00A884, #0F1F3D)" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Willkommen bei Habino!</h2>
          <p className="text-slate-500 text-sm mb-1">
            Ihre Plattform <strong>{form.platform_name}</strong> wurde erfolgreich eingerichtet.
          </p>
          <p className="text-slate-400 text-xs mb-8">
            Slug: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{created?.slug}</code>
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Nächste Schritte</p>
            {["Erstes Inserat anlegen", "Brand & Farben anpassen", "KI Agent testen"].map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #00A884, #0F1F3D)" }}
          >
            Zum Admin Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold" style={{ color: "#00A884" }}>Habino</span>
          </Link>
          <p className="text-slate-500 mt-1.5 text-sm">Eigene Immobilienplattform erstellen</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">

          <div className="flex flex-wrap gap-2 mb-6">
            {["KI-Agent", "Inseratsverwaltung", "Terminanfragen", "Marktdaten"].map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
                ✓ {f}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Plattformname *</label>
              <input type="text" required value={form.platform_name}
                onChange={(e) => set("platform_name", e.target.value)}
                className={inputClass}
                placeholder="z.B. Meine Immobilien Hamburg" />
              <p className="text-xs text-slate-400 mt-1">Name Ihrer Plattform — kann später geändert werden.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ihr Name *</label>
              <input type="text" required value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className={inputClass}
                placeholder="Max Mustermann" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail-Adresse *</label>
              <input type="email" required value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
                placeholder="max@beispiel.de" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Passwort *</label>
              <input type="password" required minLength={8} value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className={inputClass}
                placeholder="Mindestens 8 Zeichen" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Passwort bestätigen *</label>
              <input type="password" required value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                className={inputClass}
                placeholder="Passwort wiederholen" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
              style={{ background: "linear-gradient(135deg, #00A884, #0F1F3D)" }}>
              {loading ? "Plattform wird eingerichtet…" : "Kostenlos starten →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Bereits registriert?{" "}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#00A884" }}>
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
