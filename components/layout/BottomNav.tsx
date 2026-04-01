"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "AI Agent",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    href: "/markt",
    label: "Market",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <circle cx="9" cy="10" r="0.5" fill="currentColor" />
        <circle cx="12" cy="10" r="0.5" fill="currentColor" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
];

export default function BottomNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "rgba(17,17,25,0.95)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex items-stretch h-[56px]">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const showBadge = tab.href === "/messages" && unreadMessages > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-60 relative"
            >
              <span style={{ color: active ? "var(--color-primary)" : "var(--text-3)" }} className="relative">
                {tab.icon(active)}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: "#FF453A", padding: "0 3px" }}
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.02em",
                color: active ? "var(--color-primary)" : "var(--text-3)",
                transition: "color 0.12s",
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
