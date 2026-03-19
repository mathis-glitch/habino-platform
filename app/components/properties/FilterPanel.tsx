"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house",     label: "House"     },
  { value: "commercial",label: "Commercial"},
  { value: "land",      label: "Land"      },
];

export function FilterPanel() {
  const router     = useRouter();
  const params     = useSearchParams();
  const [open, setOpen] = useState(false);

  const [minPrice,  setMinPrice]  = useState(params.get("min_price") || "");
  const [maxPrice,  setMaxPrice]  = useState(params.get("max_price") || "");
  const [propType,  setPropType]  = useState(params.get("property_type") || "");

  function applyFilters() {
    const p = new URLSearchParams(params.toString());
    if (minPrice)  p.set("min_price",     minPrice);  else p.delete("min_price");
    if (maxPrice)  p.set("max_price",     maxPrice);  else p.delete("max_price");
    if (propType)  p.set("property_type", propType);  else p.delete("property_type");
    p.set("page", "1");
    router.push(`/search?${p.toString()}`);
    setOpen(false);
  }

  function clearAll() {
    setMinPrice(""); setMaxPrice(""); setPropType("");
    const p = new URLSearchParams(params.toString());
    ["min_price", "max_price", "property_type"].forEach((k) => p.delete(k));
    p.set("page", "1");
    router.push(`/search?${p.toString()}`);
    setOpen(false);
  }

  const hasFilters = !!(params.get("min_price") || params.get("max_price") || params.get("property_type"));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border-2 ${
          hasFilters
            ? "text-white border-transparent"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
        style={hasFilters ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filters {hasFilters && "●"}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute left-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-72">
            <h3 className="font-semibold text-slate-800 mb-4">More Filters</h3>

            {/* Property type */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Property type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPropType(propType === t.value ? "" : t.value)}
                    className={`py-2 px-3 rounded-lg text-sm text-left transition-colors border ${
                      propType === t.value
                        ? "text-white border-transparent font-medium"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                    style={propType === t.value ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Price range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-white"
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Apply
              </button>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
