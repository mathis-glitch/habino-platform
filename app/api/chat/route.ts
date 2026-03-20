import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createServiceClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Intent detection ─────────────────────────────────────────────────────────
const SEARCH_KEYWORDS = [
  "such", "zeig", "find", "show", "liste", "gibt es",
  "wohnung", "haus", "häuser", "apartment", "villa", "studio", "immobilie",
  "kaufen", "mieten", "kauf", "miete", "buy", "rent",
  "zimmer", "schlafzimmer", "bedroom",
  "preis", "€", "euro", "price", "kosten",
  "verfügbar", "angebot", "inserat",
];
const BOOK_KEYWORDS    = ["termin", "besichtigung", "buche", "besichtige", "appointment", "viewing", "treffen"];
const CREATE_KEYWORDS  = [
  "list my", "list a", "sell my", "rent out my", "i have a property",
  "add my property", "add a property", "create a listing", "new listing",
  "ich möchte", "inserat", "anbieten", "einstellen", "meine wohnung",
  "mein haus", "property to sell", "property to rent", "want to list",
];

function detectIntent(text: string): "search" | "book" | "create_listing" | "chat" {
  const lower = text.toLowerCase();
  if (BOOK_KEYWORDS.some((k)   => lower.includes(k))) return "book";
  if (CREATE_KEYWORDS.some((k) => lower.includes(k))) return "create_listing";
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return "search";
  return "chat";
}

// ── Extract search filters from user message via GPT ─────────────────────────
async function extractFilters(userMessage: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract property search filters from the user message as JSON.
Return ONLY a JSON object with these optional fields:
listing_type: "buy" | "rent"
property_type: "apartment" | "house" | "villa" | "studio" | "commercial" | "land"
min_price: number
max_price: number
bedrooms: number (minimum)
city: string
neighbourhood: string

Return {} if no filters are clear. Return ONLY valid JSON, no explanation.`,
      },
      { role: "user", content: userMessage },
    ],
    max_tokens: 150,
    temperature: 0,
  });

  try {
    const raw = res.choices[0].message.content?.trim() || "{}";
    const json = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ── Supabase property search ──────────────────────────────────────────────────
async function searchProperties(filters: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  let query = supabase
    .from("properties")
    .select("id, title, listing_type, property_type, price, currency, bedrooms, bathrooms, area_sqm, city, neighbourhood, status, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  if (filters.listing_type)  query = query.eq("listing_type", filters.listing_type);
  if (filters.property_type) query = query.eq("property_type", filters.property_type);
  if (filters.min_price)     query = query.gte("price", filters.min_price);
  if (filters.max_price)     query = query.lte("price", filters.max_price);
  if (filters.bedrooms)      query = query.gte("bedrooms", filters.bedrooms);
  if (filters.city)          query = query.ilike("city", `%${filters.city}%`);
  if (filters.neighbourhood) query = query.ilike("neighbourhood", `%${filters.neighbourhood}%`);

  const { data } = await query;
  return data || [];
}

// ── Book appointment ──────────────────────────────────────────────────────────
async function saveAppointment(details: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("appointments").insert({
    tenant_id:      tenantId,
    property_id:    details.property_id || null,
    property_title: details.property_title || null,
    name:           details.name,
    email:          details.email,
    phone:          details.phone || null,
    preferred_date: details.preferred_date,
    message:        details.message || null,
    status:         "pending",
  });
  return !error;
}

// ── Create listing via AI ─────────────────────────────────────────────────────
interface ListingData {
  title?: string;
  property_type?: "apartment" | "house" | "commercial" | "land";
  listing_type?: "buy" | "rent";
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  city?: string;
  neighbourhood?: string;
  description?: string;
}

async function extractListingData(
  conversationMessages: Array<{ role: string; content: string }>
): Promise<{ data: ListingData; missing: string[]; question?: string }> {

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are collecting information to create a real estate listing.
Extract whatever property details have been mentioned in the conversation.
Return a JSON object with this structure:
{
  "extracted": {
    "title": string or null,
    "property_type": "apartment"|"house"|"commercial"|"land" or null,
    "listing_type": "buy"|"rent" or null,
    "price": number or null,
    "currency": string (default "USD") or null,
    "bedrooms": number or null,
    "bathrooms": number or null,
    "area_sqm": number or null,
    "city": string or null,
    "neighbourhood": string or null,
    "description": string or null
  },
  "missing_required": ["field1", "field2"],
  "next_question": "friendly question to ask for the next missing required field, or null if all required fields are present"
}

Required fields are: title (or generate one from available info), property_type, listing_type, price, city.
Keep next_question short, friendly, and ask for only ONE field at a time.
Return ONLY valid JSON.`,
      },
      ...(conversationMessages.slice(-12) as ChatCompletionMessageParam[]),
    ],
    max_tokens: 400,
    temperature: 0,
  });

  try {
    const raw = res.choices[0].message.content?.trim() || "{}";
    const json = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json);

    const data: ListingData = {};
    const extracted = parsed.extracted || {};
    if (extracted.title)         data.title         = extracted.title;
    if (extracted.property_type) data.property_type = extracted.property_type;
    if (extracted.listing_type)  data.listing_type  = extracted.listing_type;
    if (extracted.price)         data.price         = extracted.price;
    if (extracted.currency)      data.currency      = extracted.currency || "USD";
    if (extracted.bedrooms)      data.bedrooms      = extracted.bedrooms;
    if (extracted.bathrooms)     data.bathrooms     = extracted.bathrooms;
    if (extracted.area_sqm)      data.area_sqm      = extracted.area_sqm;
    if (extracted.city)          data.city          = extracted.city;
    if (extracted.neighbourhood) data.neighbourhood = extracted.neighbourhood;
    if (extracted.description)   data.description   = extracted.description;

    return {
      data,
      missing: parsed.missing_required || [],
      question: parsed.next_question || undefined,
    };
  } catch {
    return {
      data: {},
      missing: ["title", "property_type", "listing_type", "price", "city"],
      question: "Let's get your listing set up! What type of property are you listing — apartment, house, commercial space, or land?",
    };
  }
}

