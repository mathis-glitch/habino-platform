import Link from "next/link";

export const metadata = { title: "Data Security — Habino" };

export default function SecurityPage() {
  const measures = [
    { icon: "🔒", title: "Encryption in Transit", desc: "All data between your browser and Habino is encrypted using TLS 1.2+. Your session is always secure." },
    { icon: "🛡️", title: "Row-Level Security", desc: "Powered by Supabase RLS policies — users can only read and write their own data. No cross-account data leakage is possible." },
    { icon: "🔑", title: "Secure Authentication", desc: "Habino uses industry-standard OAuth (Google, Facebook) and email magic links. Passwords are never stored in plaintext." },
    { icon: "👁️", title: "Minimal Data Collection", desc: "We collect only the data needed to provide the platform. We never sell or share your data with advertisers." },
    { icon: "🏗️", title: "Secure Infrastructure", desc: "Hosted on Supabase (EU region), built on PostgreSQL with automated backups, monitoring, and uptime guarantees." },
    { icon: "📋", title: "Audit Logging", desc: "All sensitive operations (logins, data changes, deletions) are logged with timestamps for security audits." },
    { icon: "🔄", title: "Regular Security Reviews", desc: "Our team conducts regular security reviews and promptly patches any vulnerabilities discovered." },
    { icon: "📞", title: "Responsible Disclosure", desc: "Found a security issue? Report it to security@habino.com and we will respond within 24 hours." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link href="/explore" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-bold text-slate-900 text-sm">Data Security</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>🛡️</div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Your data is safe with us</h1>
            <p className="text-xs text-slate-400">Security measures we take to protect you</p>
          </div>
        </div>

        <div className="space-y-3">
          {measures.map(item => (
            <div key={item.title} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-center">
          <p className="text-sm font-semibold text-emerald-900 mb-1">Security questions?</p>
          <p className="text-xs text-emerald-700 mb-3">Our security team responds within 24 hours.</p>
          <a
            href="mailto:security@habino.com"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#16a34a" }}
          >
            security@habino.com
          </a>
        </div>
      </div>
    </div>
  );
}
