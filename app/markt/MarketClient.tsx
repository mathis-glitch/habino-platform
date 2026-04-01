"use client";

import { useState } from "react";
import { PriceTrendChart, DistrictChart } from "./MarktCharts";

// ── Addis Abeba Districts ──────────────────────────────────────────────────────
const DISTRICTS = [
  "All Districts",
  "Bole",
  "Kazanchis",
  "Sarbet",
  "CMC",
  "Megenagna",
  "Piassa",
  "Arada",
  "Lideta",
  "Yeka",
  "Nifas Silk-Lafto",
];

const USAGE_TYPES = [
  { key: "residential", label: "Residential" },
  { key: "commercial",  label: "Commercial"  },
  { key: "land",        label: "Land"         },
];

// Prices in ETB/m² — indicative estimates for Addis Abeba
const STATS: Record<string, Record<string, { buy: string; rent: string | null; yield: string; trend: string; up: boolean }>> = {
  residential: {
    "All Districts":    { buy: "ETB 43,000",  rent: "ETB 140",  yield: "3.9%", trend: "+5.8%", up: true  },
    "Bole":             { buy: "ETB 52,000",  rent: "ETB 165",  yield: "3.8%", trend: "+7.2%", up: true  },
    "Kazanchis":        { buy: "ETB 48,000",  rent: "ETB 155",  yield: "3.9%", trend: "+6.5%", up: true  },
    "Sarbet":           { buy: "ETB 44,000",  rent: "ETB 145",  yield: "4.0%", trend: "+5.9%", up: true  },
    "CMC":              { buy: "ETB 40,000",  rent: "ETB 135",  yield: "4.1%", trend: "+5.2%", up: true  },
    "Megenagna":        { buy: "ETB 38,000",  rent: "ETB 130",  yield: "4.1%", trend: "+5.0%", up: true  },
    "Piassa":           { buy: "ETB 35,000",  rent: "ETB 120",  yield: "4.1%", trend: "+3.8%", up: true  },
    "Arada":            { buy: "ETB 33,000",  rent: "ETB 115",  yield: "4.2%", trend: "+3.5%", up: true  },
    "Lideta":           { buy: "ETB 31,000",  rent: "ETB 108",  yield: "4.2%", trend: "+3.1%", up: true  },
    "Yeka":             { buy: "ETB 30,000",  rent: "ETB 108",  yield: "4.3%", trend: "+2.9%", up: true  },
    "Nifas Silk-Lafto": { buy: "ETB 28,000",  rent: "ETB 100",  yield: "4.3%", trend: "+2.5%", up: true  },
  },
  commercial: {
    "All Districts":    { buy: "ETB 60,000",  rent: "ETB 235",  yield: "4.7%", trend: "+6.1%", up: true  },
    "Bole":             { buy: "ETB 72,000",  rent: "ETB 260",  yield: "4.3%", trend: "+7.8%", up: true  },
    "Kazanchis":        { buy: "ETB 68,000",  rent: "ETB 248",  yield: "4.4%", trend: "+7.1%", up: true  },
    "Sarbet":           { buy: "ETB 60,000",  rent: "ETB 225",  yield: "4.5%", trend: "+6.0%", up: true  },
    "CMC":              { buy: "ETB 54,000",  rent: "ETB 200",  yield: "4.4%", trend: "+5.4%", up: true  },
    "Megenagna":        { buy: "ETB 50,000",  rent: "ETB 185",  yield: "4.4%", trend: "+5.0%", up: true  },
    "Piassa":           { buy: "ETB 46,000",  rent: "ETB 172",  yield: "4.5%", trend: "+4.2%", up: true  },
    "Arada":            { buy: "ETB 42,000",  rent: "ETB 158",  yield: "4.5%", trend: "+3.8%", up: true  },
    "Yeka":             { buy: "ETB 38,000",  rent: "ETB 145",  yield: "4.6%", trend: "+3.2%", up: true  },
  },
  land: {
    "All Districts":    { buy: "ETB 21,000",  rent: null, yield: "—", trend: "+8.2%", up: true  },
    "Bole":             { buy: "ETB 38,000",  rent: null, yield: "—", trend: "+10.5%", up: true },
    "Kazanchis":        { buy: "ETB 32,000",  rent: null, yield: "—", trend: "+9.8%",  up: true },
    "Sarbet":           { buy: "ETB 28,000",  rent: null, yield: "—", trend: "+8.9%",  up: true },
    "CMC":              { buy: "ETB 24,000",  rent: null, yield: "—", trend: "+7.5%",  up: true },
    "Megenagna":        { buy: "ETB 22,000",  rent: null, yield: "—", trend: "+7.0%",  up: true },
    "Piassa":           { buy: "ETB 19,000",  rent: null, yield: "—", trend: "+5.8%",  up: true },
    "Arada":            { buy: "ETB 17,000",  rent: null, yield: "—", trend: "+5.2%",  up: true },
    "Yeka":             { buy: "ETB 15,000",  rent: null, yield: "—", trend: "+4.5%",  up: true },
    "Nifas Silk-Lafto": { buy: "ETB 13,500",  rent: null, yield: "—", trend: "+4.0%",  up: true },
  },
};

