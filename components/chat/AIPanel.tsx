"use client";

/**
 * AIPanel — Smart search panel with two modes:
 *  1. Instant local pre-filter: fires onSearch on every keystroke (debounced 200ms)
 *  2. AI search: fires onSubmit on Enter / search button — caller drives the AI call
 *     and passes back aiLoading + aiSuggestion to display in the panel.
 */

import { useState, useEffect, useRef } from "react";

const G    = "#2D6A4F";
const GL   = "rgba(45,106,79,0.09)";
const FONT = "'Inter',-apple-system,sans-serif";

export interface AIPanelProps {
  title:       string;
  subtitle:    string;
  placeholder: string;
  suggestions: string[];
  /** Fired on every keystroke (debounced). Use for instant local pre-filter. */
  onSearch:    (query: string) => void;
  /** Fired on Enter / search button. Use to trigger AI ranking call. */
  onSubmit?:   (query: string) => void;
  onClear?:    () => void;
  /** Total visible results — shown as badge in header */
  resultCount?: number;
  /** True while the AI ranking call is in flight */
  aiLoading?:  boolean;
  /** Short tip from AI to help refine query */
  aiSuggestion?: string | null;
}

export function AIPanel({
  title, subtitle, placeholder, suggestions,
  onSearch, onSubmit, onClear,
  resultCount, aiLoading, aiSuggestion,
}: AIPanelProps) {
  const [value,  setValue]  = useState("");
  const [active, setActive] = useState(false);
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

  const showBadge = value && resultCount !== undefined && !aiLoading;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      overflow: "hidden",
      fontFamily: FONT,
    }}>
      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`,
        padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {aiLoading ? (
            /* Spinner while AI is thinking */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
              strokeLinecap="round" style={{ animation: "ai-spin 0.9s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {aiLoading ? "AI is analysing…" : title}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
            {aiLoading ? "Finding the best matches for you" : subtitle}
          </div>
        </div>

        {/* Result badge */}
        {showBadge && (
          <div style={{
            padding: "3px 9px", borderRadius: 20,
            background: "rgba(255,255,255,0.18)",
            fontSize: 11, fontWeight: 600, color: "#fff", flexShrink: 0,
          }}>
            {resultCount} result{resultCount !== 1 ? "s" : ""}
          </div>
        )}
        {aiLoading && (
          <div style={{
            padding: "3px 9px", borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", flexShrink: 0,
          }}>
            ✦ AI
          </div>
        )}
      </div>

      {/* ── Input row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 12px",
        borderBottom: active ? `1px solid ${G}` : "1px solid rgba(0,0,0,0.07)",
        transition: "border-color 0.15s",
      }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={!!aiLoading}
          style={{
            flex: 1, border: "none", outline: "none",
            fontSize: 14, color: "#1A1A2E",
            background: "transparent", fontFamily: FONT,
            opacity: aiLoading ? 0.5 : 1,
          }}
        />

        {value ? (
          /* Clear button */
          <button onClick={clear} disabled={!!aiLoading} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", padding: 2, display: "flex", flexShrink: 0,
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}

        {/* AI search button — only shown when there's a query */}
        {value.trim() && !aiLoading && (
          <button
            onClick={submit}
            title="Search with AI (Enter)"
            style={{
              background: G, border: "none", cursor: "pointer",
              color: "#fff", padding: "5px 10px", borderRadius: 8,
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0, fontFamily: FONT,
            }}
          >
            ✦ AI
          </button>
        )}

        {!value && (
          <div style={{ color: "#9CA3AF", display: "flex", flexShrink: 0 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        )}
      </div>

      {/* ── AI suggestion tip ── */}
      {aiSuggestion && !aiLoading && (
        <div style={{
          padding: "8px 14px 4px",
          display: "flex", alignItems: "flex-start", gap: 6,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 12, color: G, fontWeight: 500, lineHeight: 1.4 }}>
            {aiSuggestion}
          </span>
        </div>
      )}

      {/* ── Suggestion chips ── */}
      <div style={{ padding: aiSuggestion ? "8px 14px 14px" : "10px 14px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => pick(s)}
            disabled={!!aiLoading}
            style={{
              padding: "5px 11px", borderRadius: 20,
              border: `1px solid ${value === s ? G : "rgba(45,106,79,0.25)"}`,
              background: value === s ? G : GL,
              color: value === s ? "#fff" : G,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
              transition: "all 0.12s",
              opacity: aiLoading ? 0.5 : 1,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* CSS animation for spinner */}
      <style>{`@keyframes ai-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
