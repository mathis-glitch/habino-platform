"use client";

import { useEffect, useState, useCallback } from "react";
import { Property, Contract, ContractStatus, ContractType } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(price: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

function thumb(property: Property) {
  return property.images?.[0]?.url ?? null;
}

const STATUS_STYLE: Record<ContractStatus, { bg: string; color: string; border: string; label: string }> = {
  draft:               { bg: "rgba(255,255,255,0.04)", color: "var(--text-2)",   border: "var(--border)",                    label: "Entwurf"          },
  pending_review:      { bg: "rgba(255,159,10,0.08)",  color: "var(--warn)",     border: "rgba(255,159,10,0.2)",              label: "In Prüfung"       },
  pending_signature:   { bg: "rgba(124,110,242,0.10)", color: "var(--color-primary)", border: "rgba(124,110,242,0.2)",        label: "Signatur ausstehend" },
  signed:              { bg: "rgba(48,209,88,0.08)",   color: "var(--ok)",       border: "rgba(48,209,88,0.2)",               label: "Unterzeichnet"    },
  active:              { bg: "rgba(48,209,88,0.08)",   color: "var(--ok)",       border: "rgba(48,209,88,0.2)",               label: "Aktiv"            },
  expired:             { bg: "rgba(255,255,255,0.04)", color: "var(--text-3)",   border: "var(--border)",                    label: "Abgelaufen"       },
  terminated:          { bg: "rgba(255,69,58,0.08)",   color: "var(--err)",      border: "rgba(255,69,58,0.2)",               label: "Beendet"          },
};

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  residential_rental:  "Wohnraummiete",
  commercial_rental:   "Gewerbemiete",
  purchase:            "Kaufvertrag",
  option_to_purchase:  "Kaufoption",
  short_term_rental:   "Kurzzeitmiete",
};

type Tab = "saved" | "properties" | "contracts";

// ── Contract Modal ────────────────────────────────────────────────────────────

