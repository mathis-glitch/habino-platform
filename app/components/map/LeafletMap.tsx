"use client";

import { useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMap, AttributionControl } from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/lib/types";

// ── Shared canvas renderer ────────────────────────────────────────────────────
// All listing CircleMarkers share ONE <canvas> element instead of one DOM node
// per pin. At 5 000 pins this is ~10–50× faster than SVG/divIcon markers.
// Must be created after window is available (client-side only).
const PIN_RENDERER: L.Canvas | undefined =
  typeof window !== "undefined" ? L.canvas({ padding: 0.5 }) : undefined;

export type PropertyWithCoords = Property & { lat: number; lng: number };

// City-level cluster used at low zoom levels (zoom < CLUSTER_ZOOM)
export type CityCluster = {
  city:          string;
  country:       string;
  lat:           number;
  lng:           number;
  listing_count: number;
};

export const CLUSTER_ZOOM = 8; // switch from city bubbles → individual pins at this zoom

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

// ── Emoji per property type (used in map pins) ────────────────────────────────
export const TYPE_EMOJIS: Record<string, string> = {
  apartment:  "🏢",
  house:      "🏠",
  villa:      "🏡",
  office:     "💼",
  commercial: "🏪",
  land:       "🌿",
  plot:       "📍",
  hall:       "🎪",
  production: "🏭",
};

export const TYPE_LABELS: Record<string, string> = {
  apartment:  "Apartment", house:      "House",  villa:      "Villa",
  office:     "Office",    commercial: "Retail", land:       "Land",
  plot:       "Plot",      hall:       "Hall",   production: "Industrial",
};

// Fix default icon path (Webpack / Next.js issue) and suppress shadow needle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "",   // ← suppress default shadow / black-needle artefact
  shadowSize:    [0, 0],
});

function fmtPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 100_000)   return `${Math.round(price / 1_000)}K`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(price >= 10_000 ? 0 : 1)}K`;
  return String(price);
}

function makePinIcon(p: PropertyWithCoords, selected: boolean, dimmed: boolean): L.DivIcon {
  const color  = TYPE_COLORS[p.property_type]  || "#6B7280";
  const emoji  = TYPE_EMOJIS[p.property_type]  || "🏗️";
  const price  = fmtPrice(p.price);
  const ppm    = p.area_sqm && p.area_sqm > 0
    ? fmtPrice(Math.round(p.price / p.area_sqm)) + "/m²"
    : null;

  const bg     = selected ? color : "#ffffff";
  const fg     = selected ? "#ffffff" : "#111827";
  const scale  = selected ? "scale(1.72)" : dimmed ? "scale(0.82)" : "scale(1)";
  const opacity = dimmed ? "0.22" : "1";

  // Selected: prominent ring + deep glow. Normal: subtle drop-shadow.
  const shadow = selected
    ? `0 0 0 3px white, 0 0 0 6px ${color}, 0 8px 32px ${color}99`
    : "0 2px 10px rgba(0,0,0,0.13)";
  const border = selected ? `2.5px solid ${color}` : `2px solid ${color}`;

  // Pulse ring only on selected (CSS animation injected inline via a wrapping div)
  const pulseStyle = selected ? `
    position:relative;
    --pulse-color:${color};
  ` : "";

  // The pulse keyframe is injected once globally in globals.css (or we use a
  // data-URI style tag). We use a ::before pseudo via a class instead — but
  // since divIcon HTML doesn't support <style> inheritance well, we draw the
  // ring as an absolutely-positioned sibling div and animate via inline style.
  const ringHtml = selected ? `
    <div style="
      position:absolute; inset:-9px; border-radius:999px;
      border:3px solid ${color}; opacity:0;
      animation:pinPulse 1.8s ease-out infinite;
      pointer-events:none;
    "></div>
    <style>
      @keyframes pinPulse {
        0%   { transform:scale(0.85); opacity:0.7; }
        100% { transform:scale(1.6);  opacity:0;   }
      }
    </style>
  ` : "";

  const html = `
    <div style="position:relative;display:inline-block;${pulseStyle}">
      ${ringHtml}
      <div style="
        background:${bg}; color:${fg}; border:${border};
        border-radius:999px; padding:4px 10px 4px 7px;
        font-family:system-ui,sans-serif;
        box-shadow:${shadow}; cursor:pointer;
        transform:${scale}; opacity:${opacity}; transition:transform .2s,box-shadow .2s;
        display:inline-flex; flex-direction:column; align-items:center;
        white-space:nowrap; line-height:1.3;
        position:relative; z-index:1;
      ">
        <div style="display:flex;align-items:center;gap:4px">
          <span style="font-size:12px;line-height:1;flex-shrink:0">${emoji}</span>
          <span style="font-size:11px;font-weight:700">${price}</span>
        </div>
        ${ppm ? `<span style="font-size:9px;color:${selected ? "rgba(255,255,255,0.85)" : color};margin-top:1px">${ppm}</span>` : ""}
      </div>
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

