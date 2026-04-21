"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ── Row link ──────────────────────────────────────────────────────────────────
function SettingsRow({
  href,
  icon,
  label,
  subtitle,
  danger,
  onClick,
}: {
  href?: string;
  icon: string;
  label: string;
  subtitle?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <div className={`flex items-center gap-4 px-5 py-4 transition-colors ${danger ? "hover:bg-red-50" : "hover:bg-slate-50"}`}>
      <span className="text-xl w-7 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-500" : "text-slate-800"}`}>{label}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <svg className={`w-4 h-4 shrink-0 ${danger ? "text-red-300" : "text-slate-300"}`}
        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="px-5 py-3.5 border-b border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const confirmed = input === "DELETE";

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 z-10"
        style={{ boxShadow: "var(--shadow-xl)" }}>
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Delete account?</h2>
        <p className="text-sm text-slate-500 mb-4">
          This will permanently delete your account, listings, contracts, and saved items.{" "}
          <strong className="text-slate-700">This cannot be undone.</strong>
        </p>
        <ul className="space-y-1.5 mb-5 text-sm text-slate-500">
          {["Your listings will be removed", "Your contracts will be deleted", "Your saved items will be lost"].map(c => (
            <li key={c} className="flex items-center gap-2"><span className="text-red-400 text-xs">✗</span>{c}</li>
          ))}
        </ul>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Type <span className="font-mono text-red-500">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="DELETE"
          className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none mb-4"
          style={{ borderColor: confirmed ? "#f87171" : "#e2e8f0" }}
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={!confirmed || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: "#dc2626" }}>
            {loading ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [showDelete, setShowDelete] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-20" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <h1 className="font-bold text-xl text-white">Settings</h1>
        <p className="text-white/40 text-xs mt-1">Account, preferences & privacy</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 pb-10 space-y-4">

        {/* ── My Account ──────────────────────────────────────────── */}
        <Section title="My Account">
          <SettingsRow href="/profile"  icon="👤" label="My Profile"      subtitle="Name, contact details, bio" />
          <SettingsRow href="/listings" icon="🏠" label="My Listings"     subtitle="Manage your property listings" />
          <SettingsRow href="/home"     icon="📄" label="My Contracts"    subtitle="Rental and sale agreements" />
          <SettingsRow href="/saved"    icon="🔖" label="Saved Listings"  subtitle="Your property wishlist" />
        </Section>

        {/* ── Preferences ──────────────────────────────────────────── */}
        <Section title="Preferences">
          <SettingsRow href="/settings/notifications" icon="🔔" label="Notifications"    subtitle="Email, push, and in-app alerts" />
          <SettingsRow href="/settings/language"      icon="🌐" label="Language & Region" subtitle="Language, currency, date format" />
        </Section>

        {/* ── Help & Legal ─────────────────────────────────────────── */}
        <Section title="Help & Legal">
          <SettingsRow href="/help"     icon="💬" label="Help Center"    subtitle="FAQs and support" />
          <SettingsRow href="/privacy"  icon="🔒" label="Privacy Policy" />
          <SettingsRow href="/security" icon="🛡️" label="Data Security" />
          <SettingsRow href="/terms"    icon="📋" label="Terms of Use" />
          <SettingsRow href="/about"    icon="✦"  label="About Habino" />
        </Section>

        {/* ── Account actions ───────────────────────────────────────── */}
        <Section title="Account Actions">
          <SettingsRow icon="🚪" label="Sign out"       subtitle="Sign out of your account"              onClick={handleSignOut} />
          <SettingsRow icon="🗑"  label="Delete account" subtitle="Permanently remove your account & data" danger onClick={() => setShowDelete(true)} />
        </Section>

        <p className="text-center text-xs text-slate-300 pb-2">Habino · v2.0 · Find your space.</p>
      </div>

      {showDelete && <DeleteModal onClose={() => setShowDelete(false)} />}
    </div>
  );
}
