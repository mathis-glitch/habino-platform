"use client";

import { useState } from "react";
import { PriceTrendChart, DistrictChart } from "./MarktCharts";

// ── Deutsche Städte & Stadtteile ──────────────────────────────────────────────
const CITIES = ["Berlin", "München", "Hamburg", "Frankfurt", "Köln"];

const DISTRICTS: Record<string, string[]> = {
  "Berlin":    ["All Districts", "Mitte", "Prenzlauer Berg", "Friedrichshain", "Kreuzberg", "Charlottenburg", "Neukölln", "Schöneberg", "Spandau"],
  "München":   ["All Districts", "Maxvorstadt", "Schwabing", "Bogenhausen", "Haidhausen", "Sendling", "Giesing", "Pasing", "Nymphenburg"],
  "Hamburg":   ["All Districts", "Altona", "Eimsbüttel", "Winterhude", "Harvestehude", "Eppendorf", "Wandsbek", "Bergedorf", "Blankenese"],
  "Frankfurt": ["All Districts", "Sachsenhausen", "Bornheim", "Westend", "Nordend", "Bockenheim", "Gallusviertel", "Dornbusch", "Höchst"],
  "Köln":      ["All Districts", "Ehrenfeld", "Nippes", "Sülz", "Lindenthal", "Rodenkirchen", "Deutz", "Chorweiler", "Porz"],
};

const USAGE_TYPES = [
  { key: "residential", label: "Residential" },
  { key: "commercial",  label: "Commercial"  },
  { key: "land",        label: "Land"         },
];

// Preise in EUR/m²
const STATS: Record<string, Record<string, { buy: string; rent: string | null; yield: string; trend: string; up: boolean }>> = {
  residential: {
    "All Districts":  { buy: "€ 5.200",  rent: "€ 18",  yield: "4.2%", trend: "+3.8%", up: true  },
    "Mitte":            { buy: "€ 7.800",  rent: "€ 26",  yield: "4.0%", trend: "+4.5%", up: true  },
    "Prenzlauer Berg":  { buy: "€ 6.900",  rent: "€ 24",  yield: "4.2%", trend: "+3.9%", up: true  },
    "Friedrichshain":   { buy: "€ 6.400",  rent: "€ 22",  yield: "4.1%", trend: "+4.1%", up: true  },
    "Kreuzberg":        { buy: "€ 6.200",  rent: "€ 21",  yield: "4.1%", trend: "+3.5%", up: true  },
    "Charlottenburg":   { buy: "€ 7.100",  rent: "€ 25",  yield: "4.2%", trend: "+2.8%", up: true  },
    "Neukölln":         { buy: "€ 4.800",  rent: "€ 16",  yield: "4.0%", trend: "−0.5%", up: false },
    "Schöneberg":       { buy: "€ 6.500",  rent: "€ 22",  yield: "4.1%", trend: "+2.1%", up: true  },
    "Spandau":          { buy: "€ 3.600",  rent: "€ 12",  yield: "4.0%", trend: "−1.2%", up: false },
    "Maxvorstadt":      { buy: "€ 10.500", rent: "€ 32",  yield: "3.7%", trend: "+5.1%", up: true  },
    "Schwabing":        { buy: "€ 9.800",  rent: "€ 30",  yield: "3.7%", trend: "+4.8%", up: true  },
    "Bogenhausen":      { buy: "€ 11.200", rent: "€ 34",  yield: "3.6%", trend: "+5.5%", up: true  },
    "Haidhausen":       { buy: "€ 8.900",  rent: "€ 28",  yield: "3.8%", trend: "+4.2%", up: true  },
    "Altona":           { buy: "€ 7.200",  rent: "€ 23",  yield: "3.8%", trend: "+3.6%", up: true  },
    "Eimsbüttel":       { buy: "€ 7.500",  rent: "€ 24",  yield: "3.8%", trend: "+3.8%", up: true  },
    "Winterhude":       { buy: "€ 7.800",  rent: "€ 25",  yield: "3.8%", trend: "+4.0%", up: true  },
    "Sachsenhausen":    { buy: "€ 6.800",  rent: "€ 22",  yield: "3.9%", trend: "+3.2%", up: true  },
    "Ehrenfeld":        { buy: "€ 5.100",  rent: "€ 17",  yield: "4.0%", trend: "+2.9%", up: true  },
  },
  commercial: {
    "All Districts":  { buy: "€ 6.800",  rent: "€ 28",  yield: "5.0%", trend: "+3.2%", up: true  },
    "Mitte":            { buy: "€ 9.500",  rent: "€ 38",  yield: "4.8%", trend: "+4.1%", up: true  },
    "Prenzlauer Berg":  { buy: "€ 7.200",  rent: "€ 30",  yield: "5.0%", trend: "+3.5%", up: true  },
    "Charlottenburg":   { buy: "€ 8.400",  rent: "€ 35",  yield: "5.0%", trend: "+2.5%", up: true  },
    "Maxvorstadt":      { buy: "€ 12.000", rent: "€ 46",  yield: "4.6%", trend: "+5.0%", up: true  },
    "Altona":           { buy: "€ 8.500",  rent: "€ 34",  yield: "4.8%", trend: "+3.4%", up: true  },
    "Sachsenhausen":    { buy: "€ 7.900",  rent: "€ 32",  yield: "4.9%", trend: "+2.9%", up: true  },
    "Ehrenfeld":        { buy: "€ 5.800",  rent: "€ 24",  yield: "5.0%", trend: "+2.6%", up: true  },
  },
  land: {
    "All Districts":  { buy: "€ 980",   rent: null, yield: "—", trend: "+5.5%", up: true  },
    "Mitte":            { buy: "€ 2.800",  rent: null, yield: "—", trend: "+6.8%", up: true  },
    "Prenzlauer Berg":  { buy: "€ 2.200",  rent: null, yield: "—", trend: "+6.2%", up: true  },
    "Charlottenburg":   { buy: "€ 2.500",  rent: null, yield: "—", trend: "+5.9%", up: true  },
    "Neukölln":         { buy: "€ 1.400",  rent: null, yield: "—", trend: "+0.8%", up: true  },
    "Spandau":          { buy: "€ 680",    rent: null, yield: "—", trend: "−0.4%", up: false },
    "Maxvorstadt":      { buy: "€ 4.200",  rent: null, yield: "—", trend: "+7.5%", up: true  },
    "Altona":           { buy: "€ 1.900",  rent: null, yield: "—", trend: "+5.1%", up: true  },
  },
};

