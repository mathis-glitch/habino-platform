import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/monitoring";

const RATE_LIMIT_MAX = 20; // requests per window
const RATE_LIMIT_WINDOW_MINUTES = 60;

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const sb = createServiceClient();
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from("ai_rate_limits")
      .select("request_count, window_start")
      .eq("ip", ip)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // No record or window expired — reset
    if (!data || data.window_start < windowStart) {
      await sb.from("ai_rate_limits").upsert(
        { ip, request_count: 1, window_start: new Date().toISOString() },
        { onConflict: "ip" }
      );
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    // Within window — check count
    if (data.request_count >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }

    await sb.from("ai_rate_limits")
      .update({ request_count: data.request_count + 1 })
      .eq("ip", ip);

    return { allowed: true, remaining: RATE_LIMIT_MAX - data.request_count - 1 };
  } catch (e) {
    captureError(e, { context: "rate_limit_check" });
    return { allowed: true, remaining: RATE_LIMIT_MAX }; // fail open — don't block on DB error
  }
}

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

// ── System prompt (dynamic per city) ──────────────────────────────────────────
function buildSystemPrompt(cityName: string, country: string, currency: string): string {
  return `You are Habino, an AI real estate assistant specialised in ${cityName}, ${country}.
You help users find properties across all neighbourhoods of ${cityName}.
The local currency is ${currency}.

Your role:
- Help users find properties using the search_properties tool
- Be warm, concise, and direct
- Always use search_properties when the user shows any intent to browse or find properties
- Respond in the same language the user writes in (English, Amharic, Swahili, or other)
- If the tool returns an error, share the exact error message
- If no results match, suggest a nearby neighbourhood or relaxed criteria

CRITICAL — Response style after a search:
- After calling search_properties, respond with ONE short sentence only, like:
  "Found 8 offices in Westlands — results are shown on the right."
  "Here are 5 apartments under 15,000 ${currency}/mo."
  "4 land plots over 5,000 m² — check them out on the right."
- NEVER list properties in the chat. NEVER use tables, bullet points, or property details.
  The listings panel on the right shows all details.
- Only mention count, type, neighbourhood, and one notable fact.

Follow-up questions (e.g. "which is cheapest?", "only over 5000m²", "near a school"):
- ALWAYS pass city: "${cityName}" when calling search_properties again.
  Never omit city — it will timeout without it.
- Answer in 1-2 sentences. Call search_properties again if the user wants a filtered subset.
- Pick sort_by automatically: "cheapest" → price_asc, "most expensive" → price_desc, "biggest" → area_desc, "smallest" → area_asc.

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
}

// Backwards compatibility constant
const SYSTEM_PROMPT = buildSystemPrompt("Addis Ababa", "Ethiopia", "ETB");

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
  // Only apply ORDER BY when city is also specified — prevents full-table sort on 6.5M rows
  const hasNarrowFilter = !!(input.city || input.neighbourhood);
  if (hasNarrowFilter) {
    if (input.sort_by === "price_asc")  q = q.order("price",    { ascending: true });
    if (input.sort_by === "price_desc") q = q.order("price",    { ascending: false });
    if (input.sort_by === "area_asc")   q = q.order("area_sqm", { ascending: true });
    if (input.sort_by === "area_desc")  q = q.order("area_sqm", { ascending: false });
  }
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

// ── Load user search preferences from DB ─────────────────────────────────────
async function loadPreferences(userId: string, tenantId: string): Promise<Record<string, unknown> | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("user_search_sessions")
      .select("preferences")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .single();
    return (data?.preferences as Record<string, unknown>) ?? null;
  } catch { return null; }
}

// ── Persist preferences extracted from a tool call ───────────────────────────
async function savePreferences(
  userId: string,
  tenantId: string,
  input: SearchInput,
) {
  try {
    const supabase = createServiceClient();
    const prefs: Record<string, unknown> = {};
    if (input.listing_type)  prefs.listing_type  = input.listing_type;
    if (input.neighbourhood) prefs.neighbourhood = input.neighbourhood;
    if (input.property_type) prefs.property_type = input.property_type;
    if (input.min_bedrooms)  prefs.bedrooms      = input.min_bedrooms;
    if (input.max_price)     prefs.max_price     = input.max_price;
    if (input.city)          prefs.city          = input.city;
    await supabase.from("user_search_sessions").upsert({
      user_id:    userId,
      tenant_id:  tenantId,
      preferences: prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,tenant_id" });
  } catch { /* non-critical */ }
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

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const { allowed, remaining } = await checkRateLimit(ip);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60) } }
    );
  }
  void remaining; // available for response headers if needed later

  const body        = await req.json();
  const rawMsgs: Array<{ role: string; content: string }> = body.messages ?? [];
  if (!rawMsgs.length) {
    return new Response(JSON.stringify({ error: "No messages" }), { status: 400 });
  }

  // ── Resolve user from Authorization header (optional) ────────────────────
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      userId = data.user?.id ?? null;
    } catch { /* anonymous session */ }
  }

  // ── Load stored preferences and inject into system prompt ─────────────────
  // ── City context from client ─────────────────────────────────────────────
  const cityName = (body.cityName as string) || "Addis Ababa";
  const cityCountry = (body.cityCountry as string) || "Ethiopia";
  const cityCurrency = (body.cityCurrency as string) || "ETB";

  let systemPrompt = buildSystemPrompt(cityName, cityCountry, cityCurrency);
  if (userId) {
    const prefs = await loadPreferences(userId, tenantId);
    if (prefs && Object.keys(prefs).length > 0) {
      const prefLines = Object.entries(prefs)
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join("\n");
      systemPrompt += `\n\nUSER PREFERENCES (from previous sessions — use as context, not strict filter):\n${prefLines}\nIf relevant, acknowledge their previous search naturally (e.g. "Still looking for apartments in Bole?").`;
    }
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
          // ── Streaming call with retry for overloaded / 529 errors ──────────
          let finalMsg: Awaited<ReturnType<typeof stream.finalMessage>> | null = null;
          let stream!: ReturnType<typeof anthropic.messages.stream>;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              stream = anthropic.messages.stream({
                model:      "claude-sonnet-4-6",
                max_tokens: 1024,
                system:     systemPrompt,
                tools:      TOOLS,
                messages:   currentMsgs,
              });
              stream.on("text", (text: string) => { controller.enqueue(send({ t: text })); });
              finalMsg = await stream.finalMessage();
              break; // success — exit retry loop
            } catch (e: unknown) {
              const msg   = String(e);
              const is529 = msg.includes("overloaded") || msg.includes("529")
                         || (e as { status?: number })?.status === 529;
              if (is529 && attempt < 2) {
                // Exponential back-off: 1 s, then 2.5 s
                await new Promise(r => setTimeout(r, attempt === 0 ? 1000 : 2500));
                continue;
              }
              throw e; // non-retryable or max retries reached
            }
          }
          if (!finalMsg) break;

          if (finalMsg.stop_reason !== "tool_use") {
            // No more tool calls — we're done
            break;
          }

          // ── Tool call: execute search, then continue ────────────────────
          const tb = finalMsg.content.find(
            (b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          if (!tb) break;

          let toolResult: string;
          try {
            const rows  = await execSearch(tb.input as SearchInput, tenantId);
            foundProperties = rows;
            toolResult = JSON.stringify({ count: rows.length, results: formatRows(rows) });
            // Persist search preferences for this user
            if (userId) savePreferences(userId, tenantId, tb.input as SearchInput);
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
