import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/parse-intent
 *
 * Uses Claude to parse a user query into a structured intent.
 * Called when local regex-based parsing is uncertain.
 *
 * Input:  { query: string, city: string, districts: string[] }
 * Output: { type, propertyType, listingType, district, maxPrice, minPrice, bedrooms, serviceCategory, sortBy }
 */
export async function POST(req: NextRequest) {
  try {
    const { query, city, districts } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ type: "properties" });
    }

    const districtList = (districts ?? []).join(", ");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are an intent parser for a real estate app called Habino. The user is in ${city}.

Available districts: ${districtList}

Parse this user query into a structured JSON intent. Respond with ONLY valid JSON, no explanation.

Query: "${query}"

JSON schema:
{
  "type": "properties" | "brokers" | "services" | "market",
  "propertyType": "apartment" | "house" | "villa" | "office" | "commercial" | "land" | "hall" | "production" | null,
  "listingType": "rent" | "buy" | null,
  "district": string | null,
  "maxPrice": number | null,
  "minPrice": number | null,
  "bedrooms": number | null,
  "serviceCategory": "cleaning" | "plumbing" | "electric" | "garden" | "moving" | "painting" | "security" | "ac" | "legal" | "it" | null,
  "sortBy": "price_asc" | "price_desc" | "area_desc" | "newest" | null
}

Rules:
- "plot" = "land"
- Default type is "properties" unless clearly asking for brokers, services, or market data
- Market type: user asks about prices, trends, averages, statistics, market overview
- Services type: user asks for cleaning, plumbing, electrician, moving, etc.
- Brokers type: user asks for broker, agent, realtor
- Extract price: "under 50k" = maxPrice: 50000, "30k-50k" = minPrice: 30000 + maxPrice: 50000
- "k" = 1000, "M" = 1000000
- Match district names case-insensitively against the available districts list
- If query is in non-English language (Amharic, Swahili, German), still parse correctly`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ type: "properties" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[parse-intent]", err);
    return NextResponse.json({ type: "properties" });
  }
}
