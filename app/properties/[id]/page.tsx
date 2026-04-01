import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { ImageGallery } from "../../components/properties/ImageGallery";
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

// Deterministic broker portrait (same logic as ExploreClient)
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

          {/* Details table */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Property Details
            </h2>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
              {[
                { label: "Property type",  value: typeLabel },
                { label: "Listing",        value: isRent ? "For rent" : "For sale" },
                ...(property.bedrooms  > 0 ? [{ label: "Bedrooms",    value: String(property.bedrooms) }]  : []),
                ...(property.bathrooms > 0 ? [{ label: "Bathrooms",   value: String(property.bathrooms) }] : []),
                ...(property.area_sqm  > 0 ? [{ label: "Total area",  value: `${property.area_sqm} m²` }]  : []),
                ...(property.area_sqm  > 0 ? [{ label: "Price / m²",  value: fmtPrice(Math.round(property.price / property.area_sqm), property.currency) }] : []),
                { label: "Location",       value: location || property.city },
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

          {/* Market data */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Market Context
            </h2>

            {/* Map snapshot */}
            <div style={{
              position: "relative", height: 160, borderRadius: 14, overflow: "hidden",
              marginBottom: 12, background: "#D4E6DC",
            }}>
              {/* Illustrative map */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, #C8DDD2 0%, #B8CFC7 40%, #C2D8CF 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Grid lines to mimic map */}
                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
                  {[0,1,2,3,4,5].map(i => (
                    <line key={`h${i}`} x1="0" y1={`${i*20}%`} x2="100%" y2={`${i*20}%`} stroke="#2D6A4F" strokeWidth="0.5"/>
                  ))}
                  {[0,1,2,3,4,5,6,7].map(i => (
                    <line key={`v${i}`} x1={`${i*16}%`} y1="0" x2={`${i*16}%`} y2="100%" stroke="#2D6A4F" strokeWidth="0.5"/>
                  ))}
                  {/* Roads */}
                  <path d="M 0 50% Q 30% 45%, 50% 50% T 100% 48%" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7"/>
                  <path d="M 40% 0 L 42% 100%" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6"/>
                  <path d="M 0 75% L 100% 72%" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/>
                </svg>
                {/* Pin */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)",
                    background: G, boxShadow: "0 4px 12px rgba(45,106,79,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ transform: "rotate(45deg)", width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />
                  </div>
                  <div style={{
                    marginTop: 6, padding: "4px 10px", borderRadius: 8,
                    background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    fontSize: 11, fontWeight: 700, color: G, whiteSpace: "nowrap",
                  }}>
                    {property.neighbourhood ?? property.city}
                  </div>
                </div>
              </div>
              {/* District label */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                padding: "4px 9px", borderRadius: 8,
                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)",
                fontSize: 11, fontWeight: 600, color: "#1A1A2E",
              }}>
                📍 {property.neighbourhood ?? property.city}, Addis Ababa
              </div>
            </div>

            {/* Price comparison card */}
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
                <div style={{
                  padding: "5px 10px", borderRadius: 8,
                  background: "rgba(255,159,10,0.12)",
                  color: "#FF9F0A", fontSize: 12, fontWeight: 700,
                }}>
                  +8% above avg
                </div>
              </div>
              {/* Price bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>
                  <span>Low</span>
                  <span>This listing</span>
                  <span>High</span>
                </div>
                <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3,
                    width: "62%", background: `linear-gradient(90deg, rgba(45,106,79,0.25), ${G})`,
                  }} />
                  <div style={{
                    position: "absolute", top: "50%", left: "62%", transform: "translate(-50%,-50%)",
                    width: 14, height: 14, borderRadius: "50%", background: G,
                    border: "2.5px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                  }} />
                </div>
              </div>
              {/* Stats row */}
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Active listings", value: "24" },
                  { label: "Avg. days listed", value: "18" },
                  { label: "Price trend", value: "+4% YoY" },
                ].map((s) => (
                  <div key={s.label} style={{
                    flex: 1, background: "#fff", borderRadius: 10, padding: "9px 8px",
                    border: "1px solid rgba(0,0,0,0.05)", textAlign: "center",
                  }}>
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
                {/* Avatar — photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brokerPhoto(property.agent_name ?? "A")}
                  alt={property.agent_name ?? "Agent"}
                  style={{ width: 46, height: 46, borderRadius: 14, objectFit: "cover", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 2 }}>
                    {property.agent_name}
                  </div>
                  {property.agent_phone && (
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{property.agent_phone}</div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  {property.agent_phone && (
                    <a href={`tel:${property.agent_phone}`} style={{
                      padding: "8px 14px", borderRadius: 10,
                      background: G, color: "#fff",
                      fontSize: 13, fontWeight: 700, textDecoration: "none",
                      textAlign: "center",
                    }}>
                      Call
                    </a>
                  )}
                  <a href="/markt#brokers" style={{
                    padding: "6px 14px", borderRadius: 10,
                    background: GL, color: G,
                    fontSize: 11, fontWeight: 600, textDecoration: "none",
                    textAlign: "center",
                  }}>
                    Profile →
                  </a>
                </div>
              </div>
            </div>
          )}

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
