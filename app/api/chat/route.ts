import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/server";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set!");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Tool definitions ────────────────────────────────────────────────────────
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_properties",
      description: "Search available properties based on user criteria. Call this whenever the user asks to find, show, or search for properties.",
      parameters: {
        type: "object",
        properties: {
          listing_type:  { type: "string", enum: ["buy", "rent"], description: "Whether the user wants to buy or rent" },
          property_type: { type: "string", enum: ["apartment", "house", "villa", "studio", "commercial", "land"], description: "Type of property" },
          min_price:     { type: "number", description: "Minimum price in the listing currency" },
          max_price:     { type: "number", description: "Maximum price in the listing currency" },
          bedrooms:      { type: "number", description: "Minimum number of bedrooms" },
          city:          { type: "string", description: "City or location to search in" },
          query:         { type: "string", description: "Free-text search in title/description" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book a viewing appointment for a specific property. Call this when the user wants to visit, view, or schedule a showing.",
      parameters: {
        type: "object",
        properties: {
          property_id:   { type: "string", description: "ID of the property to view" },
          property_title:{ type: "string", description: "Title of the property" },
          name:          { type: "string", description: "Full name of the person booking" },
          email:         { type: "string", description: "Email address for confirmation" },
          phone:         { type: "string", description: "Phone number (optional)" },
          preferred_date:{ type: "string", description: "Preferred date/time as a human-readable string" },
          message:       { type: "string", description: "Any additional message or questions" },
        },
        required: ["property_id", "name", "email", "preferred_date"],
      },
    },
  },
];

// ── Tool handlers ────────────────────────────────────────────────────────────
async function handleSearchProperties(args: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  let query = supabase
    .from("properties")
    .select("id, title, listing_type, property_type, price, currency, bedrooms, bathrooms, area_sqm, city, neighbourhood, status, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  if (args.listing_type)  query = query.eq("listing_type", args.listing_type);
  if (args.property_type) query = query.eq("property_type", args.property_type);
  if (args.min_price)     query = query.gte("price", args.min_price);
  if (args.max_price)     query = query.lte("price", args.max_price);
  if (args.bedrooms)      query = query.gte("bedrooms", args.bedrooms);
  if (args.city)          query = query.ilike("city", `%${args.city}%`);
  if (args.query)         query = query.ilike("title", `%${args.query}%`);

  const { data } = await query;
  return data || [];
}

async function handleBookAppointment(args: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("appointments").insert({
    tenant_id:      tenantId,
    property_id:    args.property_id,
    property_title: args.property_title || null,
    name:           args.name,
    email:          args.email,
    phone:          args.phone || null,
    preferred_date: args.preferred_date,
    message:        args.message || null,
    status:         "pending",
  });
  if (error) {
    console.error("Appointment insert error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ── Main route ───────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt in den Umgebungsvariablen. Bitte in Vercel unter Settings → Environment Variables eintragen." }, { status: 500 });
  }

  const { messages, context } = await request.json();
  if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, tagline, contact_email, whatsapp")
    .eq("id", tenantId)
    .single();

  const systemPrompt = `Du bist ein freundlicher, professioneller KI-Immobilienassistent für ${tenant?.name || "diese Plattform"}.
${tenant?.tagline ? `Plattform-Motto: "${tenant.tagline}"` : ""}

Deine Aufgaben:
- Nutze search_properties wenn jemand Immobilien sucht — immer, egal wie die Anfrage formuliert ist.
- Nutze book_appointment wenn jemand eine Besichtigung oder einen Termin möchte.
- Antworte auf Deutsch, kurz und hilfreich (2–4 Sätze).
- Wenn du Termine buchst, bestätige alle Details bevor du die Funktion aufrufst.
- Erfinde keine Preise oder Daten.
${context?.currentProperty ? `\nDer Nutzer schaut sich gerade Inserat-ID: ${context.currentProperty} an.` : ""}
${tenant?.contact_email ? `\nKontakt: ${tenant.contact_email}` : ""}`;

  try {
    // Round 1: let model decide which tool to call
    const firstPass = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10),
      ],
      tools,
      tool_choice: "auto",
      max_tokens: 600,
      temperature: 0.7,
    });

    const assistantMsg = firstPass.choices[0].message;
    const toolCalls = assistantMsg.tool_calls;

    // No tool call → plain reply
    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({ reply: assistantMsg.content || "Entschuldigung, keine Antwort." });
    }

    // Execute each tool call
    const toolResults: Record<string, unknown> = {};
    const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "assistant", content: assistantMsg.content, tool_calls: toolCalls } as OpenAI.Chat.ChatCompletionMessageParam,
    ];

    for (const call of toolCalls) {
      const args = JSON.parse(call.function.arguments || "{}");
      let result: unknown;

      if (call.function.name === "search_properties") {
        result = await handleSearchProperties(args, tenantId);
        toolResults.properties = result;
      } else if (call.function.name === "book_appointment") {
        result = await handleBookAppointment(args, tenantId);
        toolResults.appointment = result;
      } else {
        result = { error: "Unknown tool" };
      }

      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      } as OpenAI.Chat.ChatCompletionMessageParam);
    }

    // Round 2: model reads tool results and writes final reply
    const secondPass = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10),
        ...toolMessages,
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = secondPass.choices[0].message.content
      ?? (toolResults.properties ? "Hier sind passende Inserate für Sie:" : "Fertig.");

    return NextResponse.json({
      reply,
      ...(toolResults.properties !== undefined && { properties: toolResults.properties }),
      ...(toolResults.appointment !== undefined && { appointment: toolResults.appointment }),
    });

  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", detail);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
