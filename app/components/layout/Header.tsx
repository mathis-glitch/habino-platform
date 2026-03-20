"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";

export default function Header() {
  const { tenant } = useTenant();
  const pathname   = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isChat  = pathname === "/";
  const isSaved = pathname === "/saved";
  const isMarkt = pathname === "/markt";

  function navClass(active: boolean) {
    return `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
      active
        ? "text-white"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`;
  }

  const tabs = [
    {
      href: "/",
      label: "AI Agent",
      active: isChat,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "Saved",
      active: isSaved,
      icon: (
        <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      href: "/markt",
      label: "Market",
      active: isMarkt,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {tenant?.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={120} height={36}
              className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
              {tenant?.name || "Habino"}
            </span>
          )}
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href}
              className={navClass(t.active)}
              style={t.active ? { backgroundColor: "var(--color-primary)" } : {}}>
              {t.icon}
              {t.label}
            </Link>
          ))}
        </nav>

        {/* Spacer to keep nav centered */}
        <div className="hidden md:block w-24" />

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href}
              className={`${navClass(t.active)} justify-start`}
              style={t.active ? { backgroundColor: "var(--color-primary)" } : {}}
              onClick={() => setMenuOpen(false)}>
              {t.icon}
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
