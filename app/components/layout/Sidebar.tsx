"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconSaved({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill={active ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={active ? 2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
function IconListings({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ── Static history items (future: load from DB) ───────────────────────────────
const HISTORY_ITEMS = [
  { icon: "🔍", text: "3-room apartments under €2,000" },
  { icon: "📄", text: "Create rental contract" },
  { icon: "📊", text: "Market prices Schwabing" },
  { icon: "🏠", text: "Create new listing" },
  { icon: "💰", text: "Price analysis Pasing" },
];

// ── Sidebar component ─────────────────────────────────────────────────────────
export default function Sidebar() {
  const { tenant } = useTenant();
  const pathname   = usePathname();
  const router     = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Load user info
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email ?? "");
        setUserName(
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User"
        );
      }
    });
  }, []);

  const initial = userName ? userName[0].toUpperCase() : "U";
  const isExplore  = pathname === "/explore" || pathname === "/";
  const isSaved    = pathname.startsWith("/saved");
  const isListings = pathname.startsWith("/listings");
  const isSettings = pathname.startsWith("/settings");
  const isProfile  = pathname.startsWith("/profile");

  // Bottom nav items
  const bottomNav = [
    { href: "/saved",    label: "Saved",     active: isSaved,    icon: <IconSaved    active={isSaved}    /> },
    { href: "/listings", label: "Listings",  active: isListings, icon: <IconListings active={isListings} /> },
    { href: "/profile",  label: "Profile",   active: isProfile,  icon: <IconProfile  active={isProfile}  /> },
    { href: "/settings", label: "Settings",  active: isSettings, icon: <IconSettings active={isSettings} /> },
  ];

  async function handleNewChat() {
    // Navigate to explore — page reload clears chat state
    router.push("/explore");
    router.refresh();
  }

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{
        width: "260px",
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-sm font-black flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), #4ade80)",
            boxShadow: "0 4px 12px rgba(46,125,70,0.4)",
          }}
        >
          {tenant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.name} className="w-6 h-6 object-contain" />
          ) : "h"}
        </div>
        <span className="text-white font-extrabold text-[17px] tracking-tight">
          {tenant?.name || "habino"}
        </span>
      </div>

      {/* ── New Chat button ── */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.65)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
          }}
        >
          <IconPlus />
          New Chat
        </button>
      </div>

      {/* ── Chat history ── */}
      <div className="px-2 mt-1">
        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          Recent
        </p>
        {HISTORY_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-left transition-all"
            style={{
              background: i === 0 && isExplore ? "rgba(46,125,70,0.18)" : "transparent",
              color: i === 0 && isExplore ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
            }}
            onMouseEnter={e => {
              if (!(i === 0 && isExplore))
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={e => {
              if (!(i === 0 && isExplore))
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span className="text-sm opacity-70 flex-shrink-0">{item.icon}</span>
            <span className="text-[13px] font-medium truncate">{item.text}</span>
          </button>
        ))}
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom navigation ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px" }}>
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg mb-0.5 transition-all"
            style={{
              color: item.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              background: item.active ? "rgba(255,255,255,0.06)" : "transparent",
            }}
            onMouseEnter={e => {
              if (!item.active) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
              }
            }}
            onMouseLeave={e => {
              if (!item.active) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
              }
            }}
          >
            {item.icon}
            <span className="text-[13px] font-medium">{item.label}</span>
          </Link>
        ))}

        {/* User card */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg mt-1 transition-all"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "12px",
            marginTop: "8px",
            color: "rgba(255,255,255,0.7)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-primary), #4ade80)" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">{userName || "Account"}</div>
            <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
              {userEmail || "Profile & settings"}
            </div>
          </div>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
