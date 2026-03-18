// ── Tenant ────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  tagline: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
}

// ── User ──────────────────────────────────────────────────────
export type UserRole = "operator_admin" | "buyer";

export interface HabinoUser {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

// ── Property ──────────────────────────────────────────────────
export type ListingType    = "buy" | "rent";
export type PropertyType   = "apartment" | "house" | "commercial" | "land";
export type PropertyStatus = "draft" | "active" | "archived";

export interface Property {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  listing_type: ListingType;
  property_type: PropertyType;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  city: string;
  neighbourhood: string | null;
  address: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
  // joined
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  sort_order: number;
}

// ── Saved properties ──────────────────────────────────────────
export interface SavedProperty {
  user_id: string;
  property_id: string;
  saved_at: string;
}

// ── Market Intelligence ───────────────────────────────────────
export type DemandLevel     = "low" | "medium" | "high";
export type TrendDirection  = "up" | "down" | "stable";
export type DataConfidence  = "low" | "medium" | "high";

export interface MarketInsight {
  avg_price_sqm: number;
  trend_pct: number;
  trend_direction: TrendDirection;
  demand_level: DemandLevel;
  avm_min: number;
  avm_max: number;
  currency: string;
  summary: string;
  data_confidence: DataConfidence;
}

export interface MarketQuery {
  id: string;
  tenant_id: string;
  user_id: string | null;
  location: string;
  property_type: string;
  result_json: MarketInsight;
  created_at: string;
}

// ── API helpers ───────────────────────────────────────────────
export interface ApiError {
  error: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Property filter params ────────────────────────────────────
export interface PropertyFilters {
  listing_type?: ListingType;
  property_type?: PropertyType;
  city?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  page?: number;
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc";
}
