import Link from "next/link";

export const metadata = { title: "Data Security — Habino" };

const measures = [
  { title: "Encryption in transit", body: "All data between your browser and Habino is encrypted with TLS 1.2+. Every session is secure." },
  { title: "Row-level security", body: "Powered by Supabase RLS policies — users can only read and write their own data. Cross-account data leakage is structurally impossible." },
  { title: "Secure authentication", body: "We use OAuth (Google, Facebook) and email magic links. Passwords are never stored in plaintext." },
  { title: "Minimal data collection", body: "We collect only what is needed to operate the platform. We never sell data or share it with advertisers." },
  { title: "Secure infrastructure", body: "Hosted on Supabase with automated backups, uptime monitoring, and EU-region data storage." },
  { title: "Audit logging", body: "Sensitive operations (logins, data changes, deletions) are logged with timestamps." },
  { title: "Regular security reviews", body: "We review our security posture regularly and patch vulnerabilities promptly." },
  { title: "Responsible disclosure", body: "Found a vulnerability? Email security@habino.com — we respond within 24 hours." },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/settings" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Data Security</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-[20px] font-bold text-slate-900 mb-1">Data Security</h1>
        <p className="text-[14px] text-slate-500 mb-6">How we protect your data and keep the platform secure.</p>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100" style={{ boxShadow: "var(--shadow-sm)" }}>
          {measures.map((m) => (
            <div key={m.title} className="px-5 py-4 flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: "var(--color-primary)" }} />
              <div>
                <p className="text-[14px] font-semibold text-slate-900 mb-1">{m.title}</p>
                <p className="text-[14px] text-slate-500 leading-relaxed">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Security questions?</p>
          <a href="mailto:security@habino.com" className="text-sm text-slate-500 hover:underline">security@habino.com</a>
        </div>
      </div>
    </div>
  );
}
