"use client";

import { useEffect, useRef, useState } from "react";
import type { Property } from "@/lib/types";

// Design tokens (shared with ExploreClient)
const T = {
  bg:      "#FFFFFF",
  bgSoft:  "#F7F7F7",
  text1:   "#1A1A2E",
  text2:   "#717171",
  text3:   "#AFAFAF",
  primary: "#7C6EF2",
  primaryD:"#6459D4",
  primaryL:"rgba(124,110,242,0.10)",
  err:     "#FF453A",
  shadowMd:"0 6px 24px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.05)",
  shadowLg:"0 14px 48px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.07)",
  r2xl:    28,
  rLg:     16,
  rFull:   9999,
  font:    "'Inter',-apple-system,sans-serif",
};

function fmtPrice(price: number, currency: string) {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000)     return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price}`;
}

function getHero(images?: Property["images"]): string | null {
  if (!images?.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}

// Addis Abeba center
const ADDIS_CENTER: [number, number] = [9.005, 38.763];

interface Props {
  properties: Property[];
  onSelectProperty?: (p: Property) => void;
}

export default function MapView({ properties, onSelectProperty }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const mapInstance = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);
  const [selected, setSelected] = useState<Property | null>(null);
  const [imgErr, setImgErr]     = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamic import to avoid SSR issues
    Promise.all([
      import("leaflet"),
      // @ts-expect-error — no types needed for CSS side-effect
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      leafletRef.current = L.default ?? L;
      const Lf = leafletRef.current;

      const map = Lf.map(mapRef.current!, {
        center: ADDIS_CENTER,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstance.current = map;

      // Clean tile layer (CartoDB light)
      Lf.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Attribution (bottom right, small)
      Lf.control.attribution({ position: "bottomright", prefix: false })
        .addTo(map);

      renderMarkers(Lf, map, properties, setSelected, setImgErr);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when properties change
  useEffect(() => {
    if (!mapInstance.current || !leafletRef.current) return;
    const Lf  = leafletRef.current;
    const map = mapInstance.current;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    renderMarkers(Lf, map, properties, setSelected, setImgErr);
  }, [properties]);

  function renderMarkers(
    Lf: any,
    map: any,
    props: Property[],
    onSelect: (p: Property) => void,
    _setImgErr: (v: boolean) => void,
  ) {
    const withCoords = props.filter(p => p.lat != null && p.lng != null);

    withCoords.forEach(p => {
      const label  = fmtPrice(p.price, p.currency);
      const isRent = p.listing_type === "rent";

      const icon = Lf.divIcon({
        className: "",
        html: `
          <div style="
            padding:5px 11px;
            border-radius:999px;
            background:${isRent ? T.primary : "#34C759"};
            color:#fff;
            font-size:12px;
            font-weight:700;
            font-family:${T.font};
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.18);
            cursor:pointer;
            border:2px solid #fff;
            transform:translateX(-50%);
            display:inline-block;
          ">${label}</div>
        `,
        iconAnchor: [0, 0],
      });

      const marker = Lf.marker([p.lat!, p.lng!], { icon }).addTo(map);
      marker.on("click", () => {
        onSelect(p);
        _setImgErr(false);
        map.panTo([p.lat!, p.lng!], { animate: true });
      });
      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have markers
    if (withCoords.length > 0) {
      const bounds = Lf.latLngBounds(withCoords.map(p => [p.lat!, p.lng!]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  const hero = selected ? getHero(selected.images) : null;

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, minHeight: 0, height: "100%" }} />

      {/* Bottom property card — slides up on selection */}
      {selected && (
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            background: T.bg,
            borderRadius: `${T.r2xl}px ${T.r2xl}px 0 0`,
            boxShadow: T.shadowLg,
            padding: "8px 20px 28px",
            zIndex: 1000,
            animation: "slideUp .22s ease",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(40px); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>

          {/* Drag handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "rgba(0,0,0,0.12)",
            margin: "0 auto 14px",
          }} />

          {/* Close */}
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute", top: 18, right: 20,
              width: 30, height: 30, borderRadius: "50%",
              background: T.bgSoft, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="12" height="12" stroke={T.text2} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 12 12">
              <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>

          <div
            style={{ display: "flex", gap: 14, cursor: "pointer" }}
            onClick={() => window.location.assign(`/properties/${selected.id}`)}
          >
            {/* Thumbnail */}
            <div style={{
              width: 90, height: 90, borderRadius: 16, overflow: "hidden",
              background: "linear-gradient(135deg, rgba(124,110,242,0.18) 0%, rgba(192,132,252,0.12) 100%)",
              flexShrink: 0,
            }}>
              {hero && !imgErr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero}
                  alt={selected.title}
                  onError={() => setImgErr(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="28" height="28" fill="none" stroke={T.primary} strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "inline-block", marginBottom: 6,
                padding: "3px 9px", borderRadius: T.rFull,
                fontSize: 11, fontWeight: 700,
                background: selected.listing_type === "rent" ? T.primaryL : "rgba(52,199,89,.12)",
                color: selected.listing_type === "rent" ? T.primary : "#34C759",
              }}>
                {selected.listing_type === "rent" ? "Rent" : "Buy"}
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: T.text1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                marginBottom: 3,
              }}>
                {selected.neighbourhood ? `${selected.neighbourhood}, ` : ""}{selected.city}
              </div>
              <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>
                {[
                  selected.property_type.charAt(0).toUpperCase() + selected.property_type.slice(1),
                  selected.bedrooms  > 0 ? `${selected.bedrooms} bd`  : null,
                  selected.bathrooms > 0 ? `${selected.bathrooms} ba` : null,
                ].filter(Boolean).join(" · ")}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text1 }}>
                {fmtPrice(selected.price, selected.currency)}
                {selected.listing_type === "rent" && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: T.text2 }}> / month</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
