"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";

export default function Header() {
  const { tenant } = useTenant();
  const pathname   = usePathname();

  const tabs = [
    { href: "/",      label: "KI Agent" },
    { href: "/markt", label: "Markt"    },
    { href: "/home",  label: "Dashboard" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 20px",
        height: 52, display: "flex", alignItems: "center", gap: 16,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
          {tenant?.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={100} height={28} style={{ height: 26, width: "auto", objectFit: "contain" }} />
          ) : (
            <>
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: "linear-gradient(135deg, #7C6EF2, #9B8BF5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
                habi<span style={{ color: "var(--color-primary)" }}>no</span>
              </span>
            </>
          )}
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex" style={{
          display: "flex", alignItems: "center", gap: 2,
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 3,
        }}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} style={{
              padding: "5px 14px", borderRadius: 7,
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              transition: "all 0.12s",
              background: isActive(t.href) ? "var(--surface3)" : "transparent",
              color: isActive(t.href) ? "var(--text-1)" : "var(--text-2)",
              boxShadow: isActive(t.href) ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            }}>
              {t.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <Link href="/admin/listings/new" style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 14px", borderRadius: 8,
          background: "var(--color-primary)", color: "white",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 3px 10px rgba(124,110,242,0.2)",
          transition: "all 0.12s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-secondary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Inserieren
        </Link>

        <Link href="/profile" style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--surface2)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none", transition: "all 0.12s",
          flexShrink: 0,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
        >
          <svg width="14" height="14" fill="none" stroke="var(--text-2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
