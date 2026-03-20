"use client";

import { useEffect, useState, useCallback } from "react";
import { Property, Contract, ContractStatus, ContractType } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

// ── New Contract Form ─────────────────────────────────────────
function NewContractForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const COUNTRIES = [
    { code: "KE", label: "Kenya" }, { code: "NG", label: "Nigeria" },
    { code: "GH", label: "Ghana" }, { code: "ZA", label: "South Africa" },
    { code: "AE", label: "UAE"   }, { code: "DE", label: "Germany" },
    { code: "GB", label: "United Kingdom" }, { code: "FR", label: "France" },
    { code: "ES", label: "Spain"  }, { code: "US", label: "United States" },
  ];
  const CURRENCIES = ["KES", "USD", "EUR", "GBP", "AED", "NGN", "ZAR", "GHS"];

  const [step, setStep]     = useState<"details" | "generating">("details");
  const [error, setError]   = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    property_id:        "",
    contract_type:      "residential_rental" as ContractType,
    landlord_name:      "",
    landlord_email:     "",
    landlord_address:   "",
    tenant_name:        "",
    tenant_email:       "",
    tenant_address:     "",
    tenant_id_number:   "",
    start_date:         "",
    end_date:           "",
    notice_period_days: "30",
    monthly_rent:       "",
    deposit_amount:     "",
    purchase_price:     "",
    currency:           "USD",
    payment_day:        "1",
    country_code:       "KE",
    language:           "en",
    furnished:          false,
    pets_allowed:       false,
    subletting_allowed: false,
    notes:              "",
  });

  function u(k: string, v: string | boolean) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        notice_period_days: parseInt(form.notice_period_days),
        payment_day:        parseInt(form.payment_day),
        monthly_rent:       form.monthly_rent    ? parseFloat(form.monthly_rent)    : undefined,
        deposit_amount:     form.deposit_amount  ? parseFloat(form.deposit_amount)  : undefined,
        purchase_price:     form.purchase_price  ? parseFloat(form.purchase_price)  : undefined,
        end_date:           form.end_date        || undefined,
      };

      // 1. Create contract record
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const contractId = data.contract.id;
      setStep("generating");

      // 2. Trigger AI generation
      const genRes = await fetch(`/api/contracts/${contractId}/generate`, { method: "POST" });
      if (!genRes.ok) {
        const gd = await genRes.json();
        throw new Error(gd.error ?? "Generation failed");
      }

      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("details");
    } finally {
      setSaving(false);
    }
  }

  const isRental = ["residential_rental", "commercial_rental", "short_term_rental"].includes(form.contract_type);

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  if (step === "generating") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
          <LoadingSpinner className="h-10 w-10" />
          <p className="font-medium text-slate-800">Generating your contract…</p>
          <p className="text-sm text-slate-400">Claude is drafting a jurisdiction-compliant agreement. This takes ~20 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-slate-800">New Contract</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Contract type + property */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contract Type</label>
              <select value={form.contract_type} onChange={(e) => u("contract_type", e.target.value)} className={inputClass}>
                <option value="residential_rental">Residential Rental</option>
                <option value="commercial_rental">Commercial Lease</option>
                <option value="purchase">Purchase Agreement</option>
                <option value="short_term_rental">Short-Term Rental</option>
                <option value="option_to_purchase">Option to Purchase</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Property ID</label>
              <input required type="text" value={form.property_id}
                onChange={(e) => u("property_id", e.target.value)}
                placeholder="UUID of the property"
                className={inputClass} />
            </div>
          </div>

          {/* Parties */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Landlord / Vendor</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Name *</label>
                <input required value={form.landlord_name} onChange={(e) => u("landlord_name", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Email *</label>
                <input required type="email" value={form.landlord_email} onChange={(e) => u("landlord_email", e.target.value)} className={inputClass} /></div>
              <div className="col-span-2"><label className={labelClass}>Address</label>
                <input value={form.landlord_address} onChange={(e) => u("landlord_address", e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tenant / Purchaser</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Name *</label>
                <input required value={form.tenant_name} onChange={(e) => u("tenant_name", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Email *</label>
                <input required type="email" value={form.tenant_email} onChange={(e) => u("tenant_email", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Address</label>
                <input value={form.tenant_address} onChange={(e) => u("tenant_address", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>ID / Passport No.</label>
                <input value={form.tenant_id_number} onChange={(e) => u("tenant_id_number", e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelClass}>Start Date *</label>
              <input required type="date" value={form.start_date} onChange={(e) => u("start_date", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => u("end_date", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Notice Period (days)</label>
              <input type="number" min="0" value={form.notice_period_days} onChange={(e) => u("notice_period_days", e.target.value)} className={inputClass} /></div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Currency</label>
              <select value={form.currency} onChange={(e) => u("currency", e.target.value)} className={inputClass}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {isRental ? (
              <>
                <div><label className={labelClass}>Monthly Rent</label>
                  <input type="number" min="0" value={form.monthly_rent} onChange={(e) => u("monthly_rent", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Deposit</label>
                  <input type="number" min="0" value={form.deposit_amount} onChange={(e) => u("deposit_amount", e.target.value)} className={inputClass} /></div>
              </>
            ) : (
              <div className="col-span-2"><label className={labelClass}>Purchase Price</label>
                <input type="number" min="0" value={form.purchase_price} onChange={(e) => u("purchase_price", e.target.value)} className={inputClass} /></div>
            )}
          </div>

          {/* Jurisdiction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Country / Jurisdiction *</label>
              <select required value={form.country_code} onChange={(e) => u("country_code", e.target.value)} className={inputClass}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Contract Language</label>
              <select value={form.language} onChange={(e) => u("language", e.target.value)} className={inputClass}>
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-6">
            {[
              { key: "furnished",          label: "Furnished" },
              { key: "pets_allowed",       label: "Pets allowed" },
              { key: "subletting_allowed", label: "Subletting allowed" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => u(key, e.target.checked)} className="w-4 h-4 accent-primary" />
                {label}
              </label>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Special conditions / notes for AI</label>
            <textarea value={form.notes} onChange={(e) => u("notes", e.target.value)}
              rows={2} placeholder="Any special terms, restrictions, or conditions to include…"
              className={`${inputClass} resize-none`} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">{error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {saving && <LoadingSpinner className="h-4 w-4" />}
            Generate with AI ✨
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-slate-600 bg-slate-100 hover:bg-slate-200">
            Cancel
          </button>
        </div>
      </form>
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
  const [showNewContract,  setShowNewContract]  = useState(false);
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

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Home</h1>
          <p className="text-slate-500 text-sm mt-1">Your personal real estate dashboard</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-sm mb-6 w-fit">
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
                action={{ label: "Create a contract", onClick: () => setShowNewContract(true) }}
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
              <button
                onClick={() => setShowNewContract(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                + New Contract
              </button>
            </div>

            {contracts.length === 0 ? (
              <EmptyState
                icon="📄"
                title="No contracts yet"
                text="Create an AI-generated rental or purchase contract for any property."
                action={{ label: "Create contract", onClick: () => setShowNewContract(true) }}
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

      {/* Modals */}
      {selectedContract && (
        <ContractModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}

      {showNewContract && (
        <NewContractForm
          onClose={() => setShowNewContract(false)}
          onCreated={() => {
            setShowNewContract(false);
            fetchContracts();
            setTab("contracts");
          }}
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
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="relative h-36 bg-slate-100">
        {image ? (
          <Image src={image} alt={p.title} fill className="object-cover" sizes="400px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🏠</div>
        )}
        {showContractBadge && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            Active
          </div>
        )}
        {onUnsave && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnsave(); }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full w-7 h-7 flex items-center justify-center shadow text-slate-500 hover:text-red-500 transition-colors"
            title="Remove from saved"
          >
            ×
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-slate-800 text-sm truncate">{p.title}</p>
        <p className="text-slate-400 text-xs mt-0.5">{p.city}{p.neighbourhood ? ` · ${p.neighbourhood}` : ""}</p>
        <p className="text-sm font-bold mt-2" style={{ color: "var(--color-primary)" }}>
          {fmt(p.price, p.currency)}
          {p.listing_type === "rent" && <span className="text-slate-400 font-normal text-xs ml-1">/mo</span>}
        </p>
      </div>
    </div>
  );
}

function ContractRow({ contract: c, onClick }: { contract: Contract; onClick: () => void }) {
  const prop = c.property;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Property thumb */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        {prop?.images?.[0]?.url ? (
          <Image src={prop.images[0].url} alt={prop.title ?? ""} width={56} height={56} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl">🏠</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
            {STATUS_LABELS[c.status]}
          </span>
          <span className="text-xs text-slate-400">{CONTRACT_TYPE_LABELS[c.contract_type]}</span>
        </div>
        <p className="font-medium text-slate-800 text-sm mt-0.5 truncate">
          {prop?.title ?? `Contract ${c.id.slice(0, 8)}`}
        </p>
        <p className="text-slate-400 text-xs mt-0.5">
          {c.tenant_name} · {new Date(c.start_date).toLocaleDateString()}
          {c.end_date ? ` → ${new Date(c.end_date).toLocaleDateString()}` : " (open-ended)"}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        {c.monthly_rent && (
          <p className="font-semibold text-slate-800 text-sm">{fmt(c.monthly_rent, c.currency)}<span className="text-slate-400 font-normal text-xs">/mo</span></p>
        )}
        {c.purchase_price && (
          <p className="font-semibold text-slate-800 text-sm">{fmt(c.purchase_price, c.currency)}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">{c.country_code} · {c.language.toUpperCase()}</p>
      </div>
    </div>
  );
}
