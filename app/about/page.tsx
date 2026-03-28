import Link from "next/link";

export const metadata = { title: "About — Habino" };

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/explore" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">About Habino</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Brand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-4">
          <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center text-white text-lg font-bold"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>H</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Habino</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Addis Ababa&apos;s AI-powered real estate platform — making it simple to find, rent, buy, and list property.
          </p>
        </div>

        {/* Mission */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Our mission</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            We believe finding a home should be straightforward — not stressful. Habino combines AI-powered search,
            real-time listings, and direct agent connections so every person in Addis Ababa can access
            the best property options on the market.
          </p>
        </div>

        {/* What we do */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 mb-4">
          <div className="px-5 py-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">What we do</p>
          </div>
          {[
            { label: "AI property search", desc: "Describe what you need — we find it instantly." },
            { label: "Interactive map", desc: "Browse listings live on a map of Addis Ababa." },
            { label: "Direct agent contact", desc: "Connect via WhatsApp — no middlemen." },
            { label: "Smart listings", desc: "List your property in minutes with AI assistance." },
            { label: "Digital contracts", desc: "Generate rental contracts with a guided wizard." },
          ].map((item) => (
            <div key={item.label} className="px-5 py-3.5 flex justify-between items-start gap-4">
              <span className="text-sm font-medium text-slate-800">{item.label}</span>
              <span className="text-sm text-slate-400 text-right">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
          <div className="px-5 py-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
          </div>
          <div className="px-5 py-3.5 flex justify-between">
            <span className="text-sm text-slate-400">Email</span>
            <a href="mailto:contact@habino.com" className="text-sm font-medium text-slate-700 hover:underline">contact@habino.com</a>
          </div>
          <div className="px-5 py-3.5 flex justify-between">
            <span className="text-sm text-slate-400">Location</span>
            <span className="text-sm font-medium text-slate-700">Bole, Addis Ababa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
