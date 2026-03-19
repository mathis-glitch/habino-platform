import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { TenantProvider } from "./tenant-provider";
import { createServiceClient } from "@/lib/supabase/server";
import { tenantCssVars } from "@/lib/tenant";
import { Tenant } from "@/lib/types";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  if (!tenantId) {
    return { title: "Habino — AI Real Estate Platform" };
  }

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, tagline")
    .eq("id", tenantId)
    .single();

  return {
    title: tenant ? `${tenant.name} — Property Search` : "Habino",
    description: tenant?.tagline || "AI-powered real estate platform",
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

  const cssVars = tenant ? tenantCssVars(tenant) : "--color-primary: #00A884; --color-secondary: #0F1F3D";

  return (
    <html lang="en" style={{ cssText: cssVars } as React.CSSProperties}>
      <body className={inter.className}>
        <TenantProvider tenant={tenant}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
