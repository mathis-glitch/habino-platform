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
  const params     = await searchParams;
  const headersList = await headers();
  const tenantId   = headersList.get("x-tenant-id");

  const listingType = (params.type as ListingType) || null;
  const page        = parseInt(params.page || "1", 10);
  const limit       = 12;

  let properties: Property[] = [];

  if (tenantId) {
    const supabase = createServiceClient();

    let query = supabase
      .from("properties")
      .select("*, images:property_images(id, url, sort_order)")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (listingType) {
      query = query.eq("listing_type", listingType);
    }

    const { data } = await query;
    properties = (data as Property[]) || [];
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero section */}
        <section className="bg-secondary py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Find your next property
            </h1>
            <p className="text-slate-300 mb-8 text-lg">
              AI-powered search. Verified listings. Market insights.
            </p>
            <SearchBar />
          </div>
        </section>

        {/* Filter strip */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !listingType
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={!listingType ? { backgroundColor: "var(--color-primary)" } : {}}
            >
              All
            </Link>
            <Link
              href="/?type=buy"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                listingType === "buy"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={listingType === "buy" ? { backgroundColor: "var(--color-primary)" } : {}}
            >
              Buy
            </Link>
            <Link
              href="/?type=rent"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                listingType === "rent"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={listingType === "rent" ? { backgroundColor: "var(--color-primary)" } : {}}
            >
              Rent
            </Link>
          </div>
        </section>

        {/* Listings grid */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-800 text-lg">
              {listingType === "buy"
                ? "Properties for Sale"
                : listingType === "rent"
                ? "Properties for Rent"
                : "All Properties"}
              {properties.length > 0 && (
                <span className="text-slate-400 font-normal text-base ml-2">
                  ({properties.length} found)
                </span>
              )}
            </h2>
            <Link href="/market" className="text-sm text-primary font-medium hover:underline">
              Market Insights →
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <p className="text-lg">No properties listed yet.</p>
              <p className="text-sm mt-1">Check back soon or contact us to list yours.</p>
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
