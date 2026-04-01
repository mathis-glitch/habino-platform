"use client";

import { useState } from "react";
import { PriceTrendChart, DistrictChart } from "./MarktCharts";

// ── Light-mode design tokens (hardcoded — no CSS vars) ────────────────────────
const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  bgSoft2:  "#F0F2F0",
  border:   "rgba(0,0,0,0.07)",
  border2:  "rgba(0,0,0,0.10)",
  text1:    "#1A1A2E",
  text2:    "#6B7280",
  text3:    "#9CA3AF",
  primary:  "#2D6A4F",
  primaryD: "#1B4332",
  primaryL: "rgba(45,106,79,0.09)",
  ok:       "#34C759",
  warn:     "#FF9F0A",
  err:      "#FF453A",
  font:     "'Inter',-apple-system,sans-serif",
};

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
    "All Districts":    { buy: "ETB 21,000",  rent: null, yield: "—", trend: "+8.2%",  up: true },
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
  const color = score >= 85 ? T.ok : score >= 65 ? T.warn : T.err;
  return (
    <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", background: T.bgSoft2 }}>
      <div style={{ width: `${score}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.5s" }} />
    </div>
  );
}

const INSIGHT_TABS = [
  { key: "market",  label: "Market" },
  { key: "brokers", label: "Brokers" },
  { key: "blog",    label: "Blog" },
];

// Mock broker data
const BROKERS = [
  { id: "1", name: "Selam Tadesse", region: "Bole, Kazanchis", phone: "+251 91 234 5678", website: "habino.et/selam", specialty: "Luxury Residential", deals: 48, photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=face" },
  { id: "2", name: "Dawit Bekele",  region: "CMC, Yeka",        phone: "+251 92 345 6789", website: "habino.et/dawit",  specialty: "Commercial & Office",  deals: 36, photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&h=160&fit=crop&crop=face" },
  { id: "3", name: "Hana Girma",    region: "Sarbet, Lideta",   phone: "+251 93 456 7890", website: "habino.et/hana",  specialty: "Buy & Investment",     deals: 29, photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=face" },
  { id: "4", name: "Abel Mekonnen", region: "Piassa, Arada",    phone: "+251 94 567 8901", website: "habino.et/abel",  specialty: "Land & Plots",         deals: 54, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face" },
  { id: "5", name: "Tigist Haile",  region: "Megenagna, Bole",  phone: "+251 95 678 9012", website: "habino.et/tigist", specialty: "Expat & NGO Rentals", deals: 41, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face" },
  { id: "6", name: "Yonas Alemu",   region: "Nifas Silk-Lafto", phone: "+251 96 789 0123", website: "habino.et/yonas",  specialty: "New Developments",     deals: 22, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face" },
];

function BrokerCard({ broker }: { broker: typeof BROKERS[0] }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{
      background: T.bg,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: 16,
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    }}>
      {/* Avatar */}
      <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: T.bgSoft2 }}>
        {!imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={broker.photo} alt={broker.name} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            background: T.primaryL, color: T.primary, fontSize: 20, fontWeight: 700 }}>
            {broker.name[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text1, marginBottom: 2 }}>{broker.name}</div>
        <div style={{ fontSize: 12, color: T.text3, marginBottom: 6 }}>{broker.region}</div>
        <div style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 6,
          background: T.primaryL, color: T.primary, fontSize: 11, fontWeight: 600, marginBottom: 8,
        }}>
          {broker.specialty}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href={`tel:${broker.phone}`}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${T.border2}`,
              fontSize: 12, fontWeight: 600, color: T.text1, textAlign: "center", textDecoration: "none",
            }}>
            📞 Call
          </a>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "8px 12px", borderRadius: 10, background: T.primaryL,
            fontSize: 12, fontWeight: 600, color: T.primary,
          }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {broker.deals} deals
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsClient() {
  const [district, setDistrict] = useState("All Districts");
  const [usage,    setUsage]    = useState("residential");
  const [tab,      setTab]      = useState("market");

  const stats = getStats(usage, district);
  const micro = getMicro(district);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bgSoft, fontFamily: T.font, minHeight: 0 }}>

      {/* ── Header ── */}
      <div style={{ padding: "52px 20px 0", background: T.bg }}>
        <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.text1, letterSpacing: -0.6 }}>Insights</div>
          <div style={{
            padding: "3px 10px", borderRadius: 20, marginBottom: 2,
            background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.2)",
            color: T.warn, fontSize: 10, fontWeight: 600,
          }}>
            Addis Abeba
          </div>
        </div>
        <p style={{ fontSize: 13, color: T.text3, marginBottom: 16 }}>Real estate market data &amp; broker directory</p>

        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}` }}>
          {INSIGHT_TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 20px", border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              color: tab === t.key ? T.primary : T.text2,
              borderBottom: `2px solid ${tab === t.key ? T.primary : "transparent"}`,
              transition: "all 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Market tab ── */}
      {tab === "market" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              style={{
                flex: 1, minWidth: 140, padding: "9px 12px", borderRadius: 10,
                border: `1.5px solid ${T.border2}`, fontSize: 13, fontWeight: 500,
                color: T.text1, background: T.bg, outline: "none", cursor: "pointer",
              }}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>

            {/* Usage type pills */}
            <div style={{ display: "flex", background: T.bgSoft2, borderRadius: 10, padding: 3, gap: 2 }}>
              {USAGE_TYPES.map((u) => (
                <button key={u.key} onClick={() => setUsage(u.key)} style={{
                  padding: "6px 12px", borderRadius: 7,
                  fontSize: 12, fontWeight: 600,
                  background: usage === u.key ? T.bg : "transparent",
                  color: usage === u.key ? T.text1 : T.text2,
                  boxShadow: usage === u.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  border: "none", cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
                }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Avg. Sale/m²",     value: stats.buy,   up: undefined },
                ...(stats.rent ? [{ label: "Avg. Rent/m²/mo", value: stats.rent, up: undefined }] : []),
                { label: "Gross Yield",       value: stats.yield, up: undefined },
                { label: "Price Trend (YoY)", value: stats.trend, up: stats.up },
              ].map(({ label, value, up }) => (
                <div key={label} style={{
                  background: T.bg, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: "14px 16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    {label}
                  </p>
                  <p style={{
                    fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em",
                    color: up !== undefined ? (up ? T.ok : T.err) : T.text1,
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: "0 0 4px" }}>Price Trend — 12 months</h2>
            <p style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>Addis Abeba · {district}</p>
            <PriceTrendChart usageType={usage} />
          </div>

          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: "0 0 4px" }}>Price by District</h2>
            <p style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>
              {USAGE_TYPES.find(u => u.key === usage)?.label} · ETB/m²
            </p>
            <DistrictChart usageType={usage} />
          </div>

          {/* Micro-Location Score */}
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: "0 0 4px" }}>Micro-Location Score</h2>
            <p style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>{district} · Addis Abeba</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {micro.map(({ score, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: T.text2, width: 120, flexShrink: 0 }}>{label}</span>
                  <ScoreBar score={score} />
                  <span style={{
                    fontSize: 12, fontWeight: 700, width: 26, textAlign: "right", flexShrink: 0,
                    color: score >= 85 ? T.ok : score >= 65 ? T.warn : T.err,
                  }}>{score}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: T.text3, marginTop: 12 }}>* Scores 0–100 based on OpenStreetMap data</p>
          </div>

          {/* District table */}
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: 0 }}>District Overview</h2>
              <p style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
                {USAGE_TYPES.find(u => u.key === usage)?.label} · ETB/m²
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.bgSoft }}>
                    {["District", "Sale/m²", ...(usage !== "land" ? ["Rent/m²"] : []), "Trend"].map((h) => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: h === "District" ? "left" : "right",
                        fontSize: 10, fontWeight: 600, color: T.text3,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>{h}</th>
                    ))}
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
                          background: isActive ? T.primaryL : "transparent",
                          borderBottom: `1px solid ${T.border}`,
                        }}>
                        <td style={{ padding: "10px 12px", fontWeight: isActive ? 700 : 400, color: isActive ? T.primary : T.text1 }}>
                          {isActive && <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: T.primary, marginRight: 6, verticalAlign: "middle" }} />}
                          {d}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: T.text2, fontSize: 12 }}>{s.buy}</td>
                        {usage !== "land" && <td style={{ padding: "10px 12px", textAlign: "right", color: T.text2, fontSize: 12 }}>{s.rent}</td>}
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: s.up ? T.ok : T.err }}>{s.trend}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Market Insights cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                tag: "Market Dynamics",
                tagBg: T.primaryL, tagColor: T.primary, tagBorder: "rgba(45,106,79,0.2)",
                title: "Strong Demand",
                body: "Demand for residential and commercial properties in Bole, Kazanchis, and Sarbet far exceeds supply. Prime listings sell within 3–4 weeks on average.",
              },
              {
                tag: "Price Outlook",
                tagBg: "rgba(52,199,89,0.1)", tagColor: T.ok, tagBorder: "rgba(52,199,89,0.2)",
                title: "Rapid Appreciation",
                body: "Property prices have grown 6–10% YoY in 2025–26, driven by urbanisation, infrastructure investment, and a growing middle class.",
              },
              {
                tag: "Rental Market",
                tagBg: "rgba(255,159,10,0.1)", tagColor: T.warn, tagBorder: "rgba(255,159,10,0.2)",
                title: "Expat & Corporate Demand",
                body: "Bole and Kazanchis command the highest rental premiums, fuelled by expat and NGO demand. Gross yields of 3.8–4.6% make Addis attractive for buy-to-let.",
              },
            ].map(({ tag, tagBg, tagColor, tagBorder, title, body }) => (
              <div key={title} style={{
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: 16,
              }}>
                <span style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 20, marginBottom: 10,
                  fontSize: 11, fontWeight: 600,
                  background: tagBg, color: tagColor, border: `1px solid ${tagBorder}`,
                }}>{tag}</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: T.text3, textAlign: "center" }}>
            * All figures are indicative estimates. Live GIS data coming soon.
          </p>
        </div>
      )}

      {/* ── Blog tab ── */}
      {tab === "blog" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: T.text2, margin: "0 0 4px" }}>Real estate insights for Addis Abeba</p>
          {[
            {
              tag: "Market Analysis",
              tagColor: T.primary,
              date: "Apr 1, 2026",
              title: "Bole Real Estate: Why Prices Are Rising 10% Per Year",
              excerpt: "Bole remains the most sought-after district for both residential and commercial properties. We break down the key drivers behind the district's sustained price growth and what it means for investors.",
              readTime: "4 min read",
              img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=220&fit=crop",
            },
            {
              tag: "Investment Guide",
              tagColor: "#FF9F0A",
              date: "Mar 28, 2026",
              title: "Buy-to-Let in Addis Abeba: A Complete Guide for 2026",
              excerpt: "Gross rental yields of 3.8–4.6% make Addis Abeba one of East Africa's most attractive buy-to-let markets. Here's everything you need to know before investing.",
              readTime: "7 min read",
              img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=220&fit=crop",
            },
            {
              tag: "Neighbourhood Guide",
              tagColor: "#34C759",
              date: "Mar 22, 2026",
              title: "CMC vs Yeka: Which District is Best for Families?",
              excerpt: "Both CMC and Yeka offer more green space and quieter streets compared to Bole. We compare schools, transport, amenities and property prices to help you decide.",
              readTime: "5 min read",
              img: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400&h=220&fit=crop",
            },
            {
              tag: "Legal & Finance",
              tagColor: "#6366f1",
              date: "Mar 15, 2026",
              title: "How to Finance a Property Purchase in Ethiopia",
              excerpt: "Understanding the Ethiopian mortgage market, available loan products, and what foreign buyers need to know before purchasing real estate in Addis Abeba.",
              readTime: "6 min read",
              img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=220&fit=crop",
            },
          ].map((article, i) => (
            <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {/* Article image */}
              <div style={{ position: "relative", height: 160, background: T.bgSoft2, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.img} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", top: 12, left: 12,
                  padding: "3px 10px", borderRadius: 20,
                  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                  fontSize: 11, fontWeight: 700, color: article.tagColor,
                }}>
                  {article.tag}
                </div>
              </div>
              <div style={{ padding: "14px 16px 18px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 11, color: T.text3 }}>
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text1, lineHeight: 1.4, marginBottom: 8 }}>
                  {article.title}
                </h3>
                <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 14 }}>
                  {article.excerpt}
                </p>
                <button style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: `1.5px solid ${T.border2}`,
                  background: "transparent", color: T.primary,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                }}>
                  Read more →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Brokers tab ── */}
      {tab === "brokers" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: T.text2, margin: "0 0 4px" }}>Verified brokers in Addis Abeba</p>
          {BROKERS.map((b) => <BrokerCard key={b.id} broker={b} />)}
        </div>
      )}
    </div>
  );
}
