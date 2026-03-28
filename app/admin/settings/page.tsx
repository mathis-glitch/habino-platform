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

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm " +
  "focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all";

const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

const sectionClass = "bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4";

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
      setError(data.error || "Save failed. Please try again.");
    }
    setSaving(false);
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/admin" className="hover:text-slate-600 transition-colors">Dashboard</Link>
          <span>›</span>
          <span className="text-slate-700 font-medium">Settings</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">Brand & Settings</h1>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400">
            Loading…
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-5">

            {/* Brand */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-800">Platform</h2>
              <div>
                <label className={labelClass}>Platform name *</label>
                <input type="text" required value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass} placeholder="My Property Platform" />
              </div>
              <div>
                <label className={labelClass}>Tagline</label>
                <input type="text" value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  className={inputClass} placeholder="Find your dream home" />
              </div>
              <div>
                <label className={labelClass}>Logo URL</label>
                <input type="url" value={form.logo_url}
                  onChange={(e) => set("logo_url", e.target.value)}
                  className={inputClass} placeholder="https://example.com/logo.png" />
                <p className="text-xs text-slate-400 mt-1">Paste a direct image URL. Logo upload coming soon.</p>
              </div>
            </div>

            {/* Colors */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-800">Colours</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Primary colour</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className="h-10 w-12 rounded-lg cursor-pointer border border-slate-200" />
                    <input type="text" value={form.primary_color}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className={inputClass} placeholder="#00A884" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Secondary colour</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondary_color}
                      onChange={(e) => set("secondary_color", e.target.value)}
                      className="h-10 w-12 rounded-lg cursor-pointer border border-slate-200" />
                    <input type="text" value={form.secondary_color}
                      onChange={(e) => set("secondary_color", e.target.value)}
                      className={inputClass} placeholder="#0F1F3D" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <div className="h-8 rounded-lg flex-1 flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: form.primary_color }}>
                  Primary
                </div>
                <div className="h-8 rounded-lg flex-1 flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: form.secondary_color }}>
                  Secondary
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-800">Contact</h2>
              <div>
                <label className={labelClass}>Email address</label>
                <input type="email" value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                  className={inputClass} placeholder="hello@yourplatform.com" />
              </div>
              <div>
                <label className={labelClass}>WhatsApp number</label>
                <input type="text" value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  className={inputClass} placeholder="+251 911 000000" />
              </div>
            </div>

            {/* Domain */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-800">Custom domain</h2>
              <div>
                <label className={labelClass}>Domain</label>
                <input type="text" value={form.custom_domain}
                  onChange={(e) => set("custom_domain", e.target.value)}
                  className={inputClass} placeholder="app.yourplatform.com" />
                <p className="text-xs text-slate-400 mt-1">
                  Point your domain&apos;s DNS CNAME record to{" "}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded-md">cname.vercel-dns.com</code>.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm">
                Settings saved successfully!
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => router.back()}
                className="px-6 py-2.5 rounded-xl text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
