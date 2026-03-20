"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import type { Property } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths (broken in webpack builds)
function fixLeafletIcons() {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// Approximate city → lat/lng lookup (fallback when property has no coordinates)
const CITY_COORDS: Record<string, [number, number]> = {
  // East Africa
  nairobi: [-1.286, 36.817], mombasa: [-4.043, 39.668], kisumu: [-0.091, 34.768],
  kampala: [0.316, 32.582], dar: [-6.792, 39.208], "dar es salaam": [-6.792, 39.208],
  // West Africa
  lagos: [6.524, 3.379], abuja: [9.057, 7.496], accra: [5.614, -0.205],
  kumasi: [6.687, -1.623],
  // South Africa
  johannesburg: [-26.204, 28.045], "cape town": [-33.924, 18.424], durban: [-29.857, 31.028],
  // Middle East
  dubai: [25.202, 55.270], "abu dhabi": [24.451, 54.377], riyadh: [24.687, 46.721],
  // Europe
  berlin: [52.520, 13.405], munich: [48.137, 11.576], münchen: [48.137, 11.576],
  hamburg: [53.550, 9.993], frankfurt: [50.110, 8.682], cologne: [50.938, 6.960], köln: [50.938, 6.960],
  london: [51.507, -0.127], manchester: [53.480, -2.242], birmingham: [52.486, -1.890],
  paris: [48.856, 2.352], madrid: [40.416, -3.703], barcelona: [41.385, 2.173],
  // Americas
  "new york": [40.712, -74.005], "los angeles": [34.052, -118.243],
  miami: [25.761, -80.191], chicago: [41.878, -87.629],
  // Asia
  mumbai: [19.076, 72.877], bangalore: [12.971, 77.594],
  singapore: [1.352, 103.819], "hong kong": [22.319, 114.169],
  // Default fallback
  default: [20, 30],
};

function getCityCoords(city: string): [number, number] {
  const key = city.toLowerCase().trim();
  return CITY_COORDS[key] ?? CITY_COORDS.default;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0, notation: "compact",
  }).format(price);
}

// Fit map bounds to all markers
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 13);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, coords]);
  return null;
}

export default function PropertyMap({ properties }: { properties: Property[] }) {
  useEffect(() => { fixLeafletIcons(); }, []);

  const coords = properties.map((p) =>
    // Use stored lat/lng if available, otherwise fall back to city lookup
    (p as Property & { latitude?: number; longitude?: number }).latitude && (p as Property & { latitude?: number; longitude?: number }).longitude
      ? [(p as Property & { latitude?: number; longitude?: number }).latitude!, (p as Property & { latitude?: number; longitude?: number }).longitude!] as [number, number]
      : getCityCoords(p.city)
  );

  const center: [number, number] = coords.length > 0 ? coords[0] : [20, 30];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coords={coords} />
        {properties.map((p, i) => (
          <Marker key={p.id} position={coords[i]}>
            <Popup>
              <div className="min-w-[180px]">
                {p.images?.[0]?.url && (
                  <img src={p.images[0].url} alt={p.title}
                    className="w-full h-24 object-cover rounded-lg mb-2" />
                )}
                <p className="font-bold text-sm text-slate-900 leading-tight">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.neighbourhood ? `${p.neighbourhood}, ` : ""}{p.city}</p>
                <p className="text-sm font-bold mt-1" style={{ color: "var(--color-primary)" }}>
                  {formatPrice(p.price, p.currency)}
                  {p.listing_type === "rent" && <span className="text-xs font-normal text-slate-400">/mo</span>}
                </p>
                {p.bedrooms > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">{p.bedrooms} bed · {p.property_type}</p>
                )}
                <Link href={`/properties/${p.id}`}
                  className="mt-2 block text-center text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  View listing →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
