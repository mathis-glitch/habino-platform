import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { ImageGallery } from "../../components/properties/ImageGallery";
import { StickyContactBar, SaveButton } from "@/components/properties/PropertyDetailActions";
import { Property } from "@/lib/types";

const PropertyMap = dynamic(() => import("../../components/properties/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 240, borderRadius: 14, background: "#E8F0EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 12, color: "#9CA3AF" }}>Loading map…</span>
    </div>
  ),
});

// ── Design tokens ─────────────────────────────────────────────────────────────
const G  = "#2D6A4F";
const GL = "rgba(45,106,79,0.10)";

function fmtPrice(price: number, currency: string): string {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000)     return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price.toLocaleString()}`;
}

const PROP_TYPE_LABELS: Record<string, string> = {
  apartment:  "Apartment", house: "House", villa: "Villa",
  commercial: "Commercial", office: "Office", hall: "Hall",
  production: "Production", land: "Land", plot: "Plot",
};

// Broker photos — deterministic by name hash
const BROKER_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=faces&auto=format",
];
function brokerPhoto(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return BROKER_PHOTOS[hash % BROKER_PHOTOS.length];
}

// ETB exchange rates
const RATES = {
  EUR: { rate: 0.00167, symbol: "€" },
  USD: { rate: 0.00182, symbol: "$" },
};

// ── Micro-location descriptions ───────────────────────────────────────────────
const DISTRICT_INFO: Record<string, { description: string; highlights: string[] }> = {
  "Bole": {
    description: "Bole is Addis Ababa's most international and vibrant district — home to the international airport, upscale restaurants, embassies, and modern shopping centres. With excellent transport links and a strong expat community, Bole is one of the most sought-after addresses in the city.",
    highlights: ["Near Bole International Airport", "Embassies & consulates", "Top restaurants & cafés", "Shopping malls", "Great transport links"],
  },
  "CMC": {
    description: "CMC is a quiet, leafy residential area popular with families and professionals. Known for spacious villas, lower density, and a calm atmosphere — yet well-connected to the city centre via main arterials.",
    highlights: ["Family-friendly neighbourhood", "Spacious plots & villas", "Green & quiet streets", "Close to CMC Michael church", "Good security"],
  },
  "CMC Michael": {
    description: "CMC Michael is a prestigious sub-district within CMC, known for its well-maintained villas and close-knit community. A peaceful setting with convenient access to schools, churches, and local markets.",
    highlights: ["Premium villa area", "Low traffic & safe streets", "Local schools nearby", "CMC Michael church", "Community feel"],
  },
  "Kazanchis": {
    description: "Kazanchis is a central, fast-developing mixed-use district with easy access to government offices, major banks, and the Ring Road. Increasingly popular with young professionals and businesses.",
    highlights: ["Central location", "Banks & government offices", "Ring Road access", "Growing business hub", "Active nightlife"],
  },
  "Sarbet": {
    description: "Sarbet is a well-established mid-range residential area with a mix of apartments and houses. Close to several universities and shopping options, making it popular with academics and young families.",
    highlights: ["Close to AAU campus", "Affordable living", "Markets & shops nearby", "Good bus connections", "Residential feel"],
  },
  "Piassa": {
    description: "Piassa (also known as Arada) is the historic heart of Addis Ababa — rich in culture, history, and street life. It offers easy access to museums, theatres, traditional restaurants, and the city's oldest markets.",
    highlights: ["Historic city centre", "National Museum nearby", "Traditional cuisine & culture", "Markets & craft shops", "Excellent connectivity"],
  },
  "Megenagna": {
    description: "Megenagna is a vibrant, rapidly developing area at the intersection of several major roads. Home to modern apartment towers, the iconic Megenagna roundabout, and growing commercial activity.",
    highlights: ["Major transport hub", "Modern apartment buildings", "Active commercial scene", "Near Yeka hills", "Good supermarkets"],
  },
  "Yeka": {
    description: "Yeka is an upscale, hilly residential district offering spectacular views of the city. Popular with diplomats and senior professionals, it features large villas and a calm, secure environment.",
    highlights: ["Panoramic city views", "Diplomatic community", "Large villas & compounds", "Yeka Abado park", "Quiet & secure"],
  },
  "Gullele": {
    description: "Gullele is a mid-range residential district in the northwest, known for its local character and affordable housing. Close to Entoto mountain, offering fresh air and proximity to nature.",
    highlights: ["Affordable housing", "Near Entoto mountain", "Fresh air & green hills", "Local markets", "Authentic community"],
  },
  "Kotebe": {
    description: "Kotebe is a growing residential area in eastern Addis Ababa, with a mix of houses and newer apartment developments. Increasingly popular due to its relative affordability and improving infrastructure.",
    highlights: ["Growing area", "Affordable rents", "Kotebe university nearby", "Improving roads", "Emerging neighbourhood"],
  },
};

function getDistrictInfo(neighbourhood?: string | null, city?: string | null) {
  if (neighbourhood) {
    for (const [key, info] of Object.entries(DISTRICT_INFO)) {
      if (neighbourhood.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(neighbourhood.toLowerCase())) {
        return info;
      }
    }
  }
  return null;
}

// ── Verified badge ─────────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 6,
      background: "rgba(45,106,79,0.10)", color: G,
      fontSize: 10, fontWeight: 700,
    }}>
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
        <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" fill={G}/>
      </svg>
      Verified
    </span>
  );
}

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
    property.bedrooms  > 0 && { icon: "🛏", label: "Bedrooms",  value: property.bedrooms },
    property.bathrooms > 0 && { icon: "🚿", label: "Bathrooms", value: property.bathrooms },
    property.area_sqm  > 0 && { icon: "📐", label: "Area m²",   value: property.area_sqm },
  ].filter(Boolean) as { icon: string; label: string; value: number }[];

  const typeLabel    = PROP_TYPE_LABELS[property.property_type] ?? property.property_type;
  const location     = [property.neighbourhood, property.city].filter(Boolean).join(", ");
  const isRent       = property.listing_type === "rent";
  const agentName    = property.agent_name ?? "Habino Agent";
  const districtInfo = getDistrictInfo(property.neighbourhood, property.city);

  const priceEUR = property.currency === "ETB"
    ? `€ ${Math.round(property.price * RATES.EUR.rate).toLocaleString()}`
    : null;
  const priceUSD = property.currency === "ETB"
    ? `$ ${Math.round(property.price * RATES.USD.rate).toLocaleString()}`
    : null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FFFFFF", minHeight: 0 }}>

      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "52px 16px 10px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <Link href="/explore" style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 12,
          background: "rgba(0,0,0,0.05)", textDecoration: "none",
          fontSize: 14, fontWeight: 600, color: "#1A1A2E",
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <SaveButton propertyId={property.id} />
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>

        {/* Gallery */}
        <ImageGallery images={images} title={property.title} />

        <div style={{ padding: "20px 20px 0" }}>

          {/* Price + badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#1A1A2E", letterSpacing: -0.8, lineHeight: 1.1 }}>
                {fmtPrice(property.price, property.currency)}
                {isRent && <span style={{ fontSize: 16, fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>/mo</span>}
              </div>
              {(priceEUR || priceUSD) && (
                <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                  {priceEUR && <span style={{ padding: "3px 9px", borderRadius: 8, background: "#F0F7F4", color: G, fontSize: 12, fontWeight: 600 }}>{priceEUR}{isRent ? "/mo" : ""}</span>}
                  {priceUSD && <span style={{ padding: "3px 9px", borderRadius: 8, background: "#F0F7F4", color: G, fontSize: 12, fontWeight: 600 }}>{priceUSD}{isRent ? "/mo" : ""}</span>}
                  <span style={{ padding: "3px 9px", borderRadius: 8, background: "#F5F5F5", color: "#9CA3AF", fontSize: 11 }}>indicative</span>
                </div>
              )}
              {property.area_sqm > 0 && (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                  {fmtPrice(Math.round(property.price / property.area_sqm), property.currency)}/m²
                </div>
              )}
            </div>
            <span style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, color: "#fff", background: isRent ? G : "#34C759", flexShrink: 0, marginTop: 4 }}>
              {isRent ? "Rent" : "Buy"}
            </span>
          </div>

          {/* Title + location */}
          <h1 style={{ fontSize: 19, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3, marginBottom: 6 }}>
            {property.title}
          </h1>
          {location && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
              <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{location}</span>
            </div>
          )}

          {/* ── Broker card — prominent, right below location ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 14, marginBottom: 20,
            background: GL, border: `1px solid rgba(45,106,79,0.12)`,
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brokerPhoto(agentName)}
                alt={agentName}
                style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", display: "block" }}
              />
              {/* Verified dot */}
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 16, height: 16, borderRadius: "50%",
                background: G, border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{agentName}</span>
                <VerifiedBadge />
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>Licensed Real Estate Agent</div>
              {property.agent_phone && (
                <div style={{ fontSize: 12, color: G, fontWeight: 500, marginTop: 1 }}>{property.agent_phone}</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              {property.agent_phone && (
                <a href={`tel:${property.agent_phone}`} style={{
                  padding: "7px 14px", borderRadius: 10, background: G, color: "#fff",
                  fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center",
                }}>
                  Call
                </a>
              )}
              {property.agent_email && (
                <a href={`mailto:${property.agent_email}`} style={{
                  padding: "7px 14px", borderRadius: 10, background: "#fff", color: G,
                  fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center",
                  border: `1px solid rgba(45,106,79,0.2)`,
                }}>
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Specs row */}
          {specs.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {specs.map(({ icon, label, value }) => (
                <div key={label} style={{ flex: 1, background: "#F7F7F7", borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{label}</div>
                </div>
              ))}
              <div style={{ flex: 1, background: "#F7F7F7", borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>🏠</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{typeLabel}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>Type</div>
              </div>
            </div>
          )}

          {/* ── What you get — user-friendly highlights ── */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>What's included</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                property.bedrooms  > 0 && `${property.bedrooms} bedroom${property.bedrooms > 1 ? "s" : ""}`,
                property.bathrooms > 0 && `${property.bathrooms} bathroom${property.bathrooms > 1 ? "s" : ""}`,
                property.area_sqm  > 0 && `${property.area_sqm} m² total area`,
                isRent ? "Available to rent" : "Available to buy",
                property.area_sqm  > 0 && `${fmtPrice(Math.round(property.price / property.area_sqm), property.currency)}/m²`,
                location && `Located in ${location}`,
              ].filter(Boolean).map((item) => (
                <div key={String(item)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 12px", borderRadius: 12, background: "#F7F7F7",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: G, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#4B5563", fontWeight: 500 }}>{String(item)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>About this property</h2>
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                {property.description}
              </p>
            </div>
          )}

          {/* Details table */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Property details</h2>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
              {[
                { label: "Property type",  value: typeLabel },
                { label: "Listing type",   value: isRent ? "For rent" : "For sale" },
                ...(property.bedrooms  > 0 ? [{ label: "Bedrooms",   value: String(property.bedrooms) }]  : []),
                ...(property.bathrooms > 0 ? [{ label: "Bathrooms",  value: String(property.bathrooms) }] : []),
                ...(property.area_sqm  > 0 ? [{ label: "Total area", value: `${property.area_sqm} m²` }]  : []),
                ...(property.area_sqm  > 0 ? [{ label: "Price / m²", value: fmtPrice(Math.round(property.price / property.area_sqm), property.currency) }] : []),
                { label: "District",       value: property.neighbourhood ?? "—" },
                { label: "City",           value: property.city ?? "Addis Ababa" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 14px",
                  background: i % 2 === 0 ? "#FAFAFA" : "#FFFFFF",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Neighbourhood ── */}
          {districtInfo && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>
                About {property.neighbourhood ?? property.city}
              </h2>
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75, marginBottom: 12 }}>
                {districtInfo.description}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {districtInfo.highlights.map((h) => (
                  <span key={h} style={{
                    padding: "5px 11px", borderRadius: 8,
                    background: GL, color: G,
                    fontSize: 12, fontWeight: 500,
                  }}>
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Map ── */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Location</h2>
            <PropertyMap
              neighbourhood={property.neighbourhood}
              city={property.city}
              label={property.neighbourhood ?? property.city ?? "Property"}
              height={240}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#9CA3AF" }}>
              📍 {location || property.city}, Addis Ababa — map shows approximate district location
            </div>
          </div>

          {/* ── Market Context ── */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Market context</h2>
            <div style={{ background: "#F7F7F7", borderRadius: 14, padding: 16, border: "1px solid rgba(0,0,0,0.06)", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    District avg. {isRent ? "rent" : "price"}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1A2E" }}>
                    {fmtPrice(Math.round(property.price * 0.92), property.currency)}
                    {isRent && <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3AF", marginLeft: 3 }}>/mo</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{property.neighbourhood ?? property.city}</div>
                </div>
                <div style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(255,159,10,0.12)", color: "#FF9F0A", fontSize: 12, fontWeight: 700 }}>
                  +8% above avg
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>
                  <span>Low</span><span>This listing</span><span>High</span>
                </div>
                <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3, width: "62%", background: `linear-gradient(90deg, rgba(45,106,79,0.25), ${G})` }} />
                  <div style={{ position: "absolute", top: "50%", left: "62%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: G, border: "2.5px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Active listings", value: "24" },
                  { label: "Avg. days listed", value: "18" },
                  { label: "Price trend", value: "+4% YoY" },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "9px 8px", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5, paddingLeft: 4 }}>
              Based on {property.neighbourhood ?? property.city} listings in the last 90 days. Figures are indicative.
            </div>
          </div>

          {/* Similar listings */}
          {similar && similar.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 14 }}>Similar listings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(similar as Property[]).map((p) => {
                  const heroImg = p.images?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.url;
                  return (
                    <a key={p.id} href={`/properties/${p.id}`} style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", background: GL, flexShrink: 0 }}>
                        {heroImg && <img src={heroImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 2 }}>
                          {p.neighbourhood ? `${p.neighbourhood}, ` : ""}{p.city}
                        </div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {p.property_type} · {p.bedrooms > 0 ? `${p.bedrooms} bd` : ""}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G, marginTop: 2 }}>
                          {fmtPrice(p.price, p.currency)}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sticky contact bar */}
      <StickyContactBar
        propertyId={property.id}
        agentPhone={property.agent_phone}
        agentEmail={property.agent_email}
        propertyTitle={property.title}
      />
    </div>
  );
}
