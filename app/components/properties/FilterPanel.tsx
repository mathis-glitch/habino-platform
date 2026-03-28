"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: "🏢" },
  { value: "house",     label: "House",     icon: "🏠" },
  { value: "villa",     label: "Villa",     icon: "🏡" },
  { value: "office",    label: "Office",    icon: "🏗️" },
  { value: "commercial",label: "Commercial",icon: "🏪" },
  { value: "land",      label: "Land/Plot", icon: "🌿" },
];

const BEDROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

export function FilterPanel() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [open, setOpen] = useState(false);

  const [minPrice, setMinPrice] = useState(params.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") || "");
  const [propType, setPropType] = useState(params.get("property_type") || "");
  const [minBeds,  setMinBeds]  = useState(params.get("min_beds") || "");

  function applyFilters() {
    const p = new URLSearchParams(params.toString());
    if (minPrice) p.set("min_price",     minPrice);  else p.delete("min_price");
    if (maxPrice) p.set("max_price",     maxPrice);  else p.delete("max_price");
    if (propType) p.set("property_type", propType);  else p.delete("property_type");
    if (minBeds)  p.set("min_beds",      minBeds);   else p.delete("min_beds");
    p.set("page", "1");
    router.push(`/search?${p.toString()}`);
    setOpen(false);
  }

  function clearAll() {
    setMinPrice(""); setMaxPrice(""); setPropType(""); setMinBeds("");
    const p = new URLSearchParams(params.toString());
    ["min_price", "max_price", "property_type", "min_beds"].forEach((k) => p.delete(k));
    p.set("page", "1");
    router.push(`/search?${p.toString()}`);
    setOpen(false);
  }

  const activeCount = [
    params.get("min_price"), params.get("max_price"),
    params.get("property_type"), params.get("min_beds"),
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border"
        style={hasFilters
          ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)", color: "white" }
          : { background: "white", borderColor: "#e2e8f0", color: "#475569" }
        }
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filters
        {hasFilters && (
          <span style={{
            background: "white", color: "var(--color-primary)",
            borderRadius: 99, width: 18, height: 18,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-80">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Filters</h3>
              {hasFilters && (
                <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {/* Property type */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Property type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPropType(propType === t.value ? "" : t.value)}
                    className="py-2 px-2 rounded-xl text-xs text-center transition-all border flex flex-col items-center gap-1"
                    style={propType === t.value
                      ? { backgroundColor: "var(--color-primary-light)", borderColor: "var(--color-primary)", color: "var(--color-primary)", fontWeight: 600 }
                      : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#64748b" }
                    }
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Min. Bedrooms
              </label>
              <div className="flex gap-1.5">
                {BEDROOM_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setMinBeds(minBeds === b.value ? "" : b.value)}
                    className="flex-1 py-2 rounded-xl text-sm transition-all border font-medium"
                    style={minBeds === b.value
                      ? { backgroundColor: "var(--color-primary-light)", borderColor: "var(--color-primary)", color: "var(--color-primary)" }
                      : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#64748b" }
                    }
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Price range (ETB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-green-400"
                />
                <span className="text-slate-300 text-lg font-light shrink-0">—</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-green-400"
                />
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Show results
            </button>

          </div>
        </>
      )}
    </div>
  );
}
