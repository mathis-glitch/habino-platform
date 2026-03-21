"use client";

import { useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, AttributionControl } from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/lib/types";

export type PropertyWithCoords = Property & { lat: number; lng: number };

export type MapBounds = {
  north: number; south: number;
  east:  number; west:  number;
  zoom:  number;
};

// ── Color per property type ───────────────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  apartment:  "#3B82F6",  // blue
  house:      "#10B981",  // emerald
  villa:      "#8B5CF6",  // violet
  office:     "#F59E0B",  // amber
  commercial: "#EF4444",  // red
  land:       "#A16207",  // brown
  plot:       "#84CC16",  // lime
  hall:       "#06B6D4",  // cyan
  production: "#6B7280",  // slate
};

export const TYPE_LABELS: Record<string, string> = {
  apartment:  "Apartment", house:      "House",  villa:      "Villa",
  office:     "Office",    commercial: "Retail", land:       "Land",
  plot:       "Plot",      hall:       "Hall",   production: "Industrial",
};

// Fix default icon path (Webpack / Next.js issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function fmtPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 100_000)   return `${Math.round(price / 1_000)}K`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(price >= 10_000 ? 0 : 1)}K`;
  return String(price);
}

function makePinIcon(p: PropertyWithCoords, selected: boolean): L.DivIcon {
  const color  = TYPE_COLORS[p.property_type] || "#6B7280";
  const price  = fmtPrice(p.price);
  const ppm    = p.area_sqm && p.area_sqm > 0
    ? fmtPrice(Math.round(p.price / p.area_sqm)) + "/m²"
    : null;

  const bg     = selected ? color : "#ffffff";
  const fg     = selected ? "#ffffff" : "#111827";
  const dot    = selected ? "rgba(255,255,255,0.8)" : color;
  const border = `2px solid ${color}`;
  const shadow = selected
    ? `0 4px 20px ${color}55`
    : "0 2px 10px rgba(0,0,0,0.13)";
  const scale  = selected ? "scale(1.12)" : "scale(1)";

  const html = `
    <div style="
      background:${bg}; color:${fg}; border:${border};
      border-radius:999px; padding:4px 10px 4px 8px;
      font-family:system-ui,sans-serif;
      box-shadow:${shadow}; cursor:pointer;
      transform:${scale}; transition:all .15s;
      display:inline-flex; flex-direction:column; align-items:center;
      white-space:nowrap; line-height:1.3;
    ">
      <div style="display:flex;align-items:center;gap:5px">
        <span style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0;display:inline-block"></span>
        <span style="font-size:12px;font-weight:700">${price}</span>
      </div>
      ${ppm ? `<span style="font-size:9px;color:${selected ? "rgba(255,255,255,0.85)" : color};margin-top:1px">${ppm}</span>` : ""}
    </div>`;

  return L.divIcon({ className: "", html, iconSize: undefined, iconAnchor: undefined });
}

function MapFlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.1, easeLinearity: 0.3 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: MapBounds) => void }) {
  const map = useMap();
  const report = useCallback(() => {
    const b = map.getBounds();
    onBoundsChange({
      north: b.getNorth(), south: b.getSouth(),
      east:  b.getEast(),  west:  b.getWest(),
      zoom:  map.getZoom(),
    });
  }, [map, onBoundsChange]);

  useEffect(() => {
    map.on("moveend", report);
    map.on("zoomend", report);
    map.whenReady(report);
    return () => { map.off("moveend", report); map.off("zoomend", report); };
  }, [map, report]);

  return null;
}

interface LeafletMapProps {
  center:          [number, number];
  zoom?:           number;
  properties:      PropertyWithCoords[];
  selectedId:      string | null;
  onSelect:        (p: PropertyWithCoords) => void;
  onBoundsChange?: (b: MapBounds) => void;
}

export default function LeafletMap({
  center, zoom = 5, properties, selectedId, onSelect, onBoundsChange,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom
      attributionControl={false}
      style={{
        position: "fixed", inset: 0,
        width: "100vw", height: "100dvh",
        background: "#f0ede8", zIndex: 0,
      }}
    >
      <AttributionControl
        position="bottomleft"
        prefix='© Habino · <a href="mailto:hello@habino.app">hello@habino.app</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a>'
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="" subdomains="abcd" maxZoom={19}
      />
      <MapFlyTo center={center} zoom={zoom} />
      {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}
      {properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makePinIcon(p, p.id === selectedId)}
          eventHandlers={{ click: () => onSelect(p) }}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
        />
      ))}
    </MapContainer>
  );
}
