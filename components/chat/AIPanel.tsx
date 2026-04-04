"use client";

/**
 * AIPanel — Smart search/filter panel.
 * NO chat, NO API calls. Calls onSearch(query) on every keystroke so the
 * parent can instantly filter its local data.
 */

import { useState, useEffect, useRef } from "react";

const G  = "#2D6A4F";
const GL = "rgba(45,106,79,0.09)";
const font = "'Inter',-apple-system,sans-serif";

interface AIPanelProps {
  title: string;
  subtitle: string;
  placeholder: string;
  suggestions: string[];
  /** Fired on every keystroke + suggestion click. Use to filter the list. */
  onSearch: (query: string) => void;
  /** Fired when input is cleared */
  onClear?: () => void;
  /** Total visible results — shown as "X results" badge */
  resultCount?: number;
}

export function AIPanel({
  title, subtitle, placeholder, suggestions,
  onSearch, onClear, resultCount,
}: AIPanelProps) {
  const [value,  setValue]  = useState("");
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce: fire onSearch 120 ms after last keystroke
  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function pick(s: string) {
    setValue(s);
    onSearch(s);
    inputRef.current?.blur();
  }

  function clear() {
    setValue("");
    onSearch("");
    onClear?.();
    inputRef.current?.focus();
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      overflow: "hidden",
      fontFamily: font,
    }}>
      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`,
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{subtitle}</div>
        </div>
        {value && resultCount !== undefined && (
          <div style={{
            padding: "3px 9px", borderRadius: 20,
            background: "rgba(255,255,255,0.18)",
            fontSize: 11, fontWeight: 600, color: "#fff", flexShrink: 0,
          }}>
            {resultCount} result{resultCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Input row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        borderBottom: active ? `1px solid ${G}` : "1px solid rgba(0,0,0,0.07)",
        transition: "border-color 0.15s",
      }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none",
            fontSize: 14, color: "#1A1A2E",
            background: "transparent", fontFamily: font,
          }}
        />
        {value ? (
          <button onClick={clear} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", padding: 2, display: "flex", flexShrink: 0,
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <div style={{ color: "#9CA3AF", display: "flex", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Suggestion chips ── */}
      <div style={{ padding: "10px 14px 14px", display: "flex", gap: 7, flexWrap: "wrap" }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => pick(s)}
            style={{
              padding: "5px 11px", borderRadius: 20,
              border: `1px solid ${value === s ? G : "rgba(45,106,79,0.25)"}`,
              background: value === s ? G : GL,
              color: value === s ? "#fff" : G,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: font,
              transition: "all 0.12s",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
