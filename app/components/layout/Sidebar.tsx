"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const HISTORY = [
  { text: "3-room apartment Berlin under €2,000", time: "Today, 14:32" },
  { text: "Rental prices Munich Q1 2026",          time: "Yesterday" },
  { text: "Price trends Frankfurt",                time: "Mar 25" },
  { text: "Penthouse Westend Frankfurt",           time: "Mar 22" },
];

function Icon({ path, filled }: { path: string; filled?: boolean }) {
  return (
    <svg width="15" height="15" fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  );
}

const NAV_MAIN = [
  {
    href: "/",
    label: "AI Agent",
    path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    match: (p: string) => p === "/" || p.startsWith("/explore"),
  },
  {
    href: "/saved",
    label: "Saved",
    path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    badge: "4",
    match: (p: string) => p.startsWith("/saved"),
  },
];

const NAV_WORKSPACE = [
  {
    href: "/admin/listings",
    label: "Listings",
    path: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    match: (p: string) => p.startsWith("/admin/listings"),
  },
  {
    href: "/home",
    label: "Contracts",
    path: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
    badge: "2",
    match: (p: string) => p.startsWith("/home"),
  },
  {
    href: "/markt",
    label: "Market",
    path: "M18 20V10M12 20V4M6 20v-6",
    match: (p: string) => p.startsWith("/markt"),
  },
  {
    href: "/profile",
    label: "Profile",
    path: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
    match: (p: string) => p.startsWith("/profile"),
  },
];

export default function Sidebar() {
  const { tenant }             = useTenant();
  const pathname               = usePathname();
  const router                 = useRouter();
  const [userName, setName]    = useState("");
  const [userEmail, setEmail]  = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email ?? "");
        setName(
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User"
        );
      }
    });
  }, []);

  const initial = userName ? userName[0].toUpperCase() : "U";

  function navItem(active: boolean) {
    return {
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 8,
      color: active ? "var(--text-1)" : "var(--text-2)",
      background: active ? "var(--color-primary-light)" : "transparent",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      transition: "all 0.12s", textDecoration: "none", border: "none",
      width: "100%", textAlign: "left" as const,
    } as React.CSSProperties;
  }

  function handleNewChat() {
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 228, height: "100%",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "18px 14px 14px", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg, #7C6EF2, #9B8BF5)",
          boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 4px 12px rgba(124,110,242,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {tenant?.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={tenant.logo_url} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
            : <svg width="14" height="14" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
          }
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          {tenant?.name
            ? tenant.name
            : <><span style={{ color: "var(--color-primary)" }}>habi</span>no</>
          }
        </span>
      </div>

      {/* New Chat */}
      <div style={{ padding: "0 10px 12px" }}>
        <button
          onClick={handleNewChat}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 9,
            background: "var(--color-primary-light)",
            border: "1px solid rgba(124,110,242,0.2)",
            color: "var(--color-primary)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.12s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,110,242,0.18)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary-light)"; }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Main Nav */}
      <div style={{ padding: "0 10px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", padding: "0 8px", marginBottom: 4 }}>
          Main Menu
        </div>
        {NAV_MAIN.map(item => {
          const active = item.match(pathname);
          return (
            <Link key={item.href} href={item.href}
              style={navItem(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ color: active ? "var(--color-primary)" : "var(--text-3)", flexShrink: 0, display: "flex" }}>
                <Icon path={item.path} />
              </span>
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 700,
                  background: "var(--color-primary-light)", color: "var(--color-primary)",
                  border: "1px solid rgba(124,110,242,0.2)",
                  borderRadius: 999, padding: "1px 6px",
                }}>{item.badge}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "10px 14px" }} />

      {/* Workspace Nav */}
      <div style={{ padding: "0 10px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", padding: "0 8px", marginBottom: 4 }}>
          Management
        </div>
        {NAV_WORKSPACE.map(item => {
          const active = item.match(pathname);
          return (
            <Link key={item.href} href={item.href}
              style={navItem(active)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ color: active ? "var(--color-primary)" : "var(--text-3)", flexShrink: 0, display: "flex" }}>
                <Icon path={item.path} />
              </span>
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 700,
                  background: "var(--color-primary-light)", color: "var(--color-primary)",
                  border: "1px solid rgba(124,110,242,0.2)",
                  borderRadius: 999, padding: "1px 6px",
                }}>{item.badge}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "10px 14px" }} />

      {/* Chat History */}
      <div style={{ padding: "0 10px 4px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", padding: "0 8px", marginBottom: 4 }}>
          History
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 10px", overscrollBehavior: "contain" }}>
        {HISTORY.map((item, i) => (
          <button key={i} onClick={handleNewChat} style={{
            width: "100%", display: "block", textAlign: "left",
            padding: "7px 10px", borderRadius: 8, border: "none",
            background: "transparent", cursor: "pointer", transition: "all 0.12s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.text}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>
              {item.time}
            </div>
          </button>
        ))}
      </div>

      {/* User card */}
      <div style={{
        borderTop: "1px solid var(--border)", padding: "12px 12px",
        display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
        transition: "all 0.12s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: "linear-gradient(135deg, #7C6EF2, #C084FC)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff",
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userName || "Account"}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userEmail || "Pro Plan"}
          </div>
        </div>
        <svg width="12" height="12" fill="none" stroke="var(--text-3)" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
      </div>
    </aside>
  );
}
