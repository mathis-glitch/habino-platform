"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Header() {
  const { tenant }   = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2">
          {tenant?.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={tenant.name}
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <span className="text-xl font-bold text-primary">
              {tenant?.name || "Habino"}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/?type=buy"  className="hover:text-primary transition-colors">Buy</Link>
          <Link href="/?type=rent" className="hover:text-primary transition-colors">Rent</Link>
          <Link href="/market"     className="hover:text-primary transition-colors">Market Insights</Link>
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login"    className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Sign in</Link>
          <Link href="/auth/register" className="btn-primary text-sm">List property</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
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
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-3 text-sm font-medium">
          <Link href="/?type=buy"  className="py-2 hover:text-primary" onClick={() => setMenuOpen(false)}>Buy</Link>
          <Link href="/?type=rent" className="py-2 hover:text-primary" onClick={() => setMenuOpen(false)}>Rent</Link>
          <Link href="/market"     className="py-2 hover:text-primary" onClick={() => setMenuOpen(false)}>Market Insights</Link>
          <hr className="border-slate-100" />
          <Link href="/auth/login"    className="py-2" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link href="/auth/register" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>List property</Link>
        </div>
      )}
    </header>
  );
}
