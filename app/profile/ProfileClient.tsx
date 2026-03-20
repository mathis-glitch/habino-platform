"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

const COUNTRY_LABELS: Record<string, string> = {
  KE: "Kenya", NG: "Nigeria", GH: "Ghana", ZA: "South Africa",
  AE: "UAE", DE: "Germany", GB: "United Kingdom", FR: "France",
  ES: "Spain", US: "United States", BR: "Brazil", IN: "India",
  ET: "Ethiopia", TZ: "Tanzania",
};

const LANG_LABELS: Record<string, string> = {
  "en-US": "English (US)", "en-GB": "English (UK)", "de-DE": "Deutsch",
  "fr-FR": "Français", "es-ES": "Español", "ar-SA": "العربية",
  "sw-KE": "Kiswahili", "pt-BR": "Português (BR)",
};

function ProfileField({ label, value, empty }: { label: string; value?: string; empty?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className={`text-sm ${value ? "text-slate-800 font-medium" : "text-slate-300 italic"}`}>
        {value || empty || "—"}
      </span>
    </div>
  );
}

export function ProfileClient() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </main>
    );
  }

  const hasProfile = !!(profile.full_name || profile.phone || profile.city);
  const initials = profile.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Gradient dark header ─────────────────────────────────── */}
      <div className="px-5 pt-7 pb-16" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl text-white">Profil</h1>
          <Link
            href="/?wizard=profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
          >
            <span>✨</span>
            {hasProfile ? "Bearbeiten" : "Einrichten"}
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-8">

        {/* ── Avatar card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-center mb-4">
          <div className="flex justify-center mb-3">
            <div className="relative inline-block">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: "var(--color-primary)" }}
              >
                {initials}
              </div>
              {hasProfile && (
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <h2 className="font-bold text-xl text-slate-900">{profile.full_name ?? "Kein Name"}</h2>
          {profile.email && <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>}
          {profile.bio && <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{profile.bio}</p>}
          {hasProfile && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-semibold text-emerald-700">Verifiziert</span>
              </div>
            </div>
          )}
          <Link
            href="/?wizard=profile"
            className="mt-4 w-full h-11 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <span>✨</span>
            {hasProfile ? "Mit KI bearbeiten" : "Mit KI einrichten"}
          </Link>
        </div>

        {!hasProfile ? (
          /* ── Empty state ─────────────────────────────────────── */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">🤖</div>
            <div>
              <h2 className="font-semibold text-slate-800 text-lg">No profile yet</h2>
              <p className="text-slate-400 text-sm mt-1 max-w-xs">
                Let the AI guide you through a quick interview — takes about a minute.
                Your info will be used to pre-fill contracts and personalise your experience.
              </p>
            </div>
            <Link
              href="/?wizard=profile"
              className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span>✨</span>
              Set up my profile with AI
            </Link>
            <p className="text-xs text-slate-300">Voice input supported · Takes ~1 minute</p>
          </div>
        ) : (
          /* ── Profile cards ───────────────────────────────────── */
          <div className="flex flex-col gap-4">

            {/* Personal info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <ProfileField label="Full Name" value={profile.full_name} />
                <ProfileField label="Email" value={profile.email} empty="Not set" />
              </div>
              {profile.bio && (
                <div className="mt-4">
                  <ProfileField label="Bio" value={profile.bio} />
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Contact Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <ProfileField label="Phone" value={profile.phone} empty="Not set" />
                <ProfileField label="WhatsApp" value={profile.whatsapp} empty="Not set" />
                {profile.address && (
                  <div className="col-span-2">
                    <ProfileField label="Address" value={profile.address} />
                  </div>
                )}
                <ProfileField
                  label="City"
                  value={profile.city}
                  empty="Not set"
                />
                <ProfileField
                  label="Country"
                  value={profile.country_code ? COUNTRY_LABELS[profile.country_code] ?? profile.country_code : undefined}
                  empty="Not set"
                />
              </div>
            </div>

            {/* Identity */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Identity</h2>
              <p className="text-xs text-slate-300 mb-4">Used to pre-fill rental contracts</p>
              <ProfileField
                label="ID / Passport Number"
                value={profile.id_number ? `••••${profile.id_number.slice(-4)}` : undefined}
                empty="Not set"
              />
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Preferences</h2>
              <ProfileField
                label="Preferred Language"
                value={profile.preferred_lang ? LANG_LABELS[profile.preferred_lang] ?? profile.preferred_lang : undefined}
                empty="English (US)"
              />
            </div>

            {/* Edit CTA */}
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="text-2xl shrink-0">✨</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Want to update anything?</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chat with the AI — just say "update my profile" or use voice input in your preferred language.
                </p>
              </div>
              <Link
                href="/?wizard=profile"
                className="shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Update with AI
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