// Tells Leaflet to recalculate its size after the flex layout settles.
// Required when the map is inside a split-view rather than full-screen fixed.
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Small delay lets the browser finish layout before Leaflet measures the container
    const t = setTimeout(() => { map.invalidateSize(); }, 80);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// ── Scale bar at bottom-right ─────────────────────────────────────────────────
function ScaleControl() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({ position: "bottomright", imperial: false, maxWidth: 120 });
    scale.addTo(map);
    return () => { scale.remove(); };
  }, [map]);
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

// ── Neighbourhood label icon ──────────────────────────────────────────────────
function makeNeighbourhoodIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      white-space: nowrap;
      pointer-events: none;
      text-shadow:
        0 0 3px #fff, 0 0 3px #fff, 0 0 4px #fff,
        1px 1px 0 #fff, -1px -1px 0 #fff,
        1px -1px 0 #fff, -1px 1px 0 #fff;
    ">${name}</div>`,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

export type NeighbourhoodLabel = { name: string; lat: number; lng: number };

/** Pixel position within the map container — used to anchor the popup card. */
export type PinClickPosition = { x: number; y: number };

/**
 * Geographic bounding box that constrains panning/zooming.
 * Format: [[southLat, westLng], [northLat, eastLng]]
 */
export type CityBounds = [[number, number], [number, number]];

// ── Enforce city-level bounds dynamically ─────────────────────────────────────
// MapContainer.maxBounds is read-only after mount, so we update it imperatively
// via map.setMaxBounds() inside a child component whenever the prop changes.
function BoundsEnforcer({
  bounds,
  minZoom,
}: {
  bounds?: CityBounds;
  minZoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.setMaxBounds(bounds);
      // viscosity 1.0 = hard wall (no rubber-band spring effect)
      map.options.maxBoundsViscosity = 1.0;
    } else {
      // No bounds: allow free panning worldwide
      map.setMaxBounds(L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)));
    }
    if (minZoom !== undefined) {
      map.setMinZoom(minZoom);
      // If already zoomed out further than the new minimum, snap back
      if (map.getZoom() < minZoom) map.setZoom(minZoom);
    }
  }, [map, bounds, minZoom]);
  return null;
}

interface LeafletMapProps {
  center:               [number, number];
  zoom?:                number;
  properties:           PropertyWithCoords[];
  selectedId:           string | null;
  highlightedIds?:      string[];
  /** Called when the user clicks a pin; includes pixel position within map container. */
  onSelect:             (p: PropertyWithCoords, pos: PinClickPosition) => void;
  onBoundsChange?:      (b: MapBounds) => void;
  cityClusters?:        CityCluster[];
  currentZoom?:         number;
  onCityClick?:         (c: CityCluster) => void;
  /** Neighbourhood name labels shown on the map at city zoom levels */
  neighbourhoodLabels?: NeighbourhoodLabel[];
  /** If set, restricts panning/zooming to this geographic bounding box. */
  cityBounds?:          CityBounds;
  /** Minimum zoom level — prevents zooming out beyond city scale. */
  cityMinZoom?:         number;
}

