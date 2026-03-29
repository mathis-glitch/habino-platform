"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const HISTORY = [
  { text: "2-bed in Bole under 45k/mo",       time: "Today, 09:14" },
  { text: "Compare Old Airport vs CMC",         time: "Yesterday" },
  { text: "Is Kazanchis a good investment?",    time: "Mar 24" },
  { text: "Rental contract — Lideta flat",      time: "Mar 20" },
  { text: "Best schools near Sarbet",           time: "Mar 18" },
];

function NavIcon({ d, filled }: { d: string; filled?: boolean }) {
  return (
    <svg width="15" height="15" fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function Sidebar() {
  const { tenant }            = useTenant();
  const pathname              = usePathname();
  const router                = useRouter();
  const [userName, setName]   = useState("");
  const [userEmail, setEmail] = useState("");

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

  const initial    = userName ? userName[0].toUpperCase() : "U";
  const isExplore  = pathname === "/explore" || pathname === "/";
  const isSaved    = pathname.startsWith("/saved");
  const isListings = pathname.startsWith("/listings");
  const isProfile  = pathname.startsWith("/profile");
  const isSettings = pathname.startsWith("/settings");

  function navCls(active: boolean) {
    return {
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 8,
      color: active ? "#fff" : "rgba(255,255,255,0.42)",
      background: active ? "rgba(82,183,136,0.13)" : "transparent",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      transition: "all 0.15s", textDecoration: "none",
    } as React.CSSProperties;
  }

  function handleNewChat() {
    router.push("/explore");
    router.refresh();
  }

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{
        width: 228,
        background: "#0E1117",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding: "18px 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg, var(--color-primary) 0%, #52b788 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: "#fff",
          boxShadow: "0 2px 8px rgba(82,183,136,0.3)",
        }}>
          {tenant?.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={tenant.logo_url} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
            : "⌂"}
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.3px" }}>
          {tenant?.name || "Habino"}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
          color: "#52b788", background: "rgba(82,183,136,0.12)",
          border: "1px solid rgba(82,183,136,0.2)", borderRadius: 999,
          padding: "2px 7px", textTransform: "uppercase",
        }}>AI</span>
      </div>

      {/* ── New chat ── */}
      <div style={{ padding: "12px 10px 4px" }}>
        <button
          onClick={handleNewChat}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "9px 14px", borderRadius: 10,
            background: "rgba(82,183,136,0.10)", border: "1px solid rgba(82,183,136,0.18)",
            color: "#52b788", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(82,183,136,0.18)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(82,183,136,0.10)"; }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New conversation
        </button>
      </div>

      {/* ── Discover section ── */}
      <div style={{ padding: "14px 10px 2px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 8px", marginBottom: 4 }}>
          Discover
        </div>
        <Link href="/explore" style={navCls(isExplore)}
          onMouseEnter={e => { if (!isExplore) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { if (!isExplore) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>💬</span>
          Ask AI
        </Link>
        <Link href="/listings" style={navCls(isListings)}
          onMouseEnter={e => { if (!isListings) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { if (!isListings) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>🔍</span>
          Browse Listings
          <span style={{
            marginLeft: "auto", background: "var(--color-primary)", color: "#fff",
            fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px",
          }}>48</span>
        </Link>
        <a style={navCls(false)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>📊</span>
          Market Intel
        </a>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 16px" }} />

      {/* ── Workspace section ── */}
      <div style={{ padding: "2px 10px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 8px", marginBottom: 4 }}>
          Workspace
        </div>
        <Link href="/saved" style={navCls(isSaved)}
          onMouseEnter={e => { if (!isSaved) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { if (!isSaved) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>❤️</span>
          Saved Homes
          <span style={{
            marginLeft: "auto", background: "var(--color-primary)", color: "#fff",
            fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px",
          }}>12</span>
        </Link>
        <a style={navCls(false)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>🔔</span>
          Alerts
          <span style={{
            marginLeft: "auto", background: "#B45309", color: "#fff",
            fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px",
          }}>3</span>
        </a>
        <a style={navCls(false)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>📄</span>
          Contracts
        </a>
        <Link href="/profile" style={navCls(isProfile)}
          onMouseEnter={e => { if (!isProfile) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { if (!isProfile) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>👤</span>
          Profile
        </Link>
        <Link href="/settings" style={navCls(isSettings)}
          onMouseEnter={e => { if (!isSettings) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { if (!isSettings) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 14 }}>⚙️</span>
          Settings
        </Link>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 16px" }} />

      {/* ── Recent chats ── */}
      <div style={{ padding: "2px 10px 4px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 8px", marginBottom: 4 }}>
          Recent
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
        {HISTORY.map((item, i) => (
          <button
            key={i}
            onClick={handleNewChat}
            style={{
              width: "100%", display: "block", textAlign: "left",
              padding: "7px 10px", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.text}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>
              {item.time}
            </div>
          </button>
        ))}
      </div>

      {/* ── User card ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999, flexShrink: 0,
          background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff",
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userName || "Account"}
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userEmail || "Pro plan"}
          </div>
        </div>
        <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </aside>
  );
}
