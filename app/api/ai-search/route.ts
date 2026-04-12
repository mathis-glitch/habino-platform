import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MARKET_CONTEXT = `
You are a real estate search assistant for Habino, operating in Addis Ababa, Ethiopia.
Market context:
- Premium: Bole, Kazanchis, Old Airport → expats, luxury, ETB 40k–120k/mo rent
- Mid-tier: CMC, Megenagna, Sarbet → growing middle class
- Affordable: Yeka, Lideta, Kolfe, Piassa, Arada → local buyers
- New builds: Ayat, Jemo, Lebu, Saris → investment, condos
- "Compound" = house with private garden (very desirable)
- "Condominium" = government housing scheme (affordable)
- Currency: Ethiopian Birr (ETB). Buy: ETB 2M–50M+
`;

const TYPE_FIELDS: Record<string, string> = {
  property: "id, title, listing_type (buy/rent), property_type, neighbourhood, price (ETB), bedrooms, area_sqm, description",
  broker:   "id, full_name, agency, speciality[], districts[], years_exp, rating, verified",
  service:  "id, name, category, description, tags[], rating, verified, responseTime",
};

/**
 * POST /api/ai-search
 * Single-call AI search — intent + ranking + insight in one pass.
 * Returns { matchIds, insight, suggestion }
 */
export async function POST(req: NextRequest) {
  try {
    const { query, type = "property", items } = (await req.json()) as {
      query: string;
      type?: "property" | "broker" | "service";
      items: Array<Record<string, unknown>>;
    };

    if (!query?.trim() || !items?.length) {
      return NextResponse.json({ matchIds: [], insight: null, suggestion: null });
    }

    // Trim items to keep prompt short → faster & cheaper
    const trimmed = items.slice(0, 18);

    const system = `${MARKET_CONTEXT}
Items have these fields: ${TYPE_FIELDS[type] ?? TYPE_FIELDS.property}

Given the user's search query and a list of items, respond with ONLY valid JSON (no markdown):
{
  "matchIds": ["id1", "id2", ...],
  "insight": "2-3 sentences: summarise what you found, key price/location observations, and one practical tip for the user",
  "suggestion": "one short tip to refine the search if helpful, else null"
}

Rules:
- matchIds: best match first, max 10 IDs. Be generous — partial matches are fine.
- insight: conversational, helpful, specific to what was found. Mention price ranges, districts, or standout properties/brokers.
- If nothing matches well, still return the closest items and explain why in insight.`;

    const msg = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system,
      messages: [{
        role:    "user",
        content: `Search query: "${query}"\nSearch type: ${type}\n\nItems:\n${JSON.stringify(trimmed)}`,
      }],
    });

    const raw   = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    let result: { matchIds?: unknown[]; insight?: string; suggestion?: string | null } = {};
    try {
      if (start !== -1 && end !== -1) result = JSON.parse(raw.slice(start, end + 1));
    } catch { result = {}; }

    return NextResponse.json({
      matchIds:   Array.isArray(result.matchIds) ? result.matchIds.map(String) : [],
      insight:    result.insight   ?? null,
      suggestion: result.suggestion ?? null,
    });

  } catch (e) {
    console.error("[/api/ai-search]", e);
    return NextResponse.json({ matchIds: [], insight: null, suggestion: null }, { status: 500 });
  }
}
