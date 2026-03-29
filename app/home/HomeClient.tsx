"use client";

import { useEffect, useState, useCallback } from "react";
import { Property, Contract, ContractStatus, ContractType } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
// ContractType used in CONTRACT_TYPE_LABELS below — keep import

// Chat redirect URL for starting the contract wizard
const CONTRACT_CHAT_URL = "/?q=Create+a+contract";

// ── Helpers ───────────────────────────────────────────────────
function fmt(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

function thumb(property: Property) {
  return property.images?.[0]?.url ?? null;
}

const STATUS_COLORS: Record<ContractStatus, string> = {
  draft:               "bg-slate-100 text-slate-600",
  pending_review:      "bg-yellow-100 text-yellow-700",
  pending_signature:   "bg-blue-100 text-blue-700",
  signed:              "bg-indigo-100 text-indigo-700",
  active:              "bg-green-100 text-green-700",
  expired:             "bg-slate-100 text-slate-500",
  terminated:          "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft:               "Draft",
  pending_review:      "In Review",
  pending_signature:   "Awaiting Signature",
  signed:              "Signed",
  active:              "Active",
  expired:             "Expired",
  terminated:          "Terminated",
};

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  residential_rental:  "Residential Rental",
  commercial_rental:   "Commercial Lease",
  purchase:            "Purchase Agreement",
  option_to_purchase:  "Option to Purchase",
  short_term_rental:   "Short-Term Rental",
};

// ── Tab type ──────────────────────────────────────────────────
type Tab = "saved" | "properties" | "contracts";

