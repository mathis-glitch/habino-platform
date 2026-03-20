"use client";

import { useState, useEffect } from "react";
import { PriceTrendChart, DistrictChart } from "./MarktCharts";

// ── Static data (replace with Supabase / GIS queries later) ──────────────────
const CITIES = ["Hamburg", "Berlin", "Munich", "Frankfurt", "Cologne"];

const DISTRICTS: Record<string, string[]> = {
  Hamburg:   ["All districts", "City Centre / HafenCity", "Altona", "Eimsbüttel", "Hamburg-Nord", "Wandsbek", "Harburg"],
  Berlin:    ["All districts", "Mitte", "Prenzlauer Berg", "Friedrichshain", "Kreuzberg", "Charlottenburg", "Neukölln"],
  Munich:    ["All districts", "Maxvorstadt", "Schwabing", "Bogenhausen", "Pasing", "Neuhausen", "Giesing"],
  Frankfurt: ["All districts", "Sachsenhausen", "Bornheim", "Westend", "Nordend", "Gallus", "Eschersheim"],
  Cologne:   ["All districts", "Altstadt", "Ehrenfeld", "Nippes", "Lindenthal", "Kalk", "Porz"],
};

const USAGE_TYPES = [
  { key: "residential", label: "Residential" },
  { key: "commercial",  label: "Commercial" },
  { key: "land",        label: "Land" },
];

const STATS: Record<string, Record<string, { buy: string; rent: string | null; yield: string; trend: string; up: boolean }>> = {
  residential: {
    "City Centre / HafenCity": { buy: "$6,200", rent: "$18.50", yield: "3.6%", trend: "+4.1%", up: true },
    "Altona":                  { buy: "$5,800", rent: "$17.20", yield: "3.5%", trend: "+3.2%", up: true },
    "Eimsbüttel":              { buy: "$5,500", rent: "$16.80", yield: "3.7%", trend: "+2.9%", up: true },
    "Hamburg-Nord":            { buy: "$5,100", rent: "$15.60", yield: "3.7%", trend: "+1.8%", up: true },
    "Wandsbek":                { buy: "$4,200", rent: "$13.40", yield: "3.8%", trend: "+0.9%", up: true },
    "Harburg":                 { buy: "$3,200", rent: "$11.00", yield: "4.1%", trend: "-0.4%", up: false },
    "All districts":           { buy: "$4,720", rent: "$16.30", yield: "3.7%", trend: "+2.8%", up: true },
  },
  commercial: {
    "All districts":           { buy: "$6,320", rent: "$24.80", yield: "4.7%", trend: "+1.9%", up: true },
    "City Centre / HafenCity": { buy: "$8,500", rent: "$32.00", yield: "4.5%", trend: "+2.2%", up: true },
    "Altona":                  { buy: "$7,200", rent: "$26.50", yield: "4.4%", trend: "+1.8%", up: true },
  },
  land: {
    "All districts":           { buy: "$1,390", rent: null, yield: "—",   trend: "+1.2%", up: true },
    "City Centre / HafenCity": { buy: "$3,200", rent: null, yield: "—",   trend: "+2.8%", up: true },
    "Altona":                  { buy: "$2,400", rent: null, yield: "—",   trend: "+1.5%", up: true },
  },
};

const MICRO_FACTORS: Record<string, { score: number; label: string; icon: string }[]> = {
  "City Centre / HafenCity": [
    { score: 95, label: "Public Transport", icon: "🚇" },
    { score: 90, label: "Amenities",        icon: "🏪" },
    { score: 85, label: "Green Space",      icon: "🌳" },
    { score: 92, label: "Schools",          icon: "🏫" },
    { score: 80, label: "Noise Level",      icon: "🔇" },
  ],
  "Eimsbüttel": [
    { score: 88, label: "Public Transport", icon: "🚇" },
    { score: 92, label: "Amenities",        icon: "🏪" },
    { score: 90, label: "Green Space",      icon: "🌳" },
    { score: 94, label: "Schools",          icon: "🏫" },
    { score: 88, label: "Noise Level",      icon: "🔇" },
  ],
  "All districts": [
    { score: 82, label: "Public Transport", icon: "🚇" },
    { score: 80, label: "Amenities",        icon: "🏪" },
    { score: 78, label: "Green Space",      icon: "🌳" },
    { score: 83, label: "Schools",          icon: "🏫" },
    { score: 75, label: "Noise Level",      icon: "🔇" },
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
  const [city,    setCity]    = useState("Hamburg");
  const [district, setDistrict] = useState("All districts");
  const [usage,   setUsage]   = useState("residential");

  const stats = getStats(usage, district);
  const micro = getMicro(district);
  const districts = DISTRICTS[city] || DISTRICTS["Hamburg"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header + selectors */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Sample data · GIS integration coming soon
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Market Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real estate market intelligence by location & usage type</p>
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
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
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
            { label: "Avg. Sale Price/m²", value: stats.buy,  icon: "🏠" },
            ...(stats.rent ? [{ label: "Avg. Rent/m²",       value: stats.rent, icon: "🔑" }] : []),
            { label: "Gross Yield",         value: stats.yield, icon: "📈" },
            { label: "Price Trend (MoM)",   value: stats.trend, icon: stats.up ? "⬆️" : "⬇️", up: stats.up },
          ].map(({ label, value, icon, up }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Price Trend — 12 months</h2>
          <p className="text-xs text-slate-400 mb-4">{city} · {district}</p>
          <PriceTrendChart usageType={usage} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Price by District</h2>
          <p className="text-xs text-slate-400 mb-4">{city} · {USAGE_TYPES.find(u => u.key === usage)?.label}</p>
          <DistrictChart usageType={usage} />
        </div>
      </div>

      {/* Micro-location + district table side by side */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Micro-location scores */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
            title: "Seller's Market",
            body: "Demand outpaces supply by ~23%. Properties are on the market for an average of 24 days — act fast.",
          },
          {
            tag: "Price Outlook", tagColor: "bg-emerald-50 text-emerald-700",
            title: "Moderate Growth",
            body: "Sale prices are rising 2–4% MoM. Prime locations like City Centre show the strongest gains.",
          },
          {
            tag: "Rental Market", tagColor: "bg-amber-50 text-amber-700",
            title: "Tight Supply",
            body: "Rents are up across all districts. Eimsbüttel and West End are seeing above-average increases.",
          },
        ].map(({ tag, tagColor, title, body }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-3 ${tagColor}`}>{tag}</span>
            <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-300 text-center pb-2">
        * All figures are sample data for demonstration. Live GIS & market data will be integrated via Supabase.
      </p>
    </div>
  );
}
