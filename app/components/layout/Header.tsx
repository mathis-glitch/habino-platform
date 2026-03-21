"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";

export default function Header() {
  const { tenant } = useTenant();
  const pathname   = usePathname();

  const isChat  = pathname === "/";
  const isSaved = pathname === "/saved";
  const isMarkt = pathname === "/markt";

  const tabs = [
    { href: "/",      label: "AI Agent", active: isChat },
    { href: "/saved", label: "Saved",    active: isSaved },
    { href: "/markt", label: "Market",   active: isMarkt },
  ];

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {tenant?.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={110} height={32}
              className="h-7 w-auto object-contain" />
          ) : (
            <span className="text-base font-black tracking-tight text-slate-900">
              {tenant?.name || "habino"}
            </span>
          )}
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                t.active
                  ? "text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
              style={t.active ? { backgroundColor: "var(--color-primary)" } : {}}>
              {t.label}
            </Link>
          ))}
        </nav>


      </div>
    </header>
  );
}