// ── Contract Detail Modal ─────────────────────────────────────
function ContractModal({
  contract,
  onClose,
  onGenerate,
  generating,
}: {
  contract: Contract;
  onClose: () => void;
  onGenerate: (id: string) => void;
  generating: boolean;
}) {
  const clauses = contract.contract_data?.clauses ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[contract.status]}`}>
                {STATUS_LABELS[contract.status]}
              </span>
              <span className="text-xs text-slate-400">{CONTRACT_TYPE_LABELS[contract.contract_type]}</span>
            </div>
            <h2 className="font-semibold text-slate-800 mt-1">
              {contract.property?.title ?? "Contract"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-6">

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Landlord / Vendor</p>
              <p className="font-medium text-slate-800 text-sm">{contract.landlord_name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{contract.landlord_email}</p>
              {contract.landlord_address && <p className="text-slate-400 text-xs mt-0.5">{contract.landlord_address}</p>}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Tenant / Purchaser</p>
              <p className="font-medium text-slate-800 text-sm">{contract.tenant_name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{contract.tenant_email}</p>
              {contract.tenant_address && <p className="text-slate-400 text-xs mt-0.5">{contract.tenant_address}</p>}
            </div>
          </div>

          {/* Key terms */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            {contract.monthly_rent && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Monthly Rent</p>
                <p className="font-semibold text-slate-800 mt-0.5">{fmt(contract.monthly_rent, contract.currency)}</p>
              </div>
            )}
            {contract.purchase_price && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Purchase Price</p>
                <p className="font-semibold text-slate-800 mt-0.5">{fmt(contract.purchase_price, contract.currency)}</p>
              </div>
            )}
            {contract.deposit_amount && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Security Deposit</p>
                <p className="font-semibold text-slate-800 mt-0.5">{fmt(contract.deposit_amount, contract.currency)}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">Start Date</p>
              <p className="font-semibold text-slate-800 mt-0.5">{new Date(contract.start_date).toLocaleDateString()}</p>
            </div>
            {contract.end_date && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">End Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">{new Date(contract.end_date).toLocaleDateString()}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">Governing Law</p>
              <p className="font-semibold text-slate-800 mt-0.5 text-xs">{contract.governing_law ?? contract.country_code}</p>
            </div>
          </div>

          {/* AI Generate */}
          {contract.status === "draft" && (
            <div className="border border-dashed border-slate-200 rounded-xl p-5 flex flex-col gap-3 items-center text-center">
              <div className="text-2xl">✨</div>
              <p className="text-sm font-medium text-slate-700">Generate AI Contract</p>
              <p className="text-xs text-slate-400">
                Claude will draft a full, jurisdiction-compliant contract based on the details above.
                This takes about 15–30 seconds.
              </p>
              <button
                onClick={() => onGenerate(contract.id)}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {generating && <LoadingSpinner className="h-4 w-4" />}
                {generating ? "Generating…" : "Generate Contract"}
              </button>
            </div>
          )}

          {/* Clauses */}
          {clauses.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-slate-800">Contract Clauses</h3>
              {clauses.map((clause, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-slate-800 text-sm">{clause.title}</p>
                    {clause.type === "jurisdiction_specific" && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Jurisdiction-specific</span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{clause.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Jurisdiction note */}
          {contract.contract_data?.jurisdiction_notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
              <strong>Legal Note:</strong> {contract.contract_data.jurisdiction_notes}
            </div>
          )}

          {/* Signatures */}
          {(contract.signatures?.landlord || contract.signatures?.tenant) && (
            <div className="grid grid-cols-2 gap-3">
              {contract.signatures.landlord && (
                <div className="bg-green-50 rounded-xl p-3 text-xs">
                  <p className="font-medium text-green-800">Landlord signed</p>
                  <p className="text-green-600 mt-0.5">{new Date(contract.signatures.landlord.signed_at).toLocaleString()}</p>
                </div>
              )}
              {contract.signatures.tenant && (
                <div className="bg-green-50 rounded-xl p-3 text-xs">
                  <p className="font-medium text-green-800">Tenant signed</p>
                  <p className="text-green-600 mt-0.5">{new Date(contract.signatures.tenant.signed_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main HomeClient ───────────────────────────────────────────
export function HomeClient() {
  const router = useRouter();
  const [tab,           setTab]           = useState<Tab>("saved");
  const [savedProps,    setSavedProps]    = useState<Property[]>([]);
  const [activeProps,   setActiveProps]   = useState<Property[]>([]);
  const [contracts,     setContracts]     = useState<Contract[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [generating,    setGenerating]    = useState(false);

  // ── Fetch saved properties ──────────────────────────────────
  const fetchSaved = useCallback(async () => {
    const ids: string[] = JSON.parse(localStorage.getItem("habino_saved") ?? "[]");
    if (!ids.length) { setSavedProps([]); return; }
    const res = await fetch("/api/properties/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSavedProps(data.properties ?? []);
  }, []);

  // ── Fetch contracts ─────────────────────────────────────────
  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contracts");
    if (!res.ok) return;
    const data = await res.json();
    const all: Contract[] = data.contracts ?? [];
    setContracts(all);
    // Active properties = properties linked to active/signed contracts where user is tenant
    const active = all
      .filter((c) => ["active", "signed"].includes(c.status) && c.property)
      .map((c) => c.property!)
      .filter(Boolean);
    setActiveProps(active);
  }, []);

  useEffect(() => {
    Promise.all([fetchSaved(), fetchContracts()]).finally(() => setLoading(false));
  }, [fetchSaved, fetchContracts]);

  // ── AI generate for existing draft ─────────────────────────
  async function handleGenerate(contractId: string) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update contract in list
      setContracts((prev) => prev.map((c) => c.id === contractId ? data.contract : c));
      setSelectedContract(data.contract);
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  }

  // ── Unsave ──────────────────────────────────────────────────
  function unsave(id: string) {
    const ids: string[] = JSON.parse(localStorage.getItem("habino_saved") ?? "[]");
    const next = ids.filter((x) => x !== id);
    localStorage.setItem("habino_saved", JSON.stringify(next));
    setSavedProps((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </main>
    );
  }

  // Greeting helper
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Greeting hero — forest green matching Figma dashboard ── */}
      <div className="px-5 pt-6 pb-14 text-white"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #235f35) 100%)" }}>
        <h1 className="font-bold text-2xl">{greeting} 👋</h1>
        <p className="text-white/75 text-sm mt-1">Your personal property dashboard</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">

        {/* ── Stats row — first card green-filled like Figma ─────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Saved",      value: savedProps.length,  primary: true },
            { label: "Contracts",  value: contracts.length,   primary: false },
            { label: "Active",     value: activeProps.length, primary: false },
          ].map(({ label, value, primary }) => (
            <div key={label}
              className={`rounded-xl p-3 shadow-sm border text-center transition-colors ${
                primary
                  ? "border-transparent text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              style={primary ? { backgroundColor: "var(--color-primary)" } : {}}>
              <div className={`font-black text-2xl ${primary ? "text-white" : "text-slate-900"}`}>{value}</div>
              <div className={`text-[11px] font-medium mt-0.5 ${primary ? "text-white/80" : "text-slate-500"}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/?q=List+my+property"
            className="flex items-center gap-3 p-4 rounded-xl text-white shadow-sm active:scale-[0.98] transition-all"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg shrink-0">🏠</div>
            <span className="text-sm font-semibold leading-snug">List a property</span>
          </Link>
          <Link
            href={CONTRACT_CHAT_URL}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-[0.98] transition-all hover:border-slate-300"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">📄</div>
            <span className="text-sm font-semibold text-slate-800 leading-snug">Create a contract</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm mb-6 w-fit">
          {([
            { id: "saved",      label: "Saved",        count: savedProps.length },
            { id: "properties", label: "My Properties", count: activeProps.length },
            { id: "contracts",  label: "Contracts",    count: contracts.length },
          ] as { id: Tab; label: string; count: number }[]).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                tab === id
                  ? "text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              style={tab === id ? { backgroundColor: "var(--color-primary)" } : {}}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: Saved ──────────────────────────────────────── */}
        {tab === "saved" && (
          <div>
            {savedProps.length === 0 ? (
              <EmptyState
                icon="🔖"
                title="No saved listings yet"
                text="Tap the bookmark icon on any listing to save it here."
                action={{ label: "Browse listings", href: "/search" }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {savedProps.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    onUnsave={() => unsave(p.id)}
                    onClick={() => router.push(`/properties/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: My Properties ─────────────────────────────── */}
        {tab === "properties" && (
          <div>
            {activeProps.length === 0 ? (
              <EmptyState
                icon="🏠"
                title="No active properties"
                text="Properties linked to your active or signed rental/purchase contracts will appear here."
                action={{ label: "Create a contract", href: CONTRACT_CHAT_URL }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {activeProps.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    showContractBadge
                    onClick={() => router.push(`/properties/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Contracts ─────────────────────────────────── */}
        {tab === "contracts" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</p>
              <Link
                href={CONTRACT_CHAT_URL}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span>✨</span> New Contract via AI
              </Link>
            </div>

            {contracts.length === 0 ? (
              <EmptyState
                icon="📄"
                title="No contracts yet"
                text="Let the AI guide you through creating a rental or purchase contract — just talk to it."
                action={{ label: "Create contract with AI ✨", href: CONTRACT_CHAT_URL }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {contracts.map((c) => (
                  <ContractRow
                    key={c.id}
                    contract={c}
                    onClick={() => setSelectedContract(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contract detail modal */}
      {selectedContract && (
        <ContractModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────
function EmptyState({
  icon, title, text, action,
}: {
  icon: string;
  title: string;
  text: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-slate-400 text-sm max-w-xs">{text}</p>
      {action && (
        action.href ? (
          <Link href={action.href}
            className="mt-2 px-5 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick}
            className="mt-2 px-5 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

function PropertyCard({
  property: p,
  onUnsave,
  showContractBadge,
  onClick,
}: {
  property: Property;
  onUnsave?: () => void;
  showContractBadge?: boolean;
  onClick: () => void;
}) {
  const image = thumb(p);
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
    >
      {/* Image */}
      <div className="relative h-[148px] bg-slate-100">
        {image ? (
          <Image src={image} alt={p.title} fill className="object-cover" sizes="400px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🏠</div>
        )}
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        {showContractBadge && (
          <div
            className="absolute top-2.5 left-2.5 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Active
          </div>
        )}
        {onUnsave && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnsave(); }}
            className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
            title="Remove from saved"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
        {/* Type badge bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-[11px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {p.listing_type === "rent" ? "For Rent" : "For Sale"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-[15px] font-semibold text-slate-900 truncate leading-snug">{p.title}</p>
        <p className="text-[13px] text-slate-400 mt-0.5 truncate">
          {p.city}{p.neighbourhood ? ` · ${p.neighbourhood}` : ""}
        </p>
        {/* Specs row */}
        {(p.bedrooms || p.bathrooms || p.area_sqm) && (
          <div className="flex items-center gap-3 mt-2 text-[12px] text-slate-500">
            {p.bedrooms && <span>{p.bedrooms} bed</span>}
            {p.bathrooms && <span>{p.bathrooms} bath</span>}
            {p.area_sqm && <span>{p.area_sqm} m²</span>}
          </div>
        )}
        <p className="text-[16px] font-bold mt-2" style={{ color: "var(--color-primary)" }}>
          {fmt(p.price, p.currency)}
          {p.listing_type === "rent" && <span className="text-slate-400 font-normal text-[12px] ml-1">/mo</span>}
        </p>
      </div>
    </div>
  );
}

function ContractRow({ contract: c, onClick }: { contract: Contract; onClick: () => void }) {
  const prop = c.property;

  // Progress % for active/signed contracts with defined end date
  const progress = (() => {
    if (!["active", "signed"].includes(c.status) || !c.end_date) return null;
    const start = new Date(c.start_date).getTime();
    const end   = new Date(c.end_date).getTime();
    const now   = Date.now();
    if (end <= start) return null;
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  })();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100/80 cursor-pointer transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Thumb */}
        <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
          {prop?.images?.[0]?.url ? (
            <Image src={prop.images[0].url} alt={prop.title ?? ""} width={60} height={60} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl">🏠</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
              {STATUS_LABELS[c.status]}
            </span>
            <span className="text-[11px] text-slate-400">{CONTRACT_TYPE_LABELS[c.contract_type]}</span>
          </div>
          <p className="text-[14px] font-semibold text-slate-900 truncate leading-tight">
            {prop?.title ?? `Contract ${c.id.slice(0, 8)}`}
          </p>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {new Date(c.start_date).toLocaleDateString()}
            {c.end_date ? ` → ${new Date(c.end_date).toLocaleDateString()}` : " · Open-ended"}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          {c.monthly_rent && (
            <p className="text-[14px] font-bold" style={{ color: "var(--color-primary)" }}>
              {fmt(c.monthly_rent, c.currency)}
              <span className="text-slate-400 font-normal text-[11px]">/mo</span>
            </p>
          )}
          {c.purchase_price && (
            <p className="text-[14px] font-bold" style={{ color: "var(--color-primary)" }}>
              {fmt(c.purchase_price, c.currency)}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">{c.country_code}</p>
        </div>
      </div>

      {/* Progress bar — active contracts only */}
      {progress !== null && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-400">{progress}% elapsed</span>
            <span className="text-[11px] text-slate-400">{100 - progress}% remaining</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: "var(--color-primary)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
