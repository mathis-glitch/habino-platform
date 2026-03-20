"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Property } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Image from "next/image";

interface Props {
  property?: Property;
  tenantId: string;
}

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "AED", "KES", "NGN", "ZAR"];

const LISTING_TYPES = [
  { value: "rent", label: "Zur Miete" },
  { value: "buy",  label: "Zum Verkauf" },
];

const PROPERTY_TYPES = [
  { value: "apartment",  label: "Wohnung" },
  { value: "house",      label: "Haus" },
  { value: "villa",      label: "Villa" },
  { value: "studio",     label: "Studio" },
  { value: "commercial", label: "Gewerbe" },
  { value: "land",       label: "Grundstück" },
];

const STATUS_OPTIONS = [
  { value: "draft",  label: "Entwurf speichern",  desc: "Nicht öffentlich sichtbar." },
  { value: "active", label: "Veröffentlichen",     desc: "Sofort für alle sichtbar." },
];

export function ListingForm({ property, tenantId }: Props) {
  const router  = useRouter();
  const isEdit  = !!property;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title:         property?.title         || "",
    description:   property?.description   || "",
    listing_type:  property?.listing_type  || "rent",
    property_type: property?.property_type || "apartment",
    price:         property?.price?.toString()     || "",
    currency:      property?.currency      || "EUR",
    bedrooms:      property?.bedrooms?.toString()  || "0",
    bathrooms:     property?.bathrooms?.toString() || "0",
    area_sqm:      property?.area_sqm?.toString()  || "",
    city:          property?.city          || "",
    neighbourhood: property?.neighbourhood || "",
    address:       property?.address       || "",
    agent_name:    property?.agent_name    || "",
    agent_phone:   property?.agent_phone   || "",
    agent_email:   property?.agent_email   || "",
    status:        property?.status        || "draft",
  });

  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls,  setPreviewUrls]  = useState<string[]>(
    property?.images?.map((i) => i.url) || []
  );

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (previewUrls.length + files.length > 10) {
      setError("Maximal 10 Fotos pro Inserat.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      if (isEdit && property?.id) {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        const res = await fetch(`/api/properties/${property.id}/images`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreviewUrls((prev) => [...prev, ...data.urls]);
      } else {
        setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
        setPendingFiles((prev) => [...prev, ...files]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        price:     parseFloat(form.price),
        bedrooms:  parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        area_sqm:  form.area_sqm ? parseFloat(form.area_sqm) : null,
      };

      let propertyId = property?.id;

      if (isEdit) {
        const res = await fetch(`/api/properties/${propertyId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      } else {
        const res = await fetch("/api/properties", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        propertyId = data.id;
        if (pendingFiles.length && propertyId) {
          const formData = new FormData();
          pendingFiles.forEach((f) => formData.append("files", f));
          await fetch(`/api/properties/${propertyId}/images`, { method: "POST", body: formData });
        }
      }

      router.push("/admin/listings");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
  const sectionClass = "bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-3xl">

      {/* Grunddaten */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Grunddaten</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Angebotstyp</label>
            <select value={form.listing_type} onChange={(e) => update("listing_type", e.target.value)} className={inputClass}>
              {LISTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Immobilientyp</label>
            <select value={form.property_type} onChange={(e) => update("property_type", e.target.value)} className={inputClass}>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Titel *</label>
          <input required type="text" value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="z.B. Moderne 3-Zimmer-Wohnung mit Balkon"
            className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Beschreibung</label>
          <textarea value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Beschreiben Sie die Immobilie ausführlich..."
            rows={4} className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Preis */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Preis</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>
              Preis *{form.listing_type === "rent" && <span className="text-slate-400 font-normal ml-1">(pro Monat)</span>}
            </label>
            <input required type="number" min="0" value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="z.B. 1200" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Währung</label>
            <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Ausstattung */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Ausstattung</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Zimmer</label>
            <input type="number" min="0" value={form.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bäder</label>
            <input type="number" min="0" value={form.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fläche (m²)</label>
            <input type="number" min="0" value={form.area_sqm}
              onChange={(e) => update("area_sqm", e.target.value)}
              placeholder="z.B. 78" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Lage */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Lage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Stadt *</label>
            <input required type="text" value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="z.B. Hamburg" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Stadtteil</label>
            <input type="text" value={form.neighbourhood}
              onChange={(e) => update("neighbourhood", e.target.value)}
              placeholder="z.B. Eimsbüttel" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Vollständige Adresse (optional)</label>
          <input type="text" value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="z.B. Musterstraße 12, 20095 Hamburg" className={inputClass} />
        </div>
      </div>

      {/* Ansprechpartner */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Ansprechpartner</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={form.agent_name}
              onChange={(e) => update("agent_name", e.target.value)}
              placeholder="Max Mustermann" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input type="tel" value={form.agent_phone}
              onChange={(e) => update("agent_phone", e.target.value)}
              placeholder="+49 40 000000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-Mail</label>
            <input type="email" value={form.agent_email}
              onChange={(e) => update("agent_email", e.target.value)}
              placeholder="makler@beispiel.de" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Fotos */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Fotos</h2>
        <p className="text-sm text-slate-400 -mt-2">Bis zu 10 Fotos. Das erste Bild wird als Titelbild verwendet.</p>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative h-20 rounded-xl overflow-hidden bg-slate-100">
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                    Titelbild
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          <button type="button" disabled={uploading || previewUrls.length >= 10}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            {uploading && <LoadingSpinner className="h-4 w-4" />}
            {uploading ? "Wird hochgeladen..." : "Fotos hochladen"}
          </button>
        </div>
      </div>

      {/* Sichtbarkeit */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Sichtbarkeit</h2>
        <div className="flex gap-3 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button key={s.value} type="button" onClick={() => update("status", s.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                form.status === s.value ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={form.status === s.value ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          {STATUS_OPTIONS.find((s) => s.value === form.status)?.desc}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}>
          {saving && <LoadingSpinner className="h-4 w-4" />}
          {isEdit ? "Änderungen speichern" : "Inserat erstellen"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
          Abbrechen
        </button>
      </div>
    </form>
  );
}
