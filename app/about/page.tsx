import Link from "next/link";

export const metadata = { title: "About — Habino" };

const STATS = [
  { value: "12,400+", label: "Active Listings" },
  { value: "5",       label: "Cities" },
  { value: "38,000+", label: "Registered Users" },
  { value: "2022",    label: "Founded" },
];

const VALUES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Transparency",
    desc: "No hidden fees. No fake listings. Every property is what it says it is.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: "Speed",
    desc: "From first search to signed contract in days, not weeks.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: "Trust",
    desc: "Verified landlords, reviewed contracts, and data security you can rely on.",
  },
];

const WHAT_WE_DO = [
  { label: "AI property search",   desc: "Describe what you need — we find it instantly." },
  { label: "Interactive map",      desc: "Browse listings live on an interactive map." },
  { label: "Direct agent contact", desc: "Connect via WhatsApp — no middlemen." },
  { label: "Smart listings",       desc: "List your property in minutes with AI assistance." },
  { label: "Digital contracts",    desc: "Generate rental contracts with a guided AI wizard." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Sticky top bar ──────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">About Habino</span>
      </div>

      {/* ── Hero ────────────────────────────────────────── */}
      <div
        className="px-5 pt-12 pb-14 flex flex-col items-center text-center gap-4"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #1a5c2c 100%)" }}
      >
        {/* Logo mark */}
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center text-[24px] font-black text-white border border-white/20"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
        >
          H
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-white leading-tight">Habino</h1>
          <p className="text-[15px] text-white/75 mt-1.5 max-w-xs leading-relaxed">
            {"East Africa's AI-powered real estate platform — making property search simple and trustworthy."}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">

        {/* ── Stats row ───────────────────────────────── */}
        <div
          className="grid grid-cols-4 bg-white rounded-2xl border border-slate-200 overflow-hidden -mt-6 mb-5"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center py-4 px-2 text-center ${i < STATS.length - 1 ? "border-r border-slate-100" : ""}`}
            >
              <span className="text-[18px] font-bold text-slate-900 leading-tight">{s.value}</span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5 leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Mission ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3">Our Mission</p>
          <p className="text-[15px] text-slate-600 leading-relaxed">
            We believe finding a home should be straightforward — not stressful.
            Habino combines AI-powered search, real-time listings, and direct agent connections
            so every person in East Africa can access the best property options on the market.
          </p>
        </div>

        {/* ── Values ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
              >
                {v.icon}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{v.title}</p>
                <p className="text-[12px] text-slate-400 mt-0.5 leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── What we do ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">What We Do</p>
          </div>
          <div className="divide-y divide-slate-100">
            {WHAT_WE_DO.map((item) => (
              <div key={item.label} className="px-5 py-3.5 flex justify-between items-center gap-4">
                <span className="text-[14px] font-medium text-slate-800">{item.label}</span>
                <span className="text-[13px] text-slate-400 text-right">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">Contact</p>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="px-5 py-3.5 flex justify-between items-center">
              <span className="text-[13px] text-slate-400">Email</span>
              <a href="mailto:contact@habino.com" className="text-[14px] font-medium text-slate-700 hover:underline">contact@habino.com</a>
            </div>
            <div className="px-5 py-3.5 flex justify-between items-center">
              <span className="text-[13px] text-slate-400">Location</span>
              <span className="text-[14px] font-medium text-slate-700">Addis Ababa, Ethiopia</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
