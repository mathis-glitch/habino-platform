import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { ImageGallery } from "../../components/properties/ImageGallery";
import { PhotoEditPanel } from "@/components/properties/PhotoEditPanel";
import { StickyContactBar, SaveButton } from "@/components/properties/PropertyDetailActions";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const PROP_TYPE_LABELS: Record<string, string> = {
  apartment:  "Wohnung",
  house:      "Haus",
  villa:      "Villa",
  commercial: "Gewerbe",
  office:     "Büro",
  hall:       "Halle",
  production: "Produktion",
  land:       "Grundstück",
  plot:       "Baugrundstück",
};

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
    property.bedrooms  > 0 && { icon: "🛏", label: "Zimmer",   value: property.bedrooms },
    property.bathrooms > 0 && { icon: "🚿", label: "Bäder",    value: property.bathrooms },
    property.area_sqm  > 0 && { icon: "📐", label: "m²",       value: property.area_sqm },
  ].filter(Boolean) as { icon: string; label: string; value: number }[];

  const typeLabel = PROP_TYPE_LABELS[property.property_type] ?? property.property_type;
  const location  = [property.neighbourhood, property.city].filter(Boolean).join(", ");

  return (
    <>
      <Header />

      {/* ── Back bar ── */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </Link>
          <div className="flex items-center gap-2">
            <SaveButton propertyId={property.id} />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-0 md:px-4 pb-40 md:pb-24">

        {/* ── Gallery — edge-to-edge on mobile ── */}
        <div className="md:rounded-2xl md:overflow-hidden md:mt-4">
          <ImageGallery images={images} title={property.title} />
        </div>

        <div className="px-4 md:px-0">

          {/* ── Price + badge ── */}
          <div className="flex items-start justify-between gap-3 mt-5">
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {formatPrice(property.price, property.currency)}
                {property.listing_type === "rent" && (
                  <span className="text-lg font-normal text-slate-400 ml-1">/Mo.</span>
                )}
              </p>
              {property.area_sqm > 0 && (
                <p className="text-sm text-slate-400 mt-0.5">
                  {formatPrice(Math.round(property.price / property.area_sqm), property.currency)}/m²
                </p>
              )}
            </div>
            <span
              className="shrink-0 mt-1 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}
            >
              {property.listing_type === "buy" ? "Kaufen" : "Mieten"}
            </span>
          </div>

          {/* ── Title + location ── */}
          <h1 className="text-xl font-bold text-slate-900 leading-snug mt-3">
            {property.title}
          </h1>
          {location && (
            <p className="flex items-center gap-1 text-sm text-slate-500 mt-1.5">
              <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {location}
            </p>
          )}

          {/* ── Specs row ── */}
          {specs.length > 0 && (
            <div className="flex gap-3 mt-5">
              {specs.map(({ icon, label, value }) => (
                <div key={label}
                  className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
              <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-base font-bold text-slate-900">{typeLabel}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Typ</p>
              </div>
            </div>
          )}

          {/* ── Description ── */}
          {property.description && (
            <div className="mt-6">
              <h2 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide text-slate-400">
                Beschreibung
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* ── Agent card ── */}
          {(property.agent_name || property.agent_phone) && (
            <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Ansprechpartner</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  {property.agent_name?.charAt(0).toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{property.agent_name}</p>
                  {property.agent_phone && (
                    <p className="text-xs text-slate-400">{property.agent_phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Photo upload (owner only) ── */}
          <div className="mt-4">
            <PhotoEditPanel propertyId={property.id} imageCount={images.length} />
          </div>

          {/* ── Similar listings ── */}
          {similar && similar.length > 0 && (
            <section className="mt-8">
              <h2 className="font-semibold text-slate-800 mb-4">Similar listings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(similar as Property[]).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Sticky contact bar ── */}
      <StickyContactBar
        propertyId={property.id}
        agentPhone={property.agent_phone}
        agentEmail={property.agent_email}
        propertyTitle={property.title}
      />
    </>
  );
}
