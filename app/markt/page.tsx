import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PriceTrendChart, RentTrendChart, StadtteilChart } from "./MarktCharts";

// ── Placeholder data (swap with real DB queries later) ───────────────────────
const STATS = [
  {
    label:   "Ø Kaufpreis/m²",
    value:   "4.720 €",
    change:  "+2,8 %",
    up:      true,
    sub:     "Gegenüber Vormonat",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label:   "Ø Mietpreis/m²",
    value:   "16,30 €",
    change:  "+1,9 %",
    up:      true,
    sub:     "Gegenüber Vormonat",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    label:   "Aktive Inserate",
    value:   "1.284",
    change:  "-3,1 %",
    up:      false,
    sub:     "Weniger Angebot als Vormonat",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    label:   "Ø Verweildauer",
    value:   "24 Tage",
    change:  "-2 Tage",
    up:      true,
    sub:     "Schneller als Vormonat",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const TOP_LAGEN = [
  { stadtteil: "Mitte / HafenCity",  typ: "Kaufen",  preis: "6.200 €/m²", trend: "+4,1 %",  up: true },
  { stadtteil: "Altona / Ottensen",  typ: "Kaufen",  preis: "5.800 €/m²", trend: "+3,2 %",  up: true },
  { stadtteil: "Eimsbüttel",         typ: "Kaufen",  preis: "5.500 €/m²", trend: "+2,9 %",  up: true },
  { stadtteil: "Hamburg-Nord",       typ: "Kaufen",  preis: "5.100 €/m²", trend: "+1,8 %",  up: true },
  { stadtteil: "Wandsbek",           typ: "Kaufen",  preis: "4.200 €/m²", trend: "+0,9 %",  up: true },
  { stadtteil: "Harburg",            typ: "Kaufen",  preis: "3.200 €/m²", trend: "-0,4 %",  up: false },
  { stadtteil: "Altona",             typ: "Mieten",  preis: "18,50 €/m²", trend: "+2,2 %",  up: true },
  { stadtteil: "Eimsbüttel",         typ: "Mieten",  preis: "17,80 €/m²", trend: "+1,9 %",  up: true },
];

export default function MarktPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">

        {/* Hero */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Beispieldaten · werden durch Echtdaten ersetzt
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Marktbericht Hamburg</h1>
                <p className="text-slate-500 mt-1">Stand: März 2026 · Wohn­immobilien</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ label, value, change, up, sub, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    {icon}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                <p className="text-xs text-slate-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Kaufpreis Trend */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="mb-4">
                <h2 className="font-semibold text-slate-800">Kaufpreisentwicklung</h2>
                <p className="text-xs text-slate-400 mt-0.5">€/m² · letzte 12 Monate</p>
              </div>
              <PriceTrendChart />
            </div>

            {/* Mietpreis Trend */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="mb-4">
                <h2 className="font-semibold text-slate-800">Mietpreisentwicklung</h2>
                <p className="text-xs text-slate-400 mt-0.5">€/m² · letzte 12 Monate</p>
              </div>
              <RentTrendChart />
            </div>
          </div>

          {/* Stadtteil chart + table */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="mb-4">
                <h2 className="font-semibold text-slate-800">Kaufpreis nach Stadtteil</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ø €/m²</p>
              </div>
              <StadtteilChart />
            </div>

            {/* Top-Lagen table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Top-Lagen im Überblick</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ø Preise & Monatstrend</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-2.5 text-left">Stadtteil</th>
                    <th className="px-4 py-2.5 text-left">Typ</th>
                    <th className="px-4 py-2.5 text-right">Preis</th>
                    <th className="px-4 py-2.5 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TOP_LAGEN.map(({ stadtteil, typ, preis, trend, up }, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{stadtteil}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          typ === "Kaufen"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-violet-50 text-violet-600"
                        }`}>
                          {typ}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium">{preis}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                          {trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Market insights cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Käufermarkt",
                body: "Die Nachfrage übersteigt das Angebot um ca. 23 %. Interessenten sollten schnell entscheiden — Inserate sind im Schnitt nur 24 Tage am Markt.",
                color: "bg-blue-50 border-blue-100",
                tag: "Marktlage",
                tagColor: "bg-blue-100 text-blue-700",
              },
              {
                title: "Preistrend stabil",
                body: "Die Kaufpreise steigen moderat um 2–4 % p.m. Starke Lagen wie HafenCity und Altona verzeichnen die höchsten Zuwächse.",
                color: "bg-emerald-50 border-emerald-100",
                tag: "Preistrend",
                tagColor: "bg-emerald-100 text-emerald-700",
              },
              {
                title: "Mietmarkt angespannt",
                body: "Die Mietpreise sind in allen Stadtteilen gestiegen. Besonders Eimsbüttel und Altona verzeichnen überdurchschnittliche Zuwächse.",
                color: "bg-amber-50 border-amber-100",
                tag: "Mieten",
                tagColor: "bg-amber-100 text-amber-700",
              },
            ].map(({ title, body, color, tag, tagColor }) => (
              <div key={title} className={`rounded-2xl border p-5 ${color}`}>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-3 ${tagColor}`}>
                  {tag}
                </span>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Data disclaimer */}
          <p className="text-xs text-slate-400 text-center pb-4">
            * Alle Angaben sind Beispieldaten zu Demonstrationszwecken. Echtdaten werden über die Supabase-Datenbank eingebunden.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
