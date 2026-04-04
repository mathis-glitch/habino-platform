import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Habino",
  description: "How Habino collects, uses, and protects your personal data.",
};

const G = "#2D6A4F";
const LAST_UPDATED = "4 April 2026";
const DPO_EMAIL = "dpo@habino.app";
const PRIVACY_EMAIL = "privacy@habino.app";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1A1A2E", marginBottom: 12, paddingTop: 4 }}>{title}</h2>
      <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.85 }}>{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 5 }}>{item}</li>)}
    </ul>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 5,
      background: "rgba(45,106,79,0.10)", color: G,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
      letterSpacing: "0.05em", marginRight: 4, marginBottom: 4,
    }}>{label}</span>
  );
}

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: -0.4 }}>Privacy Policy</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>Last updated: {LAST_UPDATED}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["GDPR (EU)", "Germany BDSG", "Kenya DPA 2019", "UAE PDPL", "Ethiopia"].map(j => (
            <span key={j} style={{
              padding: "3px 9px", borderRadius: 5,
              background: "rgba(255,255,255,0.2)", color: "#fff",
              fontSize: 10, fontWeight: 600,
            }}>{j}</span>
          ))}
        </div>
      </div>

      {/* TOC */}
      <div style={{ background: "#F9FAFB", padding: "14px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Contents</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px" }}>
          {[
            ["#controller",      "1. Data Controller"],
            ["#what-we-collect", "2. Data We Collect"],
            ["#legal-basis",     "3. Legal Basis"],
            ["#how-we-use",      "4. How We Use Data"],
            ["#sharing",         "5. Sharing & Third Parties"],
            ["#retention",       "6. Retention"],
            ["#your-rights",     "7. Your Rights"],
            ["#cookies",         "8. Cookies"],
            ["#transfers",       "9. Int'l Transfers"],
            ["#children",        "10. Children"],
            ["#security",        "11. Security"],
            ["#jurisdiction",    "12. Jurisdictions"],
            ["#contact",         "13. Contact"],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 12, color: G, textDecoration: "none", fontWeight: 500 }}>{label}</a>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 22px 80px" }}>

        <Section id="controller" title="1. Data Controller">
          <p>The data controller for your personal data is:</p>
          <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px 16px", margin: "10px 0", fontSize: 13, lineHeight: 1.8 }}>
            <strong>Habino Technologies</strong><br />
            Bole Road, Addis Ababa, Ethiopia<br />
            General: <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: G }}>{PRIVACY_EMAIL}</a><br />
            Data Protection Officer: <a href={`mailto:${DPO_EMAIL}`} style={{ color: G }}>{DPO_EMAIL}</a>
          </div>
        </Section>

        <Section id="what-we-collect" title="2. Data We Collect">
          <Sub title="2.1 Account & Profile Data">
            <Ul items={[
              "Full name and email address",
              "Phone number and WhatsApp (optional)",
              "Date of birth (optional, age verification)",
              "Profile photo (optional)",
              "City, address, country",
              "Account type (private / business) and usage intent",
              "National ID number (optional, for verification score only)",
              "Business name (business accounts)",
              "Bio (optional)",
            ]} />
          </Sub>
          <Sub title="2.2 Activity Data">
            <Ul items={[
              "Listings you create, view, or save",
              "Messages with agents and service providers",
              "Search queries and filter preferences",
              "Profile completion progress",
            ]} />
          </Sub>
          <Sub title="2.3 Technical Data">
            <Ul items={[
              "IP address and city-level location",
              "Device type, OS, browser version",
              "Session identifiers, app version",
              "Crash reports and error logs",
            ]} />
          </Sub>
        </Section>

        <Section id="legal-basis" title="3. Legal Basis for Processing">
          <div style={{ marginBottom: 10 }}>
            <Badge label="GDPR Art. 6" />
            <Badge label="Kenya DPA s.30" />
            <Badge label="UAE PDPL Art. 4" />
          </div>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            {[
              ["Account & platform services", "Contract (Art. 6(1)(b) GDPR)"],
              ["Authentication & security", "Legitimate interests"],
              ["Transactional notifications", "Contract"],
              ["Analytics", "Legitimate interests / Consent"],
              ["Marketing communications", "Consent (opt-in only)"],
              ["Legal compliance", "Legal obligation (Art. 6(1)(c))"],
              ["Identity verification score", "Consent (voluntary)"],
            ].map(([purpose, basis], i, arr) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "9px 12px", fontSize: 12,
                borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                background: i % 2 === 0 ? "#FAFAFA" : "#fff",
              }}>
                <span style={{ color: "#1A1A2E", fontWeight: 600, flex: 1 }}>{purpose}</span>
                <span style={{ color: "#6B7280", textAlign: "right", flex: 1 }}>{basis}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="how-we-use" title="4. How We Use Your Data">
          <Ul items={[
            "Creating and managing your account",
            "Displaying your listings to other users",
            "Connecting buyers, renters, agents, and service providers",
            "Computing your profile verification score (0–100%)",
            "Sending transactional emails (confirmations, resets)",
            "Improving the platform via anonymous analytics",
            "Detecting fraud, abuse, and security threats",
            "Complying with legal obligations in applicable jurisdictions",
          ]} />
          <p style={{ marginTop: 8, padding: "10px 12px", background: "rgba(45,106,79,0.06)", borderRadius: 10, fontSize: 12 }}>
            ✓ We do <strong>not</strong> sell your personal data.<br />
            ✓ We do not use automated decision-making with significant legal effects.<br />
            ✓ National ID is used solely for your local verification score — never shared with third parties.
          </p>
        </Section>

        <Section id="sharing" title="5. Sharing & Third Parties">
          <Sub title="5.1 Sub-processors">
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
              {[
                ["Supabase (AWS eu-central-1)", "Database, auth, file storage", "Frankfurt, Germany (EU)"],
                ["Vercel Inc.", "Hosting, CDN, edge network", "EU edge / USA"],
                ["Unsplash", "Demo images (no personal data)", "USA"],
              ].map(([name, purpose, location], i, arr) => (
                <div key={name} style={{
                  padding: "10px 12px", fontSize: 12,
                  borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                  background: i % 2 === 0 ? "#FAFAFA" : "#fff",
                }}>
                  <strong style={{ color: "#1A1A2E" }}>{name}</strong>
                  <span style={{ color: "#9CA3AF" }}> — {location}</span>
                  <div style={{ color: "#6B7280", marginTop: 2 }}>{purpose}</div>
                </div>
              ))}
            </div>
          </Sub>
          <Sub title="5.2 Public Listings">
            <p>Property and service listings you publish are visible to all users. Your phone/email is shown only to authenticated users when you initiate contact.</p>
          </Sub>
          <Sub title="5.3 Legal Disclosure">
            <p>We may disclose data to law enforcement or courts when required by Ethiopian, Kenyan, UAE, or EU/German law.</p>
          </Sub>
        </Section>

        <Section id="retention" title="6. Data Retention">
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            {[
              ["Active account data", "Duration of account"],
              ["Inactive accounts", "Deleted after 24 months (30-day notice)"],
              ["Post-deletion", "Anonymised within 30 days"],
              ["Messaging logs", "3 years (legal obligation)"],
              ["Backup snapshots", "Max 90 days"],
              ["Analytics (anonymised)", "13 months"],
            ].map(([type, period], i, arr) => (
              <div key={type} style={{
                display: "flex", justifyContent: "space-between",
                padding: "9px 12px", fontSize: 12,
                borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                background: i % 2 === 0 ? "#FAFAFA" : "#fff",
              }}>
                <span style={{ color: "#1A1A2E", fontWeight: 600 }}>{type}</span>
                <span style={{ color: "#6B7280", textAlign: "right" }}>{period}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="your-rights" title="7. Your Rights">
          <div style={{ marginBottom: 10 }}>
            <Badge label="GDPR Art. 15–22" />
            <Badge label="Kenya DPA s.26–34" />
            <Badge label="UAE PDPL Art. 14–21" />
          </div>
          {[
            { right: "Access", desc: "Request a copy of all personal data we hold about you." },
            { right: "Rectification", desc: "Correct inaccurate data via your profile settings." },
            { right: "Erasure (Right to be Forgotten)", desc: "Request full deletion of your account and data." },
            { right: "Data Portability", desc: "Receive your data in machine-readable JSON format." },
            { right: "Restriction", desc: "Limit our processing in certain circumstances." },
            { right: "Object", desc: "Object to processing based on legitimate interests." },
            { right: "Withdraw Consent", desc: "Revoke consent at any time without affecting prior processing." },
          ].map((item, i, arr) => (
            <div key={item.right} style={{
              display: "flex", gap: 10, padding: "10px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: G,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2,
              }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{item.right} — </span>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{item.desc}</span>
              </div>
            </div>
          ))}
          <p style={{ marginTop: 14, fontSize: 13 }}>
            Submit requests via your{" "}
            <Link href="/privacy/data-rights" style={{ color: G, fontWeight: 600 }}>Data Rights page</Link>{" "}
            or email <a href={`mailto:${DPO_EMAIL}`} style={{ color: G }}>{DPO_EMAIL}</a>.
            Response time: <strong>30 days</strong> (GDPR) / <strong>21 days</strong> (Kenya DPA).
          </p>
        </Section>

        <Section id="cookies" title="8. Cookies & Tracking">
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            {[
              { type: "Essential", detail: "Session tokens, CSRF, tenant ID", basis: "Necessary", canOptOut: false },
              { type: "Preferences", detail: "Currency, saved listings (localStorage)", basis: "Legitimate interest", canOptOut: false },
              { type: "Analytics", detail: "Vercel Analytics — anonymous only, no cross-site tracking", basis: "Consent", canOptOut: true },
              { type: "Marketing", detail: "Personalised recommendations", basis: "Consent", canOptOut: true },
            ].map((row, i, arr) => (
              <div key={row.type} style={{
                padding: "11px 13px", fontSize: 12,
                borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                background: i % 2 === 0 ? "#FAFAFA" : "#fff",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <strong style={{ color: "#1A1A2E" }}>{row.type}</strong>
                  <span style={{
                    padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: row.canOptOut ? "rgba(45,106,79,0.10)" : "#F3F4F6",
                    color: row.canOptOut ? G : "#6B7280",
                  }}>Opt-out: {row.canOptOut ? "Yes" : "No"}</span>
                </div>
                <div style={{ color: "#6B7280" }}>{row.detail}</div>
                <div style={{ color: "#9CA3AF", marginTop: 2 }}>Basis: {row.basis}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="transfers" title="9. International Data Transfers">
          <div style={{ marginBottom: 8 }}>
            <Badge label="GDPR Ch. V" />
            <Badge label="Kenya DPA s.49" />
            <Badge label="UAE PDPL Art. 22" />
          </div>
          <p>Your data is stored primarily in <strong>Frankfurt, Germany (EU)</strong> via Supabase/AWS eu-central-1. Transfers outside the EEA are protected by Standard Contractual Clauses (SCCs) per GDPR Art. 46(2)(c).</p>
          <p>For Kenyan users: transfers comply with Kenya DPA 2019 s.49 (equivalent protection verification). For UAE users: cross-border transfers comply with UAE PDPL Art. 22.</p>
        </Section>

        <Section id="children" title="10. Children's Privacy">
          <p>Habino is not directed at users under <strong>16 years of age</strong>. We do not knowingly collect data from children under 16. This applies under GDPR Art. 8, the Kenya DPA, and the UAE PDPL. If you believe a minor has registered, please contact <a href={`mailto:${DPO_EMAIL}`} style={{ color: G }}>{DPO_EMAIL}</a> and we will delete their data immediately.</p>
        </Section>

        <Section id="security" title="11. Security">
          <Ul items={[
            "All traffic encrypted via TLS 1.2+",
            "Data at rest encrypted with AES-256 (Supabase/AWS)",
            "Row-Level Security (RLS) — users access only their own data",
            "JWT-based authentication, no plaintext passwords",
            "Service role keys never exposed client-side",
            "Breach notification within 72 hours (GDPR Art. 33)",
          ]} />
        </Section>

        <Section id="jurisdiction" title="12. Jurisdiction-Specific Notes">
          <Sub title="EU / Germany (GDPR + BDSG)">
            <p>Supervisory authority: <strong>BfDI</strong> — <a href="https://www.bfdi.bund.de" style={{ color: G }}>www.bfdi.bund.de</a>. All GDPR Art. 15–22 rights apply. Data minimisation and privacy-by-design principles are implemented throughout.</p>
          </Sub>
          <Sub title="Kenya (Data Protection Act 2019)">
            <p>Rights under Kenya DPA ss.26–34. Complaints: <strong>ODPC</strong> — <a href="https://www.odpc.go.ke" style={{ color: G }}>www.odpc.go.ke</a>. Response within 21 days. Sensitive data processed only with explicit consent.</p>
          </Sub>
          <Sub title="UAE (Federal Decree-Law No. 45/2021 — PDPL)">
            <p>Rights under UAE PDPL Arts. 14–21. Complaints: <strong>UAE Data Office</strong> — <a href="https://www.uaedataoffice.ae" style={{ color: G }}>www.uaedataoffice.ae</a>. Sensitive data (incl. national ID) requires explicit consent.</p>
          </Sub>
          <Sub title="Ethiopia">
            <p>Ethiopia does not yet have a comprehensive data protection law. We apply GDPR-equivalent standards to all Ethiopian users and will comply with the forthcoming Ethiopian Personal Data Protection Proclamation upon enactment.</p>
          </Sub>
          <Sub title="App Store & Google Play">
            <p>We declare the following data collection categories: Contact Info, Identifiers, Usage Data, Diagnostics. No data is used for cross-app/cross-site tracking without explicit consent. Apple ATT is respected for any future native app distribution.</p>
          </Sub>
        </Section>

        <Section id="contact" title="13. Contact & Complaints">
          <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.8 }}>
            <strong>Data Protection Officer</strong><br />
            Habino Technologies · Bole Road, Addis Ababa, Ethiopia<br />
            📧 <a href={`mailto:${DPO_EMAIL}`} style={{ color: G }}>{DPO_EMAIL}</a><br />
            📧 <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: G }}>{PRIVACY_EMAIL}</a>
          </div>
          <p style={{ marginTop: 12 }}>
            Submit requests via the{" "}
            <Link href="/privacy/data-rights" style={{ color: G, fontWeight: 600 }}>Data Rights portal →</Link>
          </p>
        </Section>

        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 18, marginTop: 4 }}>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7 }}>
            We may update this policy periodically. Material changes are communicated via in-app notification or email at least 30 days before taking effect.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
            <Link href="/terms" style={{ fontSize: 13, color: G, fontWeight: 600 }}>Terms of Service →</Link>
            <Link href="/privacy/data-rights" style={{ fontSize: 13, color: G, fontWeight: 600 }}>Your Data Rights →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
