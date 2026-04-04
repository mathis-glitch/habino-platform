"use client";

/**
 * AIDescribeInput
 * Voice recording + text input → calls /api/ai-draft → returns structured draft.
 * Works with Web Speech API (Chrome/Safari mobile, free, no backend needed for transcription).
 */

import { useState, useRef, useEffect } from "react";

const G    = "#2D6A4F";
const FONT = "'Inter',-apple-system,sans-serif";

export interface AIDescribeInputProps {
  type:        "property" | "broker" | "service";
  placeholder?: string;
  onDraft:     (draft: Record<string, unknown>) => void;
  /** Optional example shown below the input */
  example?:    string;
}

type Phase = "idle" | "recording" | "thinking" | "done" | "error";

// Simple waveform animation bars
function Waveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
      {[0.6, 1, 0.7, 1.2, 0.5, 0.9, 0.4, 1.1, 0.8, 0.6].map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: "#fff",
          height: `${h * 20}px`,
          animation: `wave-bar 0.8s ease-in-out infinite`,
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
      <style>{`
        @keyframes wave-bar {
          0%,100% { transform: scaleY(1); opacity:0.7; }
          50%      { transform: scaleY(1.8); opacity:1; }
        }
      `}</style>
    </div>
  );
}

export function AIDescribeInput({ type, placeholder, onDraft, example }: AIDescribeInputProps) {
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [text,     setText]     = useState("");
  const [interim,  setInterim]  = useState("");
  const [errMsg,   setErrMsg]   = useState("");
  const [draftPreview, setDraftPreview] = useState<Record<string, unknown> | null>(null);
  const recRef  = useRef<SpeechRecognition | null>(null);
  const taRef   = useRef<HTMLTextAreaElement>(null);

  const voiceSupported = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  // Auto-grow textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = taRef.current.scrollHeight + "px";
    }
  }, [text]);

  function startRecording() {
    const SR = window.SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    recRef.current = rec;

    let final = text;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { final += (final ? " " : "") + t; }
        else { interim = t; }
      }
      setText(final);
      setInterim(interim);
    };

    rec.onerror = () => { setPhase("idle"); setInterim(""); };
    rec.onend   = () => { setInterim(""); if (phase === "recording") setPhase("idle"); };

    rec.start();
    setPhase("recording");
  }

  function stopRecording() {
    recRef.current?.stop();
    recRef.current = null;
    setPhase("idle");
    setInterim("");
  }

  async function analyse() {
    const input = (text + " " + interim).trim();
    if (!input) return;
    setPhase("thinking");
    try {
      const res  = await fetch("/api/ai-draft", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description: input, type }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraftPreview(data.draft);
        setPhase("done");
      } else {
        throw new Error("No draft returned");
      }
    } catch {
      setErrMsg("AI processing failed — please try again.");
      setPhase("error");
    }
  }

  function applyDraft() {
    if (draftPreview) {
      onDraft(draftPreview);
    }
  }

  function reset() {
    setPhase("idle");
    setText("");
    setInterim("");
    setDraftPreview(null);
    setErrMsg("");
  }

  const typeLabel = { property: "property", broker: "broker profile", service: "service" }[type];
  const defaultPlaceholder = {
    property: `e.g. "I have a 3-bedroom furnished villa for rent in Bole, private compound with garden and generator, asking 85,000 ETB per month, available immediately"`,
    broker:   `e.g. "I'm a broker with 8 years experience specialising in luxury villas and expat relocation in Bole and Kazanchis. I speak English and Amharic and work with NGOs and embassies"`,
    service:  `e.g. "We offer professional home cleaning services across Bole, CMC and Kazanchis. 6-person team, eco-friendly products, available 7 days, starting from ETB 900 per session"`,
  }[type];

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", letterSpacing: -0.5, marginBottom: 4 }}>
          ✦ Describe your {typeLabel}
        </div>
        <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
          Speak or type a description — the AI will fill in all the details for you.
        </div>
      </div>

      {/* Main input area */}
      {phase !== "done" && (
        <div style={{
          borderRadius: 16,
          border: `2px solid ${phase === "recording" ? "#EF4444" : phase === "thinking" ? G : "rgba(0,0,0,0.12)"}`,
          overflow: "hidden",
          transition: "border-color 0.2s",
          background: "#fff",
        }}>
          {/* Recording banner */}
          {phase === "recording" && (
            <div style={{
              padding: "10px 14px",
              background: "#EF4444",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "rec-pulse 1s ease-in-out infinite" }} />
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Recording…</span>
                <Waveform />
              </div>
              <button onClick={stopRecording} style={{
                background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
                color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", cursor: "pointer",
              }}>
                Stop
              </button>
            </div>
          )}

          {/* Thinking banner */}
          {phase === "thinking" && (
            <div style={{
              padding: "10px 14px",
              background: `linear-gradient(90deg, ${G}, #1B4332)`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
                strokeLinecap="round" style={{ animation: "ai-spin 0.9s linear infinite", flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>AI is analysing your description…</span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={taRef}
            value={text + (interim ? " " + interim : "")}
            onChange={e => { setText(e.target.value); setInterim(""); }}
            placeholder={placeholder ?? defaultPlaceholder}
            disabled={phase === "thinking" || phase === "recording"}
            style={{
              display: "block", width: "100%", minHeight: 110,
              padding: "14px 16px", border: "none", outline: "none",
              fontSize: 14, color: "#1A1A2E", lineHeight: 1.6,
              background: "transparent", fontFamily: FONT, resize: "none",
              boxSizing: "border-box",
              opacity: phase === "thinking" ? 0.5 : 1,
            }}
          />

          {/* Bottom toolbar */}
          <div style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {/* Voice button */}
            {voiceSupported && (
              <button
                onClick={phase === "recording" ? stopRecording : startRecording}
                disabled={phase === "thinking"}
                style={{
                  width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: phase === "recording" ? "#EF4444" : "rgba(45,106,79,0.1)",
                  color: phase === "recording" ? "#fff" : G,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.2s",
                }}
                title={phase === "recording" ? "Stop recording" : "Start voice input"}
              >
                {phase === "recording" ? (
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
                  </svg>
                )}
              </button>
            )}

            <div style={{ flex: 1, fontSize: 12, color: "#9CA3AF" }}>
              {phase === "recording" ? "Speak now — tap Stop when done" :
               voiceSupported ? "Tap 🎤 to use voice" : "Type your description above"}
            </div>

            {/* Analyse button */}
            <button
              onClick={analyse}
              disabled={!text.trim() || phase === "thinking" || phase === "recording"}
              style={{
                padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                background: text.trim() && phase === "idle" ? G : "rgba(0,0,0,0.08)",
                color: text.trim() && phase === "idle" ? "#fff" : "#9CA3AF",
                fontSize: 13, fontWeight: 700, fontFamily: FONT, flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              ✦ Analyse
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {phase === "error" && (
        <div style={{ padding: "14px", background: "rgba(255,69,58,0.08)", borderRadius: 12, border: "1px solid rgba(255,69,58,0.2)", marginTop: 12 }}>
          <div style={{ fontSize: 13, color: "#FF453A", fontWeight: 600, marginBottom: 8 }}>{errMsg}</div>
          <button onClick={reset} style={{ fontSize: 13, color: G, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Try again →
          </button>
        </div>
      )}

      {/* Example hint */}
      {phase === "idle" && !text && example && (
        <button
          onClick={() => setText(example)}
          style={{
            marginTop: 8, padding: "8px 12px", borderRadius: 10,
            background: "rgba(45,106,79,0.06)", border: "1px solid rgba(45,106,79,0.12)",
            cursor: "pointer", textAlign: "left", width: "100%", fontFamily: FONT,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>Example</span>
          <span style={{ fontSize: 12, color: "#6B7280" }}>{example}</span>
        </button>
      )}

      {/* Draft preview */}
      {phase === "done" && draftPreview && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            padding: "14px 16px", borderRadius: 14,
            background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#34C759" }}>AI draft ready</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>Review below — you can edit any field before publishing.</div>
            </div>
          </div>

          {/* Key fields preview */}
          <div style={{
            borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)",
            overflow: "hidden", background: "#fff",
          }}>
            {Object.entries(draftPreview)
              .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
              .slice(0, 8)
              .map(([k, v]) => (
                <div key={k} style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 100, paddingTop: 1, flexShrink: 0 }}>
                    {k.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 13, color: "#1A1A2E", lineHeight: 1.4 }}>
                    {Array.isArray(v) ? v.join(", ") : String(v)}
                  </span>
                </div>
              ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={reset} style={{
              flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.1)",
              background: "#fff", color: "#6B7280", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            }}>
              ← Re-describe
            </button>
            <button onClick={applyDraft} style={{
              flex: 2, padding: "13px", borderRadius: 12, border: "none",
              background: G, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            }}>
              Use this draft →
            </button>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes rec-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ai-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
