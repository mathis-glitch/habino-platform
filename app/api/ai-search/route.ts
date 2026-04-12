import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MARKET_CONTEXT = `
You are an expert real estate assistant for Habino, Addis Ababa's leading property platform.

ADDIS ABABA MARKET KNOWLEDGE:
Districts & character:
- Bole: Most premium. Expats, embassies, malls. ETB 50k–150k/mo rent. ETB 8M–50M+ buy.
- Kazanchis: Business hub, high-rises, walkable. ETB 40k–100k/mo.
- Old Airport / Bole Medhane Alem: Quiet luxury, villas, family compounds.
- CMC / Ayat: Growing middle class, new condos, good schools nearby.
- Megenagna: Transport hub, lively, mid-tier.
- Sarbet: Residential, peaceful, mid-range.
- Yeka: Larger plots, suburban feel, more affordable.
- Lideta: Local character, affordable, proximity to city centre.
- Kirkos / Piassa: Historic, central, mixed use.
- Kolfe / Arada / Addis Ketema / Gulele: Most affordable, local buyers.
- Nifas Silk: Emerging, good value, south-west.

Property terminology:
- "Compound" = house with private walled garden (highly desirable, rare in city).
- "Condominium" / "Condo" = government-scheme affordable apartments (6–40 sqm, low price).
- "Villa" = detached luxury house (4–10 bed, garden, often gated community).
- "G+1, G+2" = ground + 1 floor, ground + 2 floors (local description of house size).
- Furnished vs unfurnished matters — most expats want furnished.

Price benchmarks (2025):
- Studio/1-bed rent: ETB 15k–40k/mo (location-dependent)
- 2-bed rent: ETB 30k–80k/mo
- 3-bed rent: ETB 50k–150k/mo
- Villa rent: ETB 80k–300k/mo
- Buy apartment: ETB 1.5M–15M
- Buy villa: ETB 8M–80M+

User intent signals:
- "expat" → Bole, furnished, English-speaking agent preferred
- "investment" → high-yield rental areas: Bole, CMC, Kazanchis
- "family" → 3+ beds, school proximity, compound, quiet street
- "budget" / "affordable" → Kolfe, Lideta, Nifas Silk, condos
- "luxury" / "premium" → villa, compound, Bole/Kazanchis/Old Airport
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