export default function LeafletMap({
  center, zoom = 5, properties, selectedId, highlightedIds, onSelect, onBoundsChange,
  cityClusters, currentZoom = zoom, onCityClick, neighbourhoodLabels,
  cityBounds, cityMinZoom,
}: LeafletMapProps) {
  const hasHighlight = highlightedIds && highlightedIds.length > 0;
  const highlightSet = hasHighlight ? new Set(highlightedIds) : null;
  const hasSelection = !!selectedId;
  const showClusters = currentZoom < CLUSTER_ZOOM;

  // The outer div provides a positioned block for the MapContainer to fill.
  // This is required for Leaflet to calculate its dimensions correctly inside
  // a flex layout (as opposed to the old full-screen fixed approach).
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom
      attributionControl={false}
      style={{
        position: "absolute", inset: 0,
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
      <MapResizer />
      <ScaleControl />
      <BoundsEnforcer bounds={cityBounds} minZoom={cityMinZoom} />
      {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}

      {/* ── City cluster layer (zoom < CLUSTER_ZOOM) ──────────────────────── */}
      {showClusters && cityClusters?.map((c) => {
        // Radius: logarithmic scale 6–30 px based on listing count
        const r = Math.min(30, Math.max(6, Math.log2(c.listing_count + 1) * 3.2));
        return (
          <CircleMarker
            key={`${c.city}|${c.country}`}
            center={[c.lat, c.lng]}
            radius={r}
            pathOptions={{
              color:       "#1d4ed8",
              fillColor:   "#3b82f6",
              fillOpacity: 0.55,
              weight:      1.5,
            }}
            eventHandlers={{ click: () => onCityClick?.(c) }}
          >
            <Tooltip direction="top" offset={[0, -r]} opacity={0.9}>
              <span style={{ fontWeight: 600 }}>{c.city}</span>
              <br />
              <span style={{ fontSize: "0.78em", color: "#555" }}>
                {c.listing_count.toLocaleString()} listings
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* ── Neighbourhood labels — visible between zoom 11 and 15 ─────────── */}
      {neighbourhoodLabels && currentZoom >= 11 && currentZoom <= 15 && neighbourhoodLabels.map((nb) => (
        <Marker
          key={`nb-${nb.name}`}
          position={[nb.lat, nb.lng]}
          icon={makeNeighbourhoodIcon(nb.name)}
          interactive={false}
          zIndexOffset={-500}
        />
      ))}

      {/* ── Individual listing pins (zoom >= CLUSTER_ZOOM) ────────────────── */}
      {/* All pins share a single canvas element via PIN_RENDERER (~10-50× faster  */}
      {/* than divIcon/SVG at 5 000+ pins). Selected pin uses a DOM Marker on top. */}
      {!showClusters && properties.map((p) => {
        const selected    = p.id === selectedId;
        const highlighted = highlightSet?.has(p.id) ?? false;
        const dimmed      = !selected && !!highlightSet && !highlighted;
        // When any pin is selected, all non-selected pins turn neutral gray
        const grayedOut   = !selected && hasSelection;
        const color       = TYPE_COLORS[p.property_type] ?? "#3B82F6";

        if (selected) {
          // Selected pin: DOM Marker so it floats above the canvas layer
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={makePinIcon(p, true, false)}
              eventHandlers={{
                click: (e: L.LeafletMouseEvent) => {
                  // stopPropagation prevents the click bubbling to the React map
                  // container div, which would immediately close the popup we open.
                  e.originalEvent.stopPropagation();
                  onSelect(p, { x: e.containerPoint.x, y: e.containerPoint.y });
                },
              }}
              zIndexOffset={1000}
            />
          );
        }

        // Unselected pin: small emoji bubble
        const emoji  = TYPE_EMOJIS[p.property_type] || "🏗️";
        const sz     = highlighted ? 34 : 28;
        const emojiSz = highlighted ? 17 : 14;
        const opacity = dimmed ? 0.28 : grayedOut ? 0.45 : 1;
        const scale   = dimmed ? 0.78 : grayedOut ? 0.88 : highlighted ? 1.12 : 1;
        const shadow  = highlighted
          ? `0 0 0 2px white, 0 0 0 3.5px ${color}, 0 4px 12px ${color}66`
          : "0 2px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.10)";

        const emojiIcon = L.divIcon({
          className: "",
          html: `<div style="
            width:${sz}px; height:${sz}px; border-radius:50%;
            background:white;
            box-shadow:${shadow};
            border:1.5px solid rgba(0,0,0,0.07);
            display:flex; align-items:center; justify-content:center;
            font-size:${emojiSz}px; line-height:1;
            transform:scale(${scale}); opacity:${opacity};
            transition:transform .15s, opacity .15s;
            cursor:pointer; user-select:none;
          ">${emoji}</div>`,
          iconSize:   [sz, sz],
          iconAnchor: [sz / 2, sz / 2],
        });

        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={emojiIcon}
            eventHandlers={{
              click: (e: L.LeafletMouseEvent) => {
                e.originalEvent.stopPropagation();
                onSelect(p, { x: e.containerPoint.x, y: e.containerPoint.y });
              },
            }}
          />
        );
      })}
    </MapContainer>
    </div>
  );
}
