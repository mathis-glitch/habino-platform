"use client";

import { useState } from "react";
import { PriceTrendChart, DistrictChart } from "./MarktCharts";

// ── Static data — Addis Ababa & major Ethiopian cities ────────────────────────
const CITIES = ["Addis Ababa", "Hawassa", "Bahir Dar", "Dire Dawa", "Mekelle"];

const DISTRICTS: Record<string, string[]> = {
  "Addis Ababa": ["All districts", "Bole", "Kazanchis", "CMC", "Megenagna", "Sarbet", "Lideta", "Piassa", "Merkato"],
  "Hawassa":     ["All districts", "Tabor", "Hawella", "Mehal Ketema", "Addis Ketema", "Haik Dar"],
  "Bahir Dar":   ["All districts", "Sefene Selam", "Ghion", "Belay Zeleke", "Shum Abo", "Meshualekia"],
  "Dire Dawa":   ["All districts", "Kezira", "Sabian", "Gendekore", "Addis Ketema", "Legehare"],
  "Mekelle":     ["All districts", "Adi Haki", "Enda Mariam", "Hadnet", "Hawelti", "Ayder"],
};

const USAGE_TYPES = [
  { key: "residential", label: "Residential" },
  { key: "commercial",  label: "Commercial"  },
  { key: "land",        label: "Land"         },
];

// Prices in ETB per m²
const STATS: Record<string, Record<string, { buy: string; rent: string | null; yield: string; trend: string; up: boolean }>> = {
  residential: {
    "All districts":  { buy: "ETB 28,400", rent: "ETB 320",  yield: "3.8%", trend: "+5.2%", up: true  },
    "Bole":           { buy: "ETB 45,000", rent: "ETB 520",  yield: "3.6%", trend: "+6.1%", up: true  },
    "Kazanchis":      { buy: "ETB 38,000", rent: "ETB 440",  yield: "3.9%", trend: "+5.8%", up: true  },
    "CMC":            { buy: "ETB 32,000", rent: "ETB 380",  yield: "4.1%", trend: "+4.5%", up: true  },
    "Megenagna":      { buy: "ETB 30,000", rent: "ETB 350",  yield: "4.2%", trend: "+4.8%", up: true  },
    "Sarbet":         { buy: "ETB 26,000", rent: "ETB 290",  yield: "4.0%", trend: "+3.9%", up: true  },
    "Lideta":         { buy: "ETB 22,000", rent: "ETB 250",  yield: "4.3%", trend: "+2.8%", up: true  },
    "Piassa":         { buy: "ETB 20,000", rent: "ETB 230",  yield: "4.4%", trend: "+1.6%", up: true  },
    "Merkato":        { buy: "ETB 16,000", rent: "ETB 180",  yield: "4.7%", trend: "+0.8%", up: true  },
  },
  commercial: {
    "All districts":  { buy: "ETB 52,000", rent: "ETB 720",  yield: "5.2%", trend: "+4.8%", up: true  },
    "Bole":           { buy: "ETB 78,000", rent: "ETB 1,100",yield: "5.0%", trend: "+5.9%", up: true  },
    "Kazanchis":      { buy: "ETB 68,000", rent: "ETB 950",  yield: "5.1%", trend: "+5.3%", up: true  },
    "CMC":            { buy: "ETB 48,000", rent: "ETB 680",  yield: "5.4%", trend: "+4.1%", up: true  },
    "Megenagna":      { buy: "ETB 44,000", rent: "ETB 620",  yield: "5.3%", trend: "+3.8%", up: true  },
    "Merkato":        { buy: "ETB 38,000", rent: "ETB 550",  yield: "5.8%", trend: "+2.1%", up: true  },
    "Piassa":         { buy: "ETB 35,000", rent: "ETB 480",  yield: "5.6%", trend: "+1.4%", up: true  },
  },
  land: {
    "All districts":  { buy: "ETB 8,500",  rent: null, yield: "—", trend: "+7.2%", up: true  },
    "Bole":           { buy: "ETB 18,000", rent: null, yield: "—", trend: "+8.4%", up: true  },
    "Kazanchis":      { buy: "ETB 14,000", rent: null, yield: "—", trend: "+7.9%", up: true  },
    "CMC":            { buy: "ETB 9,500",  rent: null, yield: "—", trend: "+6.8%", up: true  },
    "Megenagna":      { buy: "ETB 8,800",  rent: null, yield: "—", trend: "+6.4%", up: true  },
    "Sarbet":         { buy: "ETB 7,200",  rent: null, yield: "—", trend: "+5.6%", up: true  },
    "Merkato":        { buy: "ETB 5,800",  rent: null, yield: "—", trend: "+3.2%", up: true  },
  },
};

