import Link from "next/link";

export const metadata = { title: "Terms of Use — Habino" };

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using Habino, you agree to be bound by these Terms of Use. If you do not agree, please do not use the platform.",
    },
    {
      title: "2. Eligibility",
      content: "You must be at least 18 years old to create an account and post listings on Habino. By registering, you confirm that all information you provide is accurate and up to date.",
    },
    {
      title: "3. Listings & Content",
      content: "You are responsible for all content you post on Habino. Listings must be for real properties you have the right to rent or sell. Fraudulent, misleading, or illegal listings will be removed immediately, and the account will be suspended.",
    },
    {
      title: "4. Fees",
      content: "Habino is currently free to use for buyers, renters, and agents during our launch period. We reserve the right to introduce fees with at least 30 days' prior notice to registered users.",
    },
    {
      title: "5. Intellectual Property",
      content: "All platform content including design, code, logos, and the Habino name are the intellectual property of Habino Real Estate Platform. You may not copy, reproduce, or distribute platform content without written permission.",
    },
    {
      title: "6. Third-Party Services",
      content: "Habino integrates with third-party services including OpenStreetMap, WhatsApp, and Google OAuth. Use of these services is subject to their respective terms and conditions.",
    },
    {
      title: "7. Limitation of Liability",
      content: "Habino provides a platform to connect property seekers and agents. We do not verify the accuracy of all listings and are not a party to any rental or sale transaction. Habino is not liable for any losses arising from use of the platform.",
    },
    {
      title: "8. Governing Law",
      content: "These terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Any disputes shall be resolved in the courts of Addis Ababa.",
    },
    {
      title: "9. Changes to Terms",
      content: "We may update these Terms at any time. Continued use of Habino after changes constitutes acceptance of the updated Terms.",
    },
    {
      title: "10. Contact",
      content: "For questions about these Terms, contact us at legal@habino.com or at our offices in Bole, Addis Ababa, Ethiopia.",
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
        <span className="font-bold text-slate-900 text-sm">Terms of Use</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Terms of Use</h1>
        <p className="text-xs text-slate-400 mb-6">Last updated: January 2025 · Habino Real Estate Platform</p>

        <div className="space-y-5">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-sm font-bold text-slate-900 mb-1.5">{sec.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{sec.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
