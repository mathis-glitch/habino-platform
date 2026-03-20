import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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
const BOOK_KEYWORDS = ["termin", "besichtigung", "buche", "besichtige", "appointment", "viewing", "treffen"];

function detectIntent(text: string): "search" | "book" | "chat" {
  const lower = text.toLowerCase();
  if (BOOK_KEYWORDS.some((k) => lower.includes(k))) return "book";
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
    // Strip possible markdown code fences
    const json = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ── Supabase search ──────────────────────────────────────────────────────────
async function searchProperties(filters: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  let query = supabase
    .from("properties")
    .select("id, title, listing_type, property_type, price, currency, bedrooms, bathrooms, area_sqm, city, neighbourhood, status, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  if (filters.listing_type)   query = query.eq("listing_type", filters.listing_type);
  if (filters.property_type)  query = query.eq("property_type", filters.property_type);
  if (filters.min_price)      query = query.gte("price", filters.min_price);
  if (filters.max_price)      query = query.lte("price", filters.max_price);
  if (filters.bedrooms)       query = query.gte("bedrooms", filters.bedrooms);
  if (filters.city)           query = query.ilike("city", `%${filters.city}%`);
  if (filters.neighbourhood)  query = query.ilike("neighbourhood", `%${filters.neighbourhood}%`);

  const { data } = await query;
  return data || [];
}

// ── Book appointment ─────────────────────────────────────────────────────────
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

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant nicht gefunden" }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "OPENAI_API_KEY fehlt. Bitte in Vercel unter Settings → Environment Variables eintragen.",
    }, { status: 500 });
  }

  const { messages, context, role } = await request.json();
  const isAnbieter = role === "anbieter";
  if (!messages?.length) return NextResponse.json({ error: "Keine Nachrichten" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, tagline, contact_email, whatsapp")
    .eq("id", tenantId)
    .single();

  const lastUserMessage: string = messages.filter((m: { role: string }) => m.role === "user").at(-1)?.content || "";
  const intent = detectIntent(lastUserMessage);

  try {
    // ── SEARCH intent ──────────────────────────────────────────────────────
    if (intent === "search") {
      const filters = await extractFilters(lastUserMessage);
      const properties = await searchProperties(filters, tenantId);

      const propertyContext = properties.length
        ? properties.map((p: Record<string, unknown>) => {
            const price = typeof p.price === "number" ? p.price.toLocaleString("de-DE") : p.price;
            return `• ${p.title} | ${p.listing_type === "buy" ? "Kaufen" : "Mieten"} | ${p.currency} ${price} | ${p.bedrooms} Zi. | ${p.city} | ID: ${p.id}`;
          }).join("\n")
        : "Keine passenden Inserate gefunden.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI real estate assistant for ${tenant?.name || "this platform"}.
Reply in English, briefly (1–2 sentences). Results are shown as cards — do not mention IDs or links.
${isAnbieter ? "The user is an agent — mention optimisation tips if relevant." : ""}
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

    // ── BOOKING intent ─────────────────────────────────────────────────────
    if (intent === "book") {
      // Use GPT to extract booking details
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

      // Try to parse as JSON — if it fails, it's a follow-up question
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

    // ── CHAT (general conversation) ────────────────────────────────────────
    const systemPrompt = isAnbieter
      ? `You are an AI assistant for property agents on ${tenant?.name || "this platform"}.
You help agents: create listings, optimise photos, set prices and manage viewings.
For specific actions, refer them to the admin dashboard at /admin.
Reply in English, professionally and concisely (2–4 sentences).
${tenant?.contact_email ? `Support: ${tenant.contact_email}` : ""}`
      : `You are a friendly AI real estate assistant for ${tenant?.name || "this platform"}.
You help buyers and renters find properties, book viewings and get market information.
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

    const reply = completion.choices[0].message.content || "Wie kann ich Ihnen helfen?";
    return NextResponse.json({ reply });

  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", detail);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
