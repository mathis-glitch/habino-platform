"use client";

import { useEffect, useState } from "react";

const G = "#2D6A4F";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("habino_splash_shown")) return;
    sessionStorage.setItem("habino_splash_shown", "1");
    setVisible(true);

    const fadeTimer  = setTimeout(() => setFadeOut(true), 1800);
    const hideTimer  = setTimeout(() => setVisible(false), 2300);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: G,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.5s ease",
      pointerEvents: fadeOut ? "none" : "all",
    }}>
      {/* Logo mark */}
      <div style={{
        animation: "splashScale 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
        opacity: 0,
      }}>
        <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="9" fill="rgba(255,255,255,0.15)" />
          <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{
        marginTop: 16,
        animation: "splashFadeUp 0.5s ease 0.3s forwards",
        opacity: 0,
      }}>
        <span style={{
          fontSize: 36, fontWeight: 800, color: "#fff",
          letterSpacing: -1, fontFamily: "'Inter',-apple-system,sans-serif",
        }}>
          habino
        </span>
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8,
        animation: "splashFadeUp 0.5s ease 0.5s forwards",
        opacity: 0,
      }}>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", fontFamily: "'Inter',-apple-system,sans-serif" }}>
          Find your space.
        </span>
      </div>

      {/* Loading dot */}
      <div style={{
        position: "absolute", bottom: 60,
        animation: "splashFadeUp 0.5s ease 0.8s forwards",
        opacity: 0,
        display: "flex", gap: 6,
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            animation: `splashDot 1s ease ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashScale {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes splashFadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes splashDot {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
