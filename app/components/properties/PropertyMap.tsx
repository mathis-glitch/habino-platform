"use client";

import { useEffect, useRef } from "react";

const G  = "#2D6A4F";
const GD = "#1B4332";

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Bole":        [9.005, 38.799],
  "CMC":         [9.065, 38.808],
  "CMC Michael": [9.065, 38.808],
  "Kazanchis":   [8.993, 38.771],
  "Sarbet":      [8.990, 38.751],
  "Piassa":      [9.033, 38.752],
  "Megenagna":   [9.025, 38.822],
  "Yeka":        [9.030, 38.830],
  "Gullele":     [9.057, 38.737],
  "Kotebe":      [9.055, 38.840],
  "Lafto":       [8.970, 38.730],
  "Akaki":       [8.870, 38.795],
  "Lebu":        [8.960, 38.725],
  "Kirkos":      [9.010, 38.755],
  "Arada":       [9.040, 38.755],
  "Lideta":      [8.995, 38.745],
  "Nifas Silk":  [8.975, 38.780],
  "Kolfe":       [8.995, 38.720],
};

function resolveCoords(neighbourhood?: string | null): [number, number] {
  if (neighbourhood) {
    for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
      if (neighbourhood.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(neighbourhood.toLowerCase())) {
        return coords;
      }
    }
  }
  return [9.005, 38.763];
}

// Spread nearby coords slightly so overlapping pins are visible
function spreadCoord(base: [number, number], index: number): [number, number] {
  const spread = 0.003;
  const angle  = (index * 137.5 * Math.PI) / 180; // golden angle
  return [
    base[0] + Math.cos(angle) * spread * (0.5 + (index % 3) * 0.5),
    base[1] + Math.sin(angle) * spread * (0.5 + (index % 3) * 0.5),
  ];
}

export interface NearbyProperty {
  id: string;
  title: string;
  price: number;
  currency: string;
  neighbourhood?: string | null;
  listing_type: string;
}

interface Props {
  neighbourhood?: string | null;
  city?: string | null;
  label: string;
  height?: number;
  nearby?: NearbyProperty[];
}

function fmtShort(price: number, currency: string) {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000)     return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price}`;
}

export default function PropertyMap({ neighbourhood, city, label, height = 240, nearby = [] }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !mapRef.current) return;
    initRef.current = true;

    const mainCoords = resolveCoords(neighbourhood);

    import("leaflet").then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const zoom = nearby.length > 0 ? 14 : 15;
      const map  = L.map(mapRef.current!, {
        center: mainCoords,
        zoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // ── Main pin ──────────────────────────────────────────────
      const mainIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;
          background:${G};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid #fff;
          box-shadow:0 4px 14px rgba(45,106,79,0.55);
          display:flex;align-items:center;justify-content:center;
        "><div style="transform:rotate(45deg);width:11px;height:11px;border-radius:50%;background:#fff;"></div></div>`,
        iconSize:    [40, 40],
        iconAnchor:  [20, 40],
        popupAnchor: [0, -44],
      });

      L.marker(mainCoords, { icon: mainIcon })
        .addTo(map)
        .bindPopup(`<div style="font-family:Inter,sans-serif;min-width:120px">
          <b style="color:${G};font-size:13px">${label}</b>
          <div style="font-size:11px;color:#6B7280;margin-top:2px">${neighbourhood ?? city ?? "Addis Ababa"}</div>
        </div>`, { offset: [0, -36] })
        .openPopup();

      // ── Nearby pins ───────────────────────────────────────────
      nearby.slice(0, 6).forEach((p, i) => {
        const nearbyBase = resolveCoords(p.neighbourhood ?? neighbourhood);
        const [lat, lng] = spreadCoord(nearbyBase, i + 1);
        const isRent     = p.listing_type === "rent";

        const nearbyIcon = L.divIcon({
          className: "",
          html: `<div style="
            padding:4px 8px;
            background:${isRent ? GD : "#fff"};
            color:${isRent ? "#fff" : G};
            border:2px solid ${G};
            border-radius:20px;
            font-size:10px;font-weight:700;
            font-family:Inter,sans-serif;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.18);
          ">${fmtShort(p.price, p.currency)}</div>`,
          iconSize:    [80, 24],
          iconAnchor:  [40, 12],
          popupAnchor: [0, -14],
        });

        L.marker([lat, lng], { icon: nearbyIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:Inter,sans-serif">
            <a href="/properties/${p.id}" style="color:${G};font-size:12px;font-weight:700;text-decoration:none">${p.title}</a>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">${fmtShort(p.price, p.currency)}${isRent ? "/mo" : ""}</div>
          </div>`, { offset: [0, -10] });
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div ref={mapRef} style={{ width: "100%", height, borderRadius: 14, overflow: "hidden" }} />
    </>
  );
}
