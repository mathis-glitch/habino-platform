import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ── Anthropic client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POI types the AI knows about ──────────────────────────────────────────────
const POI_TYPE_LIST = [
  "school", "kindergarten", "university", "college",
  "hospital", "clinic", "pharmacy", "doctor",
  "train_station", "subway", "bus_station", "airport",
  "park", "playground", "sports_centre", "gym", "beach",
  "supermarket", "mall", "restaurant", "cafe",
  "bank", "post_office", "police",
].join(" | ");

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Habino, a world-class AI real estate assistant powering the Habino platform — a global property marketplace with listings across 300+ cities on every continent.

Your role:
- Help users find properties that match their needs using the search_properties tool
- Be warm, concise, and direct. Max 2-3 short sentences before showing results
- Always use search_properties when the user shows any intent to browse or find properties
- Respond in the same language the user writes in
- If no results match, suggest broadening the search (different neighbourhood, higher budget, different type)
- When proximity constraints are found (e.g. "near a school", "500m to metro"), use the proximity array in search_properties

When searching, extract from the user message:
- City, country, neighbourhood
- Buy vs rent
- Property type: apartment, house, villa, office, commercial, land, plot, hall, production
- Budget (min/max price)
- Number of bedrooms / area in m²
- Proximity requirements: "near school" → {poi_type: "school", radius_m: 500}, "walking distance to metro" → {poi_type: "subway", radius_m: 800}, "500m to hospital" → {poi_type: "hospital", radius_m: 500}

Default proximity radius if not specified by user: 500m for education/health, 800m for transport.

Always call search_properties when the user wants to find, browse, compare or explore listings. Do not describe what you are going to search — just search, then describe what you found in 1-2 sentences.

