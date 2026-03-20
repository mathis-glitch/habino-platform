import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createServiceClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────
type WizardStep =
  | "listing_type"   // Step 1: Sale or Rent?
  | "property_type"  // Step 2: Apartment, House, Commercial, Land?
  | "title"          // Step 3: Listing title
  | "price"          // Step 4: Price (with currency detection)
  | "city"           // Step 5: City
  | "extras"         // Step 6: Optional details (bedrooms, m², description)
  | "confirm"        // Step 7: Summary + confirmation before saving
  | "edit_field"     // Edit: which field to change?
  | "edit_value";    // Edit: new value for that field

interface WizardData {
  listing_type?:  "buy" | "rent";
  property_type?: "apartment" | "house" | "commercial" | "land";
  title?:         string;
  price?:         number;
  currency?:      string;
  city?:          string;
  neighbourhood?: string;
  bedrooms?:      number;
  bathrooms?:     number;
  area_sqm?:      number;
  description?:   string;
}

interface WizardState {
  step:            WizardStep | null;
  data:            WizardData;
  lastCreatedId?:  string;   // ID of last published listing (for post-publish edits)
  editingField?:   string;   // which field is being edited
}

// ── Intent detection (for non-wizard messages) ────────────────────────────────
const SEARCH_KEYWORDS = [
  "such", "zeig", "find", "show", "liste", "gibt es",
  "wohnung", "haus", "häuser", "apartment", "villa", "studio", "immobilie",
  "kaufen", "mieten", "kauf", "miete", "buy", "rent",
  "zimmer", "schlafzimmer", "bedroom",
  "preis", "€", "euro", "price", "kosten",
  "verfügbar", "angebot",
];
const BOOK_KEYWORDS   = ["termin", "besichtigung", "buche", "appointment", "viewing", "treffen"];
const CREATE_KEYWORDS = [
  "list my", "list a", "list another", "sell my", "rent out my",
  "i have a property", "add my property", "add a property",
  "create a listing", "new listing", "want to list", "add property",
  "ich möchte", "inserat aufgeben", "anbieten", "einstellen",
  "meine wohnung", "mein haus", "property to sell", "property to rent",
];
const EDIT_KEYWORDS = ["edit", "change", "update", "wrong", "fix", "modify", "incorrect", "alter", "different"];

function detectIntent(text: string): "search" | "book" | "create_listing" | "edit_listing" | "chat" {
  const lower = text.toLowerCase();
  if (BOOK_KEYWORDS.some((k)   => lower.includes(k))) return "book";
  if (CREATE_KEYWORDS.some((k) => lower.includes(k))) return "create_listing";
  if (EDIT_KEYWORDS.some((k)   => lower.includes(k))) return "edit_listing";
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return "search";
  return "chat";
}

// ── Wizard helpers ────────────────────────────────────────────────────────────
function parsePrice(text: string): { price: number; currency: string } | null {
  let currency = "USD";
  const lower = text.toLowerCase();
  if (lower.includes("€") || /\beur\b/.test(lower)) currency = "EUR";
  else if (lower.includes("£") || /\bgbp\b/.test(lower)) currency = "GBP";
  else if (/\bchf\b/.test(lower)) currency = "CHF";

  const clean = text.replace(/[€$£,\s]/g, "").replace(/\b(eur|gbp|usd|chf)\b/gi, "");
  const m = clean.match(/([\d.]+)\s*([km]?)/i);
  if (!m) return null;

  let n = parseFloat(m[1]);
  const suffix = m[2].toLowerCase();
  if (suffix === "k") n *= 1_000;
  if (suffix === "m") n *= 1_000_000;
  if (isNaN(n) || n <= 0) return null;
  return { price: Math.round(n), currency };
}

function fmtPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

function buildSummary(d: WizardData): string {
  const price   = d.price ? fmtPrice(d.price, d.currency || "USD") : "—";
  const type    = { apartment: "Apartment", house: "House", commercial: "Commercial", land: "Land" }[d.property_type!] ?? d.property_type;
  const listing = d.listing_type === "buy" ? "For Sale" : "For Rent";
  const loc     = [d.neighbourhood, d.city].filter(Boolean).join(", ");

  const lines = [
    `📋  ${d.title}`,
    `💰  ${price} · ${listing} · ${type}`,
    `📍  ${loc}`,
  ];
  if (d.bedrooms)    lines.push(`🛏  ${d.bedrooms} bedroom${d.bedrooms !== 1 ? "s" : ""}${d.bathrooms ? ` · ${d.bathrooms} bathroom${d.bathrooms !== 1 ? "s" : ""}` : ""}`);
  if (d.area_sqm)    lines.push(`📐  ${d.area_sqm} m²`);
  if (d.description) lines.push(`📝  "${d.description}"`);
  return lines.join("\n");
}