const MICRO_FACTORS: Record<string, { score: number; label: string; icon: string }[]> = {
  "Bole": [
    { score: 90, label: "Public Transport", icon: "🚌" },
    { score: 95, label: "Amenities",        icon: "🏪" },
    { score: 72, label: "Green Space",      icon: "🌳" },
    { score: 88, label: "Schools",          icon: "🏫" },
    { score: 78, label: "Noise Level",      icon: "🔇" },
  ],
  "Kazanchis": [
    { score: 85, label: "Public Transport", icon: "🚌" },
    { score: 88, label: "Amenities",        icon: "🏪" },
    { score: 68, label: "Green Space",      icon: "🌳" },
    { score: 82, label: "Schools",          icon: "🏫" },
    { score: 72, label: "Noise Level",      icon: "🔇" },
  ],
  "CMC": [
    { score: 74, label: "Public Transport", icon: "🚌" },
    { score: 76, label: "Amenities",        icon: "🏪" },
    { score: 88, label: "Green Space",      icon: "🌳" },
    { score: 90, label: "Schools",          icon: "🏫" },
    { score: 86, label: "Noise Level",      icon: "🔇" },
  ],
  "Megenagna": [
    { score: 88, label: "Public Transport", icon: "🚌" },
    { score: 82, label: "Amenities",        icon: "🏪" },
    { score: 70, label: "Green Space",      icon: "🌳" },
    { score: 80, label: "Schools",          icon: "🏫" },
    { score: 74, label: "Noise Level",      icon: "🔇" },
  ],
  "All districts": [
    { score: 78, label: "Public Transport", icon: "🚌" },
    { score: 80, label: "Amenities",        icon: "🏪" },
    { score: 74, label: "Green Space",      icon: "🌳" },
    { score: 80, label: "Schools",          icon: "🏫" },
    { score: 72, label: "Noise Level",      icon: "🔇" },
  ],
};

function getStats(usage: string, district: string) {
  return STATS[usage]?.[district] ?? STATS[usage]?.["All districts"] ?? null;
}

