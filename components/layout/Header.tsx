"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";

export default function Header() {
  const { tenant } = useTenant();
  const pathname   = usePathname();

  const isChat  = pathname === "/";
  const isHome  = pathname.startsWith("/home");
  const isMarkt = pathname.startsWith("/markt") || pathname.startsWith("/search");

  function navClass(active: boolean) {
    return `flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
      active
        ? "text-white"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`;
  }

  const tabs = [
    { href: "/",       label: "AI Agent", active: isChat },
    { href: "/home",   label: "Home",     active: isHome },
    { href: "/search", label: "Search",   active: isMarkt },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {tenant?.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={120} height={36}
              className="h-7 w-auto object-contain" />
          ) : (
            <span className="text-base font-black tracking-tight" style={{ color: "var(--color-primary)" }}>
              {tenant?.name || "Habino"}
            </span>
          )}
        </Link>

        {/* Desktop tabs — hidden on mobile (BottomNav handles it) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
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
          {/* Search icon — mobile only */}
          <Link href="/search"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Search">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Profile icon — desktop only */}
          <Link href="/profile"
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
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
