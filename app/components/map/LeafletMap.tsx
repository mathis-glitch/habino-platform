"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/lib/types";

export type PropertyWithCoords = Property & { lat: number; lng: number };

// Fix default icon path (Webpack / Next.js issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function fmtPin(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 100_000)   return `${Math.round(price / 1_000)}K`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(price >= 10_000 ? 0 : 1)}K`;
  return String(price);
}

function makePinIcon(price: number, selected: boolean): L.DivIcon {
  const label = fmtPin(price);
  const bg    = selected ? "#111827" : "#ffffff";
  const fg    = selected ? "#ffffff" : "#111827";
  const scale = selected ? "scale(1.08)" : "scale(1)";
  const shadow = selected
    ? "0 4px 16px rgba(0,0,0,0.28)"
    : "0 2px 10px rgba(0,0,0,0.14)";

  const html = `
    <div style="
      background:${bg};
      color:${fg};
      border-radius:999px;
      padding:5px 11px;
      font-size:12px;
      font-weight:700;
      font-family:system-ui,-apple-system,sans-serif;
      box-shadow:${shadow};
      white-space:nowrap;
      cursor:pointer;
      transform:${scale};
      transition:transform 0.15s,box-shadow 0.15s;
      border:2px solid ${selected ? "#111827" : "transparent"};
      line-height:1.2;
    ">${label}</div>`;

  return L.divIcon({ className: "", html, iconSize: undefined, iconAnchor: undefined });
}

// Smooth pan/zoom when city changes
function MapFlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.1, easeLinearity: 0.3 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

// Force Leaflet to recalculate dimensions after mount
function MapSizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

interface LeafletMapProps {
  center:     [number, number];
  zoom?:      number;
  properties: PropertyWithCoords[];
  selectedId: string | null;
  onSelect:   (p: PropertyWithCoords) => void;
}

export default function LeafletMap({
  center,
  zoom = 12,
  properties,
  selectedId,
  onSelect,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "#f0ede8" }}
    >
      {/* CartoDB Positron — clean, minimal, Airbnb-like */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <MapFlyTo center={center} zoom={zoom} />
      <MapSizer />

      {properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makePinIcon(p.price, p.id === selectedId)}
          eventHandlers={{ click: () => onSelect(p) }}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
        />
      ))}
    </MapContainer>
  );
}
