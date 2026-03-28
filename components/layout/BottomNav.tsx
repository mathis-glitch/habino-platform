"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",        label: "Search"  },
  { href: "/saved",   label: "Saved"   },
  { href: "/markt",   label: "Market"  },
  { href: "/profile", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide the bottom nav on the landing page
  if (pathname === "/") return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-[52px]">
        {TABS.map((tab) => {
          const active = tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <span
                className={`text-sm font-semibold transition-colors ${active ? "" : "text-neutral-400"}`}
                style={active ? { color: "var(--color-primary)" } : {}}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
