"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";

export default function Header() {
  const { tenant } = useTenant();
  const pathname   = usePathname();

  const isChat    = pathname === "/";
  const isMarkt   = pathname.startsWith("/markt");
  const isHome    = pathname.startsWith("/home");
  const isProfile = pathname.startsWith("/profile");

  function navClass(active: boolean) {
    return `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      active
        ? "text-white"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;
  }

  const tabs = [
    { href: "/",        label: "KI Agent", active: isChat },
    { href: "/markt",   label: "Markt",    active: isMarkt },
    { href: "/home",    label: "Home",     active: isHome },
    { href: "/profile", label: "Profil",   active: isProfile },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo — black like Figma */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {tenant?.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={120} height={36}
              className="h-7 w-auto object-contain" />
          ) : (
            <span className="text-lg font-black tracking-tight text-slate-900">
              {tenant?.name || "habino"}
            </span>
          )}
        </Link>

        {/* Desktop tabs — pill nav */}
        <nav className="hidden md:flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href}
              className={navClass(t.active)}
              style={t.active ? { backgroundColor: "var(--color-primary)" } : {}}>
              {t.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile: search shortcut */}
          <Link href="/markt"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Markt">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Desktop: "+ Inserieren" CTA — matches Figma's "Create Listing" button */}
          <Link href="/?q=Immobilie+inserieren"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Inserieren
          </Link>

          {/* Desktop: profile icon */}
          <Link href="/profile"
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            title="My Profile">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
