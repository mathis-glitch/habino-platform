"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Forest green CI
const GREEN = "#2D6A4F";
const INACTIVE = "#9CA3AF";

const TABS = [
  {
    href: "/explore",
    label: "Explore",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    href: "/markt",
    label: "Insights",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
];

export default function BottomNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.05)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", height: 64 }}>
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const showBadge = tab.href === "/messages" && unreadMessages > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                color: active ? GREEN : INACTIVE,
                transition: "opacity 0.1s",
                position: "relative",
                textDecoration: "none",
              }}
            >
              <span style={{ position: "relative", display: "flex" }}>
                {tab.icon(active)}
                {showBadge && (
                  <span
                    style={{
                      position: "absolute", top: -3, right: -5,
                      minWidth: 15, height: 15, borderRadius: 999,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: "#fff",
                      background: "#FF453A", padding: "0 3px",
                    }}
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.01em",
                color: active ? GREEN : INACTIVE,
              }}>
                {tab.label}
              </span>
              {active && (
                <span style={{
                  position: "absolute", bottom: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 20, height: 2, borderRadius: 1,
                  background: GREEN,
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
