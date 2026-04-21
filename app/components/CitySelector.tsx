"use client";

import { useCity } from "@/lib/cityContext";

const FLAG: Record<string, string> = {
  ET: "🇪🇹",
  KE: "🇰🇪",
  TZ: "🇹🇿",
};

export default function CitySelector() {
  const { cities, currentCity, setCity } = useCity();

  if (cities.length <= 1) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {cities.map((city) => {
        const active = city.id === currentCity?.id;
        return (
          <button
            key={city.id}
            onClick={() => setCity(city)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 20,
              border: active ? "2px solid #2D6A4F" : "1.5px solid #E5E7EB",
              background: active ? "#F0FDF4" : "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              color: active ? "#2D6A4F" : "#717171",
              transition: "all 0.15s",
            }}
          >
            <span>{FLAG[city.country_code] ?? "🌍"}</span>
            <span>{city.name}</span>
          </button>
        );
      })}
    </div>
  );
}
