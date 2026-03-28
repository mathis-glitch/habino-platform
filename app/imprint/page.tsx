import Link from "next/link";

export const metadata = { title: "Imprint — Habino" };

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link href="/explore" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-bold text-slate-900 text-sm">Imprint</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-xl font-extrabold text-slate-900 mb-6">Legal Notice / Imprint</h1>

        <div className="space-y-6 text-sm text-slate-600">

          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Company Information</h2>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <p className="font-semibold text-slate-800">Habino Real Estate Platform</p>
              <p>Bole Sub-City, Addis Ababa</p>
              <p>Federal Democratic Republic of Ethiopia</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Contact</h2>
            <div className="space-y-1">
              <p>Email: <a href="mailto:contact@habino.com" className="underline" style={{ color: "var(--color-primary)" }}>contact@habino.com</a></p>
              <p>Support: <a href="mailto:support@habino.com" className="underline" style={{ color: "var(--color-primary)" }}>support@habino.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Platform Information</h2>
            <div className="space-y-2">
              <p>Habino is a digital real estate platform connecting property seekers, landlords, and agents in Addis Ababa, Ethiopia.</p>
              <p>The platform uses AI technology to improve property discovery and facilitate real estate transactions.</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Disclaimer</h2>
            <p className="leading-relaxed">
              Habino provides a platform for property listings and does not act as a real estate agent or broker.
              We do not guarantee the accuracy of individual listings. All transactions are between the property
              owner (or their authorised agent) and the interested party.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Third-Party Content</h2>
            <p className="leading-relaxed">
              Map data is provided by OpenStreetMap contributors (© OpenStreetMap, licensed under ODbL).
              Habino is not affiliated with OpenStreetMap or its contributors.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Governing Law</h2>
            <p>This platform and its operations are governed by the laws of the Federal Democratic Republic of Ethiopia.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