async function extractExtras(msg: string): Promise<Partial<WizardData>> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract optional property listing details from the user message as JSON.
Return ONLY fields that are clearly mentioned:
{ "neighbourhood": string|null, "bedrooms": number|null, "bathrooms": number|null, "area_sqm": number|null, "description": string|null }
Return ONLY valid JSON, no explanation.`,
      },
      { role: "user", content: msg },
    ],
    max_tokens: 150,
    temperature: 0,
  });
  try {
    const raw  = res.choices[0].message.content?.trim() || "{}";
    const json = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const p    = JSON.parse(json);
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null && v !== undefined));
  } catch {
    return {};
  }
}

// ── Wizard state machine ──────────────────────────────────────────────────────
async function processWizardStep(
  step:          WizardStep,
  data:          WizardData,
  userMessage:   string,
  tenantId:      string,
  lastCreatedId?: string,
  editingField?:  string,
): Promise<{ reply: string; wizard: WizardState; chips?: string[]; listing_created?: Record<string, unknown> }> {

  const lower = userMessage.toLowerCase().trim();

  switch (step) {

    // ── Step 1: For Sale or For Rent? ─────────────────────────────────────
    case "listing_type": {
      let lt: "buy" | "rent" | null = null;
      if (/\b(sale|sell|selling|for sale|buy|kaufen|verkaufen)\b/.test(lower)) lt = "buy";
      else if (/\b(rent|renting|rental|for rent|mieten|vermieten|lease)\b/.test(lower)) lt = "rent";

      if (!lt) {
        return {
          reply: "Just to confirm — is this property for **sale** or for **rent**?",
          wizard: { step: "listing_type", data },
          chips: ["For Sale", "For Rent"],
        };
      }
      return {
        reply: "Got it! What **type of property** is it?",
        wizard: { step: "property_type", data: { ...data, listing_type: lt } },
        chips: ["Apartment", "House", "Commercial", "Land"],
      };
    }

    // ── Step 2: Property type ─────────────────────────────────────────────
    case "property_type": {
      let pt: "apartment" | "house" | "commercial" | "land" | null = null;
      if (/\b(apartment|flat|wohnung|studio|condo)\b/.test(lower))        pt = "apartment";
      else if (/\b(house|villa|haus|home|bungalow|detached)\b/.test(lower)) pt = "house";
      else if (/\b(commercial|office|retail|gewerbe|shop|laden)\b/.test(lower)) pt = "commercial";
      else if (/\b(land|plot|grundstück|lot)\b/.test(lower))              pt = "land";

      if (!pt) {
        return {
          reply: "Which type of property is it?",
          wizard: { step: "property_type", data },
          chips: ["Apartment", "House", "Commercial", "Land"],
        };
      }
      const label = { apartment: "Apartment", house: "House", commercial: "Commercial space", land: "Land plot" }[pt];
      return {
        reply: `${label} — noted! What's the **listing title**? This is the first thing people will see.\n\n*e.g. "Bright 2-bed apartment in the city centre"*`,
        wizard: { step: "title", data: { ...data, property_type: pt } },
      };
    }

    // ── Step 3: Title ─────────────────────────────────────────────────────
    case "title": {
      const title = userMessage.trim();
      if (!title || title.length < 5) {
        return {
          reply: "Please give the listing a title (at least 5 characters).",
          wizard: { step: "title", data },
        };
      }
      return {
        reply: `Great title! What's the **asking price**?\n\n*Type a number — e.g. 380000, 380k, or €380,000. USD is the default currency.*`,
        wizard: { step: "price", data: { ...data, title } },
      };
    }

    // ── Step 4: Price ─────────────────────────────────────────────────────
    case "price": {
      const parsed = parsePrice(userMessage);
      if (!parsed) {
        return {
          reply: "I couldn't read that price. Please enter a number — e.g. **350000**, **350k**, or **€350,000**.",
          wizard: { step: "price", data },
        };
      }
      return {
        reply: `${fmtPrice(parsed.price, parsed.currency)} — got it! Which **city** is the property in?`,
        wizard: { step: "city", data: { ...data, price: parsed.price, currency: parsed.currency } },
      };
    }

    // ── Step 5: City ──────────────────────────────────────────────────────
    case "city": {
      const city = userMessage.trim();
      if (!city || city.length < 2) {
        return {
          reply: "Which city is the property located in?",
          wizard: { step: "city", data },
        };
      }
      return {
        reply: `Almost done! Would you like to add any optional details?\n\n• Neighbourhood / district\n• Number of bedrooms & bathrooms\n• Area in m²\n• A short description\n\nYou can type them all at once, or tap **Skip** to go straight to confirmation.`,
        wizard: { step: "extras", data: { ...data, city } },
        chips: ["Skip — show summary", "Add details"],
      };
    }

    // ── Step 6: Optional extras ───────────────────────────────────────────
    case "extras": {
      const isSkip = /^(skip|no|none|nein|weiter|pass|show summary|summary|confirm)/i.test(lower);
      let next: WizardData = { ...data };
      if (!isSkip) {
        const extras = await extractExtras(userMessage);
        next = { ...next, ...extras };
      }
      const summary = buildSummary(next);
      return {
        reply: `Here's your **listing summary** — please review:\n\n${summary}\n\nLooks good? Tap **Publish** to make it live, or **Edit** to change something.`,
        wizard: { step: "confirm", data: next },
        chips: ["Publish now 🚀", "Edit details"],
      };
    }

    // ── Step 7: Confirmation → save to DB ────────────────────────────────
    case "confirm": {
      const isConfirm = /\b(yes|publish|confirm|go ahead|ok|looks good|great|perfect|ja|veröffentlichen|publish now)\b/i.test(lower);
      const isEdit    = /\b(edit|change|no|nein|back|wrong|modify)\b/i.test(lower);

      if (isEdit) {
        return {
          reply: "No problem — what would you like to change?",
          wizard: { step: "edit_field", data, lastCreatedId },
          chips: ["Price", "Title", "Description", "City", "Bedrooms", "Area (m²)"],
        };
      }
      if (!isConfirm) {
        return {
          reply: "Ready to publish? Tap **Publish now** or say yes.",
          wizard: { step: "confirm", data },
          chips: ["Publish now 🚀", "Edit details"],
        };
      }

      // ── Save to database ────────────────────────────────────────────────
      const supabase = createServiceClient();
      const { data: created, error } = await supabase
        .from("properties")
        .insert({
          tenant_id:     tenantId,
          title:         data.title!,
          property_type: data.property_type!,
          listing_type:  data.listing_type!,
          price:         data.price!,
          currency:      data.currency || "USD",
          bedrooms:      data.bedrooms  || 0,
          bathrooms:     data.bathrooms || 0,
          area_sqm:      data.area_sqm  || null,
          city:          data.city!,
          neighbourhood: data.neighbourhood || null,
          description:   data.description   || null,
          status:        "active",
        })
        .select("id, title, price, currency, listing_type, property_type, city, bedrooms, area_sqm")
        .single();

      if (error || !created) {
        console.error("Listing save error:", error);
        return {
          reply: "Something went wrong saving your listing. Please try again.",
          wizard: { step: "confirm", data },
          chips: ["Try again", "Edit details"],
        };
      }

      return {
        reply: `Your listing is live! 🎉\n\nYou can add photos by finding it in the **Saved** tab. Want to change anything or list another property?`,
        wizard: { step: null, data: {}, lastCreatedId: created.id as string },
        listing_created: created,
        chips: ["Change something", "List another property"],
      };
    }

    // ── Edit: pick field ──────────────────────────────────────────────────
    case "edit_field": {
      const fieldMap: Record<string, string> = {
        price: "price", title: "title", description: "description",
        city: "city", bedrooms: "bedrooms", bathrooms: "bathrooms",
        "area (m²)": "area_sqm", area: "area_sqm", neighbourhood: "neighbourhood",
      };
      let field: string | null = null;
      for (const [key, val] of Object.entries(fieldMap)) {
        if (lower.includes(key)) { field = val; break; }
      }
      if (!field) {
        return {
          reply: "Which part would you like to change?",
          wizard: { step: "edit_field", data, lastCreatedId },
          chips: ["Price", "Title", "Description", "City", "Bedrooms", "Area (m²)"],
        };
      }
      const fieldLabel: Record<string, string> = {
        price: "asking price", title: "title", description: "description",
        city: "city", bedrooms: "number of bedrooms", bathrooms: "number of bathrooms",
        area_sqm: "area in m²", neighbourhood: "neighbourhood",
      };
      return {
        reply: `What's the new **${fieldLabel[field] || field}**?`,
        wizard: { step: "edit_value", data, lastCreatedId, editingField: field },
      };
    }

    // ── Edit: apply new value ─────────────────────────────────────────────
    case "edit_value": {
      if (!editingField) {
        return {
          reply: "Something went wrong. What would you like to change?",
          wizard: { step: "edit_field", data, lastCreatedId },
          chips: ["Price", "Title", "Description", "City", "Bedrooms", "Area (m²)"],
        };
      }

      // Parse value based on field type
      let newValue: string | number = userMessage.trim();
      let newCurrency: string | undefined;

      if (editingField === "price") {
        const parsed = parsePrice(userMessage);
        if (!parsed) {
          return {
            reply: "Couldn't parse that price. Please enter a number, e.g. **350000** or **350k**.",
            wizard: { step: "edit_value", data, lastCreatedId, editingField },
          };
        }
        newValue    = parsed.price;
        newCurrency = parsed.currency;
      } else if (["bedrooms", "bathrooms", "area_sqm"].includes(editingField)) {
        const n = parseInt(userMessage.replace(/[^\d]/g, ""), 10);
        if (isNaN(n)) {
          return {
            reply: "Please enter a number.",
            wizard: { step: "edit_value", data, lastCreatedId, editingField },
          };
        }
        newValue = n;
      }

      const updatedData: WizardData = { ...data, [editingField]: newValue };
      if (newCurrency) updatedData.currency = newCurrency;

      // ── Already published: update directly in DB ──────────────────────
      if (lastCreatedId) {
        const supabase = createServiceClient();
        const patch: Record<string, unknown> = {
          [editingField]: newValue,
          updated_at: new Date().toISOString(),
        };
        if (newCurrency) patch.currency = newCurrency;

        const { error } = await supabase
          .from("properties")
          .update(patch)
          .eq("id", lastCreatedId);

        if (error) {
          return {
            reply: "Couldn't update that field — please try again.",
            wizard: { step: "edit_value", data, lastCreatedId, editingField },
          };
        }

        const displayVal = editingField === "price"
          ? fmtPrice(newValue as number, newCurrency || data.currency || "USD")
          : String(newValue);

        return {
          reply: `Done! **${editingField.replace("_", " ")}** updated to **${displayVal}**.\n\nAnything else to change?`,
          wizard: { step: null, data: updatedData, lastCreatedId },
          chips: ["Change something else", "All good!"],
        };
      }

      // ── Not yet published: update local data, go back to confirm ─────
      const summary = buildSummary(updatedData);
      return {
        reply: `Updated! Here's the revised summary:\n\n${summary}\n\nShall I publish this now?`,
        wizard: { step: "confirm", data: updatedData },
        chips: ["Publish now 🚀", "Edit details"],
      };
    }
  }
}

