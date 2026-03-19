import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { SearchBar } from "@/components/properties/SearchBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Property, ListingType } from "@/lib/types";
import Link from "next/link";

interface HomePageProps {
  searchParams: Promise<{ type?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params      = await searchParams;
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  const listingType = (params.type as ListingType) || null;
  const page        = parseInt(params.page || "1", 10);
  const limit       = 12;

  let properties: Property[]     = [];
  let totalCount: number         = 0;

  if (tenantId) {
    const supabase = createServiceClient();

    let query = supabase
      .from("properties")
      .select("*, images:property_images(id, url, sort_order)", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (listingType) query = query.eq("listing_type", listingType);

    const { data, count } = await query;
    properties = (data as Property[]) || [];
    totalCount = count || 0;
  }

  const filterBtn = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
      style={active ? { backgroundColor: "var(--color-primary)" } : {}}
    >
      {label}
    </Link>
  );

  return (
    <>
      <Header />
      <main>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section
          className="relative py-20 px-4 overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-secondary) 0%, color-mix(in srgb, var(--color-secondary) 80%, var(--color-primary)) 100%)" }}
        >
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

          <div className="relative max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered Real Estate Platform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Find your perfect<br />
                <span style={{ color: "var(--color-primary)" }}>property</span>
              </h1>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Smart search, verified listings, and real-time market intelligence — all in one place.
              </p>
              <SearchBar />
            </div>

            {/* Stats row */}
            {totalCount > 0 && (
              <div className="flex flex-wrap gap-6 mt-10 pt-10 border-t border-white/10">
                {[
                  { value: `${totalCount}+`, label: "Active listings" },
                  { value: "AI", label: "Market insights" },
                  { value: "Free", label: "To browse" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-slate-400 text-sm">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Filter strip ─────────────────────────────────────── */}
        <section className="bg-white border-b border-slate-200 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
            {filterBtn("/",          "All",  !listingType)}
            {filterBtn("/?type=buy", "Buy",  listingType === "buy")}
            {filterBtn("/?type=rent","Rent", listingType === "rent")}
            <div className="ml-auto">
              <Link href="/search" className="text-sm text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                Advanced search
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Listings grid ─────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-800 text-lg">
              {listingType === "buy" ? "For Sale" : listingType === "rent" ? "For Rent" : "All Properties"}
              {properties.length > 0 && (
                <span className="text-slate-400 font-normal text-base ml-2">· {totalCount} listed</span>
              )}
            </h2>
            <Link href="/market" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
              Market Insights →
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No properties listed yet</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon or contact us to list yours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
