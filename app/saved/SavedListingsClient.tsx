"use client";

import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Property } from "@/lib/types";
import Link from "next/link";

export function SavedListingsClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [ids, setIds]               = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
      setIds(stored);
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      setProperties([]);
      return;
    }

    async function fetchSaved() {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/batch?ids=${ids.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
        }
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSaved();
  }, [ids]);

  // Re-sync when localStorage changes (e.g. user un-saves from this page)
  useEffect(() => {
    function onStorage() {
      try {
        const stored = JSON.parse(localStorage.getItem("habino_saved") || "[]") as string[];
        setIds(stored);
      } catch {
        setIds([]);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">Merkliste</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-52 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (properties.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center" style={{ minHeight: "calc(100vh - 124px)" }}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Noch keine Favoriten</h2>
        <p className="text-slate-400 text-sm max-w-xs mb-8">
          Klick auf das Herz-Icon auf einer Immobilienkarte, um sie hier zu speichern.
        </p>
        <Link href="/search"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}>
          Immobilien entdecken
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Merkliste
          <span className="text-slate-400 font-normal text-lg ml-2">· {properties.length}</span>
        </h1>
        <Link href="/search" className="text-sm font-medium hover:underline"
          style={{ color: "var(--color-primary)" }}>
          Weitere entdecken →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </main>
  );
}
