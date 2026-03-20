import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Property, ListingType, PropertyType } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";
import { SearchClient } from "./SearchClient";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    property_type?: string;
    min_price?: string;
    max_price?: string;
    bedrooms?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params      = await searchParams;
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  const query        = params.q || "";
  const listingType  = (params.type as ListingType) || undefined;
  const propertyType = (params.property_type as PropertyType) || undefined;
  const minPrice     = params.min_price ? parseInt(params.min_price) : undefined;
  const maxPrice     = params.max_price ? parseInt(params.max_price) : undefined;
  const bedrooms     = params.bedrooms  ? parseInt(params.bedrooms)  : undefined;
  const sort         = params.sort || "newest";
  const page         = parseInt(params.page || "1");
  const limit        = 18;

  let properties: Property[] = [];
  let total = 0;

  if (tenantId) {
    const supabase = createServiceClient();
    const offset   = (page - 1) * limit;

    let dbQuery = supabase
      .from("properties")
      .select("*, images:property_images(id, url, sort_order)", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .range(offset, offset + limit - 1);

    if (query) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,city.ilike.%${query}%,neighbourhood.ilike.%${query}%,description.ilike.%${query}%`
      );
    }
    if (listingType)  dbQuery = dbQuery.eq("listing_type",  listingType);
    if (propertyType) dbQuery = dbQuery.eq("property_type", propertyType);
    if (minPrice)     dbQuery = dbQuery.gte("price", minPrice);
    if (maxPrice)     dbQuery = dbQuery.lte("price", maxPrice);
    if (bedrooms)     dbQuery = dbQuery.gte("bedrooms", bedrooms);

    if (sort === "price_asc")  dbQuery = dbQuery.order("price", { ascending: true });
    else if (sort === "price_desc") dbQuery = dbQuery.order("price", { ascending: false });
    else dbQuery = dbQuery.order("created_at", { ascending: false });

    const { data, count } = await dbQuery;
    properties = (data as Property[]) || [];
    total      = count || 0;
  }

  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      q: query || undefined,
      type: listingType,
      property_type: propertyType,
      min_price: minPrice?.toString(),
      max_price: maxPrice?.toString(),
      bedrooms: bedrooms?.toString(),
      sort,
      ...overrides,
    };
    Object.entries(base).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/search?${p.toString()}`;
  }

  const activeFilters: { label: string; removeUrl: string }[] = [];
  if (query)        activeFilters.push({ label: `"${query}"`,                     removeUrl: buildUrl({ q: undefined, page: "1" }) });
  if (listingType)  activeFilters.push({ label: listingType === "buy" ? "For Sale" : "For Rent", removeUrl: buildUrl({ type: undefined, page: "1" }) });
  if (propertyType) activeFilters.push({ label: propertyType,                     removeUrl: buildUrl({ property_type: undefined, page: "1" }) });
  if (bedrooms)     activeFilters.push({ label: `${bedrooms}+ bed`,               removeUrl: buildUrl({ bedrooms: undefined, page: "1" }) });
  if (minPrice)     activeFilters.push({ label: `From ${minPrice}`,               removeUrl: buildUrl({ min_price: undefined, page: "1" }) });
  if (maxPrice)     activeFilters.push({ label: `Up to ${maxPrice}`,              removeUrl: buildUrl({ max_price: undefined, page: "1" }) });

  return (
    <>
      <Header />

      {/* ── Hero search bar ───────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-4 px-4 sticky top-14 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto">
          {/* Search input */}
          <form action="/search" method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                defaultValue={query}
                placeholder="City, neighbourhood, or keyword…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50"
              />
            </div>
            <button type="submit"
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Search
            </button>
          </form>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {/* Listing type */}
            {(["buy", "rent"] as ListingType[]).map((t) => (
              <Link key={t}
                href={buildUrl({ type: listingType === t ? undefined : t, page: "1" })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  listingType === t ? "text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                style={listingType === t ? { backgroundColor: "var(--color-primary)" } : {}}>
                {t === "buy" ? "🏷️ For Sale" : "🔑 For Rent"}
              </Link>
            ))}
            {/* Property types */}
            {(["apartment", "house", "commercial", "land"] as PropertyType[]).map((pt) => {
              const icons: Record<string, string> = { apartment: "🏢", house: "🏡", commercial: "🏬", land: "🌿" };
              const labels: Record<string, string> = { apartment: "Apartments", house: "Houses", commercial: "Commercial", land: "Land" };
              return (
                <Link key={pt}
                  href={buildUrl({ property_type: propertyType === pt ? undefined : pt, page: "1" })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    propertyType === pt ? "text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                  style={propertyType === pt ? { backgroundColor: "var(--color-primary)" } : {}}>
                  {icons[pt]} {labels[pt]}
                </Link>
              );
            })}
            {/* Bedrooms */}
            {(["1", "2", "3", "4+"] as string[]).map((b) => {
              const val = b === "4+" ? "4" : b;
              const active = bedrooms?.toString() === val;
              return (
                <Link key={b}
                  href={buildUrl({ bedrooms: active ? undefined : val, page: "1" })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    active ? "text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                  style={active ? { backgroundColor: "var(--color-primary)" } : {}}>
                  🛏 {b} bed
                </Link>
              );
            })}
            {/* AI Chat link */}
            <Link href="/?q=Search+for+properties"
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors flex items-center gap-1">
              ✨ Ask AI
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Suspense>
          <SearchClient
            properties={properties}
            total={total}
            page={page}
            totalPages={totalPages}
            query={query}
            listingType={listingType}
            sort={sort}
            activeFilters={activeFilters}
            buildUrl={buildUrl}
          />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
