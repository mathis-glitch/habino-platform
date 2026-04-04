"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const G  = "#2D6A4F";
const GL = "rgba(45,106,79,0.10)";

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

export function AuthGateModal({ open, onClose, reason }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else      document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        }}
      />

      {/* Sheet */}
      <div
        ref={ref}
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, zIndex: 9001,
          background: "#fff", borderRadius: "24px 24px 0 0",
          padding: "28px 24px 40px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 24px" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill={G} />
            <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 22, fontWeight: 800, color: G, letterSpacing: -0.5 }}>habino</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1A2E", textAlign: "center", marginBottom: 8, letterSpacing: -0.3 }}>
          Create a free account
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.6, marginBottom: 28 }}>
          {reason ?? "Sign up to contact agents, save listings, and access all Habino features — it's free."}
        </p>

        {/* Benefits */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "📞", text: "Contact agents & brokers directly" },
            { icon: "💚", text: "Save and compare listings" },
            { icon: "💬", text: "Message agents & request viewings" },
            { icon: "🛠️", text: "Book household services" },
          ].map((b) => (
            <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: GL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                {b.icon}
              </div>
              <span style={{ fontSize: 13, color: "#4B5563", fontWeight: 500 }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <a href="/auth/signup" style={{
          display: "block", width: "100%", padding: "14px 0", borderRadius: 14,
          background: G, color: "#fff", textAlign: "center",
          fontSize: 15, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 16px rgba(45,106,79,0.35)",
          marginBottom: 10,
        }}>
          Sign up — it&apos;s free
        </a>
        <a href="/auth/login" style={{
          display: "block", width: "100%", padding: "14px 0", borderRadius: 14,
          background: GL, color: G, textAlign: "center",
          fontSize: 15, fontWeight: 600, textDecoration: "none",
          marginBottom: 14,
        }}>
          I already have an account
        </a>
        <button onClick={onClose} style={{
          display: "block", width: "100%", background: "none", border: "none",
          fontSize: 13, color: "#9CA3AF", cursor: "pointer",
          marginBottom: 16,
        }}>
          Continue browsing
        </button>

        {/* Legal links — required for App Store / GDPR */}
        <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", lineHeight: 1.7 }}>
          By signing up you agree to our{" "}
          <Link href="/terms" style={{ color: G, fontWeight: 600 }}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: G, fontWeight: 600 }}>Privacy Policy</Link>.
          We process your data in accordance with GDPR, Kenya DPA 2019, and UAE PDPL.
        </p>
      </div>
    </>
  );
}
