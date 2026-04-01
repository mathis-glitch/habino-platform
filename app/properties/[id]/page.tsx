import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { ImageGallery } from "../../components/properties/ImageGallery";
import { PhotoEditPanel } from "@/components/properties/PhotoEditPanel";
import { StickyContactBar, SaveButton } from "@/components/properties/PropertyDetailActions";
import { Property } from "@/lib/types";

// Forest green CI
const G = "#2D6A4F";
const GL = "rgba(45,106,79,0.10)";

function fmtPrice(price: number, currency: string): string {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000)     return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price.toLocaleString()}`;
}

const PROP_TYPE_LABELS: Record<string, string> = {
  apartment:  "Apartment",
  house:      "House",
  villa:      "Villa",
  commercial: "Commercial",
  office:     "Office",
  hall:       "Hall",
  production: "Production",
  land:       "Land",
  plot:       "Plot",
};

// ETB to EUR/USD exchange rates (approx, for display only)
const RATES: Record<string, { rate: number; symbol: string }> = {
  EUR: { rate: 0.00167, symbol: "€" },
  USD: { rate: 0.00182, symbol: "$" },
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
    property.bedrooms  > 0 && { icon: "🛏", label: "Bedrooms",  value: property.bedrooms },
    property.bathrooms > 0 && { icon: "🚿", label: "Bathrooms", value: property.bathrooms },
    property.area_sqm  > 0 && { icon: "📐", label: "Area m²",   value: property.area_sqm },
  ].filter(Boolean) as { icon: string; label: string; value: number }[];

  const typeLabel = PROP_TYPE_LABELS[property.property_type] ?? property.property_type;
  const location  = [property.neighbourhood, property.city].filter(Boolean).join(", ");
  const isRent    = property.listing_type === "rent";

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
        <div style={{ borderRadius: 0, overflow: "hidden" }}>
          <ImageGallery images={images} title={property.title} />
        </div>

        <div style={{ padding: "20px 20px 0" }}>

          {/* Price + badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#1A1A2E", letterSpacing: -0.8, lineHeight: 1.1 }}>
                {fmtPrice(property.price, property.currency)}
                {isRent && <span style={{ fontSize: 16, fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>/mo</span>}
              </div>
              {/* Currency converter */}
              {(priceEUR || priceUSD) && (
                <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                  {priceEUR && (
                    <span style={{
                      padding: "3px 9px", borderRadius: 8,
                      background: "#F0F7F4", color: G, fontSize: 12, fontWeight: 600,
                    }}>{priceEUR}{isRent ? "/mo" : ""}</span>
                  )}
                  {priceUSD && (
                    <span style={{
                      padding: "3px 9px", borderRadius: 8,
                      background: "#F0F7F4", color: G, fontSize: 12, fontWeight: 600,
                    }}>{priceUSD}{isRent ? "/mo" : ""}</span>
                  )}
                  <span style={{ padding: "3px 9px", borderRadius: 8, background: "#F5F5F5", color: "#9CA3AF", fontSize: 11 }}>
                    indicative
                  </span>
                </div>
              )}
              {property.area_sqm > 0 && (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                  {fmtPrice(Math.round(property.price / property.area_sqm), property.currency)}/m²
                </div>
              )}
            </div>
            <span style={{
              padding: "6px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, color: "#fff",
              background: isRent ? G : "#34C759", flexShrink: 0, marginTop: 4,
            }}>
              {isRent ? "Rent" : "Buy"}
            </span>
          </div>

          {/* Title + location */}
          <h1 style={{ fontSize: 19, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3, marginBottom: 6 }}>
            {property.title}
          </h1>
          {location && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
              <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{location}</span>
            </div>
          )}

          {/* Specs row */}
          {specs.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {specs.map(({ icon, label, value }) => (
                <div key={label} style={{
                  flex: 1, background: "#F7F7F7", borderRadius: 14, padding: "12px 8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{label}</div>
                </div>
              ))}
              <div style={{
                flex: 1, background: "#F7F7F7", borderRadius: 14, padding: "12px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>🏠</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{typeLabel}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>Type</div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.07)", marginBottom: 20 }} />

          {/* Description */}
          {property.description && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Description
              </h2>
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {property.description}
              </p>
            </div>
          )}

          {/* Agent card */}
          {(property.agent_name || property.agent_phone) && (
            <div style={{
              background: "#F7F7F7", borderRadius: 18, padding: 16, marginBottom: 20,
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Contact Agent
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar — initial */}
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: GL, color: G,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, flexShrink: 0,
                }}>
                  {property.agent_name?.charAt(0).toUpperCase() ?? "A"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 2 }}>
                    {property.agent_name}
                  </div>
                  {property.agent_phone && (
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{property.agent_phone}</div>
                  )}
                </div>
                {property.agent_phone && (
                  <a href={`tel:${property.agent_phone}`} style={{
                    padding: "9px 16px", borderRadius: 12,
                    background: G, color: "#fff",
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                    flexShrink: 0,
                  }}>
                    Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Photo upload (owner only) */}
          <div style={{ marginBottom: 20 }}>
            <PhotoEditPanel propertyId={property.id} imageCount={images.length} />
          </div>

          {/* Similar listings */}
          {similar && similar.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", marginBottom: 14 }}>Similar listings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(similar as Property[]).map((p) => {
                  const heroImg = p.images?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.url;
                  return (
                    <a key={p.id} href={`/properties/${p.id}`} style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: 12, overflow: "hidden",
                        background: GL, flexShrink: 0,
                      }}>
                        {heroImg && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={heroImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
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
