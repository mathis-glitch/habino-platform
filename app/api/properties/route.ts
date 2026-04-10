import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PropertyFilters } from "@/lib/types";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// GET /api/properties — public listing feed
export async function GET(request: NextRequest) {
  let tenantId = request.headers.get("x-tenant-id");

  // Fallback: if no tenant resolved from hostname, use the first active tenant
  // (single-tenant deployments on Vercel preview / custom domains)
  if (!tenantId?.trim()) {
    const svc = createServiceClient();
    const { data: firstTenant } = await svc
      .from("tenants")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .single();
    if (!firstTenant) {
      return NextResponse.json({ error: "No active tenant found" }, { status: 404 });
    }
    tenantId = firstTenant.id;
  }

  const { searchParams } = new URL(request.url);

  // ── Semantic search: ?q= natural language query ────────────────────────────
  const q = searchParams.get("q")?.trim();
  if (q) {
    // Embed the user's query and find semantically similar properties
    let semanticIds: string[] = [];
    try {
      const embResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: q,
      });
      const queryEmbedding = embResponse.data[0].embedding;

      const supabase = createServiceClient();
      const { data: matches } = await supabase.rpc("search_properties_semantic", {
        query_embedding:  queryEmbedding,
        tenant_id_filter: tenantId,
        match_count:      30,
        threshold:        0.35,
      });

      if (matches && matches.length > 0) {
        semanticIds = matches.map((m: { id: string }) => m.id);
      }
    } catch {
      // If embedding fails, fall through to regular keyword search
    }

    if (semanticIds.length > 0) {
      // Fetch full property data for the matched IDs, preserving similarity order
      const supabase = createServiceClient();
      const { data: props } = await supabase
        .from("properties")
        .select("*, images:property_images(id, url, sort_order)")
        .eq("tenant_id", tenantId!)
        .eq("status", "active")
        .in("id", semanticIds);

      // Re-sort to match semantic order (Supabase .in() doesn't preserve order)
      const ordered = semanticIds
        .map(id => props?.find(p => p.id === id))
        .filter(Boolean);

      return NextResponse.json({
        data:  ordered,
        total: ordered.length,
        page:  1,
        limit: ordered.length,
        semantic: true,
      });
    }
    // If no semantic matches, fall through to regular filter search below
  }

  const filters: PropertyFilters = {
    listing_type:  (searchParams.get("type") as any)      || undefined,
    property_type: (searchParams.get("property_type") as any) || undefined,
    city:          searchParams.get("city")               || undefined,
    min_price:     searchParams.get("min_price") ? parseInt(searchParams.get("min_price")!) : undefined,
    max_price:     searchParams.get("max_price") ? parseInt(searchParams.get("max_price")!) : undefined,
    bedrooms:      searchParams.get("bedrooms")  ? parseInt(searchParams.get("bedrooms")!)  : undefined,
    page:          parseInt(searchParams.get("page")  || "1"),
    limit:         parseInt(searchParams.get("limit") || "12"),
    sort:          (searchParams.get("sort") as any) || "newest",
  };

  const supabase = createServiceClient();
  const offset   = ((filters.page || 1) - 1) * (filters.limit || 12);

  // neighbourhood filter — supports single ("neighbourhood") or multi ("neighbourhoods" comma-sep)
  const neighbourhoodParam  = searchParams.get("neighbourhood")  || undefined;
  const neighbourhoodsParam = searchParams.get("neighbourhoods") || undefined;
  // property type — supports single ("property_type") or multi ("property_types" comma-sep)
  const propertyTypesParam  = searchParams.get("property_types") || undefined;

  // ── Parse bbox ──────────────────────────────────────────────────────────────
  const bboxParam = searchParams.get("bbox");
  let bboxCoords: { south: number; west: number; north: number; east: number } | null = null;
  if (bboxParam) {
    const [south, west, north, east] = bboxParam.split(",").map(Number);
    if (!isNaN(south) && !isNaN(west) && !isNaN(north) && !isNaN(east)) {
      bboxCoords = { south, west, north, east };
    }
  }

  // ── Base query builder (filters shared between PostGIS + fallback paths) ───
  function buildBase() {
    let q = supabase
      .from("properties")
      .select("*, images:property_images(id, url, sort_order)", { count: "exact" })
      .eq("tenant_id", tenantId!)
      .eq("status", "active")
      .range(offset, offset + (filters.limit || 12) - 1);

    if (filters.listing_type)  q = q.eq("listing_type",  filters.listing_type);
    if (filters.min_price)     q = q.gte("price", filters.min_price);
    if (filters.max_price)     q = q.lte("price", filters.max_price);
    if (filters.bedrooms)      q = q.eq("bedrooms", filters.bedrooms);

    // Property type — multi takes precedence over single
    if (propertyTypesParam) {
      const types = propertyTypesParam.split(",").map(t => t.trim()).filter(Boolean);
      if (types.length === 1) q = q.eq("property_type", types[0]);
      else if (types.length > 1) q = q.in("property_type", types);
    } else if (filters.property_type) {
      q = q.eq("property_type", filters.property_type);
    }

    // District / neighbourhood — multi takes precedence over single
    if (neighbourhoodsParam) {
      const districts = neighbourhoodsParam.split(",").map(d => d.trim()).filter(Boolean);
      if (districts.length === 1) {
        q = q.ilike("neighbourhood", `%${districts[0]}%`);
      } else if (districts.length > 1) {
        q = q.or(districts.map(d => `neighbourhood.ilike.%${d}%`).join(","));
      }
    } else if (neighbourhoodParam) {
      q = q.ilike("neighbourhood", `%${neighbourhoodParam}%`);
    }

    return q;
  }

  // Apply sort order — returns the same query type Supabase expects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applySort(q: any): any {
    if (filters.sort === "price_asc")  return q.order("price",      { ascending: true  });
    if (filters.sort === "price_desc") return q.order("price",      { ascending: false });
    if (filters.sort === "spread")     return q.order("lng",        { ascending: true  }).order("lat", { ascending: true });
    return                                    q.order("created_at", { ascending: false });
  }

  // ── ids param: fetch specific properties by ID (e.g. saved listings) ────────
  const idsParam = searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ data: [], total: 0, page: 1, limit: ids.length });
    const result = await supabase
      .from("properties")
      .select("*, images:property_images(id, url, sort_order)")
      .eq("tenant_id", tenantId!)
      .in("id", ids);
    return NextResponse.json({ data: result.data ?? [], total: result.data?.length ?? 0, page: 1, limit: ids.length });
  }

  // ── City / legacy filter (only when no bbox) ────────────────────────────────
  const citiesParam = searchParams.get("cities");

  // ── Execute query ──────────────────────────────────────────────────────────
  let data: any[] | null = null;
  let count: number | null = null;
  let error: { message: string } | null = null;

  if (bboxCoords) {
    const { south, west, north, east } = bboxCoords;

    // ── lat/lng B-tree bbox scan ──────────────────────────────────────────────
    // Simple and fast — PostGIS st_intersects via PostgREST is not supported.
    // PostGIS is only used for proximity queries (ST_DWithin) via RPC functions.
    const result = await applySort(
      buildBase()
        .gte("lat", south).lte("lat", north)
        .gte("lng", west) .lte("lng", east)
        .not("lat", "is", null)
    );
    data  = result.data;
    count = result.count;
    error = result.error;

  } else {
    // ── No bbox: city name filter or plain list ───────────────────────────────
    let q = buildBase();
    if (citiesParam) {
      const cityList = citiesParam.split(",").map(c => c.trim()).filter(Boolean);
      q = q.in("city", cityList);
    } else if (filters.city) {
      q = q.ilike("city", `%${filters.city}%`);
    }
    const result = await applySort(q);
    data  = result.data;
    count = result.count;
    error = result.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    total: count || 0,
    page:  filters.page,
    limit: filters.limit,
  });
}

// POST /api/properties — create listing (operator auth required)
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const serviceClient = createServiceClient();

  const body = await request.json();

  const { data, error } = await serviceClient
    .from("properties")
    .insert({ ...body, tenant_id: tenantId })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate embedding in the background — don't block the response
  embedProperty(data).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}

// ── Background embedding helper ────────────────────────────────────────────────
async function embedProperty(p: Record<string, unknown>) {
  try {
    const text = [
      p.title, p.property_type,
      p.listing_type === "rent" ? "for rent" : "for sale",
      p.bedrooms ? `${p.bedrooms} bedrooms` : null,
      p.area_sqm ? `${p.area_sqm} sqm` : null,
      p.neighbourhood, p.city,
      p.description ? String(p.description).slice(0, 500) : null,
    ].filter(Boolean).join(". ");

    const res  = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
    const vec  = res.data[0].embedding;
    const supabase = createServiceClient();
    await supabase.from("properties").update({ embedding: vec as unknown as string }).eq("id", p.id);
  } catch {
    // Non-critical — backfill script can re-run to catch failures
  }
}
