import { Tenant } from "./types";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "habino.app";

/**
 * Resolve the tenant slug from a hostname.
 * e.g. "demo.habino.app"    → "demo"
 *      "app.homefind.co.ke" → custom domain lookup
 *      "localhost:3000"     → uses DEV_TENANT_SLUG env var
 */
export function getTenantSlug(hostname: string): string | null {
  // Dev mode override
  if (
    hostname === "localhost" ||
    hostname.startsWith("localhost:") ||
    hostname === "127.0.0.1"
  ) {
    return process.env.NEXT_PUBLIC_DEV_TENANT_SLUG || "demo";
  }

  // Vercel preview deployments (*.vercel.app) → use dev tenant slug
  if (hostname.endsWith(".vercel.app")) {
    return process.env.NEXT_PUBLIC_DEV_TENANT_SLUG || "demo";
  }

  // Subdomain of root domain: demo.habino.app → demo
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1);
    // Exclude www
    if (sub && sub !== "www") return sub;
  }

  // Custom domain — return null (middleware will look up by custom_domain field)
  return null;
}

/**
 * Determine if the hostname is a custom domain (not a subdomain of ROOT_DOMAIN).
 */
export function isCustomDomain(hostname: string): boolean {
  return (
    !hostname.includes("localhost") &&
    !hostname.endsWith(`.${ROOT_DOMAIN}`) &&
    hostname !== ROOT_DOMAIN
  );
}

/**
 * Build tenant CSS variables string from a Tenant object.
 * Injected into <html> style attribute for per-tenant theming.
 */
export function tenantCssVars(tenant: Tenant): string {
  return [
    `--color-primary: ${tenant.primary_color || "#00A884"}`,
    `--color-secondary: ${tenant.secondary_color || "#0F1F3D"}`,
  ].join("; ");
}

/**
 * Default fallback tenant (used when no tenant is found, e.g. root domain).
 */
export const DEFAULT_TENANT: Partial<Tenant> = {
  name: "Habino",
  primary_color: "#00A884",
  secondary_color: "#0F1F3D",
  tagline: "The White-Label AI Real Estate Platform",
};
