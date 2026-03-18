"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MarketInsight, DemandLevel, TrendDirection } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const PROPERTY_TYPES = ["apartment", "house", "commercial", "land"];

const demandVariant: Record<DemandLevel, "success" | "warning" | "danger"> = {
  high:   "success",
  medium: "warning",
  low:    "danger",
};

const trendIcon: Record<TrendDirection, string> = {
  up:     "↑",
  down:   "↓",
  stable: "→",
};

export default function MarketPage() {
  const [location,     setLocation]     = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<MarketInsight | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/market/insights", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ location: location.trim(), property_type: propertyType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Market Intelligence</h1>
        <p className="text-slate-500 mb-8">
          Get AI-generated price analysis, demand signals, and valuation estimates for any location.
        </p>

        {/* Query form */}
        <form onSubmit={handleQuery} className="card p-6 flex flex-col gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input
              type="text" required value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Property type</label>
            <div className="flex gap-2 flex-wrap">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type} type="button"
                  onClick={() => setPropertyType(type)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                    propertyType === type
                      ? "text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  style={propertyType === type ? { backgroundColor: "var(--color-primary)" } : {}}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? <><LoadingSpinner className="h-4 w-4" /> Analysing...</> : "Get Market Insights"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="card p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg capitalize">{location}</h2>
                <p className="text-slate-500 text-sm capitalize">{propertyType}</p>
              </div>
              <Badge variant={demandVariant[result.demand_level]} className="capitalize text-sm">
                {result.demand_level} demand
              </Badge>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Avg price / m²</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatPrice(result.avg_price_sqm, result.currency)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">6-month trend</p>
                <p className={`text-xl font-bold ${
                  result.trend_direction === "up"     ? "text-emerald-600" :
                  result.trend_direction === "down"   ? "text-red-500" : "text-slate-600"
                }`}>
                  {trendIcon[result.trend_direction]} {Math.abs(result.trend_pct).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* AVM */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                 style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, white)" }}>
              <p className="text-xs font-semibold text-primary mb-1">AI Valuation Estimate</p>
              <p className="font-bold text-slate-900 text-lg">
                {formatPrice(result.avm_min, result.currency)} – {formatPrice(result.avm_max, result.currency)}
              </p>
            </div>

            {/* Summary */}
            <div>
              <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Confidence + disclaimer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Data confidence: <span className="capitalize font-medium">{result.data_confidence}</span>
              </span>
              <span className="text-xs text-slate-400">AI estimate · Not a formal valuation</span>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
