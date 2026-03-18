"use client";

import { useState } from "react";
import { MarketInsight } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Props {
  location: string;
  propertyType: string;
  areaSqm?: number | null;
}

export function MarketInsightWidget({ location, propertyType, areaSqm }: Props) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<MarketInsight | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [shown,   setShown]   = useState(false);

  async function fetchInsight() {
    setShown(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/market/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, property_type: propertyType, area_sqm: areaSqm }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load insights.");
      else setResult(data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (!shown) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-slate-700 mb-1">AI Market Valuation</p>
        <p className="text-xs text-slate-500 mb-3">Get an AI price estimate for {location}</p>
        <button onClick={fetchInsight} className="btn-primary px-5 py-2 rounded-lg text-sm">
          Get Valuation
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 mb-3">AI Market Valuation · {location}</p>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <LoadingSpinner className="h-4 w-4" /> Analysing market data...
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Avg price/m²</p>
              <p className="font-bold text-slate-900">{formatPrice(result.avg_price_sqm, result.currency)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">6-month trend</p>
              <p className={`font-bold ${result.trend_direction === "up" ? "text-emerald-600" : result.trend_direction === "down" ? "text-red-500" : "text-slate-600"}`}>
                {result.trend_direction === "up" ? "↑" : result.trend_direction === "down" ? "↓" : "→"} {Math.abs(result.trend_pct).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="bg-primary/5 rounded-lg p-3"
               style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, white)" }}>
            <p className="text-xs font-semibold text-primary mb-0.5">Estimated Value Range</p>
            <p className="font-bold text-slate-900 text-sm">
              {formatPrice(result.avm_min, result.currency)} – {formatPrice(result.avm_max, result.currency)}
            </p>
          </div>
          <p className="text-xs text-slate-500">{result.summary}</p>
          <p className="text-xs text-slate-400">AI estimate · Not a formal valuation</p>
        </div>
      )}
    </div>
  );
}
