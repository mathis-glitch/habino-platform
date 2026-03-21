"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Property } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

function pricePerSqm(p: Property) {
  if (!p.area_sqm || p.area_sqm === 0) return "—";
  return fmt(Math.round(p.price / p.area_sqm), p.currency) + "/m²";
}

function propTypeLabel(t: string) {
  return { apartment: "Apartment", house: "House", commercial: "Commercial", land: "Land" }[t] ?? t;
}

function listingLabel(t: string) {
  return t === "buy" ? "For Sale" : "For Rent";
}

// ── Property Detail Drawer ────────────────────────────────────────────────────
function DetailDrawer({
  property: initialProperty,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const router    = useRouter();
  const [imgIdx, setImgIdx]       = useState(0);
  const [property, setProperty]   = useState(initialProperty);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = property.images ?? [];

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const stats = [
    property.bedrooms  > 0       && { icon: "🛏", label: "Bedrooms",  value: String(property.bedrooms) },
    property.bathrooms > 0       && { icon: "🚿", label: "Bathrooms", value: String(property.bathrooms) },
    property.area_sqm            && { icon: "📐", label: "Area",      value: `${property.area_sqm} m²` },
    true                          && { icon: "🏷", label: "Type",      value: propTypeLabel(property.property_type) },
    property.area_sqm            && { icon: "💶", label: "Price/m²",  value: pricePerSqm(property) },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  function bookViewing() {
    const q = encodeURIComponent(`I'd like to book a viewing for "${property.title}" in ${property.city}`);
    router.push(`/?q=${q}`);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadErr(null);

    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    try {
      const res = await fetch(`/api/properties/${property.id}/images`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Merge new images into local property state
      const newImages = data.images ?? [];
      setProperty((prev) => {
        const merged = [...(prev.images ?? []), ...newImages];
        setImgIdx(merged.length - newImages.length); // jump to first new image
        return { ...prev, images: merged };
      });
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden
        animate-in slide-in-from-right duration-300">

        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}>
              {listingLabel(property.listing_type)}
            </span>
            <span className="text-xs text-slate-400 font-medium">{propTypeLabel(property.property_type)}</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
          />

          {/* Upload error */}
          {uploadErr && (
            <div className="mx-5 mt-3 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
              {uploadErr}
              <button onClick={() => setUploadErr(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Image carousel */}
          <div className="relative bg-slate-100" style={{ height: "260px" }}>
            {images.length > 0 ? (
              <>
                <Image
                  src={images[imgIdx].url}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="448px"
                />
                {/* Carousel controls */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-all">
                      <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-all">
                      <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {/* Dot indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === imgIdx ? "bg-white w-4" : "bg-white/60"
                          }`} />
                      ))}
                    </div>
                  </>
                )}
                {/* Image count */}
                {images.length > 1 && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-semibold">
                    {imgIdx + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors group">
                {uploading ? (
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-slate-300 group-hover:border-slate-400 flex items-center justify-center transition-colors text-slate-400 group-hover:text-slate-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Add photos</span>
                    <span className="text-xs text-slate-400">JPG, PNG, WebP · max 8 MB each</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 0 && (
            <div className="flex gap-2 px-5 py-3 overflow-x-auto bg-slate-50 border-b border-slate-100">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    i === imgIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={i === imgIdx ? { borderColor: "var(--color-primary)" } : {}}>
                  <Image src={img.url} alt="" width={56} height={40} className="object-cover w-full h-full" />
                </button>
              ))}
              {images.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 w-14 h-10 rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                  }
                </button>
              )}
            </div>
          )}

          {/* Price + title */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <p className="text-3xl font-extrabold text-slate-900">
              {fmt(property.price, property.currency)}
              {property.listing_type === "rent" && (
                <span className="text-base font-normal text-slate-400 ml-1">/mo</span>
              )}
            </p>
            <h2 className="text-lg font-semibold text-slate-800 mt-1 leading-snug">{property.title}</h2>
            <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Stats grid */}
          {stats.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-base mb-0.5">{s.icon}</p>
                    <p className="text-sm font-bold text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Agent contact */}
          {(property.agent_name || property.agent_email || property.agent_phone) && (
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Contact</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  {property.agent_name && (
                    <p className="text-sm font-semibold text-slate-800">{property.agent_name}</p>
                  )}
                  {property.agent_phone && (
                    <a href={`tel:${property.agent_phone}`}
                      className="text-xs text-slate-500 hover:text-slate-800 block">{property.agent_phone}</a>
                  )}
                  {property.agent_email && (
                    <a href={`mailto:${property.agent_email}`}
                      className="text-xs text-slate-500 hover:text-slate-800 block truncate">{property.agent_email}</a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-6" />
        </div>

        {/* CTA footer */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 flex gap-3">
          <button
            onClick={bookViewing}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}>
            Book a Viewing
          </button>
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Ask AI
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Mini saved card ───────────────────────────────────────────────────────────
function SavedCard({
  property,
  selected,
  onToggle,
  onRemove,
  onOpen,
}: {
  property: Property;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const img = property.images?.[0]?.url;
  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-150 cursor-pointer group ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-slate-100 hover:border-slate-200 hover:shadow-md"
      }`}
      style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
      onClick={onOpen}>

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        aria-label="Select for comparison"
        className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
          selected
            ? "border-transparent text-white"
            : "border-white/80 bg-white/60 text-transparent hover:bg-white/90"
        }`}
        style={selected ? { backgroundColor: "var(--color-primary)" } : {}}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove from saved"
        className="absolute top-3 right-3 z-10 w-6 h-6 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {img ? (
          <Image src={img} alt={property.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-slate-700 shadow-sm">
            {listingLabel(property.listing_type)}
          </span>
        </div>
        {/* Hover hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            View details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="font-bold text-slate-900 text-lg leading-tight">{fmt(property.price, property.currency)}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{property.title}</p>
        <p className="text-xs text-slate-400 mt-1">
          {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
        </p>
        <div className="flex gap-3 mt-3 text-xs text-slate-500">
          {property.bedrooms  > 0 && <span>🛏 {property.bedrooms} bed</span>}
          {property.bathrooms > 0 && <span>🚿 {property.bathrooms} bath</span>}
          {property.area_sqm      && <span>📐 {property.area_sqm} m²</span>}
        </div>
      </div>
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────────
function CompareView({ properties, onClose }: { properties: Property[]; onClose: () => void }) {
  const rows: { label: string; getValue: (p: Property) => string }[] = [
    { label: "Price",         getValue: (p) => fmt(p.price, p.currency) },
    { label: "Listing",       getValue: (p) => listingLabel(p.listing_type) },
    { label: "Type",          getValue: (p) => propTypeLabel(p.property_type) },
    { label: "Bedrooms",      getValue: (p) => p.bedrooms  > 0 ? String(p.bedrooms) : "—" },
    { label: "Bathrooms",     getValue: (p) => p.bathrooms > 0 ? String(p.bathrooms) : "—" },
    { label: "Area",          getValue: (p) => p.area_sqm ? `${p.area_sqm} m²` : "—" },
    { label: "Price / m²",   getValue: (p) => pricePerSqm(p) },
    { label: "City",          getValue: (p) => p.city },
    { label: "Neighbourhood", getValue: (p) => p.neighbourhood ?? "—" },
  ];

  function isBest(row: typeof rows[0], p: Property, all: Property[]) {
    if (row.label === "Price") return p.price === Math.min(...all.map((x) => x.price));
    if (row.label === "Area")  return (p.area_sqm ?? 0) === Math.max(...all.map((x) => x.area_sqm ?? 0)) && (p.area_sqm ?? 0) > 0;
    if (row.label === "Price / m²") {
      const vals = all.map((x) => x.area_sqm ? x.price / x.area_sqm : Infinity);
      const mine = p.area_sqm ? p.price / p.area_sqm : Infinity;
      return mine === Math.min(...vals) && mine < Infinity;
    }
    return false;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Comparing {properties.length} properties</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: `${200 + properties.length * 200}px` }}>
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase w-40">Feature</th>
              {properties.map((p) => {
                const img = p.images?.[0]?.url;
                return (
                  <th key={p.id} className="px-4 py-4 text-left">
                    <div className="flex flex-col gap-2">
                      <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100">
                        {img
                          ? <Image src={img} alt={p.title} fill className="object-cover" />
                          : <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                        }
                      </div>
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{p.title}</p>
                      <p className="text-xs text-slate-400">{[p.neighbourhood, p.city].filter(Boolean).join(", ")}</p>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">{row.label}</td>
                {properties.map((p) => {
                  const best = isBest(row, p, properties);
                  return (
                    <td key={p.id} className="px-4 py-3.5">
                      <span className={`text-sm font-medium ${best ? "text-emerald-600" : "text-slate-700"}`}>
                        {best && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 mb-0.5" />}
                        {row.getValue(p)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-300 text-center mt-4">Green dot = best value in that category</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SavedListingsClient() {
  const [properties, setProperties]   = useState<Property[]>([]);
  const [loading, setLoading]         = useState(true);
  const [ids, setIds]                 = useState<string[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [comparing, setComparing]     = useState(false);
  const [detailProp, setDetailProp]   = useState<Property | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      setIds(stored);
    } catch { setIds([]); }
  }, []);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); setProperties([]); return; }
    async function fetchSaved() {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/batch?ids=${ids.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
        }
      } catch { setProperties([]); }
      finally { setLoading(false); }
    }
    fetchSaved();
  }, [ids]);

  useEffect(() => {
    function onStorage() {
      try {
        const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
        setIds(stored);
      } catch { setIds([]); }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else if (next.size < 4) { next.add(id); }
      return next;
    });
  }, []);

  function removeProperty(id: string) {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      const updated = stored.filter((x) => x !== id);
      localStorage.setItem("habino_saved", JSON.stringify(updated));
      setIds(updated);
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      if (detailProp?.id === id) setDetailProp(null);
    } catch { /* ignore */ }
  }

  // Comparison mode
  if (comparing) {
    return (
      <main className="min-h-screen bg-slate-50">
        <CompareView
          properties={properties.filter((p) => selected.has(p.id))}
          onClose={() => setComparing(false)}
        />
      </main>
    );
  }

  // Loading
  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-8 w-40 bg-slate-100 rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // Empty
  if (properties.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center"
        style={{ minHeight: "calc(100vh - 124px)" }}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No saved properties yet</h2>
        <p className="text-slate-400 text-sm max-w-xs mb-8">
          Ask the AI to find properties, then tap the heart icon to save them here.
        </p>
        <Link href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}>
          Discover properties
        </Link>
      </main>
    );
  }

  const selectedArr = Array.from(selected);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Saved
            <span className="text-slate-400 font-normal text-lg ml-2">· {properties.length}</span>
          </h1>
          {properties.length >= 2 && (
            <p className="text-xs text-slate-400 mt-0.5">Tap a card to view details · Select 2–4 to compare</p>
          )}
        </div>
        <Link href="/" className="text-sm font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
          Discover more →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((p) => (
          <SavedCard
            key={p.id}
            property={p}
            selected={selected.has(p.id)}
            onToggle={() => toggleSelect(p.id)}
            onRemove={() => removeProperty(p.id)}
            onOpen={() => setDetailProp(p)}
          />
        ))}
      </div>

      {/* Detail drawer */}
      {detailProp && (
        <DetailDrawer property={detailProp} onClose={() => setDetailProp(null)} />
      )}

      {/* Sticky compare bar */}
      {selectedArr.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4
          bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/20 border border-white/10">
          <div className="flex -space-x-2">
            {selectedArr.slice(0, 4).map((id) => {
              const p = properties.find((x) => x.id === id);
              const img = p?.images?.[0]?.url;
              return (
                <div key={id} className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-slate-700 overflow-hidden">
                  {img && <Image src={img} alt="" width={32} height={32} className="object-cover w-full h-full" />}
                </div>
              );
            })}
          </div>
          <span className="text-sm font-medium">{selectedArr.length} selected</span>
          <button
            onClick={() => setComparing(true)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors">
            Compare →
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-slate-400 hover:text-white transition-colors ml-1" aria-label="Clear">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
