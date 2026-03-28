import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link href="/explore" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-bold text-slate-900 text-sm">About Habino</span>
      </div>

      {/* Hero */}
      <div className="px-6 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #e8f5ed 100%)" }}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow"
          style={{ background: "linear-gradient(135deg, #00A884, #0F1F3D)" }}>
          <span className="text-white text-2xl font-bold">H</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Habino</h1>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Addis Ababa&apos;s AI-powered real estate platform — built to make finding, renting, and buying property simple.
        </p>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-8">

        {/* Mission */}
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-3">Our Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We believe finding a home should be easy — not stressful. Habino combines AI-powered search,
            real-time listings, and direct agent connections to give every person in Addis Ababa access
            to the best property options on the market.
          </p>
        </section>

        {/* What we do */}
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-3">What We Do</h2>
          <div className="space-y-3">
            {[
              { icon: "🔍", title: "AI Property Search", desc: "Describe what you need in plain language — Habino finds matching properties instantly." },
              { icon: "🗺️", title: "Interactive Map", desc: "Browse listings on a live map of Addis Ababa, with neighbourhood insights and POI data." },
              { icon: "💬", title: "Direct Agent Contact", desc: "Connect with verified agents via WhatsApp — no middlemen, no delays." },
              { icon: "📝", title: "Smart Listings", desc: "List your property in minutes with AI-assisted descriptions and pricing guidance." },
              { icon: "📄", title: "Digital Contracts", desc: "Generate professional rental contracts with a guided AI wizard." },
            ].map(item => (
              <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Company */}
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-3">Company</h2>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-800">Habino Real Estate Platform</span></p>
            <p>Bole, Addis Ababa, Ethiopia</p>
            <p>contact@habino.com</p>
          </div>
        </section>

        {/* Back CTA */}
        <div className="pt-2 text-center">
          <Link href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}>
            Start exploring
          </Link>
        </div>
      </div>
    </div>
  );
}
