import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { MarketInsightWidget } from "@/components/market/MarketInsightWidget";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { Property } from "@/lib/types";
import { formatPrice, formatArea } from "@/lib/utils";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }      = await params;
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  if (!tenantId) notFound();

  const supabase = createServiceClient();

  // Fetch property
  const { data: property } = await supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();

  if (!property) notFound();

  // Sort images
  const images = (property.images || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  const hero = images[0]?.url || null;

  // Similar listings
  const { data: similar } = await supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("listing_type", property.listing_type)
    .eq("city", property.city)
    .neq("id", id)
    .limit(3);

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href={`/?type=${property.listing_type}`} className="hover:text-primary capitalize">
            {property.listing_type === "buy" ? "For Sale" : "For Rent"}
          </Link>
          <span>/</span>
          <span className="text-slate-700 line-clamp-1">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column: images + details ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Hero image */}
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-slate-200">
              {hero ? (
                <Image
                  src={hero}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge variant={property.listing_type === "buy" ? "info" : "success"} className="text-sm">
                  {property.listing_type === "buy" ? "For Sale" : "For Rent"}
                </Badge>
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(1).map((img: { id: string; url: string }) => (
                  <div key={img.id} className="relative h-20 w-28 shrink-0 rounded-lg overflow-hidden bg-slate-200">
                    <Image src={img.url} alt="" fill className="object-cover" sizes="112px" />
                  </div>
                ))}
              </div>
            )}

            {/* Title + price */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
              <p className="text-slate-500 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {[property.address, property.neighbourhood, property.city].filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Price */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatPrice(property.price, property.currency)}
                  {property.listing_type === "rent" && (
                    <span className="text-lg font-normal text-slate-400">/mo</span>
                  )}
                </p>
                {property.area_sqm && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatPrice(Math.round(property.price / property.area_sqm), property.currency)}/m²
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-sm capitalize">{property.property_type}</Badge>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-3">
              {property.bedrooms > 0 && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{property.bedrooms}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bedrooms</p>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{property.bathrooms}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bathrooms</p>
                </div>
              )}
              {property.area_sqm && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{property.area_sqm}</p>
                  <p className="text-xs text-slate-500 mt-0.5">m²</p>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-2">About this property</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* AI Valuation widget */}
            {property.city && (
              <MarketInsightWidget
                location={property.neighbourhood ? `${property.neighbourhood}, ${property.city}` : property.city}
                propertyType={property.property_type}
                areaSqm={property.area_sqm}
              />
            )}
          </div>

          {/* ── Right column: agent + contact ── */}
          <div className="flex flex-col gap-4">

            {/* Agent card */}
            {(property.agent_name || property.agent_phone || property.agent_email) && (
              <div className="card p-5 sticky top-20">
                <h3 className="font-semibold text-slate-800 mb-4">Contact Agent</h3>

                {property.agent_name && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                         style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, white)" }}>
                      <span className="text-primary font-bold text-sm">
                        {property.agent_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{property.agent_name}</p>
                      <p className="text-xs text-slate-500">Listing Agent</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {property.agent_phone && (
                    <a
                      href={`tel:${property.agent_phone}`}
                      className="btn-primary w-full py-2.5 rounded-lg text-sm text-center"
                    >
                      📞 {property.agent_phone}
                    </a>
                  )}
                  {property.agent_email && (
                    <a
                      href={`mailto:${property.agent_email}?subject=Enquiry: ${encodeURIComponent(property.title)}`}
                      className="btn-secondary w-full py-2.5 rounded-lg text-sm text-center"
                    >
                      Email Agent
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="card p-4 text-center">
              <p className="text-sm text-slate-500">Share this listing</p>
              <CopyLinkButton />
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similar && similar.length > 0 && (
          <section className="mt-14">
            <h2 className="font-semibold text-slate-800 text-lg mb-5">Similar properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(similar as Property[]).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
