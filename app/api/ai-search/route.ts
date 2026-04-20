import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MARKET_CONTEXT = `
You are an expert real estate assistant for Habino, a multi-market property platform covering Addis Ababa (Ethiopia), Nairobi (Kenya), and Dar es Salaam (Tanzania).

IMPORTANT RULES:
- "plot" and "land" are the same property type — always treat them as "land"
- Identify which city the user is searching in from the items provided (check the city field)
- Respond with context relevant to that specific city and its currency

Property terminology:
- "Compound" = house with private walled garden
- "Villa" = detached luxury house (4–10 bed, garden, gated community)
- Furnished vs unfurnished matters for expat searches

User intent signals:
- "expat" → premium districts, furnished, English-speaking agent
- "investment" → high-yield rental areas
- "family" → 3+ beds, school proximity, quiet street
- "budget" / "affordable" → outer/emerging districts
- "luxury" / "premium" → villa, compound, prime districts
`;

const TYPE_FIELDS: Record<string, string> = {
  property: "id, title, listing_type (buy/rent), property_type, neighbourhood, price (ETB), currency, bedrooms, bathrooms, area_sqm, description",
  broker:   "id, full_name, agency, bio, speciality[], districts[], years_exp, rating, verified, transaction_count, certifications[]",
  service:  "id, name, category, description, tags[], rating, verified, responseTime, price",
};

/**
 * POST /api/ai-search
 * Two-stage: first classify intent from query, then rank items.
 * Returns { matchIds, insight, suggestion }
 */
export async function POST(req: NextRequest) {
  try {
    const { query, type = "property", items, filters } = (await req.json()) as {
      query: string;
      type?: "property" | "broker" | "service";
      items: Array<Record<string, unknown>>;
      filters?: Record<string, unknown>;
    };

    if (!query?.trim() || !items?.length) {
      return NextResponse.json({ matchIds: [], insight: null, suggestion: null });
    }

    // For properties: send up to 60 items (Sonnet can handle it)
    // Compress each item to keep tokens manageable
    const MAX_ITEMS = type === "property" ? 60 : 30;
    const trimmed = items.slice(0, MAX_ITEMS).map(item => {
      if (type === "property") {
        return {
          id: item.id,
          title: item.title,
          type: item.property_type,
          listing: item.listing_type,
          neighbourhood: item.neighbourhood,
          city: item.city,
          price: item.price,
          currency: item.currency,
          beds: item.bedrooms,
          baths: item.bathrooms,
          area: item.area_sqm,
          desc: typeof item.description === "string"
            ? item.description.slice(0, 200)
            : null,
        };
      }
      return item;
    });

    const filterContext = filters && Object.keys(filters).length > 0
      ? `\nActive user filters: ${JSON.stringify(filters)}`
      : "";

    const system = `${MARKET_CONTEXT}

Item fields available: ${TYPE_FIELDS[type] ?? TYPE_FIELDS.property}

Your task: given the user's search query and a list of items, identify the best matches and provide a helpful insight.

Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "matchIds": ["id1", "id2", ...],
  "insight": "3-4 sentences: what you found, why these match, price/location context, one practical tip",
  "suggestion": "one short search refinement tip if useful, else null"
}

Rules:
- matchIds: rank best match first, return up to 12 IDs. Be generous with partial matches.
- insight: be specific — mention actual prices, districts, and what makes the top results stand out. Sound like a knowledgeable local agent.
- If zero matches: return the closest items anyway, explain why in insight, suggest how to adjust the search.
- Never mention IDs in insight — talk about the properties/brokers naturally.`;

    const msg = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 600,
      system,
      messages: [{
        role:    "user",
        content: `Search query: "${query}"\nSearch type: ${type}${filterContext}\n\nAvailable items (${trimmed.length} of ${items.length} total):\n${JSON.stringify(trimmed)}`,
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
