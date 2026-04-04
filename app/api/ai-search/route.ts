import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/ai-search
 * Ranks a list of items (properties / brokers / services) against a user query.
 * Returns { matchIds: string[], suggestion: string | null }
 */
export async function POST(req: NextRequest) {
  try {
    const { query, type, items } = (await req.json()) as {
      query: string;
      type: "property" | "broker" | "service";
      items: Array<Record<string, unknown>>;
    };

    if (!query?.trim() || !items?.length) {
      return NextResponse.json({ matchIds: [], suggestion: null });
    }

    const typeLabel = {
      property: "real estate listings",
      broker:   "real estate brokers/agents",
      service:  "home & property service providers",
    }[type];

    const system = `You are a smart search assistant for Habino, a real estate platform in Addis Ababa, Ethiopia.

Given a user search query and a list of ${typeLabel}, return the IDs of the best matches ranked by relevance.

Respond ONLY with valid JSON — no markdown, no explanation, nothing else:
{"matchIds":["id1","id2"],"suggestion":"optional tip"}

Rules:
- matchIds: IDs ranked best-first. Max 12 results. Return [] only if truly nothing is relevant.
- suggestion: a SHORT tip (≤15 words) in the user's language (English/German/Amharic) to help them
  refine their search next time. Use null if the query was already good.
- Understand natural language and synonyms:
  • "rent" = for_rent, "buy" = for_sale
  • "near CMC / in Bole / Kazanchis area" = neighbourhood match
  • "villa / luxury" = high-end property type
  • "5+ years / experienced" = years_exp threshold for brokers
  • "top rated / best" = high rating
  • "plot / site" = land type
  • commercial / office / shop = commercial property type
- For properties: match on type, listing_type, neighbourhood, price range, bedrooms, description.
- For brokers: match on speciality, districts, years_exp, rating, verified status, agency name.
- For services: match on category, tags, description, districts served.
- Be generous with partial matches — returning something is better than returning nothing.`;

    const userMsg = `Query: "${query}"

${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} to analyse:
${JSON.stringify(items)}`;

    const msg = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system,
      messages:   [{ role: "user", content: userMsg }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return NextResponse.json({ matchIds: [], suggestion: null });
    }

    const parsed = JSON.parse(raw.slice(start, end + 1));
    return NextResponse.json({
      matchIds:   Array.isArray(parsed.matchIds) ? parsed.matchIds.map(String) : [],
      suggestion: typeof parsed.suggestion === "string" ? parsed.suggestion : null,
    });

  } catch (e) {
    console.error("[/api/ai-search]", e);
    return NextResponse.json({ matchIds: [], suggestion: null }, { status: 500 });
  }
}
