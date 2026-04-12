"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface GeoResult {
  label: string;
  neighbourhood: string | null;
  city: string | null;
  lat: number;
  lng: number;
}

interface Props {
  placeholder?: string;
  onSelect: (result: GeoResult) => void;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export default function AddressAutocomplete({ placeholder = "Search area or address…", onSelect, style, inputStyle }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q + " Addis Ababa")}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  }

  function handleSelect(r: GeoResult) {
    setQuery(r.neighbourhood ?? r.city ?? r.label.split(",")[0]);
    setOpen(false);
    onSelect(r);
  }

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", ...style }}>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 12,
          border: "1.5px solid rgba(0,0,0,0.12)",
          fontSize: 14,
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
          ...inputStyle,
        }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#AFAFAF" }}>
          …
        </span>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.07)", zIndex: 999, overflow: "hidden",
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 14px", background: "none", border: "none",
                cursor: "pointer", fontSize: 13, color: "#1A1A2E",
                borderBottom: i < results.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F7FAF9")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontWeight: 600 }}>{r.neighbourhood ?? r.city ?? r.label.split(",")[0]}</span>
              <span style={{ color: "#9CA3AF", marginLeft: 6, fontSize: 12 }}>
                {r.label.split(",").slice(1, 3).join(",").trim()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
