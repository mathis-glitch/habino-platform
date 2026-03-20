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
      title: "Habino — KI Immobilienassistent",
      description: "Find your space. Anytime. Anywhere. — KI-gestützte Immobilienplattform.",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Habino",
      },
      other: {
        "mobile-web-app-capable": "yes",
      },
    };
  }

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, tagline")
    .eq("id", tenantId)
    .single();

  return {
    title: tenant?.name || "Habino",
    description: tenant?.tagline || "KI-gestützter Immobilienassistent",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: tenant?.name || "Habino",
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  let tenant: Tenant | null = null;

  if (tenantId) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();
    tenant = data;
  }

  // Fix: updated default to new forest green brand colors
  const cssVars = tenant
    ? tenantCssVars(tenant)
    : "--color-primary: #2E7D46; --color-secondary: #0F1F3D; --color-primary-dark: #235f35; --color-primary-light: #e8f5ed";

  return (
    <html lang="de" style={{ cssText: cssVars } as React.CSSProperties}>
      <head>
        {/* PWA — iOS */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Habino" />
        {/* PWA — Android / General */}
        <meta name="theme-color" content="#2E7D46" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} pb-safe`}>
        <TenantProvider tenant={tenant}>
          {/* Main content — extra bottom padding on mobile for BottomNav */}
          <div className="md:pb-0 pb-16">
            {children}
          </div>
          <BottomNav />
          <InstallPrompt />
        </TenantProvider>
      </body>
    </html>
  );
}