const MICRO_FACTORS: Record<string, { score: number; label: string }[]> = {
  "Mitte": [
    { score: 97, label: "Public Transport" },
    { score: 95, label: "Infrastructure" },
    { score: 58, label: "Green Space" },
    { score: 90, label: "Schools" },
    { score: 62, label: "Noise Level" },
  ],
  "Prenzlauer Berg": [
    { score: 92, label: "Public Transport" },
    { score: 90, label: "Infrastructure" },
    { score: 75, label: "Green Space" },
    { score: 88, label: "Schools" },
    { score: 72, label: "Noise Level" },
  ],
  "Charlottenburg": [
    { score: 94, label: "Public Transport" },
    { score: 92, label: "Infrastructure" },
    { score: 70, label: "Green Space" },
    { score: 86, label: "Schools" },
    { score: 68, label: "Noise Level" },
  ],
  "Spandau": [
    { score: 72, label: "Public Transport" },
    { score: 68, label: "Infrastructure" },
    { score: 88, label: "Green Space" },
    { score: 80, label: "Schools" },
    { score: 90, label: "Noise Level" },
  ],
  "All Districts": [
    { score: 82, label: "Public Transport" },
    { score: 80, label: "Infrastructure" },
    { score: 72, label: "Green Space" },
    { score: 80, label: "Schools" },
    { score: 70, label: "Noise Level" },
  ],
};

function getStats(usage: string, district: string) {
  return STATS[usage]?.[district] ?? STATS[usage]?.["All Districts"] ?? null;
}

function getMicro(district: string) {
  return MICRO_FACTORS[district] ?? MICRO_FACTORS["All Districts"];
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "var(--ok)" : score >= 65 ? "var(--warn)" : "var(--err)";
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface3)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 9,
  border: "1px solid var(--border2)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-1)",
  background: "var(--surface2)",
  outline: "none",
  cursor: "pointer",
};

