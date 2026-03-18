import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price number with currency symbol.
 * e.g. formatPrice(95000, "KES") → "KES 95,000"
 */
export function formatPrice(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Format area in square metres.
 * e.g. formatArea(72) → "72 m²"
 */
export function formatArea(sqm: number): string {
  return `${sqm} m²`;
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

/**
 * Returns the hero image URL for a property (first image with sort_order 0).
 * Falls back to a placeholder.
 */
export function getHeroImage(images?: { url: string; sort_order: number }[]): string {
  if (!images || images.length === 0) return "/placeholder-property.jpg";
  const hero = images.find((img) => img.sort_order === 0) || images[0];
  return hero.url;
}

/**
 * Slugify a string for URL use.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
