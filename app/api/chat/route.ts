import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
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
- Help users find properties using the search_properties tool
- Be warm, concise, and direct
- Always use search_properties when the user shows any intent to browse or find properties
- Respond in the same language the user writes in
- If the tool returns an error field, tell the user the exact error message — do not hide it
- If no results match, suggest broadening the search

CRITICAL — Response style after a search:
- After calling search_properties, respond with ONE short sentence only, like:
  "Found 8 offices in Nairobi — results are shown on the right."
  "Here are 5 apartments in Munich under €2,000/mo."
  "4 land plots over 5,000 m² — check them out on the right."
- NEVER list properties in the chat. NEVER use tables, bullet points, or property details.
  The listings panel on the right already shows all details.
- Only mention count, type, city, and maybe a notable fact (price range, proximity).

Follow-up questions (e.g. "which is cheapest?", "show me the biggest"):
- Answer directly in 1-2 sentences based on the listings shown in conversation context.
- If the user wants to see only a subset, call search_properties again with appropriate filters.
- Pick sort_by automatically: "cheapest/günstigste/moins cher" → price_asc, "most expensive/teuerste" → price_desc, "biggest/größte" → area_desc, "smallest" → area_asc.

When searching, extract from the user message:
- City, country, neighbourhood
- Buy vs rent
- Property type: apartment, house, villa, office, commercial, land, plot, hall, production
- Budget (min/max price)
- Number of bedrooms / area in m²
- Proximity: "near school" → {poi_type:"school",radius_m:500}, "near metro" → {poi_type:"subway",radius_m:800}
- Sorting intent → set sort_by accordingly