export default function MarketClient() {
  const [city,     setCity]     = useState("Berlin");
  const [district, setDistrict] = useState("All Districts");
  const [usage,    setUsage]    = useState("residential");

  const stats     = getStats(usage, district);
  const micro     = getMicro(district);
  const districts = DISTRICTS[city] || DISTRICTS["Berlin"];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.2)",
              color: "var(--warn)", fontSize: 11, fontWeight: 600, marginBottom: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn)", display: "inline-block" }} />
              Indicative data · Live GIS integration coming soon
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0 }}>
              Market Report
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
              Real estate market data by city, district & usage type
            </p>
          </div>

          {/* City + District selectors */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict("All Districts"); }} style={selectStyle}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} style={selectStyle}>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Usage type tabs */}
        <div style={{
          display: "flex", gap: 2,
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 3, width: "fit-content",
        }}>
          {USAGE_TYPES.map((u) => (
            <button key={u.key} onClick={() => setUsage(u.key)} style={{
              padding: "6px 16px", borderRadius: 7,
              fontSize: 13, fontWeight: 600,
              background: usage === u.key ? "var(--surface3)" : "transparent",
              color: usage === u.key ? "var(--text-1)" : "var(--text-2)",
              boxShadow: usage === u.key ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              border: "none", cursor: "pointer", transition: "all 0.12s",
            }}>
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${usage === "land" ? 3 : 4}, 1fr)`, gap: 12 }}>
          {[
            { label: "Avg. Sale Price/m²", value: stats.buy,   up: undefined },
            ...(stats.rent ? [{ label: "Avg. Rent/m²/mo",   value: stats.rent,  up: undefined }] : []),
            { label: "Gross Yield",         value: stats.yield, up: undefined },
            { label: "Price Trend (MoM)",   value: stats.trend, up: stats.up },
          ].map(({ label, value, up }) => (
            <div key={label} style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "18px 20px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                {label}
              </p>
              <p style={{
                fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
                color: up !== undefined ? (up ? "var(--ok)" : "var(--err)") : "var(--text-1)",
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          {
            title: "Price Trend — 12 months",
            subtitle: `${city} · ${district}`,
            chart: <PriceTrendChart usageType={usage} />,
          },
          {
            title: "Price by District",
            subtitle: `${city} · ${USAGE_TYPES.find(u => u.key === usage)?.label}`,
            chart: <DistrictChart usageType={usage} />,
          },
        ].map(({ title, subtitle, chart }) => (
          <div key={title} style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 24,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, marginBottom: 16 }}>{subtitle}</p>
            {chart}
          </div>
        ))}
      </div>

      {/* Mikrolage + Stadtteil-Tabelle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Mikrolage */}
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 24,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Micro-Location Score</h2>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, marginBottom: 20 }}>{district} · {city}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {micro.map(({ score, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-2)", width: 130, flexShrink: 0 }}>{label}</span>
                <ScoreBar score={score} />
                <span style={{
                  fontSize: 12, fontWeight: 700, width: 28, textAlign: "right", flexShrink: 0,
                  color: score >= 85 ? "var(--ok)" : score >= 65 ? "var(--warn)" : "var(--err)",
                }}>{score}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 16 }}>* Scores 0–100 based on OpenStreetMap data</p>
        </div>

        {/* Stadtteil-Tabelle */}
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>District Overview</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              {city} · {USAGE_TYPES.find(u => u.key === usage)?.label}
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--surface3)" }}>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>District</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Sale/m²</th>
                  {usage !== "land" && <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Rent/m²</th>}
                  <th style={{ padding: "8px 16px 8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {(DISTRICTS[city] || []).filter(d => d !== "All Districts").map((d) => {
                  const s = getStats(usage, d);
                  if (!s) return null;
                  const isActive = district === d;
                  return (
                    <tr key={d}
                      onClick={() => setDistrict(d)}
                      style={{
                        cursor: "pointer",
                        background: isActive ? "var(--color-primary-light)" : "transparent",
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.12s",
                      }}>
                      <td style={{ padding: "10px 16px", fontWeight: isActive ? 600 : 400, color: isActive ? "var(--color-primary)" : "var(--text-1)" }}>
                        {isActive && (
                          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--color-primary)", marginRight: 6, marginBottom: 1 }} />
                        )}
                        {d}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-2)" }}>{s.buy}</td>
                      {usage !== "land" && <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-2)" }}>{s.rent}</td>}
                      <td style={{ padding: "10px 16px 10px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.up ? "var(--ok)" : "var(--err)" }}>{s.trend}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Markt-Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          {
            tag: "Market Dynamics", tagColor: { bg: "rgba(124,110,242,0.1)", text: "var(--color-primary)", border: "rgba(124,110,242,0.2)" },
            title: "High Demand",
            body: "Demand for residential properties in Berlin-Mitte and Prenzlauer Berg exceeds supply by ~28%. Properties in prime locations stay on the market for an average of 14 days.",
          },
          {
            tag: "Price Outlook", tagColor: { bg: "rgba(48,209,88,0.1)", text: "var(--ok)", border: "rgba(48,209,88,0.2)" },
            title: "Steady Growth",
            body: "Purchase prices in major German cities rose 3–6% p.a. in 2025–26, driven by population growth, housing shortage, and limited new construction activity.",
          },
          {
            tag: "Rental Market", tagColor: { bg: "rgba(255,159,10,0.1)", text: "var(--warn)", border: "rgba(255,159,10,0.2)" },
            title: "Rising Rents",
            body: "Rental demand remains high across all major cities. Gross yields of 3.6–4.2% for residential and up to 5.0% for commercial are typical for German A-cities.",
          },
        ].map(({ tag, tagColor, title, body }) => (
          <div key={title} style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 20,
          }}>
            <span style={{
              display: "inline-block", padding: "3px 10px", borderRadius: 20, marginBottom: 12,
              fontSize: 11, fontWeight: 600,
              background: tagColor.bg, color: tagColor.text, border: `1px solid ${tagColor.border}`,
            }}>{tag}</span>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{body}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
        * All figures are indicative estimates for demonstration purposes. Live market data will be integrated via Supabase GIS.
      </p>
    </div>
  );
}
