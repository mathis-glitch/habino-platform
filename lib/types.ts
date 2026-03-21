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
export type PropertyType   = "apartment" | "house" | "commercial" | "land" | "villa" | "office" | "hall" | "production" | "plot";
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
  // coordinates (stored in DB, used for map pins)
  lat: number | null;
  lng: number | null;
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

// ── Contracts ─────────────────────────────────────────────────
export type ContractStatus =
  | "draft"
  | "pending_review"
  | "pending_signature"
  | "signed"
  | "active"
  | "expired"
  | "terminated";

export type ContractType =
  | "residential_rental"
  | "commercial_rental"
  | "purchase"
  | "option_to_purchase"
  | "short_term_rental";

export interface ContractClause {
  title: string;
  body: string;
  type: "standard" | "special" | "jurisdiction_specific";
}

export interface ContractData {
  clauses: ContractClause[];
  special_conditions: string[];
  utilities_included: string[];
  furnished: boolean;
  pets_allowed: boolean;
  subletting_allowed: boolean;
  jurisdiction_notes: string;
  generated_at: string;
  model: string;
}

export interface ContractSignature {
  signed_at: string;
  ip?: string;
  method: "electronic" | "manual";
}

export interface Contract {
  id: string;
  tenant_id: string;
  property_id: string;

  // Parties
  landlord_user_id: string | null;
  landlord_name: string;
  landlord_email: string;
  landlord_address: string | null;

  tenant_user_id: string | null;
  tenant_name: string;
  tenant_email: string;
  tenant_address: string | null;
  tenant_id_number: string | null;

  // Contract details
  contract_type: ContractType;
  status: ContractStatus;

  // Dates
  start_date: string;         // ISO date
  end_date: string | null;
  notice_period_days: number;

  // Financials
  monthly_rent: number | null;
  purchase_price: number | null;
  deposit_amount: number | null;
  currency: string;
  payment_day: number;

  // Jurisdiction
  country_code: string;       // ISO 3166-1 alpha-2
  governing_law: string | null;
  jurisdiction_city: string | null;
  language: string;           // ISO 639-1

  // AI content
  contract_data: ContractData;

  // Signatures
  signatures: {
    landlord?: ContractSignature;
    tenant?: ContractSignature;
  };

  // PDF
  pdf_url: string | null;
  pdf_storage_path: string | null;

  // Meta
  notes: string | null;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  activated_at: string | null;

  // Joined
  property?: Property;
}

// Payload for AI contract generation
export interface GenerateContractPayload {
  property_id: string;
  contract_type: ContractType;
  start_date: string;
  end_date?: string;
  notice_period_days?: number;
  monthly_rent?: number;
  purchase_price?: number;
  deposit_amount?: number;
  currency: string;
  payment_day?: number;
  country_code: string;
  language?: string;
  landlord_name: string;
  landlord_email: string;
  landlord_address?: string;
  tenant_name: string;
  tenant_email: string;
  tenant_address?: string;
  tenant_id_number?: string;
  special_conditions?: string[];
  furnished?: boolean;
  pets_allowed?: boolean;
  subletting_allowed?: boolean;
  utilities_included?: string[];
  notes?: string;
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
  sort?: "newest" | "price_asc" | "price_desc" | "spread";
}