Default proximity radius: 500m for education/health, 800m for transport.
Do not describe what you will search — just search, then reply in one sentence.`;

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
        sort_by:        { type: "string",  enum: ["price_asc","price_desc","area_asc","area_desc"], description: "Sort order. Use price_asc for cheapest, price_desc for most expensive, area_desc for largest." },
        proximity: {
          type: "array",
          description: "Geospatial proximity constraints — only return properties within radius_m metres of at least one POI of the given type.",
          items: {
            type: "object",
            properties: {
              poi_type: { type: "string", description: `Allowed values: ${POI_TYPE_LIST}` },
              radius_m: { type: "number", description: "Search radius in metres." },
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
interface ProximityConstraint { poi_type: string; radius_m: number; }

// ── Search executor ───────────────────────────────────────────────────────────
async function execSearch(
  input: SearchInput,
  tenantId: string,
): Promise<Record<string, unknown>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const proximity = (input.proximity as ProximityConstraint[] | undefined) ?? [];

  // ── Path A: proximity search via PostGIS RPC ──────────────────────────────
  if (proximity.length > 0) {
    const p = proximity[0];
    const { data, error } = await sb.rpc("find_properties_near_poi", {
      p_tenant_id:     tenantId,            // ✅ tenant-isolated
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
    if (!error && data?.length > 0) return data as Record<string, unknown>[];
    if (error) console.warn("[/api/chat] proximity RPC:", error.message, "→ fallback");
  }

  // ── Path B: standard filter search ───────────────────────────────────────
  let q = sb
    .from("properties")
    .select(
      "id,title,price,currency,city,neighbourhood,address,property_type,listing_type," +
      "bedrooms,bathrooms,area_sqm,description,agent_name,agent_email,agent_phone,status,lat,lng"
    )
    .eq("status",    "active")
    .eq("tenant_id", tenantId); // ✅ always tenant-isolated

  // Use ilike without leading wildcard so Postgres can use the city index
  if (input.city)           q = q.ilike("city",          `${input.city}%`);
  if (input.neighbourhood)  q = q.ilike("neighbourhood", `${input.neighbourhood}%`);
  if (input.property_type)  q = q.eq("property_type",    input.property_type);
  if (input.listing_type)   q = q.eq("listing_type",     input.listing_type);
  if (input.min_price)      q = q.gte("price",           input.min_price);
  if (input.max_price)      q = q.lte("price",           input.max_price);
  if (input.min_bedrooms)   q = q.gte("bedrooms",        input.min_bedrooms);
  if (input.max_bedrooms)   q = q.lte("bedrooms",        input.max_bedrooms);
  if (input.min_area_sqm)   q = q.gte("area_sqm",        input.min_area_sqm);
  if (input.max_area_sqm)   q = q.lte("area_sqm",        input.max_area_sqm);

  const limit = Math.min(Number(input.limit) || 8, 20);
  // Apply sort only when explicitly requested (avoids full-table sort on large datasets)
  if (input.sort_by === "price_asc")  q = q.order("price",    { ascending: true });
  if (input.sort_by === "price_desc") q = q.order("price",    { ascending: false });
  if (input.sort_by === "area_asc")   q = q.order("area_sqm", { ascending: true });
  if (input.sort_by === "area_desc")  q = q.order("area_sqm", { ascending: false });
  q = q.limit(limit);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

function formatRows(rows: Record<string, unknown>[]) {
  return rows.map(p => ({
    id: p.id, title: p.title, price: p.price, currency: p.currency,
    city: p.city, neighbourhood: p.neighbourhood,
    property_type: p.property_type, listing_type: p.listing_type,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, area_sqm: p.area_sqm,
    lat: p.lat, lng: p.lng,
    nearest_poi_name: p.nearest_poi_name,
    nearest_poi_dist_m: p.nearest_poi_dist_m
      ? Math.round(p.nearest_poi_dist_m as number) : undefined,
  }));
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ✅ Tenant from middleware-injected header — always scoped correctly
  const tenantId = req.headers.get("x-tenant-id")?.trim() ?? "";

  if (!tenantId) {
    return new Response(
      JSON.stringify({ error: "Tenant not resolved. Check NEXT_PUBLIC_DEV_TENANT_SLUG env var." }),
      { status: 400 }
    );
  }

  const body        = await req.json();
  const rawMsgs: Array<{ role: string; content: string }> = body.messages ?? [];
  if (!rawMsgs.length) {
    return new Response(JSON.stringify({ error: "No messages" }), { status: 400 });
  }

  const initMsgs: Anthropic.MessageParam[] = rawMsgs.map(m => ({
    role:    m.role as "user" | "assistant",
    content: m.content,
  }));

  let foundProperties: Record<string, unknown>[] = [];

  // ── Streaming response ────────────────────────────────────────────────────
  // Each turn is streamed. If Claude calls a tool the tool text isn't visible
  // (it's just JSON), so the user just sees a brief pause before the reply streams.
  const enc = new TextEncoder();
  const send = (payload: Record<string, unknown>) =>
    enc.encode(`data: ${JSON.stringify(payload)}\n\n`);

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let currentMsgs = [...initMsgs];
        let guard = 0;

        while (guard++ < 4) {
          // Start a streaming call
          const stream = anthropic.messages.stream({
            model:    "claude-sonnet-4-6",
            max_tokens: 1024,
            system:   SYSTEM_PROMPT,
            tools:    TOOLS,
            messages: currentMsgs,
          });

          // Forward text deltas to the client in real-time
          stream.on("text", (text) => {
            controller.enqueue(send({ t: text }));
          });

          // Wait for the full message (needed to extract tool calls)
          const finalMsg = await stream.finalMessage();

          if (finalMsg.stop_reason !== "tool_use") {
            // No more tool calls — we're done
            break;
          }

          // ── Tool call: execute search, then continue ────────────────────
          const tb = finalMsg.content.find(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          if (!tb) break;

          let toolResult: string;
          try {
            const rows  = await execSearch(tb.input as SearchInput, tenantId);
            foundProperties = rows;
            toolResult = JSON.stringify({ count: rows.length, results: formatRows(rows) });
          } catch (e) {
            const errMsg = String(e);
            console.error("[chat/search_properties] error:", errMsg, "tenant:", tenantId, "input:", JSON.stringify(tb.input));
            // Surface real error to Claude so it can relay it (helps debugging)
            toolResult = JSON.stringify({ count: 0, error: errMsg, debug_tenant: tenantId });
          }

          // Append assistant + tool_result to conversation and loop
          currentMsgs = [
            ...currentMsgs,
            { role: "assistant" as const, content: finalMsg.content },
            {
              role: "user" as const,
              content: [{
                type:        "tool_result" as const,
                tool_use_id: tb.id,
                content:     toolResult,
              }],
            },
          ];
        }

        // ── Done: send properties so frontend can highlight map pins ───────
        controller.enqueue(send({
          done:        true,
          properties:  foundProperties,
          propertyIds: foundProperties.map(p => p.id as string),
        }));

      } catch (err) {
        const msg = String(err);
        const friendly = msg.includes("overloaded")
          ? "The AI is currently under heavy load. Please try again in a moment."
          : msg.includes("timeout") || msg.includes("timed out")
          ? "The request timed out. Please try again."
          : msg.includes("401") || msg.includes("authentication")
          ? "API authentication error. Check the ANTHROPIC_API_KEY."
          : "Something went wrong. Please try again.";
        controller.enqueue(send({ t: friendly }));
        controller.enqueue(send({ done: true, properties: [], propertyIds: [] }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