function getMicro(district: string) {
  return MICRO_FACTORS[district] ?? MICRO_FACTORS["All districts"];
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score}%`, backgroundColor: score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444" }} />
    </div>
  );
}

export default function MarketClient() {
  const [city,     setCity]     = useState("Addis Ababa");
  const [district, setDistrict] = useState("All districts");
  const [usage,    setUsage]    = useState("residential");

  const stats     = getStats(usage, district);
  const micro     = getMicro(district);
  const districts = DISTRICTS[city] || DISTRICTS["Addis Ababa"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header + selectors */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Indicative data · Live GIS integration coming soon
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Market Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real estate market intelligence by city, district & usage type</p>
        </div>

        {/* City + District selectors */}
        <div className="flex gap-2 flex-wrap">
          <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict("All districts"); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={district} onChange={(e) => setDistrict(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2">
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Usage type tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {USAGE_TYPES.map((u) => (
          <button key={u.key} onClick={() => setUsage(u.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              usage === u.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {u.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      {stats && (
        <div className={`grid gap-4 ${usage === "land" ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
          {[
            { label: "Avg. Sale Price/m²",   value: stats.buy,   icon: "🏠" },
            ...(stats.rent ? [{ label: "Avg. Rent/m²/mo", value: stats.rent, icon: "🔑" }] : []),
            { label: "Gross Yield",           value: stats.yield, icon: "📈" },
            { label: "Price Trend (MoM)",     value: stats.trend, icon: stats.up ? "⬆️" : "⬇️", up: stats.up },
          ].map(({ label, value, icon, up }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <span className="text-2xl mb-2 block">{icon}</span>
              <p className={`text-2xl font-bold ${up !== undefined ? (up ? "text-emerald-600" : "text-red-500") : "text-slate-900"}`}>
                {value}
              </p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Price Trend — 12 months</h2>
          <p className="text-xs text-slate-400 mb-4">{city} · {district}</p>
          <PriceTrendChart usageType={usage} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Price by District</h2>
          <p className="text-xs text-slate-400 mb-4">{city} · {USAGE_TYPES.find(u => u.key === usage)?.label}</p>
          <DistrictChart usageType={usage} />
        </div>
      </div>

      {/* Micro-location + district table side by side */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Micro-location scores */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Micro-Location Score</h2>
          <p className="text-xs text-slate-400 mb-5">{district} · {city}</p>
          <div className="flex flex-col gap-3">
            {micro.map(({ score, label, icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{icon}</span>
                <span className="text-sm text-slate-600 w-32 shrink-0">{label}</span>
                <ScoreBar score={score} />
                <span className={`text-xs font-semibold w-8 text-right ${
                  score >= 85 ? "text-emerald-600" : score >= 70 ? "text-amber-500" : "text-red-500"
                }`}>{score}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-300 mt-5">* Scores 0–100 based on OpenStreetMap data (GIS)</p>
        </div>

        {/* District comparison table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">District Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">{city} · {USAGE_TYPES.find(u => u.key === usage)?.label}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
              <tr>
                <th className="px-5 py-2.5 text-left">District</th>
                <th className="px-4 py-2.5 text-right">Sale/m²</th>
                {usage !== "land" && <th className="px-4 py-2.5 text-right">Rent/m²</th>}
                <th className="px-4 py-2.5 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(DISTRICTS[city] || []).filter(d => d !== "All districts").map((d) => {
                const s = getStats(usage, d);
                if (!s) return null;
                return (
                  <tr key={d}
                    onClick={() => setDistrict(d)}
                    className={`cursor-pointer transition-colors ${district === d ? "bg-primary/5" : "hover:bg-slate-50"}`}>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {district === d && <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5" style={{ backgroundColor: "var(--color-primary)" }} />}
                      {d}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.buy}</td>
                    {usage !== "land" && <td className="px-4 py-3 text-right text-slate-600">{s.rent}</td>}
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold ${s.up ? "text-emerald-600" : "text-red-500"}`}>{s.trend}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market insight cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            tag: "Market Dynamics", tagColor: "bg-blue-50 text-blue-700",
            title: "Strong Demand",
            body: "Demand for residential units in Bole and Kazanchis outpaces supply by ~31%. Properties in prime areas average 18 days on market.",
          },
          {
            tag: "Price Outlook", tagColor: "bg-emerald-50 text-emerald-700",
            title: "Consistent Growth",
            body: "Sale prices in Addis Ababa have risen 5–8% MoM in 2025–26, driven by urban expansion and infrastructure investment.",
          },
          {
            tag: "Rental Market", tagColor: "bg-amber-50 text-amber-700",
            title: "Rising Rents",
            body: "Rental demand is strong in Bole and Megenagna. Yield averages 3.8–4.2% for residential and up to 5.8% for commercial.",
          },
        ].map(({ tag, tagColor, title, body }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-3 ${tagColor}`}>{tag}</span>
            <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-300 text-center pb-2">
        * All figures are indicative estimates for demonstration. Live market data will be integrated via Supabase GIS.
      </p>
    </div>
  );
}
