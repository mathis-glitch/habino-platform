"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { analytics } from "@/lib/analytics";
import { createBrowserClient } from "@supabase/ssr";

const G  = "#2D6A4F";
const GL = "rgba(45,106,79,0.09)";
const T  = {
  bg: "#FFFFFF", bgSoft: "#F7F7F7",
  border: "rgba(0,0,0,0.07)",
  text1: "#1A1A2E", text2: "#6B7280", text3: "#9CA3AF",
  font: "'Inter',-apple-system,sans-serif",
};

function fmtPrice(price: number, currency: string) {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000)     return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price.toLocaleString()}`;
}

function maskPhone(phone: string | null, loggedIn: boolean) {
  if (!phone) return null;
  if (loggedIn) return phone;
  return phone.slice(0, 6) + " xxx xxxx";
}

function maskEmail(email: string | null, loggedIn: boolean) {
  if (!email) return null;
  if (loggedIn) return email;
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

interface BrokerProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  bio: string | null;
  agency: string | null;
  speciality: string[] | null;
  districts: string[] | null;
  languages: string[] | null;
  verified: boolean;
  verified_score: number | string | null;
  listings_count: number | null;
  rating: number | string | null;
  reviews_count: number | null;
  years_exp: number | string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  listing_type: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  neighbourhood: string | null;
  city: string;
  images?: { url: string; sort_order: number }[];
}

function StarRow({ rating, reviews }: { rating: number | string | null; reviews: number }) {
  const r = Number(rating) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= Math.round(r) ? "#FF9F0A" : "#E5E7EB"}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginLeft: 2 }}>{r.toFixed(1)}</span>
      <span style={{ fontSize: 12, color: T.text3 }}>({reviews} reviews)</span>
    </div>
  );
}

function ListingCard({ listing, loggedIn }: { listing: Listing; loggedIn: boolean }) {
  const hero = listing.images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const isRent = listing.listing_type === "rent";

  return (
    <Link href={`/properties/${listing.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: T.bg, borderRadius: 18,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        {/* Image */}
        <div style={{ position: "relative", height: 160, background: "#E8F0EC" }}>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏠</div>
          )}
          <span style={{
            position: "absolute", top: 10, left: 10,
            padding: "4px 10px", borderRadius: 8,
            background: isRent ? G : "#34C759",
            color: "#fff", fontSize: 11, fontWeight: 700,
          }}>
            {isRent ? "Rent" : "Buy"}
          </span>
          {!loggedIn && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.0)",
            }} />
          )}
        </div>
        {/* Info */}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 2 }}>
            {fmtPrice(listing.price, listing.currency)}
            {isRent && <span style={{ fontSize: 11, fontWeight: 400, color: T.text3 }}>/mo</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {listing.title}
          </div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 6 }}>
            📍 {[listing.neighbourhood, listing.city].filter(Boolean).join(", ")}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {listing.bedrooms > 0 && <span style={{ fontSize: 11, color: T.text2 }}>🛏 {listing.bedrooms}</span>}
            {listing.bathrooms > 0 && <span style={{ fontSize: 11, color: T.text2 }}>🚿 {listing.bathrooms}</span>}
            {listing.area_sqm && listing.area_sqm > 0 && <span style={{ fontSize: 11, color: T.text2 }}>📐 {listing.area_sqm}m²</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BrokerProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const brokerId = params.id as string;

  const [broker,   setBroker]   = useState<BrokerProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    sb.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  useEffect(() => {
    fetch(`/api/brokers/${brokerId}`)
      .then(r => r.json())
      .then(d => {
        setBroker(d.broker);
        setListings(d.listings ?? []);
        if (d.broker?.id) analytics.brokerViewed({ broker_id: d.broker.id });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [brokerId]);

  if (loading) {
    return (
      <div style={{ flex: 1, background: T.bgSoft, padding: "52px 16px", fontFamily: T.font }}>
        {[90, 200, 140].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 20, background: "#E5E7EB", marginBottom: 14 }} />
        ))}
      </div>
    );
  }

  if (!broker) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: T.font }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text1, marginBottom: 8 }}>Broker not found</h2>
        <button onClick={() => router.back()} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: G, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: T.font }}>Go back</button>
      </div>
    );
  }

  const displayName = loggedIn
    ? broker.full_name
    : (() => {
        const parts = broker.full_name.trim().split(" ");
        return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
      })();
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const phone    = maskPhone(broker.phone, loggedIn);
  const email    = maskEmail(broker.email, loggedIn);
  const wa       = maskPhone(broker.whatsapp, loggedIn);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bgSoft, fontFamily: T.font }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", gap: 12,
        padding: "52px 16px 12px",
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 10, border: "none",
          background: T.bgSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" fill="none" stroke={T.text1} strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Broker Profile</span>
      </div>

      {/* Hero card */}
      <div style={{ background: T.bg, padding: "24px 20px 20px", marginBottom: 12 }}>
        {/* Avatar + name */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {broker.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={broker.avatar_url} alt={displayName} style={{ width: 76, height: 76, borderRadius: 20, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 76, height: 76, borderRadius: 20, background: `linear-gradient(135deg, ${G} 0%, #40916C 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff" }}>
                {initials}
              </div>
            )}
            {broker.verified && (
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: G, border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: -0.4, marginBottom: 2 }}>{displayName}</div>
            {broker.agency && (
              <div style={{ fontSize: 13, color: G, fontWeight: 600, marginBottom: 4 }}>{broker.agency}</div>
            )}
            <StarRow rating={broker.rating} reviews={broker.reviews_count} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Listings", value: listings.length || Number(broker.listings_count ?? 0) },
            { label: "Years exp.", value: Number(broker.years_exp ?? 0) },
            { label: "Score", value: `${Number(broker.verified_score ?? 0)}%` },
          ].map(s => (
            <div key={s.label} style={{ background: T.bgSoft, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: G }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {broker.bio && (
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.75, marginBottom: 16 }}>{broker.bio}</p>
        )}

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {broker.speciality?.map(s => (
            <span key={s} style={{ padding: "5px 12px", borderRadius: 9999, background: GL, color: G, fontSize: 12, fontWeight: 600 }}>{s}</span>
          ))}
          {broker.districts?.slice(0, 4).map(d => (
            <span key={d} style={{ padding: "5px 12px", borderRadius: 9999, background: T.bgSoft, color: T.text2, fontSize: 12, fontWeight: 500 }}>📍 {d}</span>
          ))}
        </div>

        {/* Languages */}
        {broker.languages && broker.languages.length > 0 && (
          <div style={{ fontSize: 12, color: T.text3, marginBottom: 16 }}>
            🗣 {broker.languages.join(" · ")}
          </div>
        )}

        {/* Contact buttons */}
        {!loggedIn ? (
          <div style={{ background: GL, borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G, marginBottom: 4 }}>Sign in to contact {displayName.split(" ")[0]}</div>
            <p style={{ fontSize: 12, color: T.text2, marginBottom: 12 }}>Create a free account to view contact details and send messages.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/auth/signup" style={{
                flex: 1, padding: "11px 0", borderRadius: 12, background: G, color: "#fff",
                textAlign: "center", fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>Sign up free</Link>
              <Link href="/auth/login" style={{
                flex: 1, padding: "11px 0", borderRadius: 12, background: T.bg, color: G,
                border: `1.5px solid rgba(45,106,79,0.25)`,
                textAlign: "center", fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>Log in</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* WhatsApp */}
            {(wa || broker.phone) && (
              <a href={`https://wa.me/${(broker.whatsapp || broker.phone)?.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "14px 0", borderRadius: 14,
                  background: "#25D366", color: "#fff",
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
                }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp — {wa}
              </a>
            )}
            {/* Call */}
            {phone && (
              <a href={`tel:${broker.phone}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px 0", borderRadius: 14,
                background: G, color: "#fff",
                textDecoration: "none", fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.0 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Call — {phone}
              </a>
            )}
            {/* Email */}
            {email && (
              <a href={`mailto:${broker.email}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "12px 0", borderRadius: 14,
                background: T.bgSoft, color: T.text1,
                border: `1.5px solid ${T.border}`,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                {email}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Listings */}
      <div style={{ padding: "0 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, marginTop: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text1 }}>
            Listings by {displayName.split(" ")[0]}
          </h2>
          <span style={{ fontSize: 12, color: T.text3 }}>{listings.length} active</span>
        </div>

        {listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: T.bg, borderRadius: 20, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
            <p style={{ fontSize: 14, color: T.text2 }}>No active listings at the moment.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} loggedIn={loggedIn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
