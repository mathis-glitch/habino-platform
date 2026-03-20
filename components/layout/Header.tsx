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
  const isHome  = pathname === "/home";
  const isMarkt = pathname === "/markt";

  function navClass(active: boolean) {
    return `flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
      active
        ? "text-white"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`;
  }

  const tabs = [
    { href: "/",      label: "AI Agent", active: isChat },
    { href: "/home",  label: "Home",     active: isHome },
    { href: "/markt", label: "Market",   active: isMarkt },
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
              {t.label}
            </Link>
          ))}
        </nav>

        {/* Profile icon */}
        <Link href="/profile" className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0" title="My Profile">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>

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
              {t.label}
            </Link>
          ))}
          <Link href="/profile" className={`${navClass(pathname === "/profile")} justify-start`}
            style={pathname === "/profile" ? { backgroundColor: "var(--color-primary)" } : {}}
            onClick={() => setMenuOpen(false)}>
            Profile
          </Link>
        </div>
      )}
    </header>
  );
}
