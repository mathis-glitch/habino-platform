import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ── Anthropic client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Habino, a world-class AI real estate assistant powering the Habino platform — a global property marketplace with 300,000+ listings across 300 cities on every continent.

Your role:
- Help users find properties that match their needs using the search_properties tool
- Be warm, concise, and direct. Max 2-3 short sentences before showing results
- Always use search_properties when the user shows any intent to browse or find properties
- Respond in the same language the user writes in
- If no results match, suggest broadening the search (different neighbourhood, higher budget, different type)

When searching, extract from the user message:
- City, country, neighbourhood
- Buy vs rent
- Property type: apartment, house, villa, office, commercial, land, plot, hall, production
- Budget (min/max price)
- Number of bedrooms / area in m2

Always call search_properties when the user wants to find, browse, compare or explore listings. Do not describe what you are going to search — just search, then describe what you found in 1-2 sentences.`;

// ── Tool definition ───────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_properties",
    description: "Search Habino global property database for listings matching criteria. Call this whenever the user wants to find, browse, or explore properties.",
    input_schema: {
      type: "object" as const,
      properties: {
        city:          { type: "string",  description: "City name (e.g. Dubai, Lagos, Tokyo)" },
        neighbourhood: { type: "string",  description: "Neighbourhood or district" },
        property_type: { type: "string",  enum: ["apartment","house","villa","office","commercial","land","plot","hall","production"] },
        listing_type:  { type: "string",  enum: ["buy","rent"] },
        min_price:     { type: "number",  description: "Minimum price in local currency" },
        max_price:     { type: "number",  description: "Maximum price in local currency" },
        min_bedrooms:  { type: "number",  description: "Minimum bedrooms" },
        max_bedrooms:  { type: "number",  description: "Maximum bedrooms" },
        min_area_sqm:  { type: "number",  description: "Minimum area m2" },
        max_area_sqm:  { type: "number",  description: "Maximum area m2" },
        limit:         { type: "number",  description: "Max results (default 8, max 20)" },
      },
      required: [],
    },
  },
];

// ── Search executor ───────────────────────────────────────────────────────────
type SearchInput = Record<string, unknown>;

async function execSearch(input: SearchInput): Promise<Record<string, unknown>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;

  let q = sb
    .from("properties")
    .select("id,title,price,currency,city,neighbourhood,address,property_type,listing_type,bedrooms,bathrooms,area_sqm,description,agent_name,agent_email,agent_phone,images,status")
    .eq("status", "active");

  if (input.city)          q = q.ilike("city",          `%${input.city}%`);
  if (input.neighbourhood) q = q.ilike("neighbourhood", `%${input.neighbourhood}%`);
  if (input.property_type) q = q.eq("property_type",    input.property_type);
  if (input.listing_type)  q = q.eq("listing_type",     input.listing_type);
  if (input.min_price)     q = q.gte("price",           input.min_price);
  if (input.max_price)     q = q.lte("price",           input.max_price);
  if (input.min_bedrooms)  q = q.gte("bedrooms",        input.min_bedrooms);
  if (input.max_bedrooms)  q = q.lte("bedrooms",        input.max_bedrooms);
  if (input.min_area_sqm)  q = q.gte("area_sqm",        input.min_area_sqm);
  if (input.max_area_sqm)  q = q.lte("area_sqm",        input.max_area_sqm);

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

    // Tool-use loop
    let guard = 0;
    while (res.stop_reason === "tool_use" && guard++ < 3) {
      const tb = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (!tb) break;

      let toolResult: string;
      try {
        const rows = await execSearch(tb.input as SearchInput);
        foundProperties = rows;
        const summary = rows.map((p) => ({
          id: p.id, title: p.title, price: p.price, currency: p.currency,
          city: p.city, neighbourhood: p.neighbourhood,
          property_type: p.property_type, listing_type: p.listing_type,
          bedrooms: p.bedrooms, bathrooms: p.bathrooms, area_sqm: p.area_sqm,
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
