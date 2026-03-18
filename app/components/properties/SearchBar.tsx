"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city, area or property..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white
                     text-slate-800 placeholder-slate-400 text-sm
                     focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
      </div>
      <button type="submit" className="btn-primary px-6 py-3 rounded-xl text-sm">
        Search
      </button>
    </form>
  );
}
