"use client";

/**
 * AIPanel — Smart search bar matching the Property page AISearchBar aesthetic.
 *  1. Instant local pre-filter: fires onSearch on every keystroke (debounced 200ms)
 *  2. AI search: fires onSubmit on Enter / AI button — caller drives the AI call
 *     and passes back aiLoading + aiSuggestion to display in the panel.
 */

import { useState, useEffect, useRef } from "react";

const G    = "#2D6A4F";
const GL   = "rgba(45,106,79,0.09)";
const FONT = "'Inter',-apple-system,sans-serif";

export interface AIPanelProps {
  title:        string;
  subtitle:     string;
  placeholder:  string;
  suggestions:  string[];
  /** Fired on every keystroke (debounced). Use for instant local pre-filter. */
  onSearch:     (query: string) => void;
  /** Fired on Enter / AI button. Use to trigger AI ranking call. */
  onSubmit?:    (query: string) => void;
  onClear?:     () => void;
  /** Total visible results — shown in subtitle when value is set */
  resultCount?: number;
  /** True while the AI ranking call is in flight */
  aiLoading?:   boolean;
  /** Short tip from AI to help refine query */
  aiSuggestion?: string | null;
}

export function AIPanel({
  title, subtitle, placeholder, suggestions,
  onSearch, onSubmit, onClear,
  resultCount, aiLoading, aiSuggestion,
}: AIPanelProps) {
  const [value,   setValue]   = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced local pre-filter
  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function submit() {
    if (!value.trim() || aiLoading) return;
    onSubmit?.(value.trim());
  }

  function pick(s: string) {
    setValue(s);
    onSearch(s);
    setTimeout(() => onSubmit?.(s), 10);
    inputRef.current?.blur();
  }

  function clear() {
    setValue("");
    onSearch("");
    onClear?.();
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  }

  // Subtitle text
  const sub = aiLoading
    ? `✦ AI is analysing ${title.toLowerCase().replace("ai ", "").replace(" finder", "")}s…`
    : value
    ? resultCount !== undefined
      ? `${resultCount} result${resultCount !== 1 ? "s" : ""} · Press Enter for AI search`
      : "Press Enter for AI search"
    : subtitle;

  return (
    <div style={{ fontFamily: FONT }}>
      {/* ── Main search bar (matches AISearchBar style) ── */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", borderRadius: 18, padding: "12px 14px",
          boxShadow: focused
            ? `0 0 0 4px ${GL}, 0 6px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)`
            : "0 6px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
          border: `1.5px solid ${focused ? G : "transparent"}`,
          cursor: "text", transition: "all .2s",
        }}
      >
        {/* Left icon — spinner while AI loading, search icon otherwise */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: aiLoading ? G : GL,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}>
          {aiLoading ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
              strokeLinecap="round" style={{ animation: "ai-spin 0.9s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke={G} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </div>

        {/* Input + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={(e) => { setFocused(true); e.currentTarget.select(); }}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={!!aiLoading}
            style={{
              display: "block", width: "100%",
              fontSize: 15, fontWeight: value ? 600 : 400,
              color: value ? "#1A1A2E" : "#AFAFAF",
              border: "none", outline: "none", background: "transparent",
              fontFamily: FONT, opacity: aiLoading ? 0.6 : 1,
            }}
          />
          <div style={{
            fontSize: 12, marginTop: 2, fontWeight: aiLoading ? 500 : 400,
            color: aiLoading ? G : "#AFAFAF",
          }}>
            {sub}
          </div>
        </div>

        {/* Right: clear × when value present, AI button when value+not loading */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {value && !aiLoading && (
            <button onClick={clear} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#AFAFAF", padding: 2, display: "flex",
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {value.trim() && !aiLoading && (
            <button onClick={submit} style={{
              background: G, border: "none", cursor: "pointer",
              color: "#fff", padding: "5px 10px", borderRadius: 8,
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
              fontFamily: FONT,
            }}>
              ✦ AI
            </button>
          )}
          {!value && (
            <div style={{
              width: 34, height: 34, borderRadius: "50%", background: "#F7F7F7",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" fill="none" stroke={focused ? G : "#717171"} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ── AI suggestion tip ── */}
      {aiSuggestion && !aiLoading && (
        <div style={{
          marginTop: 8, padding: "8px 14px", borderRadius: 12,
          background: GL, border: "1px solid rgba(45,106,79,0.15)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>💡</span>
          <span style={{ fontSize: 12, color: G, fontWeight: 500, lineHeight: 1.4 }}>{aiSuggestion}</span>
        </div>
      )}

      {/* ── Suggestion chips — show when no query typed yet ── */}
      {!value && suggestions.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={() => pick(s)}
              disabled={!!aiLoading}
              style={{
                padding: "5px 12px", borderRadius: 20,
                border: "1px solid rgba(45,106,79,0.22)",
                background: GL, color: G,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                transition: "all 0.12s",
                opacity: aiLoading ? 0.5 : 1,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* CSS animation */}
      <style>{`@keyframes ai-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
