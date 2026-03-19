import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { SearchBar } from "@/components/properties/SearchBar";
import { FilterPanel } from "../components/properties/FilterPanel";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Property, ListingType, PropertyType } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";

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

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

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
  const limit        = 12;

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

    // Text search across title, city, neighbourhood
    if (query) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,city.ilike.%${query}%,neighbourhood.ilike.%${query}%`
      );
    }

    if (listingType)  dbQuery = dbQuery.eq("listing_type",  listingType);
    if (propertyType) dbQuery = dbQuery.eq("property_type", propertyType);
    if (minPrice)     dbQuery = dbQuery.gte("price", minPrice);
    if (maxPrice)     dbQuery = dbQuery.lte("price", maxPrice);
    if (bedrooms)     dbQuery = dbQuery.eq("bedrooms", bedrooms);

    if (sort === "price_asc")  dbQuery = dbQuery.order("price", { ascending: true });
    else if (sort === "price_desc") dbQuery = dbQuery.order("price", { ascending: false });
    else dbQuery = dbQuery.order("created_at", { ascending: false });

    const { data, count } = await dbQuery;
    properties = (data as Property[]) || [];
    total      = count || 0;
  }

  const totalPages = Math.ceil(total / limit);

  // Build query string helper
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const base = { q: query, type: listingType, property_type: propertyType,
      min_price: minPrice?.toString(), max_price: maxPrice?.toString(),
      bedrooms: bedrooms?.toString(), sort, ...overrides };
    Object.entries(base).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/search?${p.toString()}`;
  }

  // Active filter chips
  const activeFilters: { label: string; removeUrl: string }[] = [];
  if (query)        activeFilters.push({ label: `"${query}"`,                    removeUrl: buildUrl({ q: undefined, page: "1" }) });
  if (listingType)  activeFilters.push({ label: listingType === "buy" ? "For Sale" : "For Rent", removeUrl: buildUrl({ type: undefined, page: "1" }) });
  if (propertyType) activeFilters.push({ label: propertyType,                    removeUrl: buildUrl({ property_type: undefined, page: "1" }) });
  if (bedrooms)     activeFilters.push({ label: `${bedrooms} bed+`,              removeUrl: buildUrl({ bedrooms: undefined, page: "1" }) });
  if (minPrice)     activeFilters.push({ label: `From ${minPrice}`,              removeUrl: buildUrl({ min_price: undefined, page: "1" }) });
  if (maxPrice)     activeFilters.push({ label: `Up to ${maxPrice}`,             removeUrl: buildUrl({ max_price: undefined, page: "1" }) });

  return (
    <>
      <Header />
      <main>
        {/* Search bar */}
        <section className="bg-secondary py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <SearchBar defaultValue={query} />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-8">
          {/* Results header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-bold text-slate-900 text-xl">
                {query ? `Results for "${query}"` : "All Properties"}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">{total} {total === 1 ? "property" : "properties"} found</p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Sort:</span>
              <div className="flex gap-1">
                {SORT_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value, page: "1" })}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      sort === opt.value
                        ? "text-white font-medium"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    style={sort === opt.value ? { backgroundColor: "var(--color-primary)" } : {}}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeFilters.map((f) => (
                <Link
                  key={f.label}
                  href={f.removeUrl}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100
                             text-slate-700 text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {f.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              ))}
              <Link href="/search" className="text-sm text-slate-400 hover:text-red-500 px-2 py-1 transition-colors">
                Clear all
              </Link>
            </div>
          )}

          {/* Quick filter strip + Filter Panel */}
          <div className="flex flex-wrap gap-2 mb-6 text-sm items-center">
            {(["buy", "rent"] as ListingType[]).map((t) => (
              <Link key={t} href={buildUrl({ type: listingType === t ? undefined : t, page: "1" })}
                className={`px-3 py-1.5 rounded-full capitalize transition-colors ${
                  listingType === t ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={listingType === t ? { backgroundColor: "var(--color-primary)" } : {}}>
                {t === "buy" ? "For Sale" : "For Rent"}
              </Link>
            ))}
            {(["1", "2", "3", "4"] as string[]).map((b) => (
              <Link key={b} href={buildUrl({ bedrooms: bedrooms?.toString() === b ? undefined : b, page: "1" })}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  bedrooms?.toString() === b ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={bedrooms?.toString() === b ? { backgroundColor: "var(--color-primary)" } : {}}>
                {b}+ bed
              </Link>
            ))}
            <Suspense>
              <FilterPanel />
            </Suspense>
          </div>

          {/* Results grid */}
          {properties.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <p className="text-lg">No properties match your search.</p>
              <Link href="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                ← Back to all listings
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm">
                      ← Previous
                    </Link>
                  )}
                  <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })}
                      className="px-4 py-2 rounded-lg text-white text-sm"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
