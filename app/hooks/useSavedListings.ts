"use client";

import { useState, useEffect, useCallback } from "react";

const LS_KEY = "habino_saved";

function lsGet(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function lsSet(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

export function useSavedListings() {
  const [saved, setSaved] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);

  // On mount: load from localStorage immediately, then sync from DB
  useEffect(() => {
    setSaved(lsGet());

    // Attempt to hydrate from Supabase (non-blocking)
    fetch("/api/saved")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { saved: string[] } | null) => {
        if (!data) return;
        // Merge: DB is authoritative; also preserve any localStorage additions
        const merged = Array.from(new Set([...data.saved, ...lsGet()]));
        setSaved(merged);
        lsSet(merged);
        setSynced(true);
      })
      .catch(() => {
        // Auth not set up yet or offline — localStorage fallback is fine
        setSynced(true);
      });
  }, []);

  const toggle = useCallback(async (id: string) => {
    setSaved((prev) => {
      const removing = prev.includes(id);
      const next = removing ? prev.filter((x) => x !== id) : [...prev, id];
      lsSet(next);

      // Sync to DB in the background (fire and forget)
      fetch("/api/saved", {
        method: removing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: id }),
      }).catch(() => {
        // Silently ignore — localStorage is the source of truth when offline
      });

      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, isSaved, synced };
}