When returning results that have nearest_poi_dist_m, mention the distance naturally: "All listings are within 400m of a school."`;

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_properties",
    description: "Search Habino global property database for listings matching criteria. Supports proximity-based filtering (near schools, hospitals, parks, metro stations etc). Call this whenever the user wants to find, browse, or explore properties.",
    input_schema: {
      type: "object" as const,
      properties: {
        city:           { type: "string",  description: "City name (e.g. Dubai, Lagos, Tokyo)" },
        neighbourhood:  { type: "string",  description: "Neighbourhood or district" },
        property_type:  { type: "string",  enum: ["apartment","house","villa","office","commercial","land","plot","hall","production"] },
        listing_type:   { type: "string",  enum: ["buy","rent"] },
        min_price:      { type: "number",  description: "Minimum price in local currency" },
        max_price:      { type: "number",  description: "Maximum price in local currency" },
        min_bedrooms:   { type: "number",  description: "Minimum bedrooms" },
        max_bedrooms:   { type: "number",  description: "Maximum bedrooms" },
        min_area_sqm:   { type: "number",  description: "Minimum area m²" },
        max_area_sqm:   { type: "number",  description: "Maximum area m²" },
        limit:          { type: "number",  description: "Max results (default 8, max 20)" },
        proximity: {
          type: "array",
          description: "Geospatial proximity constraints — only return properties within radius_m metres of at least one POI of the given type.",
          items: {
            type: "object",
            properties: {
              poi_type: {
                type: "string",
                description: `Type of point of interest. Allowed values: ${POI_TYPE_LIST}`,
              },
              radius_m: {
                type: "number",
                description: "Search radius in metres. Default 500 for education/health, 800 for transport.",
              },
            },
            required: ["poi_type", "radius_m"],
          },
        },
      },
      required: [],
    },
  },
];

// ── Type helpers ──────────────────────────────────────────────────────────────
type SearchInput = Record<string, unknown>;

interface ProximityConstraint {
  poi_type: string;
  radius_m: number;
}

// ── Search executor ───────────────────────────────────────────────────────────
async function execSearch(input: SearchInput): Promise<Record<string, unknown>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;

  const proximity = (input.proximity as ProximityConstraint[] | undefined) ?? [];

  // ── Path A: proximity search via PostGIS RPC ───────────────────────────────
  // When the user specifies proximity constraints we use the find_properties_near_poi
  // Postgres function (requires PostGIS + migration 006). Falls back to normal search
  // if RPC is unavailable or POI table is empty.
  if (proximity.length > 0) {
    // Use the first proximity constraint (most specific) — future: AND/OR chaining
    const p = proximity[0];

    const { data, error } = await sb.rpc("find_properties_near_poi", {
      p_tenant_id:     null,            // RPC uses RLS — no tenant filter needed from here
      p_poi_type:      p.poi_type,
      p_radius_m:      p.radius_m,
      p_city:          input.city          ?? null,
      p_country:       input.country       ?? null,
      p_listing_type:  input.listing_type  ?? null,
      p_property_type: input.property_type ?? null,
      p_max_price:     input.max_price     ?? null,
      p_min_price:     input.min_price     ?? null,
      p_min_bedrooms:  input.min_bedrooms  ?? null,
      p_lim:           Math.min(Number(input.limit) || 8, 20),
    });

    if (!error && data && data.length > 0) {
      return data as Record<string, unknown>[];
    }

    // If RPC failed or returned 0 results, fall through to normal search
    if (error) {
      console.warn("[/api/chat] proximity RPC error:", error.message, "— falling back to normal search");
    }
  }

  // ── Path B: standard filter search ────────────────────────────────────────
  let q = sb
    .from("properties")
    .select(
      "id,title,price,currency,city,neighbourhood,address,property_type,listing_type," +
      "bedrooms,bathrooms,area_sqm,description,agent_name,agent_email,agent_phone,images,status"
    )
    .eq("status", "active");

  if (input.city)           q = q.ilike("city",           `%${input.city}%`);
  if (input.neighbourhood)  q = q.ilike("neighbourhood",  `%${input.neighbourhood}%`);
  if (input.property_type)  q = q.eq("property_type",     input.property_type);
  if (input.listing_type)   q = q.eq("listing_type",      input.listing_type);
  if (input.min_price)      q = q.gte("price",            input.min_price);
  if (input.max_price)      q = q.lte("price",            input.max_price);
  if (input.min_bedrooms)   q = q.gte("bedrooms",         input.min_bedrooms);
  if (input.max_bedrooms)   q = q.lte("bedrooms",         input.max_bedrooms);
  if (input.min_area_sqm)   q = q.gte("area_sqm",         input.min_area_sqm);
  if (input.max_area_sqm)   q = q.lte("area_sqm",         input.max_area_sqm);

  const limit = Math.min(Number(input.limit) || 8, 20);
  q = q.limit(limit).order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMsgs: Array<{ role: string; content: string }> = body.messages ?? [];
    if (!rawMsgs.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

    const msgs: Anthropic.MessageParam[] = rawMsgs.map((m) => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    }));

    let foundProperties: Record<string, unknown>[] = [];

    // First call
    let res = await anthropic.messages.create({
      model: "claude-sonnet-4-6", max_tokens: 1024,
      system: SYSTEM_PROMPT, tools: TOOLS, messages: msgs,
    });

    // Tool-use loop (max 3 rounds)
    let guard = 0;
    while (res.stop_reason === "tool_use" && guard++ < 3) {
      const tb = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (!tb) break;

      let toolResult: string;
      try {
        const rows = await execSearch(tb.input as SearchInput);
        foundProperties = rows;
        const summary = rows.map((p) => ({
          id:                   p.id,
          title:                p.title,
          price:                p.price,
          currency:             p.currency,
          city:                 p.city,
          neighbourhood:        p.neighbourhood,
          property_type:        p.property_type,
          listing_type:         p.listing_type,
          bedrooms:             p.bedrooms,
          bathrooms:            p.bathrooms,
          area_sqm:             p.area_sqm,
          // proximity result fields (present only when RPC was used)
          nearest_poi_name:     p.nearest_poi_name,
          nearest_poi_dist_m:   p.nearest_poi_dist_m
            ? Math.round(p.nearest_poi_dist_m as number)
            : undefined,
        }));
        toolResult = JSON.stringify({ count: rows.length, results: summary });
      } catch (e) {
        toolResult = JSON.stringify({ count: 0, error: String(e) });
      }

      res = await anthropic.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 1024,
        system: SYSTEM_PROMPT, tools: TOOLS,
        messages: [
          ...msgs,
          { role: "assistant", content: res.content },
          { role: "user", content: [{ type: "tool_result", tool_use_id: tb.id, content: toolResult }] },
        ],
      });
    }

    const reply = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({
      reply,
      properties:  foundProperties,
      propertyIds: foundProperties.map((p) => p.id as string),
    });

  } catch (err: unknown) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
