"use client";

import React, { useState, useEffect, Component } from "react";
import { PriceTrendChart, DistrictChart } from "./MarktCharts";
import { AIPanel } from "@/components/chat/AIPanel";

// ── Error Boundary — catches render crashes in broker list ────────────────────
class BrokerErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>
            Could not load brokers
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "#2D6A4F", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  { key: "blog",    label: "Blog"   },
  { key: "brokers", label: "Broker" },
  { key: "market",  label: "Market" },
];

// Fallback broker data (used while DB loads)
type DbBroker = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  agency: string | null;
  verified: boolean;
  rating: number | null;
  districts: string[] | null;
  speciality: string[] | null;  // text[] in DB
  years_exp: number | null;     // column is years_exp in DB
  listings_count: number | null;
  phone: string | null;
};

// ── Gender detection ──────────────────────────────────────────────────────────
const FEMALE_NAMES = new Set([
  "selam","hana","tigist","meron","makda","eden","liya","selamawit","mihret","yeshi",
  "almaz","hiwot","bethlehem","rahel","sara","sofia","grace","aisha","fatima","amina",
  "abeba","chaltu","dagne","fikerte","genet","hirut","kedist","lemlem","mekdes","nigest",
  "rediet","senait","tirhas","winta","zewditu","haben","lidat","saron","tsion","yordanos",
]);
function isFemale(name: string): boolean {
  return FEMALE_NAMES.has((name || "").trim().split(" ")[0].toLowerCase());
}

function getBadges(b: DbBroker): string[] {
  const out: string[] = [];
  if (b.verified) out.push("Verified");
  if (Number(b.rating ?? 0) >= 4.8) out.push("Top Rated");
  const yrs = b.years_exp ?? 0;
  if (yrs >= 7) out.push("Senior Expert");
  else if (yrs >= 3) out.push("Experienced");
  const specArr = Array.isArray(b.speciality) ? b.speciality : [];
  const spec = specArr.join(" ").toLowerCase();
  if (spec.includes("luxury")) out.push("Luxury");
  if (spec.includes("commercial")) out.push("Commercial");
  if (spec.includes("land") || spec.includes("plot")) out.push("Land");
  if (spec.includes("expat")) out.push("Expat");
  if ((b.listings_count ?? 0) >= 30) out.push("High Volume");
  return out.slice(0, 3);
}

const USAGE_MAP: Record<string, string> = {
  "Luxury Residential": "Residential · Luxury",
  "Commercial & Office": "Commercial · Office",
  "Buy & Investment": "Investment · Buy",
  "Land & Plots": "Land · Plots",
  "Expat & NGO Rentals": "Rental · Expat",
  "New Developments": "New Build · Off-Plan",
  "Residential Sales": "Residential · Sales",
  "Property Management": "Management · Rental",
};

// ── Addis districts for NLP parsing ──────────────────────────────────────────
const KNOWN_DISTRICTS = [
  "bole","cmc","kazanchis","sarbet","megenagna","piassa","yeka","lideta","arada",
  "kirkos","kolfe","gulele","nifas silk","summit","gerji","ayat","jemo","saris",
  "lebu","gofa","akaki","kality","lafto","ferensay",
];

