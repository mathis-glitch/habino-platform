import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { ImageGallery } from "../../components/properties/ImageGallery";
import { BookingForm } from "../../components/properties/BookingForm";
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

  const { data: property } = await supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();

  if (!property) notFound();

  const images = (property.images || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const { data: similar } = await supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("listing_type", property.listing_type)
    .eq("city", property.city)
    .neq("id", id)
    .limit(3);

  const specs = [
    property.bedrooms  > 0 && { label: "Zimmer",    value: property.bedrooms },
    property.bathrooms > 0 && { label: "Bäder",     value: property.bathrooms },
    property.area_sqm  > 0 && { label: "m²",        value: property.area_sqm },
    property.floor     != null && { label: "Etage",  value: property.floor },
    property.parking   > 0 && { label: "Parkplätze", value: property.parking },
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">KI Agent</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary transition-colors">Immobilien</Link>
          <span>/</span>
          <Link href={`/search?type=${property.listing_type}`} className="hover:text-primary transition-colors capitalize">
            {property.listing_type === "buy" ? "Kaufen" : "Mieten"}
          </Link>
          <span>/</span>
          <span className="text-slate-600 line-clamp-1">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: images + details ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            <ImageGallery images={images} title={property.title} />

            {/* Title + location */}
            <div>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{property.title}</h1>
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-white shrink-0"
                  style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}>
                  {property.listing_type === "buy" ? "Kaufen" : "Mieten"}
                </span>
              </div>
              <p className="text-slate-500 mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {[property.address, property.neighbourhood, property.city].filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Price */}
            <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatPrice(property.price, property.currency)}
                  {property.listing_type === "rent" && (
                    <span className="text-lg font-normal text-slate-400 ml-1">/Monat</span>
                  )}
                </p>
                {property.area_sqm && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatPrice(Math.round(property.price / property.area_sqm), property.currency)}/m²
                  </p>
                )}
              </div>
              <span className="px-3 py-1.5 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 capitalize">
                {property.property_type}
              </span>
            </div>

            {/* Specs grid */}
            {specs.length > 0 && (
              <div className={`grid gap-3 ${specs.length >= 4 ? "grid-cols-4" : `grid-cols-${specs.length}`}`}>
                {specs.map(({ label, value }) => (
                  <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-3 text-base">Objektbeschreibung</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* Features */}
            {property.features?.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-3 text-base">Ausstattung</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f: string) => (
                    <span key={f} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-sm">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: contact + booking ── */}
          <div className="flex flex-col gap-4">

            {/* Price summary (mobile sticky) */}
            <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">
                {formatPrice(property.price, property.currency)}
                {property.listing_type === "rent" && (
                  <span className="text-base font-normal text-slate-400 ml-1">/Monat</span>
                )}
              </p>
              <p className="text-sm text-slate-400 mt-0.5 capitalize">{property.property_type} · {property.city}</p>
            </div>

            {/* Booking form */}
            <BookingForm propertyId={property.id} propertyTitle={property.title} />

            {/* Agent contact */}
            {(property.agent_name || property.agent_phone || property.agent_email) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 text-sm">Ansprechpartner</h3>
                {property.agent_name && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      {property.agent_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{property.agent_name}</p>
                      <p className="text-xs text-slate-400">Listing Agent</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {property.agent_phone && (
                    <a href={`tel:${property.agent_phone}`}
                      className="w-full py-2.5 rounded-xl text-sm text-center font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      📞 {property.agent_phone}
                    </a>
                  )}
                  {property.agent_email && (
                    <a href={`mailto:${property.agent_email}?subject=Anfrage: ${encodeURIComponent(property.title)}`}
                      className="w-full py-2.5 rounded-xl text-sm text-center font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                      E-Mail schreiben
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-slate-400 mb-2">Inserat teilen</p>
              <CopyLinkButton />
            </div>
          </div>
        </div>

        {/* Similar */}
        {similar && similar.length > 0 && (
          <section className="mt-14">
            <h2 className="font-semibold text-slate-800 text-lg mb-5">Ähnliche Inserate</h2>
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
