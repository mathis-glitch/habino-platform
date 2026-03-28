import Link from "next/link";

export const metadata = { title: "Privacy Policy — Habino" };

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "Account information: email address, name, phone number when you register.",
        "Property data: listings, photos, descriptions, and pricing you submit.",
        "Usage data: pages visited, search queries, and features used (anonymised).",
        "Device information: browser type, operating system, and IP address for security purposes.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide and improve the Habino platform and its features.",
        "To match you with relevant property listings based on your searches.",
        "To allow agents and property seekers to connect with each other.",
        "To send transactional emails such as listing confirmations and contract copies.",
        "To comply with legal obligations under Ethiopian law.",
      ],
    },
    {
      title: "3. Data Sharing",
      content: [
        "We do not sell your personal data to third parties.",
        "Your contact information is shared only with agents when you initiate contact.",
        "We use Supabase (a European-based platform) for secure data storage.",
        "We may share aggregated, anonymised statistics for research or promotional purposes.",
      ],
    },
    {
      title: "4. Data Retention",
      content: [
        "Account data is retained for as long as your account is active.",
        "Deleted listings are removed from public view immediately but may be retained in logs for 90 days.",
        "You may request full deletion of your account and data at any time by contacting us.",
      ],
    },
    {
      title: "5. Security",
      content: [
        "All data is transmitted over HTTPS (TLS 1.2 or higher).",
        "Row-level security (RLS) ensures users can only access their own data.",
        "Passwords are never stored in plaintext — authentication is handled via Supabase Auth.",
        "We conduct regular security reviews and update our infrastructure accordingly.",
      ],
    },
    {
      title: "6. Your Rights",
      content: [
        "Access: you may request a copy of all personal data we hold about you.",
        "Correction: you may update your data at any time via your profile settings.",
        "Deletion: you may request full account deletion by emailing privacy@habino.com.",
        "Portability: data export is available upon request.",
      ],
    },
    {
      title: "7. Contact",
      content: [
        "For privacy enquiries, contact us at: privacy@habino.com",
        "Habino Real Estate Platform, Bole, Addis Ababa, Ethiopia.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link href="/explore" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-bold text-slate-900 text-sm">Privacy Policy</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-6">Last updated: January 2025 · Habino Real Estate Platform</p>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Habino (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy explains what
          data we collect, how we use it, and what rights you have.
        </p>

        <div className="space-y-6">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-sm font-bold text-slate-900 mb-2">{sec.title}</h2>
              <ul className="space-y-1.5">
                {sec.content.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-slate-300 shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
