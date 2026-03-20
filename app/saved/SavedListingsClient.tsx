"use client";

import { useEffect, useState } from "react";
import { Property } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

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

// ── Mini card used in the grid ────────────────────────────────────────────────
function SavedCard({
  property,
  selected,
  onToggle,
  onRemove,
}: {
  property: Property;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const img = property.images?.[0]?.url;
  return (
    <div className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-150 ${
      selected ? "border-primary ring-2 ring-primary/20" : "border-slate-100 hover:border-slate-200"
    }`} style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}>

      {/* Checkbox overlay */}
      <button
        onClick={onToggle}
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

      {/* Remove button */}
      <button
        onClick={onRemove}
        aria-label="Remove from saved"
        className="absolute top-3 right-3 z-10 w-6 h-6 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <div className="relative h-40 bg-slate-100">
        {img ? (
          <Image src={img} alt={property.title} fill className="object-cover" />
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
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="font-bold text-slate-900 text-lg leading-tight">{fmt(property.price, property.currency)}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{property.title}</p>
        <p className="text-xs text-slate-400 mt-1">
          {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
        </p>
        <div className="flex gap-3 mt-3 text-xs text-slate-500">
          {property.bedrooms > 0 && <span>🛏 {property.bedrooms} bed</span>}
          {property.bathrooms > 0 && <span>🚿 {property.bathrooms} bath</span>}
          {property.area_sqm && <span>📐 {property.area_sqm} m²</span>}
        </div>
      </div>
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────────
function CompareView({
  properties,
  onClose,
}: {
  properties: Property[];
  onClose: () => void;
}) {
  const rows: { label: string; getValue: (p: Property) => string }[] = [
    { label: "Price",         getValue: (p) => fmt(p.price, p.currency) },
    { label: "Listing",       getValue: (p) => listingLabel(p.listing_type) },
    { label: "Type",          getValue: (p) => propTypeLabel(p.property_type) },
    { label: "Bedrooms",      getValue: (p) => p.bedrooms > 0 ? String(p.bedrooms) : "—" },
    { label: "Bathrooms",     getValue: (p) => p.bathrooms > 0 ? String(p.bathrooms) : "—" },
    { label: "Area",          getValue: (p) => p.area_sqm ? `${p.area_sqm} m²` : "—" },
    { label: "Price / m²",   getValue: (p) => pricePerSqm(p) },
    { label: "City",          getValue: (p) => p.city },
    { label: "Neighbourhood", getValue: (p) => p.neighbourhood ?? "—" },
  ];

  // Highlight the best value for numeric rows
  function isBest(row: typeof rows[0], p: Property, all: Property[]) {
    const label = row.label;
    if (label === "Price") {
      const min = Math.min(...all.map((x) => x.price));
      return p.price === min;
    }
    if (label === "Area") {
      const vals = all.map((x) => x.area_sqm ?? 0);
      return (p.area_sqm ?? 0) === Math.max(...vals) && Math.max(...vals) > 0;
    }
    if (label === "Price / m²") {
      const vals = all.map((x) => (x.area_sqm ? x.price / x.area_sqm : Infinity));
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
        <h1 className="text-xl font-bold text-slate-900">
          Comparing {properties.length} properties
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: `${200 + properties.length * 200}px` }}>
          {/* Property header row */}
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase w-40">Feature</th>
              {properties.map((p) => {
                const img = p.images?.[0]?.url;
                return (
                  <th key={p.id} className="px-4 py-4 text-left">
                    <div className="flex flex-col gap-2">
                      <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100">
                        {img ? (
                          <Image src={img} alt={p.title} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        )}
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

      <p className="text-xs text-slate-300 text-center mt-4">
        Green dot = best value in that category
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SavedListingsClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [ids, setIds]               = useState<string[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [comparing, setComparing]   = useState(false);

  // Load saved IDs from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      setIds(stored);
    } catch {
      setIds([]);
    }
  }, []);

  // Fetch properties from API
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
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [ids]);

  // Re-sync on localStorage change
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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else if (next.size < 4) { next.add(id); }
      return next;
    });
  }

  function removeProperty(id: string) {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      const updated = stored.filter((x) => x !== id);
      localStorage.setItem("habino_saved", JSON.stringify(updated));
      setIds(updated);
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch { /* ignore */ }
  }

  // ── Comparison mode ────────────────────────────────────────────────────────
  if (comparing) {
    const compareProps = properties.filter((p) => selected.has(p.id));
    return (
      <main className="min-h-screen bg-slate-50">
        <CompareView properties={compareProps} onClose={() => setComparing(false)} />
      </main>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-8 w-40 bg-slate-100 rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
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
          Tap the heart icon on any property card to save it here for later.
        </p>
        <Link href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}>
          Discover properties
        </Link>
      </main>
    );
  }

  // ── Main grid view ─────────────────────────────────────────────────────────
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
            <p className="text-xs text-slate-400 mt-0.5">
              Select 2–4 properties to compare them side by side
            </p>
          )}
        </div>
        <Link href="/" className="text-sm font-medium hover:underline"
          style={{ color: "var(--color-primary)" }}>
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
          />
        ))}
      </div>

      {/* Sticky compare bar */}
      {selectedArr.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4
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
          <span className="text-sm font-medium">
            {selectedArr.length} selected
          </span>
          <button
            onClick={() => setComparing(true)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors">
            Compare →
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-slate-400 hover:text-white transition-colors ml-1"
            aria-label="Clear selection">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
