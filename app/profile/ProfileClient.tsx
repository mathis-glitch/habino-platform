"use client";

import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const COUNTRIES = [
  { code: "KE", label: "Kenya" }, { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" }, { code: "ZA", label: "South Africa" },
  { code: "AE", label: "UAE"   }, { code: "DE", label: "Germany" },
  { code: "GB", label: "United Kingdom" }, { code: "FR", label: "France" },
  { code: "ES", label: "Spain" }, { code: "US", label: "United States" },
  { code: "BR", label: "Brazil" }, { code: "IN", label: "India" },
  { code: "ET", label: "Ethiopia" }, { code: "TZ", label: "Tanzania" },
];

const LANGS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "de-DE", label: "Deutsch" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
  { code: "ar-SA", label: "العربية" },
  { code: "sw-KE", label: "Kiswahili" },
  { code: "pt-BR", label: "Português" },
];

interface Profile {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  country_code?: string;
  id_number?: string;
  bio?: string;
  preferred_lang?: string;
  avatar_url?: string;
}

export function ProfileClient() {
  const [profile,  setProfile]  = useState<Profile>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function u(k: string, v: string) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1.5";
  const sectionClass = "bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4";

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: "var(--color-primary)" }}>
            {profile.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.full_name ?? "Your Profile"}</h1>
            <p className="text-slate-500 text-sm">{profile.email ?? ""}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Personal info */}
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-800">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" value={profile.full_name ?? ""}
                  onChange={(e) => u("full_name", e.target.value)}
                  placeholder="Jane Mwangi" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={profile.email ?? ""} disabled
                  className={`${inputClass} bg-slate-50 text-slate-400`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio (optional)</label>
              <textarea value={profile.bio ?? ""} onChange={(e) => u("bio", e.target.value)}
                rows={2} placeholder="Tell us a little about yourself…"
                className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* Contact */}
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-800">Contact Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" value={profile.phone ?? ""}
                  onChange={(e) => u("phone", e.target.value)}
                  placeholder="+254 700 000 000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input type="tel" value={profile.whatsapp ?? ""}
                  onChange={(e) => u("whatsapp", e.target.value)}
                  placeholder="+254 700 000 000" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input type="text" value={profile.address ?? ""}
                onChange={(e) => u("address", e.target.value)}
                placeholder="14 Riverside Drive" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input type="text" value={profile.city ?? ""}
                  onChange={(e) => u("city", e.target.value)}
                  placeholder="Nairobi" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <select value={profile.country_code ?? "US"}
                  onChange={(e) => u("country_code", e.target.value)} className={inputClass}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-800">Identity</h2>
            <p className="text-xs text-slate-400 -mt-2">Used to pre-fill rental contracts and verify identity.</p>
            <div>
              <label className={labelClass}>ID / Passport Number</label>
              <input type="text" value={profile.id_number ?? ""}
                onChange={(e) => u("id_number", e.target.value)}
                placeholder="Passport or national ID number" className={inputClass} />
            </div>
          </div>

          {/* Preferences */}
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-800">Preferences</h2>
            <div>
              <label className={labelClass}>Preferred Language (Voice & AI)</label>
              <select value={profile.preferred_lang ?? "en-US"}
                onChange={(e) => u("preferred_lang", e.target.value)} className={inputClass}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">✓ Profile saved successfully</div>
          )}

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {saving && <LoadingSpinner className="h-4 w-4" />}
            Save Profile
          </button>
        </form>
      </div>
    </main>
  );
}
