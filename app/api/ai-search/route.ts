import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/ai-search
 *
 * Two-step AI search:
 *  1. Query understanding — Claude expands the user's intent into structured signals
 *  2. Ranking — Claude ranks items against the understood intent
 *
 * Returns { matchIds: string[], suggestion: string | null, intent: object }
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

    // ── Step 1: Understand query intent ──────────────────────────────────────
    const intentSystem = `You are an expert real estate search assistant for Habino, operating in Addis Ababa, Ethiopia.

Market context you must know:
- Premium districts: Bole, Kazanchis, Old Airport → high prices, expats, luxury
- Mid-tier: CMC, Megenagna, Sarbet, Summit, Gerji → growing middle class
- Affordable: Yeka, Lideta, Kolfe, Piassa, Arada → local buyers/renters
- New developments: Ayat, Jemo, Lebu, Saris → new builds, investment
- Currency: Ethiopian Birr (ETB). Typical rent: ETB 15,000–120,000/mo. Buy: ETB 2M–50M+
- "Compound" = house with garden/private yard — very desirable
- "Condominium" = government housing scheme — affordable
- Local languages: Amharic, Oromo. Expats speak English, some German/French

Your task: Deeply understand what the user REALLY wants from their query.
Think about unstated needs, synonyms, and implied requirements.

Return ONLY valid JSON — no markdown:
{
  "intent_summary": "one sentence describing what the user wants",
  "property_types": ["villa","apartment","house","commercial","land","office","hall","plot"],
  "listing_type": "rent|buy|",
  "districts": ["district names they mentioned or implied"],
  "price_max": null_or_number,
  "bedrooms_min": null_or_number,
  "key_signals": ["important keywords/phrases to match against"],
  "implicit_needs": ["things not said explicitly but implied by context"],
  "language": "en|de|am|other",
  "suggestion": "short tip to improve query, or null"
}`;

    const intentMsg = await client.messages.create({
      model:    "claude-sonnet-4-6",
      max_tokens: 512,
      system:   intentSystem,
      messages: [{ role: "user", content: `User query: "${query}"\nSearch type: ${type}` }],
    });

    const intentRaw = intentMsg.content[0].type === "text" ? intentMsg.content[0].text.trim() : "{}";
    const iStart = intentRaw.indexOf("{");
    const iEnd   = intentRaw.lastIndexOf("}");
    let intent: Record<string, unknown> = {};
    try {
      if (iStart !== -1 && iEnd !== -1) intent = JSON.parse(intentRaw.slice(iStart, iEnd + 1));
    } catch { intent = {}; }

    // ── Step 2: Rank items against understood intent ──────────────────────────
    const typeContext = {
      property: `Real estate listings in Addis Ababa. Fields: id, title, listing_type (buy/rent), property_type, neighbourhood, city, price (ETB), bedrooms, area_sqm, description.`,
      broker:   `Real estate brokers/agents in Addis Ababa. Fields: id, name, agency, speciality (array), districts (array), years_exp, rating (0–5), verified.`,
      service:  `Home & property service providers in Addis Ababa. Fields: id, name, category, description, tags, districts, rating, verified, responseTime.`,
    }[type];

    const rankSystem = `You are ranking ${type === "property" ? "real estate listings" : type === "broker" ? "real estate brokers" : "service providers"} for a user in Addis Ababa, Ethiopia.

${typeContext}

You have already analysed the user's intent:
${JSON.stringify(intent, null, 2)}

Your task: Look at each item carefully and rank them by how well they match the intent.
Consider ALL fields — title, description, tags, districts, speciality, etc.
Be generous: partial matches are better than returning nothing.

Respond ONLY with valid JSON — no markdown:
{"matchIds":["id1","id2",...],"reasoning":"1 sentence why these match"}

Rules:
- matchIds: best match first, max 12 IDs
- Include items that partially match — don't be too strict
- If truly nothing matches, return []`;

    const rankMsg = await client.messages.create({
      model:    "claude-sonnet-4-6",
      max_tokens: 512,
      system:   rankSystem,
      messages: [{
        role: "user",
        content: `Original query: "${query}"\n\nItems to rank:\n${JSON.stringify(items)}`,
      }],
    });

    const rankRaw = rankMsg.content[0].type === "text" ? rankMsg.content[0].text.trim() : "{}";
    const rStart = rankRaw.indexOf("{");
    const rEnd   = rankRaw.lastIndexOf("}");
    let ranked: { matchIds?: unknown[]; reasoning?: string } = {};
    try {
      if (rStart !== -1 && rEnd !== -1) ranked = JSON.parse(rankRaw.slice(rStart, rEnd + 1));
    } catch { ranked = {}; }

    return NextResponse.json({
      matchIds:   Array.isArray(ranked.matchIds) ? ranked.matchIds.map(String) : [],
      suggestion: typeof intent.suggestion === "string" ? intent.suggestion : null,
      intent,
    });

  } catch (e) {
    console.error("[/api/ai-search]", e);
    return NextResponse.json({ matchIds: [], suggestion: null }, { status: 500 });
  }
}