function ContractModal({ contract, onClose, onGenerate, generating }: {
  contract: Contract; onClose: () => void;
  onGenerate: (id: string) => void; generating: boolean;
}) {
  const clauses = contract.contract_data?.clauses ?? [];
  const st = STATUS_STYLE[contract.status];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{CONTRACT_TYPE_LABELS[contract.contract_type]}</span>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>
              {contract.property?.title ?? "Vertrag"}
            </h2>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Parties */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Vermieter / Verkäufer", name: contract.landlord_name, email: contract.landlord_email, addr: contract.landlord_address },
              { label: "Mieter / Käufer", name: contract.tenant_name, email: contract.tenant_email, addr: contract.tenant_address },
            ].map(p => (
              <div key={p.label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{p.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{p.email}</p>
                {p.addr && <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.addr}</p>}
              </div>
            ))}
          </div>

          {/* Key terms */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              contract.monthly_rent  && { label: "Monatliche Miete",  val: fmt(contract.monthly_rent, contract.currency) },
              contract.purchase_price && { label: "Kaufpreis",          val: fmt(contract.purchase_price, contract.currency) },
              contract.deposit_amount && { label: "Kaution",            val: fmt(contract.deposit_amount, contract.currency) },
              { label: "Beginn",       val: new Date(contract.start_date).toLocaleDateString("de-DE") },
              contract.end_date && { label: "Ende", val: new Date(contract.end_date).toLocaleDateString("de-DE") },
              { label: "Rechtslage",   val: contract.governing_law ?? contract.country_code },
            ].filter(Boolean).map((item: { label: string; val: string } | null | false, i) => item && (
              <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: "var(--text-3)" }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginTop: 3 }}>{item.val}</p>
              </div>
            ))}
          </div>

          {/* AI Generate */}
          {contract.status === "draft" && (
            <div style={{ background: "var(--color-primary-light)", border: "1px solid rgba(124,110,242,0.2)", borderRadius: 14, padding: "20px", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,110,242,0.15)", border: "1px solid rgba(124,110,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="18" height="18" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>KI-Vertrag generieren</p>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.6 }}>
                Claude erstellt einen vollständigen, rechtskonformen Vertrag auf Basis der obigen Daten. Dauer: ca. 15–30 Sekunden.
              </p>
              <button
                onClick={() => onGenerate(contract.id)}
                disabled={generating}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 9, background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.65 : 1 }}
              >
                {generating && <LoadingSpinner className="h-4 w-4" />}
                {generating ? "Generiere…" : "Vertrag generieren"}
              </button>
            </div>
          )}

          {/* Clauses */}
          {clauses.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 12 }}>Vertragsklauseln</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {clauses.map((clause, i) => (
                  <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{clause.title}</p>
                      {clause.type === "jurisdiction_specific" && (
                        <span style={{ fontSize: 10, background: "rgba(255,159,10,0.1)", color: "var(--warn)", border: "1px solid rgba(255,159,10,0.2)", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>Jurisdiktionsspezifisch</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{clause.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal note */}
          {contract.contract_data?.jurisdiction_notes && (
            <div style={{ background: "rgba(255,159,10,0.06)", border: "1px solid rgba(255,159,10,0.18)", borderRadius: 12, padding: "14px 16px", fontSize: 12.5, color: "var(--warn)", lineHeight: 1.6 }}>
              <strong>Rechtlicher Hinweis:</strong> {contract.contract_data.jurisdiction_notes}
            </div>
          )}

          {/* Signatures */}
          {(contract.signatures?.landlord || contract.signatures?.tenant) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                contract.signatures?.landlord && { label: "Vermieter unterzeichnet", date: contract.signatures.landlord.signed_at },
                contract.signatures?.tenant   && { label: "Mieter unterzeichnet",    date: contract.signatures.tenant.signed_at },
              ].filter(Boolean).map((sig: { label: string; date: string } | null | false, i) => sig && (
                <div key={i} style={{ background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ok)" }}>{sig.label}</p>
                  <p style={{ fontSize: 11, color: "var(--text-2)", marginTop: 3 }}>{new Date(sig.date).toLocaleString("de-DE")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main HomeClient ───────────────────────────────────────────────────────────

export function HomeClient() {
  const router = useRouter();
  const [tab,              setTab]              = useState<Tab>("saved");
  const [savedProps,       setSavedProps]       = useState<Property[]>([]);
  const [activeProps,      setActiveProps]      = useState<Property[]>([]);
  const [contracts,        setContracts]        = useState<Contract[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [generating,       setGenerating]       = useState(false);

  const fetchSaved = useCallback(async () => {
    const ids: string[] = JSON.parse(localStorage.getItem("habino_saved") ?? "[]");
    if (!ids.length) { setSavedProps([]); return; }
    const res = await fetch("/api/properties/batch", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSavedProps(data.properties ?? []);
  }, []);

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contracts");
    if (!res.ok) return;
    const data = await res.json();
    const all: Contract[] = data.contracts ?? [];
    setContracts(all);
    setActiveProps(all.filter(c => ["active","signed"].includes(c.status) && c.property).map(c => c.property!).filter(Boolean));
  }, []);

  useEffect(() => {
    Promise.all([fetchSaved(), fetchContracts()]).finally(() => setLoading(false));
  }, [fetchSaved, fetchContracts]);

  async function handleGenerate(contractId: string) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContracts(prev => prev.map(c => c.id === contractId ? data.contract : c));
      setSelectedContract(data.contract);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  }

  function unsave(id: string) {
    const ids: string[] = JSON.parse(localStorage.getItem("habino_saved") ?? "[]");
    localStorage.setItem("habino_saved", JSON.stringify(ids.filter(x => x !== id)));
    setSavedProps(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "saved",      label: "Gespeichert",  count: savedProps.length  },
    { id: "properties", label: "Meine Objekte", count: activeProps.length },
    { id: "contracts",  label: "Verträge",      count: contracts.length   },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Page header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "24px 24px 20px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {greeting} 👋
              </h1>
              <p style={{ fontSize: 13.5, color: "var(--text-2)" }}>Dein persönliches Immobilien-Dashboard</p>
            </div>
            <Link href="/?q=Immobilie+inserieren" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 9,
              background: "var(--color-primary)", color: "white",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 3px 12px rgba(124,110,242,0.2)",
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Objekt inserieren
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
            {[
              { label: "Gespeichert",  value: savedProps.length,  icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
              { label: "Verträge",    value: contracts.length,   icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
              { label: "Aktiv",       value: activeProps.length,  icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={s.icon}/></svg>
                  </div>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <Link href="/?q=Immobilie+inserieren" style={{
            display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
            background: "var(--color-primary-light)", border: "1px solid rgba(124,110,242,0.2)",
            borderRadius: 12, textDecoration: "none", transition: "all 0.14s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,110,242,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,110,242,0.2)"; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Objekt inserieren</p>
              <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Neues Inserat anlegen</p>
            </div>
          </Link>
          <Link href="/?q=Vertrag+erstellen" style={{
            display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 12, textDecoration: "none", transition: "all 0.14s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)"; (e.currentTarget as HTMLElement).style.background = "var(--surface3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path strokeLinecap="round" d="M13 10V3"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Vertrag mit KI erstellen</p>
              <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Claude generiert den Vertrag</p>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, width: "fit-content", marginBottom: 20 }}>
          {TABS.map(({ id, label, count }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "7px 16px", borderRadius: 7, fontFamily: "inherit",
              fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
              display: "flex", alignItems: "center", gap: 7, transition: "all 0.12s",
              background: tab === id ? "var(--surface3)" : "transparent",
              color: tab === id ? "var(--text-1)" : "var(--text-2)",
              boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            }}>
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 20,
                  background: tab === id ? "var(--color-primary-light)" : "rgba(255,255,255,0.05)",
                  color: tab === id ? "var(--color-primary)" : "var(--text-3)",
                  border: tab === id ? "1px solid rgba(124,110,242,0.2)" : "1px solid var(--border)",
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: Gespeichert */}
        {tab === "saved" && (
          savedProps.length === 0
            ? <EmptyState icon={<HeartIcon />} title="Noch keine Inserate gespeichert" text="Tippe auf das Herz-Symbol bei einem Inserat, um es hier zu speichern." action={{ label: "Inserate entdecken", href: "/search" }} />
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {savedProps.map(p => <HomePropertyCard key={p.id} property={p} onUnsave={() => unsave(p.id)} onClick={() => router.push(`/properties/${p.id}`)} />)}
              </div>
        )}

        {/* TAB: Meine Objekte */}
        {tab === "properties" && (
          activeProps.length === 0
            ? <EmptyState icon={<HomeIcon />} title="Keine aktiven Objekte" text="Objekte mit aktiven oder unterzeichneten Miet- oder Kaufverträgen erscheinen hier." action={{ label: "Vertrag erstellen", href: "/?q=Vertrag+erstellen" }} />
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {activeProps.map(p => <HomePropertyCard key={p.id} property={p} showActiveBadge onClick={() => router.push(`/properties/${p.id}`)} />)}
              </div>
        )}

        {/* TAB: Verträge */}
        {tab === "contracts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Link href="/?q=Vertrag+erstellen" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 8,
                background: "var(--color-primary)", color: "white",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Neuer KI-Vertrag
              </Link>
            </div>
            {contracts.length === 0
              ? <EmptyState icon={<DocIcon />} title="Noch keine Verträge" text="Lass den KI-Assistenten einen Miet- oder Kaufvertrag für dich erstellen." action={{ label: "Vertrag mit KI erstellen", href: "/?q=Vertrag+erstellen" }} />
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {contracts.map(c => <ContractRow key={c.id} contract={c} onClick={() => setSelectedContract(c)} />)}
                </div>
            }
          </div>
        )}
      </div>

      {selectedContract && (
        <ContractModal contract={selectedContract} onClose={() => setSelectedContract(null)} onGenerate={handleGenerate} generating={generating} />
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, text, action }: {
  icon: React.ReactNode; title: string; text: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "64px 24px", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
        {icon}
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{title}</p>
      <p style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 320, lineHeight: 1.6 }}>{text}</p>
      {action && (action.href
        ? <Link href={action.href} style={{ marginTop: 8, padding: "9px 18px", borderRadius: 9, background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{action.label}</Link>
        : <button onClick={action.onClick} style={{ marginTop: 8, padding: "9px 18px", borderRadius: 9, background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>{action.label}</button>
      )}
    </div>
  );
}

function HomePropertyCard({ property: p, onUnsave, showActiveBadge, onClick }: {
  property: Property; onUnsave?: () => void; showActiveBadge?: boolean; onClick: () => void;
}) {
  const image = thumb(p);
  return (
    <div onClick={onClick} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.16s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border2)"; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = ""; el.style.boxShadow = "none"; }}
    >
      <div style={{ position: "relative", height: 140, overflow: "hidden" }}>
        {image
          ? <Image src={image} alt={p.title} fill style={{ objectFit: "cover" }} sizes="400px" />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1A1A2E, #2A2040)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HomeIcon />
            </div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
        {showActiveBadge && (
          <div style={{ position: "absolute", top: 8, left: 8, fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(48,209,88,0.15)", color: "var(--ok)", border: "1px solid rgba(48,209,88,0.2)", backdropFilter: "blur(6px)" }}>Aktiv</div>
        )}
        {!showActiveBadge && (
          <div style={{ position: "absolute", top: 8, left: 8, fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: p.listing_type === "rent" ? "var(--color-primary-light)" : "rgba(48,209,88,0.12)", color: p.listing_type === "rent" ? "var(--color-primary)" : "var(--ok)", border: `1px solid ${p.listing_type === "rent" ? "rgba(124,110,242,0.25)" : "rgba(48,209,88,0.2)"}`, backdropFilter: "blur(6px)" }}>
            {p.listing_type === "rent" ? "Miete" : "Kauf"}
          </div>
        )}
        {onUnsave && (
          <button onClick={e => { e.stopPropagation(); onUnsave(); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(6px)" }}>
            <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          {fmt(p.price, p.currency)}{p.listing_type === "rent" && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-2)", marginLeft: 3 }}>/Mo</span>}
        </p>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
        <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{p.city}{p.neighbourhood ? ` · ${p.neighbourhood}` : ""}</p>
        {(p.bedrooms || p.bathrooms || p.area_sqm) && (
          <div style={{ display: "flex", gap: 10, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-3)" }}>
            {p.bedrooms  && <span>{p.bedrooms} Zi</span>}
            {p.bathrooms && <span>{p.bathrooms} Bad</span>}
            {p.area_sqm  && <span>{p.area_sqm} m²</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ContractRow({ contract: c, onClick }: { contract: Contract; onClick: () => void }) {
  const st = STATUS_STYLE[c.status];
  const prop = c.property;

  const progress = (() => {
    if (!["active","signed"].includes(c.status) || !c.end_date) return null;
    const start = new Date(c.start_date).getTime(), end = new Date(c.end_date).getTime(), now = Date.now();
    if (end <= start) return null;
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  })();

  return (
    <div onClick={onClick} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, cursor: "pointer", transition: "all 0.14s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border2)"; el.style.transform = "translateX(2px)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
        <div style={{ width: 52, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--surface3)" }}>
          {prop?.images?.[0]?.url
            ? <Image src={prop.images[0].url} alt={prop.title ?? ""} width={52} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><HomeIcon /></div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{CONTRACT_TYPE_LABELS[c.contract_type]}</span>
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prop?.title ?? `Vertrag ${c.id.slice(0,8)}`}</p>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
            {new Date(c.start_date).toLocaleDateString("de-DE")}{c.end_date ? ` → ${new Date(c.end_date).toLocaleDateString("de-DE")}` : " · Unbefristet"}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {c.monthly_rent && <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{fmt(c.monthly_rent, c.currency)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-3)" }}>/Mo</span></p>}
          {c.purchase_price && <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{fmt(c.purchase_price, c.currency)}</p>}
          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{c.country_code}</p>
        </div>
      </div>
      {progress !== null && (
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{progress}% abgelaufen</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{100 - progress}% verbleibend</span>
          </div>
          <div style={{ height: 4, background: "var(--surface3)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${progress}%`, background: "var(--color-primary)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small icons ───────────────────────────────────────────────────────────────

function HeartIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>; }
function HomeIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function DocIcon()  { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
