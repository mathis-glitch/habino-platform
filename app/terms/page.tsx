import Link from "next/link";

export const metadata = { title: "Terms of Use — Habino" };

const sections = [
  { title: "1. Acceptance", body: "By using Habino you agree to these Terms. If you disagree, please do not use the platform." },
  { title: "2. Eligibility", body: "You must be at least 18 years old to register and post listings. All information you provide must be accurate." },
  { title: "3. Listings & Content", body: "You are responsible for all content you post. Listings must be for real properties you have the right to rent or sell. Fraudulent or misleading listings will be removed and accounts suspended." },
  { title: "4. Fees", body: "Habino is currently free for buyers, renters, and agents. We reserve the right to introduce fees with at least 30 days' prior notice." },
  { title: "5. Intellectual Property", body: "The platform design, code, logo, and Habino name are our intellectual property. You may not copy or reproduce them without written permission." },
  { title: "6. Third-Party Services", body: "Habino uses OpenStreetMap, WhatsApp, and Google OAuth. Use of those services is subject to their own terms." },
  { title: "7. Liability", body: "Habino connects seekers and agents but is not a party to any transaction. We are not liable for losses arising from use of the platform." },
  { title: "8. Governing Law", body: "These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Disputes are resolved in Addis Ababa." },
  { title: "9. Changes", body: "We may update these Terms at any time. Continued use after changes constitutes acceptance." },
  { title: "10. Contact", body: "Questions: legal@habino.com · Habino Real Estate Platform, Bole, Addis Ababa, Ethiopia." },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/settings" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Terms of Use</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-[20px] font-bold text-slate-900 mb-1">Terms of Use</h1>
        <p className="text-[12px] text-slate-400 mb-6">Last updated January 2025 · Habino Real Estate Platform</p>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100" style={{ boxShadow: "var(--shadow-sm)" }}>
          {sections.map((s) => (
            <div key={s.title} className="px-5 py-4">
              <p className="text-[14px] font-semibold text-slate-900 mb-1.5">{s.title}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