// ── Smart NLP broker filter ───────────────────────────────────────────────────
function smartFilterBrokers(query: string, districts: string[], brokers: DbBroker[]): DbBroker[] {
  const q = query.toLowerCase().trim();

  // District chip filter — ANY selected district must appear in broker's districts
  const regionFiltered = districts.length === 0
    ? brokers
    : brokers.filter(b => {
        const dists = Array.isArray(b.districts) ? b.districts.join(" ").toLowerCase() : "";
        return districts.some(d => dists.includes(d.toLowerCase()));
      });

  if (!q) return regionFiltered;

  // ── Parse structured constraints ─────────────────────────────────────────
  // "5+ years", "5 years", "min 5 years"
  const yearMatch  = q.match(/(\d+)\+?\s*y(?:ear|r)?s?/);
  const minYears   = yearMatch ? parseInt(yearMatch[1]) : null;

  // "4.5+ rating", "above 4", "over 4 stars"
  const ratingMatch = q.match(/(\d+\.?\d*)\+?\s*(?:rating|stars?)/);
  const minRating   = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  // "top rated", "best", "highest rated"
  const wantsTopRated = /top[\s-]?rated|best|highest/.test(q);

  // "verified"
  const wantsVerified = q.includes("verified");

  // Speciality keywords → map to DB values
  const specMap: Record<string, string[]> = {
    luxury:     ["luxury", "luxus"],
    commercial: ["commercial", "office", "büro"],
    land:       ["land", "plot", "grundstück"],
    expat:      ["expat", "ngo", "diplomat"],
    rental:     ["rent", "rental", "miete"],
    newdev:     ["new", "development", "off-plan", "neubau"],
    management: ["management", "manage", "verwalt"],
    invest:     ["invest"],
    residential:["residential", "apartment", "house", "villa", "wohn"],
  };

  const wantedSpecs = Object.entries(specMap)
    .filter(([, kws]) => kws.some(kw => q.includes(kw)))
    .map(([key]) => key);

  // Mentioned districts in query
  const mentionedDistricts = KNOWN_DISTRICTS.filter(d => q.includes(d));

  // Words left for general text search (remove parsed terms)
  const stopWords = new Set([
    // parsed intent words
    "years","year","yrs","yr","experience","exp","rating","stars","star",
    "top","rated","best","highest","verified","luxury","commercial","office",
    "land","plot","expat","ngo","rental","rent","new","development","management",
    "invest","residential","apartment","house","villa","broker","agent",
    "specialist","expert","years+",
    // location prepositions
    "near","around","close","nearby","in","at","for","the","and","with","from",
    "who","has","have","that","which","a","an","is","are","was","were","be",
    "me","my","please","show","find","looking","want","need","give","get",
    "more","than","plus","minimum","min","max","about","can","you","do",
    // German
    "über","mit","für","von","und","suche","zeige","habe","gute","sehr",
    ...KNOWN_DISTRICTS,
  ]);
  const freeWords = q.split(/[\s,+]+/)
    .map(w => w.replace(/[^a-z0-9äöü]/g, ""))
    .filter(w => w.length > 2 && !stopWords.has(w));

  return regionFiltered.filter(b => {
    const spec   = Array.isArray(b.speciality) ? b.speciality.join(" ").toLowerCase() : "";
    const dists  = Array.isArray(b.districts)  ? b.districts.join(" ").toLowerCase()  : "";
    const name   = String(b.full_name ?? "").toLowerCase();
    const agency = String(b.agency    ?? "").toLowerCase();
    const allText = `${name} ${agency} ${spec} ${dists}`;

    // Hard filters first (fast exit)
    if (minYears   !== null && (b.years_exp  ?? 0) < minYears)          return false;
    if (minRating  !== null && Number(b.rating ?? 0) < minRating)        return false;
    if (wantsVerified && !b.verified)                                     return false;
    if (wantsTopRated && Number(b.rating ?? 0) < 4.5)                    return false;

    // Speciality match — ALL wanted specs must match somewhere
    for (const wanted of wantedSpecs) {
      const kws = specMap[wanted];
      if (!kws.some(kw => spec.includes(kw) || agency.includes(kw))) return false;
    }

    // District match — ANY mentioned district must appear in broker's districts
    if (mentionedDistricts.length > 0) {
      if (!mentionedDistricts.some(d => dists.includes(d))) return false;
    }

    // Free-word search — all remaining words must appear somewhere
    if (freeWords.length > 0) {
      if (!freeWords.every(w => allText.includes(w))) return false;
    }

    return true;
  });
}