const MICRO_FACTORS: Record<string, { score: number; label: string }[]> = {
  "Bole": [
    { score: 90, label: "Transport Links" },
    { score: 95, label: "Infrastructure" },
    { score: 60, label: "Green Space" },
    { score: 88, label: "Schools" },
    { score: 65, label: "Noise Level" },
  ],
  "Kazanchis": [
    { score: 88, label: "Transport Links" },
    { score: 92, label: "Infrastructure" },
    { score: 55, label: "Green Space" },
    { score: 85, label: "Schools" },
    { score: 62, label: "Noise Level" },
  ],
  "CMC": [
    { score: 72, label: "Transport Links" },
    { score: 78, label: "Infrastructure" },
    { score: 80, label: "Green Space" },
    { score: 82, label: "Schools" },
    { score: 78, label: "Noise Level" },
  ],
  "Piassa": [
    { score: 85, label: "Transport Links" },
    { score: 75, label: "Infrastructure" },
    { score: 50, label: "Green Space" },
    { score: 80, label: "Schools" },
    { score: 58, label: "Noise Level" },
  ],
  "Yeka": [
    { score: 68, label: "Transport Links" },
    { score: 70, label: "Infrastructure" },
    { score: 85, label: "Green Space" },
    { score: 78, label: "Schools" },
    { score: 82, label: "Noise Level" },
  ],
  "All Districts": [
    { score: 78, label: "Transport Links" },
    { score: 80, label: "Infrastructure" },
    { score: 65, label: "Green Space" },
    { score: 82, label: "Schools" },
    { score: 68, label: "Noise Level" },
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
  const [district, setDistrict] = useState("All Districts");
  const [usage,    setUsage]    = useState("residential");

  const stats = getStats(usage, district);
  const micro = getMicro(district);

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
              Addis Abeba Market Report
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
              Real estate market data by district &amp; usage type · Prices in ETB
            </p>
          </div>

          {/* District selector */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} style={selectStyle}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
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
            { label: "Price Trend (YoY)",   value: stats.trend, up: stats.up },
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
            subtitle: `Addis Abeba · ${district}`,
            chart: <PriceTrendChart usageType={usage} />,
          },
          {
            title: "Price by District",
            subtitle: `Addis Abeba · ${USAGE_TYPES.find(u => u.key === usage)?.label}`,
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

      {/* Micro-location + District table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Micro-Location Score */}
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 24,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Micro-Location Score</h2>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, marginBottom: 20 }}>{district} · Addis Abeba</p>
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

        {/* District table */}
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>District Overview</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              Addis Abeba · {USAGE_TYPES.find(u => u.key === usage)?.label} · ETB/m²
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
                {DISTRICTS.filter(d => d !== "All Districts").map((d) => {
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

      {/* Market Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          {
            tag: "Market Dynamics", tagColor: { bg: "rgba(124,110,242,0.1)", text: "var(--color-primary)", border: "rgba(124,110,242,0.2)" },
            title: "Strong Demand",
            body: "Demand for residential and commercial properties in Bole, Kazanchis, and Sarbet far exceeds supply. Prime listings in these districts sell within 3–4 weeks on average.",
          },
          {
            tag: "Price Outlook", tagColor: { bg: "rgba(48,209,88,0.1)", text: "var(--ok)", border: "rgba(48,209,88,0.2)" },
            title: "Rapid Appreciation",
            body: "Property prices in Addis Abeba have grown 6–10% year-over-year in 2025–26, driven by rapid urbanisation, infrastructure investment, and a growing middle class.",
          },
          {
            tag: "Rental Market", tagColor: { bg: "rgba(255,159,10,0.1)", text: "var(--warn)", border: "rgba(255,159,10,0.2)" },
            title: "Expat & Corporate Demand",
            body: "Bole and Kazanchis command the highest rental premiums, fuelled by expat and NGO demand. Gross rental yields of 3.8–4.6% make Addis Abeba attractive for buy-to-let investors.",
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
