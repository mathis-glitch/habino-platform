"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { City, District } from "@/lib/types";

interface CityContextValue {
  cities: City[];
  currentCity: City | null;
  districts: District[];
  setCity: (city: City) => void;
  loading: boolean;
}

const CityContext = createContext<CityContextValue>({
  cities: [],
  currentCity: null,
  districts: [],
  setCity: () => {},
  loading: true,
});

const STORAGE_KEY = "habino_selected_city_id";

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cities?include=districts");
        const json = await res.json();
        const data: City[] = json.data ?? [];
        setCities(data);

        // Restore last selection or pick first city
        const savedId =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : null;
        const saved = data.find((c) => c.id === savedId);
        setCurrentCity(saved ?? data[0] ?? null);
      } catch {
        // silent — will retry on next mount
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const setCity = useCallback(
    (city: City) => {
      setCurrentCity(city);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, city.id);
      }
    },
    [],
  );

  const districts = currentCity?.districts ?? [];

  return (
    <CityContext.Provider value={{ cities, currentCity, districts, setCity, loading }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
