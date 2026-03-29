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

function Field({ label, value, empty, colSpan }: {
  label: string; value?: string; empty?: string; colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-1">{label}</p>
      <p className={`text-[15px] font-medium leading-snug ${value ? "text-slate-900" : "text-slate-300 italic"}`}>
        {value || empty || "—"}
      </p>
    </div>
  );
}

function SectionCard({ title, editHref, children }: {
  title: string; editHref?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--color-primary)" }}>
          {title}
        </span>
        {editHref && (
          <Link href={editHref} className="text-[13px] font-medium transition-colors" style={{ color: "var(--color-primary)" }}>
            Edit
          </Link>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
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
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
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

      {/* ── Dark gradient header ─────────────────────────── */}
      <div className="px-5 pt-7 pb-20" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-[22px] font-bold text-white">My Profile</h1>
          <Link
            href="/?wizard=profile"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
          >
            ✨ {hasProfile ? "Edit with AI" : "Set up"}
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-24 flex flex-col gap-4">

        {/* ── Identity card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white text-2xl font-bold border-2"
                style={{ background: "linear-gradient(135deg, var(--color-primary), #235f35)", borderColor: "var(--color-primary-light)" }}
              >
                {initials}
              </div>
              {hasProfile && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                </div>
              )}
            </div>
            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold text-slate-900 leading-tight truncate">
                {profile.full_name || "No name set"}
              </h2>
              {profile.email && <p className="text-[14px] text-slate-500 mt-0.5 truncate">{profile.email}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-[12px] font-semibold"
                  style={{ backgroundColor: "var(--color-primary-light)", borderColor: "#bbddc9", color: "var(--color-primary)" }}
                >
                  Tenant
                </span>
                {profile.city && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-[12px] font-medium text-slate-500">
                    {profile.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!hasProfile ? (
          /* ── Empty state ──────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center text-center gap-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">🤖</div>
            <div>
              <h3 className="text-[17px] font-semibold text-slate-800">No profile yet</h3>
              <p className="text-[14px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Let the AI guide you through a quick interview — takes about a minute.
              </p>
            </div>
            <Link
              href="/?wizard=profile"
              className="flex items-center gap-2 h-11 px-6 rounded-xl text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              ✨ Set up my profile with AI
            </Link>
            <p className="text-[12px] text-slate-300">Voice input supported · Takes ~1 minute</p>
          </div>
        ) : (
          <>
            {/* ── Personal Information ──────────────────── */}
            <SectionCard title="Personal Information" editHref="/?wizard=profile">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Full Name" value={profile.full_name} />
                <Field label="Email" value={profile.email} empty="Not set" />
                <Field label="Phone" value={profile.phone} empty="Not set" />
                <Field label="WhatsApp" value={profile.whatsapp} empty="Not set" />
                {profile.bio && <Field label="Bio" value={profile.bio} colSpan />}
              </div>
            </SectionCard>

            {/* ── Contact & Address ─────────────────────── */}
            <SectionCard title="Contact & Address" editHref="/?wizard=profile">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {profile.address && <Field label="Address" value={profile.address} colSpan />}
                <Field label="City" value={profile.city} empty="Not set" />
                <Field
                  label="Country"
                  value={profile.country_code ? COUNTRY_LABELS[profile.country_code] ?? profile.country_code : undefined}
                  empty="Not set"
                />
              </div>
            </SectionCard>

            {/* ── Identity ──────────────────────────────── */}
            <SectionCard title="Identity">
              <p className="text-[12px] text-slate-400 mb-4 -mt-1">Used to pre-fill rental contracts</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field
                  label="ID / Passport"
                  value={profile.id_number ? `••••${profile.id_number.slice(-4)}` : undefined}
                  empty="Not set"
                />
                <Field
                  label="Preferred Language"
                  value={profile.preferred_lang ? LANG_LABELS[profile.preferred_lang] ?? profile.preferred_lang : undefined}
                  empty="English (US)"
                />
              </div>
            </SectionCard>

            {/* ── Security ──────────────────────────────── */}
            <SectionCard title="Security">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-3.5 first:pt-0">
                  <div>
                    <p className="text-[14px] font-medium text-slate-900">Password</p>
                    <p className="text-[13px] text-slate-400 mt-0.5">••••••••••••</p>
                  </div>
                  <Link href="/?wizard=profile" className="text-[13px] font-medium transition-colors" style={{ color: "var(--color-primary)" }}>
                    Change
                  </Link>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-[14px] font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-[13px] text-slate-400 mt-0.5">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-400">Off</span>
                    <div className="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer transition-colors hover:bg-slate-300">
                      <div className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Danger Zone ───────────────────────────── */}
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-2" style={{ boxShadow: "var(--shadow-sm)" }}>
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-[0.08em] pt-4 pb-3">Danger Zone</p>
              <div className="divide-y divide-red-100">
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-800">Download My Data</p>
                    <p className="text-[13px] text-slate-500 mt-0.5">Export all your account data as a ZIP file.</p>
                  </div>
                  <button className="shrink-0 h-9 px-4 rounded-xl text-[13px] font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                    Download
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-[14px] font-semibold text-red-700">Delete Account</p>
                    <p className="text-[13px] text-slate-500 mt-0.5">Permanently removes your profile, contracts, and listings.</p>
                  </div>
                  <button className="shrink-0 h-9 px-4 rounded-xl text-[13px] font-semibold border border-red-200 bg-white text-red-600 hover:bg-red-100 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