async function saveListing(data: ListingData, tenantId: string) {
  const supabase = createServiceClient();
  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      tenant_id:     tenantId,
      title:         data.title || "Untitled Property",
      property_type: data.property_type || "apartment",
      listing_type:  data.listing_type || "buy",
      price:         data.price || 0,
      currency:      data.currency || "USD",
      bedrooms:      data.bedrooms || 0,
      bathrooms:     data.bathrooms || 0,
      area_sqm:      data.area_sqm || null,
      city:          data.city || "",
      neighbourhood: data.neighbourhood || null,
      description:   data.description || null,
      status:        "active",
    })
    .select("id, title, price, currency, listing_type, property_type, city, bedrooms, area_sqm")
    .single();

  return { created, error };
}

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "OPENAI_API_KEY missing. Please add it in Vercel → Settings → Environment Variables.",
    }, { status: 500 });
  }

  const { messages, context } = await request.json();
  if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, tagline, contact_email, whatsapp")
    .eq("id", tenantId)
    .single();

  const lastUserMessage: string = messages.filter((m: { role: string }) => m.role === "user").at(-1)?.content || "";
  const intent = detectIntent(lastUserMessage);

  try {

    // ── CREATE LISTING intent ───────────────────────────────────────────────
    if (intent === "create_listing") {
      const { data, missing, question } = await extractListingData(messages);

      // Still collecting required info
      if (missing.length > 0 && question) {
        return NextResponse.json({ reply: question, intent: "create_listing" });
      }

      // All required data present — save to DB
      const { created, error } = await saveListing(data, tenantId);

      if (error || !created) {
        console.error("Listing save error:", error);
        return NextResponse.json({
          reply: "I couldn't save your listing — please try again or check the admin dashboard.",
          intent: "create_listing",
        });
      }

      return NextResponse.json({
        reply: `Your listing is live! 🎉 "${created.title}" has been published successfully.`,
        intent: "create_listing",
        listing_created: created,
      });
    }

    // ── SEARCH intent ───────────────────────────────────────────────────────
    if (intent === "search") {
      const filters = await extractFilters(lastUserMessage);
      const properties = await searchProperties(filters, tenantId);

      const propertyContext = properties.length
        ? properties.map((p: Record<string, unknown>) => {
            const price = typeof p.price === "number" ? p.price.toLocaleString("en-US") : p.price;
            return `• ${p.title} | ${p.listing_type === "buy" ? "For Sale" : "For Rent"} | ${p.currency} ${price} | ${p.bedrooms} bed | ${p.city} | ID: ${p.id}`;
          }).join("\n")
        : "No matching properties found.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI real estate assistant for ${tenant?.name || "this platform"}.
Reply in English, briefly (1–2 sentences). Results are shown as cards — do not mention IDs or links.
SEARCH RESULTS:
${propertyContext}`,
          },
          ...messages.slice(-6),
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const reply = completion.choices[0].message.content || (
        properties.length
          ? `I found ${properties.length} matching properties:`
          : "I couldn't find any matching properties. Would you like to adjust your search?"
      );

      return NextResponse.json({ reply, properties, filters });
    }

    // ── BOOKING intent ──────────────────────────────────────────────────────
    if (intent === "book") {
      const extractionRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Extract booking details from the conversation as JSON.
Fields: name, email, phone, preferred_date, property_id, property_title, message.
If details are missing, do NOT return JSON — instead ask politely in English for the missing info (name, email, preferred date are required).`,
          },
          ...messages.slice(-8),
        ],
        max_tokens: 300,
        temperature: 0,
      });

      const extractedText = extractionRes.choices[0].message.content?.trim() || "";

      try {
        const raw = extractedText.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        const details = JSON.parse(raw);

        if (details.name && details.email && details.preferred_date) {
          const success = await saveAppointment(details, tenantId);
          return NextResponse.json({
            reply: success
              ? `Perfect, ${details.name}! Your viewing request has been saved. We'll be in touch by email at ${details.email}.`
              : "There was a problem saving your request. Please try again.",
            appointment: { success },
          });
        }
      } catch {
        // Not JSON → GPT is asking for more info
      }

      return NextResponse.json({ reply: extractedText });
    }

    // ── GENERAL CHAT ────────────────────────────────────────────────────────
    const systemPrompt = `You are a friendly AI real estate assistant for ${tenant?.name || "this platform"}.
You help buyers, renters and property owners. For buyers/renters: find properties and book viewings.
For owners: help them list their property by asking for details step by step.
Reply in English, briefly and helpfully (2–3 sentences).
${tenant?.contact_email ? `Contact: ${tenant.contact_email}` : ""}
${context?.currentProperty ? `User is viewing property ${context.currentProperty}.` : ""}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10),
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content || "How can I help you?";
    return NextResponse.json({ reply });

  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", detail);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
