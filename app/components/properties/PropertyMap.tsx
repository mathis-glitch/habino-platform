"use client";

import { useEffect, useRef } from "react";

const G = "#2D6A4F";

// District centre coordinates for Addis Ababa
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

function resolveCoords(neighbourhood?: string | null, city?: string | null): [number, number] {
  if (neighbourhood) {
    for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
      if (neighbourhood.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(neighbourhood.toLowerCase())) {
        return coords;
      }
    }
  }
  return [9.005, 38.763]; // Addis Ababa center
}

interface Props {
  neighbourhood?: string | null;
  city?: string | null;
  label: string;
  height?: number;
}

export default function PropertyMap({ neighbourhood, city, label, height = 240 }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !mapRef.current) return;
    initRef.current = true;

    const [lat, lng] = resolveCoords(neighbourhood, city);

    import("leaflet").then((L) => {
      // Fix Leaflet default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Custom green pin
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;
          background:${G};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid #fff;
          box-shadow:0 4px 12px rgba(45,106,79,0.5);
          display:flex;align-items:center;justify-content:center;
        "><div style="
          transform:rotate(45deg);
          width:10px;height:10px;
          border-radius:50%;
          background:#fff;
        "></div></div>`,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
        popupAnchor:[0, -40],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<b style="color:${G}">${label}</b>`, { offset: [0, -30] })
        .openPopup();

      // Zoom controls custom
      L.control.zoom({ position: "bottomright" }).addTo(map);
    });
  }, [neighbourhood, city, label]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height, borderRadius: 14, overflow: "hidden" }}
      />
    </>
  );
}