// ── Search helpers ────────────────────────────────────────────────────────────
async function extractFilters(msg: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract property search filters from the user message as JSON.
Return ONLY a JSON object with these optional fields:
listing_type: "buy"|"rent", property_type: "apartment"|"house"|"villa"|"studio"|"commercial"|"land"
min_price: number, max_price: number, bedrooms: number, city: string, neighbourhood: string
Return {} if no filters are clear. Return ONLY valid JSON, no explanation.`,
      },
      { role: "user", content: msg },
    ],
    max_tokens: 150,
    temperature: 0,
  });
  try {
    const raw  = res.choices[0].message.content?.trim() || "{}";
    const json = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

async function searchProperties(filters: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  let q = supabase
    .from("properties")
    .select("id, title, listing_type, property_type, price, currency, bedrooms, bathrooms, area_sqm, city, neighbourhood, status, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  if (filters.listing_type)  q = q.eq("listing_type",  filters.listing_type);
  if (filters.property_type) q = q.eq("property_type", filters.property_type);
  if (filters.min_price)     q = q.gte("price",         filters.min_price);
  if (filters.max_price)     q = q.lte("price",         filters.max_price);
  if (filters.bedrooms)      q = q.gte("bedrooms",      filters.bedrooms);
  if (filters.city)          q = q.ilike("city",        `%${filters.city}%`);
  if (filters.neighbourhood) q = q.ilike("neighbourhood", `%${filters.neighbourhood}%`);

  const { data } = await q;
  return data || [];
}

async function saveAppointment(details: Record<string, unknown>, tenantId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("appointments").insert({
    tenant_id:      tenantId,
    property_id:    details.property_id    || null,
    property_title: details.property_title || null,
    name:           details.name,
    email:          details.email,
    phone:          details.phone          || null,
    preferred_date: details.preferred_date,
    message:        details.message        || null,
    status:         "pending",
  });
  return !error;
}

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing." }, { status: 500 });
  }

  const { messages, context, wizard: rawWizard } = await request.json();
  if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

  const wizard: WizardState = rawWizard || { step: null, data: {} };

  const supabase = createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, tagline, contact_email")
    .eq("id", tenantId)
    .single();

  const lastUserMsg: string =
    messages.filter((m: { role: string }) => m.role === "user").at(-1)?.content || "";

  try {

    // ── WIZARD MODE: active step → process it ─────────────────────────────
    if (wizard.step !== null) {
      const result = await processWizardStep(
        wizard.step, wizard.data, lastUserMsg, tenantId,
        wizard.lastCreatedId, wizard.editingField,
      );
      return NextResponse.json(result);
    }

    const intent = detectIntent(lastUserMsg);

    // ── Edit intent when a listing was recently created ───────────────────
    if (wizard.lastCreatedId && intent === "edit_listing") {
      const result = await processWizardStep(
        "edit_field", wizard.data, lastUserMsg, tenantId, wizard.lastCreatedId,
      );
      return NextResponse.json(result);
    }

    // ── Start wizard for create_listing intent ────────────────────────────
    if (intent === "create_listing") {
      return NextResponse.json({
        reply: "I'd love to help you list your property! Let's go through it step by step — it only takes a minute.\n\nFirst: is this property for **sale** or for **rent**?",
        wizard: { step: "listing_type", data: {} },
        chips: ["For Sale", "For Rent"],
      });
    }

    // ── SEARCH intent ─────────────────────────────────────────────────────
    if (intent === "search") {
      const filters    = await extractFilters(lastUserMsg);
      const properties = await searchProperties(filters, tenantId);

      const propContext = properties.length
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
Reply in English, briefly (1–2 sentences). Results are shown as cards — do not mention IDs.
SEARCH RESULTS:\n${propContext}`,
          },
          ...(messages.slice(-6) as ChatCompletionMessageParam[]),
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return NextResponse.json({
        reply: completion.choices[0].message.content ||
          (properties.length ? `Found ${properties.length} matching properties:` : "No matching properties found."),
        properties,
        filters,
        wizard,
      });
    }

    // ── BOOKING intent ────────────────────────────────────────────────────
    if (intent === "book") {
      const extractRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Extract booking details from the conversation as JSON.
Fields: name, email, phone, preferred_date, property_id, property_title, message.
If required fields (name, email, preferred_date) are missing, ask for them politely in English.`,
          },
          ...(messages.slice(-8) as ChatCompletionMessageParam[]),
        ],
        max_tokens: 300,
        temperature: 0,
      });

      const raw = extractRes.choices[0].message.content?.trim() || "";
      try {
        const details = JSON.parse(raw.replace(/^```json?\n?/, "").replace(/\n?```$/, ""));
        if (details.name && details.email && details.preferred_date) {
          const success = await saveAppointment(details, tenantId);
          return NextResponse.json({
            reply: success
              ? `Perfect, ${details.name}! Your viewing request has been saved. We'll be in touch at ${details.email}.`
              : "There was a problem saving your request. Please try again.",
            appointment: { success },
            wizard,
          });
        }
      } catch { /* not JSON — GPT is asking for more info */ }

      return NextResponse.json({ reply: raw, wizard });
    }

    // ── GENERAL CHAT ──────────────────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly AI real estate assistant for ${tenant?.name || "this platform"}.
Help buyers find properties, book viewings, and help owners list their property.
Reply in English, briefly (2–3 sentences).
${tenant?.contact_email ? `Contact: ${tenant.contact_email}` : ""}
${context?.currentProperty ? `User is viewing property ${context.currentProperty}.` : ""}`,
        },
        ...(messages.slice(-10) as ChatCompletionMessageParam[]),
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content || "How can I help you?",
      wizard,
    });

  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", detail);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
