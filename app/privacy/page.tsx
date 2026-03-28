import Link from "next/link";

export const metadata = { title: "Privacy Policy — Habino" };

const sections = [
  { title: "What we collect", body: "Email address, name, and phone number when you register. Property listings, photos, and descriptions you submit. Anonymised usage data (pages visited, searches). Device type and IP address for security." },
  { title: "How we use it", body: "To provide and improve the Habino platform. To show you relevant listings. To let agents and seekers connect. To send transactional emails (confirmations, contracts). To comply with Ethiopian law." },
  { title: "Data sharing", body: "We do not sell your data. Your contact details are only shared with agents when you initiate contact. We use Supabase (EU-hosted) for secure storage. Aggregated, anonymised statistics may be used for research." },
  { title: "Retention", body: "Data is kept while your account is active. Deleted listings are removed from public view immediately. You may request full deletion at any time by writing to us." },
  { title: "Security", body: "All data travels over HTTPS (TLS 1.2+). Row-level security means users only access their own records. Authentication is handled via Supabase Auth — passwords are never stored in plaintext." },
  { title: "Your rights", body: "Access a copy of your data. Correct it via profile settings at any time. Request full deletion by emailing privacy@habino.com. Export your data on request." },
  { title: "Contact", body: "Privacy enquiries: privacy@habino.com · Habino Real Estate Platform, Bole, Addis Ababa, Ethiopia." },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/explore" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Privacy Policy</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-6">Last updated January 2025 · Habino Real Estate Platform</p>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
          {sections.map((s) => (
            <div key={s.title} className="px-5 py-4">
              <p className="text-sm font-semibold text-slate-800 mb-1">{s.title}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
