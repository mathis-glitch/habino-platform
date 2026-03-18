"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Property } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Image from "next/image";

interface Props {
  property?: Property;    // if provided → edit mode, otherwise → create mode
  tenantId: string;
}

const CURRENCIES = ["KES", "USD", "AED", "EUR", "GBP", "NGN", "ZAR", "GHS"];

export function ListingForm({ property, tenantId }: Props) {
  const router  = useRouter();
  const isEdit  = !!property;
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    title:         property?.title         || "",
    description:   property?.description   || "",
    listing_type:  property?.listing_type  || "rent",
    property_type: property?.property_type || "apartment",
    price:         property?.price?.toString()    || "",
    currency:      property?.currency      || "KES",
    bedrooms:      property?.bedrooms?.toString() || "0",
    bathrooms:     property?.bathrooms?.toString()|| "0",
    area_sqm:      property?.area_sqm?.toString() || "",
    city:          property?.city          || "",
    neighbourhood: property?.neighbourhood || "",
    address:       property?.address       || "",
    agent_name:    property?.agent_name    || "",
    agent_phone:   property?.agent_phone   || "",
    agent_email:   property?.agent_email   || "",
    status:        property?.status        || "draft",
  });

  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    property?.images?.map((i) => i.url) || []
  );

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (previewUrls.length + files.length > 10) {
      setError("Maximum 10 images per listing.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // If editing, upload immediately. If new, store files for upload after create.
      if (isEdit && property?.id) {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));

        const res = await fetch(`/api/properties/${property.id}/images`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreviewUrls((prev) => [...prev, ...data.urls]);
      } else {
        // New listing — show local previews, store files for later
        const urls = files.map((f) => URL.createObjectURL(f));
        setPreviewUrls((prev) => [...prev, ...urls]);
        setPendingFiles((prev) => [...prev, ...files]);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Get the current session token to pass in Authorization header
      const { createClient: createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not signed in. Please refresh and try again.");

      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

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
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error);
        }
      } else {
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        propertyId = data.id;

        // Upload pending images
        if (pendingFiles.length && propertyId) {
          const formData = new FormData();
          pendingFiles.forEach((f) => formData.append("files", f));
          await fetch(`/api/properties/${propertyId}/images`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
          });
        }
      }

      router.push("/admin/listings");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Save failed.");
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
  const sectionClass = "card p-5 flex flex-col gap-4";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">

      {/* Basic info */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Listing type</label>
            <select value={form.listing_type} onChange={(e) => update("listing_type", e.target.value)} className={inputClass}>
              <option value="rent">For Rent</option>
              <option value="buy">For Sale</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Property type</label>
            <select value={form.property_type} onChange={(e) => update("property_type", e.target.value)} className={inputClass}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Title *</label>
          <input required type="text" value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Modern 2BR Apartment — Westlands"
            className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the property..."
            rows={4} className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Price */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Pricing</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Price *</label>
            <input required type="number" min="0" value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="e.g. 95000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Property Specs</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Bedrooms</label>
            <input type="number" min="0" value={form.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bathrooms</label>
            <input type="number" min="0" value={form.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Floor area (m²)</label>
            <input type="number" min="0" value={form.area_sqm}
              onChange={(e) => update("area_sqm", e.target.value)}
              placeholder="e.g. 72" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Location</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City *</label>
            <input required type="text" value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. Nairobi" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Neighbourhood</label>
            <input type="text" value={form.neighbourhood}
              onChange={(e) => update("neighbourhood", e.target.value)}
              placeholder="e.g. Westlands" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Full address (optional)</label>
          <input type="text" value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="e.g. 14 Riverside Drive" className={inputClass} />
        </div>
      </div>

      {/* Agent */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Agent / Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Agent name</label>
            <input type="text" value={form.agent_name}
              onChange={(e) => update("agent_name", e.target.value)}
              placeholder="Jane Mwangi" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={form.agent_phone}
              onChange={(e) => update("agent_phone", e.target.value)}
              placeholder="+254 700 000 000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.agent_email}
              onChange={(e) => update("agent_email", e.target.value)}
              placeholder="agent@example.com" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Photos</h2>
        <p className="text-sm text-slate-500 -mt-2">Up to 10 photos. First image is the hero.</p>

        {/* Preview grid */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative h-20 rounded-lg overflow-hidden bg-slate-200">
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                    Hero
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            disabled={uploading || previewUrls.length >= 10}
            onClick={() => fileRef.current?.click()}
            className="btn-secondary px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            {uploading && <LoadingSpinner className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload photos"}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-slate-800">Visibility</h2>
        <div className="flex gap-3">
          {(["draft", "active"] as const).map((s) => (
            <button
              key={s} type="button"
              onClick={() => update("status", s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border-2 ${
                form.status === s
                  ? "text-white border-transparent"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={form.status === s ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}
            >
              {s === "draft" ? "Save as Draft" : "Publish (Active)"}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          {form.status === "draft"
            ? "Draft listings are hidden from the public."
            : "Active listings are visible to all visitors."}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit" disabled={saving}
          className="btn-primary px-8 py-2.5 rounded-lg flex items-center gap-2"
        >
          {saving && <LoadingSpinner className="h-4 w-4" />}
          {isEdit ? "Save changes" : "Create listing"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