// ── Broker Card ───────────────────────────────────────────────────────────────
function BrokerCard({ broker }: { broker: DbBroker }) {
  const name    = broker.full_name || "Agent";
  const female  = isFemale(name);
  const deals   = broker.listings_count ?? 0;
  const rating  = broker.rating != null ? Number(broker.rating) : null;
  const badges  = getBadges(broker);
  const specArr = Array.isArray(broker.speciality) ? broker.speciality : [];
  const usageLabel = specArr.length > 0
    ? (USAGE_MAP[specArr[0]] ?? specArr[0])
    : null;
  const districts = Array.isArray(broker.districts) ? broker.districts.slice(0, 3) : [];
  const accentColor = female ? "#9B7EC8" : T.primary;
  const avatarBg    = female ? "#EDE8F0" : "#E8EDF0";
  const avatarFg    = female ? "#C4B8D4" : "#C4CDD4";
  const initials    = name.split(" ").map((n: string) => n[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <a href={`/brokers/${broker.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: T.bg, border: `1px solid ${T.border}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        <div style={{ height: 3, background: accentColor }} />
        <div style={{ padding: "14px 16px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>

          {/* Avatar placeholder */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: avatarFg }}>{initials}</div>
            {broker.verified && (
              <div style={{
                position: "absolute", bottom: -3, right: -3,
                width: 16, height: 16, borderRadius: "50%",
                background: accentColor, border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text1, marginBottom: 2 }}>{name}</div>
            {broker.agency && (
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 6 }}>{broker.agency}</div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                {badges.map(badge => (
                  <span key={badge} style={{
                    padding: "2px 7px", borderRadius: 6,
                    fontSize: 10, fontWeight: 700,
                    color: accentColor, background: female ? "#EDE9FE" : T.primaryL,
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Usage label */}
            {usageLabel && (
              <div style={{ fontSize: 11, color: T.text2, marginBottom: 5 }}>{usageLabel}</div>
            )}

            {/* Districts */}
            {districts.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                {districts.map((r: string) => (
                  <span key={r} style={{
                    padding: "2px 8px", borderRadius: 6,
                    fontSize: 10, fontWeight: 600,
                    color: accentColor, background: female ? "#EDE9FE" : T.primaryL,
                  }}>
                    {r}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {rating !== null && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>
                  ★ {rating.toFixed(1)}
                </span>
              )}
              <span style={{ fontSize: 12, color: T.text2 }}>{deals} listings</span>
              {(broker.years_exp ?? 0) > 0 && (
                <span style={{ fontSize: 12, color: T.text3 }}>{broker.years_exp}y exp</span>
              )}
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: accentColor }}>
                View →
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function InsightsClient() {
  const [district, setDistrict] = useState("All Districts");
  const [usage,    setUsage]    = useState("residential");
  const [tab,      setTab]      = useState("blog");
  const [brokers,      setBrokers]      = useState<DbBroker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(false);
  const [brokerPage,   setBrokerPage]   = useState(1);
  const [brokerTotal,  setBrokerTotal]  = useState(0);
  const [brokerSearch,      setBrokerSearch]      = useState("");
  const [brokerDistricts,   setBrokerDistricts]   = useState<string[]>([]);
  const [brokerSpecialities,setBrokerSpecialities] = useState<string[]>([]);
  const [showBrokerFilters, setShowBrokerFilters] = useState(false);
  const [bFilterVerified,   setBFilterVerified]   = useState(false);
  const [bFilterMinYears,   setBFilterMinYears]   = useState<number | null>(null);
  const [bFilterMinRating,  setBFilterMinRating]  = useState<number | null>(null);
  const [brokerAiIds,       setBrokerAiIds]       = useState<string[] | null>(null);
  const [brokerAiLoading,   setBrokerAiLoading]   = useState(false);
  const [brokerAiSuggestion,setBrokerAiSuggestion] = useState<string | null>(null);
  const BROKER_LIMIT = 20;

  const AI_SUGGESTIONS = [
    "Luxury specialist in Bole",
    "Commercial broker CMC",
    "5+ years experience",
    "Top rated rental agent",
    "Land & plots specialist",
    "Verified broker Kazanchis",
  ];

  const BROKER_DISTRICTS = [
    "Bole", "CMC", "Kazanchis", "Sarbet", "Megenagna", "Piassa",
    "Yeka", "Lideta", "Arada", "Kirkos", "Kolfe", "Nifas Silk", "Gulele",
  ];
  const BROKER_SPEC_CHIPS = [
    { key: "residential", label: "Residential" },
    { key: "commercial",  label: "Commercial"  },
    { key: "land",        label: "Land"        },
    { key: "expat",       label: "Expat / NGO" },
    { key: "rental",      label: "Rental"      },
    { key: "invest",      label: "Investment"  },
  ];

  useEffect(() => {
    if (tab !== "brokers") return;
    setBrokersLoading(true);
    fetch(`/api/brokers?limit=${BROKER_LIMIT}&page=${brokerPage}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data) {
          setBrokers(prev => brokerPage === 1 ? d.data : [...prev, ...d.data]);
          setBrokerTotal(d.total ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setBrokersLoading(false));
  }, [tab, brokerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = getStats(usage, district);
  const micro = getMicro(district);

  // Apply speciality chip filter after smartFilterBrokers (which handles search + district)
  const SPEC_TERMS: Record<string, string[]> = {
    residential: ["residential","apartment","house","villa","wohn"],
    commercial:  ["commercial","office"],
    land:        ["land","plot","grundstück"],
    expat:       ["expat","ngo","diplomat","embassy"],
    rental:      ["rent","rental","miete"],
    invest:      ["invest"],
  };

  const filteredBrokers = (() => {
    // Pass multi-select districts as the "region" — smartFilterBrokers now accepts array
    const bySearch = smartFilterBrokers(brokerSearch, brokerDistricts, brokers);
    return bySearch.filter(b => {
      const spec = Array.isArray(b.speciality) ? b.speciality.join(" ").toLowerCase() : "";
      // Speciality chip filter (ANY selected speciality must match)
      if (brokerSpecialities.length > 0) {
        const matches = brokerSpecialities.some(s => SPEC_TERMS[s]?.some(t => spec.includes(t)));
        if (!matches) return false;
      }
      // Hard filter panel values
      if (bFilterVerified && !b.verified) return false;
      if (bFilterMinYears !== null && (b.years_exp ?? 0) < bFilterMinYears) return false;
      if (bFilterMinRating !== null && Number(b.rating ?? 0) < bFilterMinRating) return false;
      return true;
    });
  })();

  // If AI returned ranked IDs, reorder filteredBrokers by those IDs
  const displayBrokers = brokerAiIds
    ? [
        ...brokerAiIds
          .map(id => filteredBrokers.find(b => String(b.id) === id))
          .filter((b): b is DbBroker => !!b),
        ...filteredBrokers.filter(b => !brokerAiIds.includes(String(b.id))),
      ]
    : filteredBrokers;

  async function handleBrokerAISearch(query: string) {
    if (!query.trim() || brokers.length === 0) return;
    setBrokerAiLoading(true);
    setBrokerAiIds(null);
    setBrokerAiSuggestion(null);
    try {
      const items = filteredBrokers.map(b => ({
        id:             b.id,
        name:           b.full_name,
        agency:         b.agency,
        speciality:     Array.isArray(b.speciality) ? b.speciality : [],
        districts:      Array.isArray(b.districts)  ? b.districts  : [],
        years_exp:      b.years_exp,
        rating:         b.rating != null ? Number(b.rating) : null,
        verified:       b.verified,
        listings_count: b.listings_count,
      }));
      const res  = await fetch("/api/ai-search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query, type: "broker", items }),
      });
      const data = await res.json();
      if (data.matchIds?.length > 0) setBrokerAiIds(data.matchIds);
      if (data.suggestion)           setBrokerAiSuggestion(data.suggestion);
    } catch { /* silent fallback */ }
    finally  { setBrokerAiLoading(false); }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bgSoft, fontFamily: T.font, minHeight: 0 }}>
      {/* ── Header ── */}
      <div style={{ padding: "52px 20px 0", background: T.bg }}>
        {/* Habino logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill={T.primary} />
            <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, letterSpacing: -0.5, fontFamily: T.font }}>habino</span>
          <div style={{
            marginLeft: 4, padding: "3px 10px", borderRadius: 20,
            background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.2)",
            color: T.warn, fontSize: 10, fontWeight: 600,
          }}>
            Insights
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
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

            {/* ── AI Search Panel ── */}
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ marginBottom: 12 }}>
                <AIPanel
                  title="AI Broker Finder"
                  subtitle="Type to filter · Press Enter for AI ranking"
                  placeholder="e.g. Luxury specialist in Bole with 5+ years…"
                  suggestions={[]}
                  onSearch={q => { setBrokerSearch(q); if (!q) { setBrokerAiIds(null); setBrokerAiSuggestion(null); } }}
                  onSubmit={handleBrokerAISearch}
                  onClear={() => { setBrokerSearch(""); setBrokerAiIds(null); setBrokerAiSuggestion(null); }}
                  resultCount={displayBrokers.length}
                  aiLoading={brokerAiLoading}
                  aiSuggestion={brokerAiSuggestion}
                />
              </div>

              {/* ── Chips (mixed: speciality + districts together) ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {/* Speciality chips */}
                  {BROKER_SPEC_CHIPS.map(chip => {
                    const active = brokerSpecialities.includes(chip.key);
                    return (
                      <button key={chip.key}
                        onClick={() => setBrokerSpecialities(prev => active ? prev.filter(s => s !== chip.key) : [...prev, chip.key])}
                        style={{
                          padding: "7px 12px", borderRadius: 20,
                          border: `1.5px solid ${active ? T.primary : T.border2}`,
                          background: active ? T.primaryL : T.bg,
                          color: active ? T.primary : T.text2,
                          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
                        }}>
                        {chip.label}
                      </button>
                    );
                  })}
                  {/* District chips — inline with speciality */}
                  {BROKER_DISTRICTS.map(d => {
                    const active = brokerDistricts.includes(d);
                    return (
                      <button key={d}
                        onClick={() => setBrokerDistricts(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                        style={{
                          padding: "6px 11px", borderRadius: 20,
                          border: `1.5px solid ${active ? T.primary : T.border2}`,
                          background: active ? T.primaryL : T.bg,
                          color: active ? T.primary : T.text2,
                          fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
                        }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Result count + Filter + Reset ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <p style={{ flex: 1, fontSize: 12, color: T.text3, margin: 0 }}>
                  {brokers.length === 0 ? "Loading brokers…"
                    : `${filteredBrokers.length} broker${filteredBrokers.length !== 1 ? "s" : ""} found`
                      + (brokerSearch || brokerDistricts.length || brokerSpecialities.length || bFilterVerified || bFilterMinYears || bFilterMinRating ? " · filtered" : ` of ${brokerTotal}`)}
                </p>
                {/* Filter button */}
                {(() => {
                  const hasF = bFilterVerified || bFilterMinYears !== null || bFilterMinRating !== null;
                  return (
                    <button onClick={() => setShowBrokerFilters(true)} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 12px", borderRadius: 10,
                      border: `1.5px solid ${hasF ? T.primary : T.border2}`,
                      background: hasF ? T.primaryL : T.bg,
                      color: hasF ? T.primary : T.text2,
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                    }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
                      </svg>
                      Filter{hasF ? " ●" : ""}
                    </button>
                  );
                })()}
                {/* Reset button */}
                {(brokerSearch || brokerDistricts.length > 0 || brokerSpecialities.length > 0 || bFilterVerified || bFilterMinYears || bFilterMinRating || brokerAiIds) && (
                  <button onClick={() => {
                    setBrokerSearch(""); setBrokerDistricts([]); setBrokerSpecialities([]);
                    setBFilterVerified(false); setBFilterMinYears(null); setBFilterMinRating(null);
                    setBrokerAiIds(null); setBrokerAiSuggestion(null);
                  }} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "7px 10px", borderRadius: 10,
                    border: "1.5px solid rgba(255,69,58,0.25)", background: "rgba(255,69,58,0.06)",
                    color: T.err, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                  }}>
                    ✕ Reset
                  </button>
                )}
              </div>
            </div>

            {/* Broker list */}
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {brokers.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ height: 130, borderRadius: 18, background: T.bgSoft2 }} />
                ))
              ) : displayBrokers.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 6 }}>No brokers found</div>
                  <div style={{ fontSize: 13, color: T.text2 }}>Try a different search or press Enter for AI search</div>
                </div>
              ) : (
                <BrokerErrorBoundary>
                  {displayBrokers.map(b => <BrokerCard key={b.id ?? Math.random()} broker={b} />)}
                </BrokerErrorBoundary>
              )}
            </div>

            {/* Load more */}
            {!brokersLoading && !brokerSearch && brokerDistricts.length === 0 && brokers.length < brokerTotal && (
              <div style={{ padding: "12px 16px" }}>
                <button onClick={() => setBrokerPage(p => p + 1)}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 12,
                    border: `1.5px solid ${T.border2}`,
                    background: T.bg, color: T.primary,
                    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                  }}>
                  Load more ({brokerTotal - brokers.length} remaining)
                </button>
              </div>
            )}
            {brokersLoading && brokers.length > 0 && (
              <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: T.text3 }}>Loading…</div>
            )}

            {/* ── Broker Filter Panel overlay ── */}
            {showBrokerFilters && (
              <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end" }}
                onClick={() => setShowBrokerFilters(false)}>
                <div style={{ background: T.bg, borderRadius: "24px 24px 0 0", padding: "8px 20px 40px", width: "100%", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", fontFamily: T.font }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 20px" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text1 }}>Broker Filter</div>
                    <button onClick={() => { setBFilterVerified(false); setBFilterMinYears(null); setBFilterMinRating(null); }}
                      style={{ fontSize: 13, fontWeight: 600, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>
                      Reset all
                    </button>
                  </div>
                  {/* Verified */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 10 }}>Verification</div>
                    <button onClick={() => setBFilterVerified(v => !v)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${bFilterVerified ? T.primary : T.border2}`,
                      background: bFilterVerified ? T.primaryL : T.bg,
                      color: bFilterVerified ? T.primary : T.text1,
                      fontSize: 13, fontWeight: 600, fontFamily: T.font,
                    }}>
                      <span>{bFilterVerified ? "✓" : "○"}</span> Verified brokers only
                    </button>
                  </div>
                  {/* Min years experience */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 10 }}>Min. Years Experience</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[null, 1, 3, 5, 7, 10].map(y => (
                        <button key={String(y)} onClick={() => setBFilterMinYears(y)} style={{
                          padding: "8px 14px", borderRadius: 20,
                          border: `1.5px solid ${bFilterMinYears === y ? T.primary : T.border2}`,
                          background: bFilterMinYears === y ? T.primaryL : T.bg,
                          color: bFilterMinYears === y ? T.primary : T.text1,
                          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                        }}>
                          {y === null ? "Any" : `${y}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Min rating */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 10 }}>Min. Rating</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[null, 4.0, 4.5, 4.8].map(r => (
                        <button key={String(r)} onClick={() => setBFilterMinRating(r)} style={{
                          flex: 1, padding: "9px 0", borderRadius: 12,
                          border: `1.5px solid ${bFilterMinRating === r ? T.primary : T.border2}`,
                          background: bFilterMinRating === r ? T.primaryL : T.bg,
                          color: bFilterMinRating === r ? T.primary : T.text1,
                          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                        }}>
                          {r === null ? "Any" : `★ ${r}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowBrokerFilters(false)} style={{
                    width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                    background: T.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                  }}>
                    Show {filteredBrokers.length} broker{filteredBrokers.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            )}
          </div>
      )}
    </div>
  );
}
