"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface TenantSettings {
  name:            string;
  tagline:         string;
  contact_email:   string;
  whatsapp:        string;
  primary_color:   string;
  secondary_color: string;
  custom_domain:   string;
  logo_url:        string;
}

const EMPTY: TenantSettings = {
  name:            "",
  tagline:         "",
  contact_email:   "",
  whatsapp:        "",
  primary_color:   "#00A884",
  secondary_color: "#0F1F3D",
  custom_domain:   "",
  logo_url:        "",
};

export default function SettingsPage() {
  const router  = useRouter();
  const [form,    setForm]    = useState<TenantSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenant/config")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name:            data.name            ?? "",
          tagline:         data.tagline         ?? "",
          contact_email:   data.contact_email   ?? "",
          whatsapp:        data.whatsapp        ?? "",
          primary_color:   data.primary_color   ?? "#00A884",
          secondary_color: data.secondary_color ?? "#0F1F3D",
          custom_domain:   data.custom_domain   ?? "",
          logo_url:        data.logo_url        ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function set(field: keyof TenantSettings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/tenant/config", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(true);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save settings.");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm " +
    "focus:outline-none focus:ring-2 focus:border-transparent bg-white";

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/admin" className="hover:text-primary">Dashboard</Link>
          <span>›</span>
          <span className="text-slate-800 font-medium">Brand Settings</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">Brand Settings</h1>

        {loading ? (
          <div className="card p-8 text-center text-slate-400">Loading…</div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6">

            {/* Brand */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Brand</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform name</label>
                  <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="My Real Estate Platform" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tagline</label>
                  <input type="text" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} placeholder="Find your perfect home" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
                  <input type="url" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} className={inputClass} placeholder="https://example.com/logo.png" />
                  <p className="text-xs text-slate-400 mt-1">Paste a direct image URL. Image upload coming soon.</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Colors</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-12 rounded cursor-pointer border border-slate-300" />
                    <input type="text" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className={inputClass} placeholder="#00A884" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Secondary color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} className="h-10 w-12 rounded cursor-pointer border border-slate-300" />
                    <input type="text" value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} className={inputClass} placeholder="#0F1F3D" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Contact</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact email</label>
                  <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={inputClass} placeholder="hello@yourplatform.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp number</label>
                  <input type="text" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className={inputClass} placeholder="+254712345678" />
                </div>
              </div>
            </div>

            {/* Domain */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Custom Domain</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Domain</label>
                <input type="text" value={form.custom_domain} onChange={(e) => set("custom_domain", e.target.value)} className={inputClass} placeholder="app.yourplatform.com" />
                <p className="text-xs text-slate-400 mt-1">Point your domain's DNS CNAME to <code className="bg-slate-100 px-1 rounded">cname.vercel-dns.com</code> first.</p>
              </div>
            </div>

            {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}
            {success && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3">Settings saved successfully!</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8 py-2.5 rounded-lg font-medium disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
