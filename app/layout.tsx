import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { TenantProvider } from "./tenant-provider";
import { createServiceClient } from "@/lib/supabase/server";
import { tenantCssVars } from "@/lib/tenant";
import { Tenant } from "@/lib/types";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/pwa/InstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  if (!tenantId) {
    return {
      title: "Habino — AI Property Assistant",
      description: "Find your space. Anytime. Anywhere. — AI-powered property platform.",
      manifest: "/manifest.json",
      appleWebApp: { capable: true, statusBarStyle: "default", title: "Habino" },
      other: { "mobile-web-app-capable": "yes" },
    };
  }

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants").select("name, tagline").eq("id", tenantId).single();

  return {
    title: tenant?.name || "Habino",
    description: tenant?.tagline || "AI-powered property assistant",
    manifest: "/manifest.json",
    appleWebApp: { capable: true, statusBarStyle: "default", title: tenant?.name || "Habino" },
    other: { "mobile-web-app-capable": "yes" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  let tenant: Tenant | null = null;
  if (tenantId) {
    const supabase = createServiceClient();
    const { data } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
    tenant = data;
  }

  const cssVars = tenant
    ? tenantCssVars(tenant)
    : "--color-primary:#2D6A4F;--color-secondary:#40916C;--color-primary-dark:#1B4332;--color-primary-light:rgba(45,106,79,0.10)";

  return (
    <html lang="en" style={{ cssText: cssVars } as React.CSSProperties}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Habino" />
        <meta name="theme-color" content="#F0F7F4" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <TenantProvider tenant={tenant}>
          {/*
            ── Layout strategy ───────────────────────────────────────────────
            On real mobile (PWA): fills 100dvh, bottom nav sits at bottom.
            On desktop (preview / admin): centred phone frame 430px wide
            with gradient background — exactly like the mockup.
          */}
          <div style={{
            height: "100dvh",
            background: "linear-gradient(145deg,#E8F4EE 0%,#F0F7F4 40%,#EAF2F0 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            overflow: "hidden",
          }}>
            {/* Phone shell — fixed height so BottomNav never scrolls off screen */}
            <div style={{
              width: "100%",
              maxWidth: 430,
              height: "100dvh",
              background: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 32px 80px rgba(0,0,0,0.18)",
            }}>
              {/* Page content — only this scrolls */}
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
                paddingBottom: 0,
              }}>
                {children}
              </div>

              {/* Bottom navigation — always pinned, never scrolls */}
              <BottomNav />
            </div>
          </div>

          <InstallPrompt />
        </TenantProvider>
      </body>
    </html>
  );
}
