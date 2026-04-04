import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Habino",
  description: "Terms and conditions for using the Habino platform.",
};

const G = "#2D6A4F";
const LAST_UPDATED = "4 April 2026";
const LEGAL_EMAIL = "legal@habino.app";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1A1A2E", marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.85 }}>{children}</div>
    </section>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 5 }}>{item}</li>)}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div style={{
      flex: 1, overflowY: "auto",
      background: "#FFFFFF",
      fontFamily: "'Inter',-apple-system,sans-serif",
    }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`, padding: "52px 24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Link href="/profile" style={{ marginRight: 4 }}>
            <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="rgba(255,255,255,0.2)" />
            <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>habino</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: -0.4 }}>Terms of Service</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Last updated: {LAST_UPDATED}</p>
      </div>

      {/* Intro banner */}
      <div style={{ background: "#F9FAFB", padding: "14px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
        Please read these Terms carefully before using Habino. By accessing or using the platform, you agree to be bound by these Terms and our{" "}
        <Link href="/privacy" style={{ color: G, fontWeight: 600 }}>Privacy Policy</Link>.
      </div>

      {/* Body */}
      <div style={{ padding: "24px 22px 80px" }}>

        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>These Terms of Service ("Terms") govern your access to and use of the Habino platform ("Platform"), operated by <strong>Habino Technologies</strong>, Bole Road, Addis Ababa, Ethiopia ("we", "us", "Habino").</p>
          <p>By creating an account or using the Platform, you confirm that you:</p>
          <Ul items={[
            "Are at least 16 years of age (18 for posting listings)",
            "Have read and understood these Terms",
            "Agree to be legally bound by these Terms",
          ]} />
          <p>If you do not agree, you must not use the Platform.</p>
        </Section>

        <Section id="eligibility" title="2. Eligibility & Registration">
          <Ul items={[
            "You must be at least 16 years old to create an account.",
            "You must be at least 18 years old to post property or service listings.",
            "All information you provide must be accurate, current, and complete.",
            "You are responsible for maintaining the security of your account credentials.",
            "One person or entity may not maintain multiple accounts.",
            "Accounts may not be transferred or sold without our written consent.",
          ]} />
        </Section>

        <Section id="platform" title="3. Platform Description">
          <p>Habino is an online marketplace platform connecting:</p>
          <Ul items={[
            "Property seekers (buyers and renters) with property owners and real estate agents",
            "Customers with household and property-related service providers",
          ]} />
          <p>Habino is a <strong>marketplace intermediary only</strong>. We are not a real estate agent, broker, or service provider. We are not a party to any transaction, agreement, or contract between users.</p>
        </Section>

        <Section id="listings" title="4. Listings & Content">
          <p>When you post a listing or any content on the Platform, you represent and warrant that:</p>
          <Ul items={[
            "You have the legal right to list the property or offer the service",
            "All information provided is accurate, truthful, and not misleading",
            "Photos and descriptions relate to the actual property or service",
            "The listing does not violate any applicable law or third-party rights",
            "You will promptly remove or update listings that are no longer available",
          ]} />
          <p><strong>Prohibited content</strong> includes but is not limited to:</p>
          <Ul items={[
            "Fraudulent, misleading, or duplicate listings",
            "Properties or services you do not have the right to list",
            "Discriminatory content based on race, religion, nationality, gender, disability, or other protected characteristics",
            "Content that violates Ethiopian, Kenyan, UAE, or EU laws",
            "Spam, unsolicited marketing, or phishing content",
          ]} />
          <p>We reserve the right to remove any content and suspend or terminate accounts that violate these rules, without prior notice.</p>
        </Section>

        <Section id="user-conduct" title="5. User Conduct">
          <p>You agree not to:</p>
          <Ul items={[
            "Use the Platform for any unlawful purpose",
            "Attempt to access other users' accounts or data without authorisation",
            "Scrape, crawl, or systematically extract data from the Platform",
            "Use automated tools to interact with the Platform without our written consent",
            "Transmit viruses, malware, or any harmful code",
            "Harass, abuse, or threaten other users",
            "Impersonate any person or organisation",
            "Interfere with or disrupt the Platform's infrastructure",
          ]} />
        </Section>

        <Section id="fees" title="6. Fees & Payment">
          <p>The Platform is currently <strong>free to use</strong> for property seekers, property owners, agents, and service providers.</p>
          <p>We reserve the right to introduce subscription fees, listing fees, or premium features. We will provide at least <strong>30 days' written notice</strong> before any fee changes take effect. Continued use after that date constitutes acceptance of the new fees.</p>
        </Section>

        <Section id="ip" title="7. Intellectual Property">
          <p>All intellectual property rights in the Platform — including design, code, logos, trademarks, and the "Habino" name — are owned by Habino Technologies or its licensors.</p>
          <p>You may not reproduce, distribute, modify, or create derivative works without our express written permission.</p>
          <p>By posting content on the Platform, you grant Habino a non-exclusive, royalty-free, worldwide licence to display and distribute that content solely for the purpose of operating the Platform.</p>
        </Section>

        <Section id="privacy-ref" title="8. Privacy">
          <p>Your use of the Platform is subject to our <Link href="/privacy" style={{ color: G, fontWeight: 600 }}>Privacy Policy</Link>, which is incorporated into these Terms by reference. The Privacy Policy explains how we collect, use, and protect your personal data in compliance with GDPR, the Kenya Data Protection Act 2019, the UAE PDPL, and applicable Ethiopian data protection regulations.</p>
        </Section>

        <Section id="third-parties" title="9. Third-Party Services">
          <p>The Platform integrates with or links to third-party services including:</p>
          <Ul items={[
            "Supabase (authentication and database infrastructure)",
            "Vercel (hosting and content delivery)",
            "OpenStreetMap (mapping)",
            "WhatsApp (optional contact feature)",
          ]} />
          <p>Your use of these services is subject to their respective terms and privacy policies. Habino is not responsible for the content, accuracy, or practices of third-party services.</p>
        </Section>

        <Section id="disclaimers" title="10. Disclaimers & Limitation of Liability">
          <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</p>
          <p>Habino does not warrant that:</p>
          <Ul items={[
            "Listings are accurate, complete, or current",
            "The Platform will be uninterrupted or error-free",
            "Any property transaction or service engagement will be completed successfully",
          ]} />
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HABINO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL.</p>
          <p>Nothing in these Terms limits liability for death, personal injury caused by negligence, fraud, or any liability that cannot be excluded by law.</p>
        </Section>

        <Section id="indemnity" title="11. Indemnification">
          <p>You agree to indemnify and hold harmless Habino Technologies, its officers, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:</p>
          <Ul items={[
            "Your use of the Platform",
            "Your violation of these Terms",
            "Your content posted on the Platform",
            "Your violation of any third-party rights",
          ]} />
        </Section>

        <Section id="termination" title="12. Termination">
          <p>We may suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time via the <Link href="/privacy/data-rights" style={{ color: G, fontWeight: 600 }}>Data Rights page</Link>.</p>
          <p>Upon termination, your right to use the Platform ceases. Sections 7 (IP), 10 (Disclaimers), 11 (Indemnification), and 13 (Governing Law) survive termination.</p>
        </Section>

        <Section id="changes" title="13. Changes to These Terms">
          <p>We may update these Terms from time to time. We will notify you of material changes via in-app notification or email at least <strong>30 days</strong> before they take effect. Continued use after the effective date constitutes acceptance.</p>
        </Section>

        <Section id="governing-law" title="14. Governing Law & Dispute Resolution">
          <p>These Terms are governed by the laws of the <strong>Federal Democratic Republic of Ethiopia</strong>. Disputes are subject to the exclusive jurisdiction of the courts of Addis Ababa, Ethiopia.</p>
          <p>For users in the <strong>European Union</strong>: you may also have the right to seek resolution through the courts of your EU member state for consumer disputes.</p>
          <p>For users in <strong>Kenya</strong>: disputes relating to data protection may be referred to the Office of the Data Protection Commissioner (ODPC).</p>
          <p>For users in the <strong>UAE</strong>: disputes may also be referred to the UAE Data Office for data-related matters.</p>
          <p>We encourage users to contact us directly at <a href={`mailto:${LEGAL_EMAIL}`} style={{ color: G }}>{LEGAL_EMAIL}</a> before initiating formal proceedings.</p>
        </Section>

        <Section id="contact-terms" title="15. Contact">
          <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.8 }}>
            <strong>Habino Technologies — Legal</strong><br />
            Bole Road, Addis Ababa, Ethiopia<br />
            📧 <a href={`mailto:${LEGAL_EMAIL}`} style={{ color: G }}>{LEGAL_EMAIL}</a>
          </div>
        </Section>

        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 18 }}>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: G, fontWeight: 600 }}>Privacy Policy →</Link>
            <Link href="/privacy/data-rights" style={{ fontSize: 13, color: G, fontWeight: 600 }}>Your Data Rights →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
