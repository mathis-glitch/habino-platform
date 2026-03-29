"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/app/tenant-provider";
import { Property } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

type StatusFilter = "all" | "active" | "pending" | "draft" | "closed";
type SortKey = "newest" | "price_asc" | "price_desc";

const STATUS_LABELS: Record<string, string> = {
  active: "Active", pending: "Pending", draft: "Draft",
  closed: "Closed", paused: "Paused",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  active:  { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  draft:   { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  closed:  { bg: "#f8fafc", text: "#94a3b8", border: "#e2e8f0" },
  paused:  { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Listing card ──────────────────────────────────────────────────────────────
function ListingCard({
  listing,
  onStatusChange,
}: {
  listing: Property;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hero = listing.images?.[0]?.url;
  const isActive = listing.status === "active";

  async function handleTogglePause() {
    const next = isActive ? "paused" : "active";
    onStatusChange(listing.id, next);
    setMenuOpen(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("properties").delete().eq("id", listing.id);
    onStatusChange(listing.id, "__deleted__");
  }

  if (deleting) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-sm)" }}>

      {/* Image */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {hero ? (
          <Image src={hero} alt={listing.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 50vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-200 text-5xl">🏠</div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white backdrop-blur-sm"
            style={{ background: listing.listing_type === "buy" ? "rgba(59,130,246,0.85)" : "rgba(46,125,70,0.85)" }}>
            {listing.listing_type === "buy" ? "For Sale" : "For Rent"}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={listing.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-lg font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>
          {fmt(listing.price, listing.currency)}
          {listing.listing_type === "rent" && <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>}
        </p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">{listing.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {[listing.neighbourhood, listing.city].filter(Boolean).join(", ")}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 mt-3 pt-3">
          {listing.bedrooms > 0 && <span>{listing.bedrooms} bd</span>}
          {listing.bathrooms > 0 && <span>· {listing.bathrooms} ba</span>}
          {listing.area_sqm && <span>· {listing.area_sqm} m²</span>}
          <span className="ml-auto text-[11px] text-slate-300">
            {new Date(listing.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Link href={`/admin/listings/${listing.id}`}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 text-center hover:bg-slate-50 transition-colors"
            style={{ boxShadow: "var(--shadow-xs)" }}>
            Edit
          </Link>
          <Link href={`/properties/${listing.id}`} target="_blank"
            className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 text-center hover:bg-slate-50 transition-colors"
            style={{ boxShadow: "var(--shadow-xs)" }}>
            View
          </Link>
          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              style={{ boxShadow: "var(--shadow-xs)" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 z-20 bg-white rounded-xl border border-slate-100 py-1 w-40"
                style={{ boxShadow: "var(--shadow-lg)" }}>
                <button onClick={handleTogglePause}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  {isActive ? "⏸ Pause listing" : "▶️ Reactivate"}
                </button>
                <button onClick={handleDelete}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  🗑 Delete listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-2 py-16 flex flex-col items-center text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-4xl"
        style={{ boxShadow: "var(--shadow-sm)" }}>
        🏠
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800">No listings yet</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          List your property in minutes using the AI wizard — just describe it in plain language.
        </p>
      </div>
      <Link href="/?q=List+my+property"
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all"
        style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 2px 10px rgba(46,125,70,0.25)" }}>
        <span>✨</span>
        List a property with AI
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyListingsPage() {
  const { tenant } = useTenant();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<StatusFilter>("all");
  const [sort,     setSort]     = useState<SortKey>("newest");

  useEffect(() => {
    if (!tenant?.id) return;
    const supabase = createClient();
    supabase
      .from("properties")
      .select("*, images:property_images(id, url, sort_order)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setListings((data as Property[]) ?? []);
        setLoading(false);
      });
  }, [tenant?.id]);

  function handleStatusChange(id: string, newStatus: string) {
    if (newStatus === "__deleted__") {
      setListings(ls => ls.filter(l => l.id !== id));
      return;
    }
    setListings(ls => ls.map(l => l.id === id ? { ...l, status: newStatus as Property["status"] } : l));
    const supabase = createClient();
    supabase.from("properties").update({ status: newStatus }).eq("id", id);
  }

  // Filter
  const filtered = listings.filter(l => filter === "all" || l.status === filter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc")  return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Counts
  const counts: Record<StatusFilter, number> = {
    all:     listings.length,
    active:  listings.filter(l => l.status === "active").length,
    // pending and closed don't exist in PropertyStatus — count as 0
    pending: listings.filter(l => (l.status as string) === "pending").length,
    draft:   listings.filter(l => l.status === "draft").length,
    closed:  listings.filter(l => (l.status as string) === "closed").length,
  };

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "active",  label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "draft",   label: "Draft" },
    { key: "closed",  label: "Closed" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-20" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl text-white">My Listings</h1>
          <Link href="/?q=List+my+property"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors">
            <span>+</span>
            New listing
          </Link>
        </div>
        {!loading && (
          <p className="text-white/40 text-xs mt-1">
            {counts.active} active · {listings.length} total
          </p>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 pb-10">

        {/* ── Filter + sort bar ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-3 mb-5 flex items-center gap-2 flex-wrap"
          style={{ boxShadow: "var(--shadow-md)" }}>
          {/* Status tabs */}
          <div className="flex gap-1 flex-1 flex-wrap">
            {FILTER_TABS.filter(t => counts[t.key] > 0 || t.key === "all").map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: filter === tab.key ? "var(--color-primary)" : "#f1f5f9",
                  color: filter === tab.key ? "white" : "#64748b",
                }}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className="ml-1.5 opacity-70">{counts[tab.key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none shrink-0">
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden animate-pulse"
                style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="h-44 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
                  <div className="h-3 bg-slate-100 rounded-lg w-full" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sorted.length === 0 ? (
              <EmptyState />
            ) : (
              sorted.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        )}

        {/* ── AI listing CTA ─────────────────────────────────── */}
        {!loading && listings.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100/80 p-5 flex items-center gap-4"
            style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Add another listing</p>
              <p className="text-xs text-slate-400 mt-0.5">Describe your property and the AI will list it in minutes.</p>
            </div>
            <Link href="/?q=List+my+property"
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 2px 8px rgba(46,125,70,0.25)" }}>
              List with AI
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
