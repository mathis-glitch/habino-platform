import Link from "next/link";

export const metadata = { title: "Imprint — Habino" };

export default function ImprintPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/settings" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Imprint</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-lg font-bold text-slate-900 mb-6">Legal Notice</h1>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100" style={{ boxShadow: "var(--shadow-sm)" }}>
          {[
            { label: "Company", value: "Habino Real Estate Platform" },
            { label: "Address", value: "Bole Sub-City, Addis Ababa, Ethiopia" },
            { label: "General contact", value: "contact@habino.com" },
            { label: "Support", value: "support@habino.com" },
            { label: "Legal", value: "legal@habino.com" },
          ].map((row) => (
            <div key={row.label} className="px-5 py-3.5 flex justify-between items-center">
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className="text-sm font-medium text-slate-700">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4 text-sm text-slate-500 leading-relaxed">
          <p>
            Habino is a digital platform connecting property seekers, landlords, and agents in Addis Ababa.
            We do not act as a real estate broker and are not a party to any transaction.
          </p>
          <p>
            Map data: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors, licensed under ODbL.
          </p>
          <p>
            These operations are governed by the laws of the Federal Democratic Republic of Ethiopia.
          </p>
        </div>
      </div>
    </div>
  );
}
