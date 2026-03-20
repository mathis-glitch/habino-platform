"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { tenant }    = useTenant();
  const pathname      = usePathname();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin,    setIsAdmin]    = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsAdmin(profile?.role === "operator_admin" || profile?.role === "admin");
      }
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const isChat   = pathname === "/";
  const isSaved  = pathname === "/saved";
  const isMarkt  = pathname === "/markt";

  function navClass(active: boolean) {
    return `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
      active
        ? "text-white"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`;
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {tenant?.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={tenant.name}
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
              {tenant?.name || "Habino"}
            </span>
          )}
        </Link>

        {/* Center: 2 main tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-2xl p-1">

          {/* KI Agent */}
          <Link href="/" className={navClass(isChat)} style={isChat ? { backgroundColor: "var(--color-primary)" } : {}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            KI Agent
          </Link>

          {/* Merkliste */}
          <Link href="/saved" className={navClass(isSaved)} style={isSaved ? { backgroundColor: "var(--color-primary)" } : {}}>
            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Merkliste
          </Link>

          {/* Markt */}
          <Link href="/markt" className={navClass(isMarkt)} style={isMarkt ? { backgroundColor: "var(--color-primary)" } : {}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Markt
          </Link>
        </nav>

        {/* Right: auth */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
              >
                Abmelden
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="text-sm font-medium px-4 py-2 rounded-xl text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Anmelden
            </Link>
          )}
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
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          <Link href="/" className={`${navClass(isChat)} justify-start`} style={isChat ? { backgroundColor: "var(--color-primary)" } : {}} onClick={() => setMenuOpen(false)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            KI Agent
          </Link>
          <Link href="/saved" className={`${navClass(isSaved)} justify-start`} style={isSaved ? { backgroundColor: "var(--color-primary)" } : {}} onClick={() => setMenuOpen(false)}>
            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            Merkliste
          </Link>
          <Link href="/markt" className={`${navClass(isMarkt)} justify-start`} style={isMarkt ? { backgroundColor: "var(--color-primary)" } : {}} onClick={() => setMenuOpen(false)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Markt
          </Link>
          <hr className="border-slate-100 my-2" />
          {isLoggedIn ? (
            <>
              {isAdmin && <Link href="/admin" className="py-2 px-2 text-sm font-medium text-slate-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
              <button onClick={handleSignOut} className="py-2 px-2 text-left text-sm font-medium text-red-500">Abmelden</button>
            </>
          ) : (
            <Link href="/auth/login" className="text-sm font-medium text-center px-4 py-2.5 rounded-xl text-white mt-1"
              style={{ backgroundColor: "var(--color-primary)" }} onClick={() => setMenuOpen(false)}>
              Anmelden
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
