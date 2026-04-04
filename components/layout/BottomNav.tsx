"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GREEN   = "#2D6A4F";
const INACTIVE = "#9CA3AF";

const TABS = [
  {
    href: "/explore",
    label: "Property",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
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
    href: "/services",
    label: "Services",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
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
    label: "habino",
    icon: (_active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={GREEN} />
        <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
      </svg>
    ),
  },
];

export default function BottomNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav style={{
      flexShrink: 0,
      paddingBottom: "env(safe-area-inset-bottom)",
      background: "rgba(255,255,255,0.98)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderTop: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 -2px 16px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "stretch", height: 64 }}>
        {TABS.map((tab) => {
          const active    = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const showBadge = tab.href === "/messages" && unreadMessages > 0;
          return (
            <Link key={tab.href} href={tab.href} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, color: active ? GREEN : INACTIVE,
              position: "relative", textDecoration: "none",
              transition: "opacity 0.1s",
            }}>
              <span style={{ position: "relative", display: "flex" }}>
                {tab.icon(active)}
                {showBadge && (
                  <span style={{
                    position: "absolute", top: -3, right: -5,
                    minWidth: 15, height: 15, borderRadius: 999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#fff",
                    background: "#FF453A", padding: "0 3px",
                  }}>
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: "0.01em", color: active ? GREEN : INACTIVE }}>
                {tab.label}
              </span>
              {active && (
                <span style={{
                  position: "absolute", bottom: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 20, height: 2, borderRadius: 1, background: GREEN,
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
