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
  | "edit_value"     // Edit: new value for that field
  // ── Profile wizard ────────────────────────────────────────────
  | "profile_name"       // P1: Full name (+ optional bio)
  | "profile_contact"    // P2: Phone + WhatsApp
  | "profile_location"   // P3: City + country
  | "profile_identity"   // P4: ID number + preferred language
  | "profile_confirm"    // P5: Summary → return profile_data to frontend
  // ── Contract wizard ───────────────────────────────────────────
  | "contract_landlord"      // C1: Landlord name + email
  | "contract_property"      // C2: Which property?
  | "contract_tenant"        // C3: Tenant name + email + ID
  | "contract_terms"         // C4: Start date + rent/price + deposit
  | "contract_jurisdiction"  // C5: Country + contract type
  | "contract_confirm";      // C6: Summary → create + generate

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
  // Profile fields
  p_full_name?:    string;
  p_phone?:        string;
  p_whatsapp?:     string;
  p_address?:      string;
  p_city?:         string;
  p_country_code?: string;
  p_id_number?:    string;
  p_bio?:          string;
  p_lang?:         string;
  // Contract fields
  c_landlord_name?:    string;
  c_landlord_email?:   string;
  c_property_id?:      string;
  c_property_title?:   string;
  c_tenant_name?:      string;
  c_tenant_email?:     string;
  c_tenant_id?:        string;
  c_start_date?:       string;
  c_end_date?:         string;
  c_rent?:             number;
  c_deposit?:          number;
  c_currency?:         string;
  c_contract_type?:    string;
  c_country_code?:     string;
  c_language?:         string;
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
const CONTRACT_KEYWORDS = [
  "create a contract", "new contract", "draft a contract", "vertrag erstellen",
  "mietvertrag", "kaufvertrag", "lease agreement", "rental agreement",
  "contract for", "generate contract", "make a contract", "need a contract",
  "i want a contract", "prepare a contract",
];
const PROFILE_KEYWORDS = [
  "update my profile", "set up my profile", "edit my profile", "change my profile",
  "my profile", "setup profile", "profil einrichten", "mein profil",
  "update my info", "update my details", "my name is", "my phone",
  "change my name", "change my phone", "change my address",
  "profile setup", "complete my profile",
];

function detectIntent(text: string): "search" | "book" | "create_listing" | "edit_listing" | "create_contract" | "setup_profile" | "chat" {
  const lower = text.toLowerCase();
  if (BOOK_KEYWORDS.some((k)     => lower.includes(k))) return "book";
  if (CONTRACT_KEYWORDS.some((k) => lower.includes(k))) return "create_contract";
  if (PROFILE_KEYWORDS.some((k)  => lower.includes(k))) return "setup_profile";
  if (CREATE_KEYWORDS.some((k)   => lower.includes(k))) return "create_listing";
  if (EDIT_KEYWORDS.some((k)     => lower.includes(k))) return "edit_listing";
  if (SEARCH_KEYWORDS.some((k)   => lower.includes(k))) return "search";
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

// ── Country code lookup ───────────────────────────────────────────────────────
const COUNTRY_MAP: Record<string, { code: string; label: string }> = {
  kenya: { code: "KE", label: "Kenya" }, ke: { code: "KE", label: "Kenya" },
  germany: { code: "DE", label: "Germany" }, deutschland: { code: "DE", label: "Germany" }, de: { code: "DE", label: "Germany" },
  uae: { code: "AE", label: "UAE" }, "united arab": { code: "AE", label: "UAE" }, ae: { code: "AE", label: "UAE" },
  uk: { code: "GB", label: "United Kingdom" }, "united kingdom": { code: "GB", label: "United Kingdom" }, england: { code: "GB", label: "United Kingdom" }, gb: { code: "GB", label: "United Kingdom" },
  usa: { code: "US", label: "USA" }, "united states": { code: "US", label: "USA" }, america: { code: "US", label: "USA" }, us: { code: "US", label: "USA" },
  nigeria: { code: "NG", label: "Nigeria" }, ng: { code: "NG", label: "Nigeria" },
  ghana: { code: "GH", label: "Ghana" }, gh: { code: "GH", label: "Ghana" },
  "south africa": { code: "ZA", label: "South Africa" }, za: { code: "ZA", label: "South Africa" },
  france: { code: "FR", label: "France" }, frankreich: { code: "FR", label: "France" }, fr: { code: "FR", label: "France" },
  spain: { code: "ES", label: "Spain" }, spanien: { code: "ES", label: "Spain" }, es: { code: "ES", label: "Spain" },
  ethiopia: { code: "ET", label: "Ethiopia" }, et: { code: "ET", label: "Ethiopia" },
  tanzania: { code: "TZ", label: "Tanzania" }, tz: { code: "TZ", label: "Tanzania" },
  brazil: { code: "BR", label: "Brazil" }, brasilien: { code: "BR", label: "Brazil" }, br: { code: "BR", label: "Brazil" },
  india: { code: "IN", label: "India" }, indien: { code: "IN", label: "India" }, in: { code: "IN", label: "India" },
};

function detectCountry(text: string): { code: string; label: string } | null {
  const lower = text.toLowerCase().replace(/[🇰🇪🇩🇪🇦🇪🇬🇧🇺🇸🇳🇬🇬🇭🇿🇦🇫🇷🇪🇸]/g, "").trim();
  return Object.entries(COUNTRY_MAP).find(([k]) => lower.includes(k))?.[1] ?? null;
}

const LANG_MAP: Record<string, { code: string; label: string }> = {
  english: { code: "en-US", label: "English (US)" }, "english us": { code: "en-US", label: "English (US)" },
  "english uk": { code: "en-GB", label: "English (UK)" }, "englisch": { code: "en-US", label: "English (US)" },
  deutsch: { code: "de-DE", label: "Deutsch" }, german: { code: "de-DE", label: "Deutsch" },
  français: { code: "fr-FR", label: "Français" }, french: { code: "fr-FR", label: "Français" }, französisch: { code: "fr-FR", label: "Français" },
  español: { code: "es-ES", label: "Español" }, spanish: { code: "es-ES", label: "Español" }, spanisch: { code: "es-ES", label: "Español" },
  arabic: { code: "ar-SA", label: "العربية" }, arabisch: { code: "ar-SA", label: "العربية" },
  swahili: { code: "sw-KE", label: "Kiswahili" }, kiswahili: { code: "sw-KE", label: "Kiswahili" },
  portuguese: { code: "pt-BR", label: "Português" }, português: { code: "pt-BR", label: "Português" },
  hindi: { code: "hi-IN", label: "हिन्दी" }, italian: { code: "it-IT", label: "Italiano" }, italiano: { code: "it-IT", label: "Italiano" },
  chinese: { code: "zh-CN", label: "普通话" }, mandarin: { code: "zh-CN", label: "普通话" },
  japanese: { code: "ja-JP", label: "日本語" }, korean: { code: "ko-KR", label: "한국어" },
};

function detectLang(text: string): { code: string; label: string } | null {
  const lower = text.toLowerCase().trim();
  return Object.entries(LANG_MAP).find(([k]) => lower.includes(k))?.[1] ?? null;
}

// ── Wizard state machine ──────────────────────────────────────────────────────
async function processWizardStep(
  step:          WizardStep,
  data:          WizardData,
  userMessage:   string,
  tenantId:      string,
  lastCreatedId?: string,
  editingField?:  string,
): Promise<{ reply: string; wizard: WizardState; chips?: string[]; listing_created?: Record<string, unknown>; contract_created?: Record<string, unknown>; profile_data?: Record<string, unknown> }> {

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
        reply: `Your listing is live! 🎉\n\nYou can add photos by finding it in the **Home** tab. Want to change anything or list another property?`,
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

      const summary = buildSummary(updatedData);
      return {
        reply: `Updated! Here's the revised summary:\n\n${summary}\n\nShall I publish this now?`,
        wizard: { step: "confirm", data: updatedData },
        chips: ["Publish now 🚀", "Edit details"],
      };
    }

    // ── Profile wizard ────────────────────────────────────────────────────

    case "profile_name": {
      const name = userMessage.trim();
      if (!name || name.length < 2) {
        return {
          reply: "What's your **full name**? (You can also add a short bio if you'd like.)",
          wizard: { step: "profile_name", data },
        };
      }
      // Check if they also included a bio (after a comma or newline)
      const parts = name.split(/[,\n]/);
      const fullName = parts[0].trim();
      const bio = parts.slice(1).join(",").trim() || undefined;

      return {
        reply: `Nice to meet you, **${fullName}**! 👋\n\nWhat's your **phone number**? And your WhatsApp number if it's different.`,
        wizard: { step: "profile_contact", data: { ...data, p_full_name: fullName, p_bio: bio } },
      };
    }

    case "profile_contact": {
      const phones = userMessage.match(/[+\d][\d\s\-().+]{6,}/g) ?? [];
      const phone = phones[0]?.replace(/\s/g, "") || null;
      const whatsapp = phones[1]?.replace(/\s/g, "") || null;
      const isSkip = /^(skip|same|same as phone|no whatsapp|nein|gleich)/i.test(lower);

      if (!phone && !isSkip) {
        return {
          reply: "Please share your **phone number**. If your WhatsApp is the same, just say \"same\".",
          wizard: { step: "profile_contact", data },
        };
      }

      const finalPhone = phone ?? undefined;
      const finalWhatsApp = whatsapp ?? (isSkip ? finalPhone : undefined);

      return {
        reply: `Got it! Now — what's your **city and country**?\n\n*e.g. Nairobi, Kenya · Berlin, Germany*`,
        wizard: {
          step: "profile_location",
          data: { ...data, p_phone: finalPhone, p_whatsapp: finalWhatsApp },
        },
      };
    }

    case "profile_location": {
      const countryEntry = detectCountry(userMessage);
      const isSkip = /^(skip|nein|weiter)/i.test(lower);

      if (!isSkip && !countryEntry) {
        return {
          reply: "I couldn't identify a country in that. Please tell me your **city and country** — e.g. *Nairobi, Kenya* or *Hamburg, Germany*.",
          wizard: { step: "profile_location", data },
          chips: ["Kenya 🇰🇪", "Germany 🇩🇪", "UAE 🇦🇪", "UK 🇬🇧", "USA 🇺🇸", "Nigeria 🇳🇬"],
        };
      }

      // Try to extract city (anything before the country name in the message)
      const cleanText = userMessage.replace(new RegExp(countryEntry?.label ?? "", "gi"), "").replace(/[,;]/g, " ").trim();
      const city = cleanText.split(/\s+/).filter(w => w.length > 1).slice(0, 3).join(" ").trim() || undefined;

      return {
        reply: `Great! One more thing — do you have an **ID or passport number** you'd like to store? (Used to pre-fill rental contracts)\n\nAlso, what's your **preferred language** for AI interactions?\n\n*You can share both, or tap Skip for now.*`,
        wizard: {
          step: "profile_identity",
          data: {
            ...data,
            p_city: city,
            p_country_code: countryEntry?.code,
          },
        },
        chips: ["Skip", "English 🇺🇸", "Deutsch 🇩🇪", "Français 🇫🇷", "Español 🇪🇸"],
      };
    }

    case "profile_identity": {
      const isSkip = /^(skip|nein|weiter|no|none)/i.test(lower);

      let idNumber: string | undefined;
      let lang: string | undefined;

      if (!isSkip) {
        // Try to extract ID number (alphanumeric, no spaces)
        const idMatch = userMessage.match(/(?:id|passport|pass|number|no)[:\s#]*([a-zA-Z0-9]{5,})/i)
          ?? userMessage.match(/\b([A-Z]{1,3}\d{5,}|\d{7,})\b/);
        idNumber = idMatch?.[1] ?? undefined;

        // Try to detect language
        const langEntry = detectLang(userMessage);
        lang = langEntry?.code ?? undefined;
      }

      // Build profile summary
      const d = { ...data, p_id_number: idNumber, p_lang: lang ?? data.p_lang ?? "en-US" };
      const LANG_LABELS: Record<string, string> = {
        "en-US": "English (US)", "en-GB": "English (UK)", "de-DE": "Deutsch",
        "fr-FR": "Français", "es-ES": "Español", "ar-SA": "العربية",
        "sw-KE": "Kiswahili", "pt-BR": "Português",
      };

      const summary = [
        `👤  **${d.p_full_name ?? "—"}**`,
        d.p_bio ? `📝  ${d.p_bio}` : "",
        `📱  Phone: ${d.p_phone ?? "—"}${d.p_whatsapp && d.p_whatsapp !== d.p_phone ? ` · WhatsApp: ${d.p_whatsapp}` : ""}`,
        `📍  ${[d.p_city, d.p_country_code].filter(Boolean).join(", ") || "—"}`,
        d.p_id_number ? `🪪  ID: ${d.p_id_number}` : "",
        `🌐  Language: ${LANG_LABELS[d.p_lang ?? "en-US"] ?? d.p_lang ?? "English (US)"}`,
      ].filter(Boolean).join("\n");

      return {
        reply: `Here's your **profile summary**:\n\n${summary}\n\nShall I save this?`,
        wizard: { step: "profile_confirm", data: d },
        chips: ["Save profile ✅", "Edit something"],
      };
    }

    case "profile_confirm": {
      const isCancel = /cancel|edit|ändern|no|nein|back/i.test(lower);
      const isConfirm = /yes|save|confirm|go ahead|ok|ja|speichern|perfect/i.test(lower);

      if (isCancel) {
        return {
          reply: "No problem — what would you like to change? (name, phone, location, ID, or language)",
          wizard: { step: "profile_name", data },
          chips: ["Name", "Phone", "Location", "Language"],
        };
      }
      if (!isConfirm) {
        return {
          reply: "Ready to save your profile? Tap **Save profile** or say yes.",
          wizard: { step: "profile_confirm", data },
          chips: ["Save profile ✅", "Edit something"],
        };
      }

      // Return profile_data to frontend — frontend calls /api/profile to save (needs auth)
      const profileData = {
        full_name:      data.p_full_name,
        phone:          data.p_phone,
        whatsapp:       data.p_whatsapp,
        city:           data.p_city,
        country_code:   data.p_country_code,
        id_number:      data.p_id_number,
        bio:            data.p_bio,
        preferred_lang: data.p_lang ?? "en-US",
      };

      return {
        reply: `Profile saved! ✅\n\nYour details will be used to pre-fill contracts and personalise your AI experience. You can update them anytime by saying "update my profile".\n\nWhat would you like to do next?`,
        wizard: { step: null, data: {} },
        profile_data: profileData,
        chips: ["Search for properties", "Create a contract", "List a property"],
      };
    }

    // ── Contract wizard ───────────────────────────────────────────────────

    case "contract_landlord": {
      const emailMatch = userMessage.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
      const email      = emailMatch?.[0] ?? null;
      const name       = userMessage.replace(email ?? "", "").replace(/[,;|]+/g, " ").trim();

      if (!email || !name || name.length < 2) {
        return {
          reply: "Please share your **name and email** so I can include you as the landlord.\n\n*e.g. John Müller, john@example.com*",
          wizard: { step: "contract_landlord", data },
        };
      }

      const supabase = createServiceClient();
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, city")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      const propChips = (props ?? []).map((p: { id: string; title: string; city: string }) => `${p.title} — ${p.city}`);

      return {
        reply: `Got it, **${name}**! Which **property** is this contract for? Pick from your active listings or type the property name.`,
        wizard: { step: "contract_property", data: { ...data, c_landlord_name: name, c_landlord_email: email } },
        chips: propChips.length ? propChips : undefined,
      };
    }

    case "contract_property": {
      const supabase = createServiceClient();
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, city, listing_type")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      const lower2  = userMessage.toLowerCase();
      const matched = (props ?? []).find((p: { id: string; title: string; city: string }) =>
        lower2.includes(p.title.toLowerCase()) ||
        lower2.includes(p.city.toLowerCase()) ||
        lower2.startsWith(p.title.substring(0, 10).toLowerCase())
      );

      if (!matched) {
        const chips = (props ?? []).map((p: { id: string; title: string; city: string }) => `${p.title} — ${p.city}`);
        return {
          reply: chips.length
            ? "I couldn't match that to a property. Please pick from your listings:"
            : "You don't have any active listings. Please create a listing first.",
          wizard: { step: "contract_property", data },
          chips: chips.length ? chips : ["Cancel"],
        };
      }

      return {
        reply: `✅ **${matched.title}** — selected.\n\nNow, what's the **tenant's full name, email address**, and optionally their ID/passport number?\n\n*e.g. Sarah Kamau, sarah@email.com, ID: 12345678*`,
        wizard: { step: "contract_tenant", data: { ...data, c_property_id: matched.id, c_property_title: matched.title } },
      };
    }

    case "contract_tenant": {
      const emailMatch2 = userMessage.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
      const email2      = emailMatch2?.[0] ?? null;
      const idMatch     = userMessage.match(/(?:id|passport|pass)[:\s#]*([a-zA-Z0-9]+)/i);
      const tenantIdNo  = idMatch?.[1] ?? null;
      const namePart    = userMessage.replace(email2 ?? "", "").replace(tenantIdNo ? idMatch![0] : "", "").replace(/[,;|]+/g, " ").trim();

      if (!email2 || !namePart || namePart.length < 2) {
        return {
          reply: "Please share the **tenant's name and email**.\n\n*e.g. Sarah Kamau, sarah@email.com*",
          wizard: { step: "contract_tenant", data },
        };
      }

      return {
        reply: `Got it — **${namePart}**.\n\nNow the **contract terms**:\n• Start date\n• Monthly rent (or purchase price for sale contracts) + currency\n• Security deposit (optional)\n\n*e.g. 1 June 2025, $1,200/month, $2,400 deposit*`,
        wizard: {
          step: "contract_terms",
          data: { ...data, c_tenant_name: namePart, c_tenant_email: email2, c_tenant_id: tenantIdNo ?? undefined },
        },
      };
    }

    case "contract_terms": {
      const extraction = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Extract contract financial terms from the message. Return JSON only:
{ "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "rent": number|null, "deposit": number|null, "currency": "USD"|"EUR"|"GBP"|"KES"|"AED"|"NGN"|"ZAR"|"GHS"|null }
Use null for anything not mentioned. Infer currency from symbols (€=EUR, £=GBP, $=USD, KSh=KES).`,
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 100,
        temperature: 0,
        response_format: { type: "json_object" },
      });

      let terms: { start_date?: string; end_date?: string; rent?: number; deposit?: number; currency?: string } = {};
      try { terms = JSON.parse(extraction.choices[0].message.content ?? "{}"); } catch { /* ignore */ }

      if (!terms.start_date || !terms.rent) {
        return {
          reply: "I need at least a **start date** and the **monthly rent** (or purchase price). Please try again.\n\n*e.g. 1 June 2025, $1,200/month*",
          wizard: { step: "contract_terms", data },
        };
      }

      const COUNTRY_CHIPS = ["Kenya 🇰🇪", "Germany 🇩🇪", "UAE 🇦🇪", "UK 🇬🇧", "USA 🇺🇸", "Nigeria 🇳🇬", "Ghana 🇬🇭", "South Africa 🇿🇦"];

      return {
        reply: `Perfect. One last thing — **which country** is the property in? This determines the governing law and legal clauses.`,
        wizard: {
          step: "contract_jurisdiction",
          data: {
            ...data,
            c_start_date: terms.start_date,
            c_end_date:   terms.end_date ?? undefined,
            c_rent:       terms.rent,
            c_deposit:    terms.deposit ?? undefined,
            c_currency:   terms.currency ?? "USD",
          },
        },
        chips: COUNTRY_CHIPS,
      };
    }

    case "contract_jurisdiction": {
      const lower3  = userMessage.toLowerCase().replace(/[🇰🇪🇩🇪🇦🇪🇬🇧🇺🇸🇳🇬🇬🇭🇿🇦]/g, "").trim();
      let countryEntry = Object.entries(COUNTRY_MAP).find(([k]) => lower3.includes(k))?.[1];
      if (!countryEntry) countryEntry = { code: "US", label: "Unknown (defaulting to US law)" };

      const d2 = { ...data, c_country_code: countryEntry.code };
      const rentFmt = d2.c_rent ? new Intl.NumberFormat("en-US", { style: "currency", currency: d2.c_currency ?? "USD", maximumFractionDigits: 0 }).format(d2.c_rent) : "—";
      const depositFmt = d2.c_deposit ? new Intl.NumberFormat("en-US", { style: "currency", currency: d2.c_currency ?? "USD", maximumFractionDigits: 0 }).format(d2.c_deposit) : "None";

      const summary = [
        `🏠  **${d2.c_property_title}**`,
        `🤝  Landlord: ${d2.c_landlord_name} (${d2.c_landlord_email})`,
        `👤  Tenant: ${d2.c_tenant_name} (${d2.c_tenant_email})`,
        `📅  Start: ${d2.c_start_date}${d2.c_end_date ? ` → ${d2.c_end_date}` : " (open-ended)"}`,
        `💰  Rent: ${rentFmt}/mo · Deposit: ${depositFmt}`,
        `⚖️  Jurisdiction: ${countryEntry.label}`,
      ].join("\n");

      return {
        reply: `Here's the contract summary:\n\n${summary}\n\nShall I **generate the full contract** with AI? This creates a legally-informed document based on ${countryEntry.label} law.`,
        wizard: { step: "contract_confirm", data: d2 },
        chips: ["Generate contract ✨", "Cancel"],
      };
    }

    case "contract_confirm": {
      const isCancel  = /cancel|no|nein|abbrechen/i.test(userMessage);
      const isConfirm = /yes|generate|confirm|go ahead|ok|ja|erstellen/i.test(userMessage);

      if (isCancel) {
        return {
          reply: "No problem — contract creation cancelled. Let me know if you need anything else.",
          wizard: { step: null, data: {} },
        };
      }
      if (!isConfirm) {
        return {
          reply: "Ready to generate? Tap **Generate contract ✨** or say yes.",
          wizard: { step: "contract_confirm", data },
          chips: ["Generate contract ✨", "Cancel"],
        };
      }

      const supabase3 = createServiceClient();
      const { data: created, error: createErr } = await supabase3
        .from("contracts")
        .insert({
          tenant_id:          tenantId,
          property_id:        data.c_property_id!,
          landlord_user_id:   null,
          landlord_name:      data.c_landlord_name!,
          landlord_email:     data.c_landlord_email!,
          tenant_user_id:     null,
          tenant_name:        data.c_tenant_name!,
          tenant_email:       data.c_tenant_email!,
          tenant_id_number:   data.c_tenant_id ?? null,
          contract_type:      "residential_rental",
          status:             "draft",
          start_date:         data.c_start_date!,
          end_date:           data.c_end_date ?? null,
          notice_period_days: 30,
          monthly_rent:       data.c_rent ?? null,
          deposit_amount:     data.c_deposit ?? null,
          currency:           data.c_currency ?? "USD",
          payment_day:        1,
          country_code:       data.c_country_code ?? "US",
          language:           "en",
          contract_data:      {},
          signatures:         {},
        })
        .select("id, tenant_name, landlord_name, monthly_rent, currency, start_date, status")
        .single();

      if (createErr || !created) {
        return {
          reply: "Something went wrong creating the contract. Please try again.",
          wizard: { step: "contract_confirm", data },
          chips: ["Try again", "Cancel"],
        };
      }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/contracts/${created.id}/generate`, {
          method: "POST",
          headers: { "x-internal-service": "true" },
        });
      } catch { /* non-blocking */ }

      return {
        reply: `Your contract is being generated! ✨\n\nOnce ready it will appear in **Home → Contracts**. You can review all clauses, sign it, and send it to the tenant from there.`,
        wizard: { step: null, data: {} },
        contract_created: {
          id:            created.id,
          tenant_name:   created.tenant_name,
          landlord_name: created.landlord_name,
          monthly_rent:  created.monthly_rent,
          currency:      created.currency,
          start_date:    created.start_date,
        },
        chips: ["View my contracts →"],
      };
    }
  }
}

// ── Language helper ───────────────────────────────────────────────────────────
function langInstruction(msg: string): string {
  // Detect language from character patterns and common words
  const lower = msg.toLowerCase();
  const de = /\b(ich|mir|mich|bitte|danke|zeig|such|finde|möchte|können|haben|gibt|welche|mehr|günstiger|teurer|größer|kleiner|noch|auch|bitte|alle|nur)\b/.test(lower);
  const fr = /\b(je|tu|il|nous|vous|ils|est|sont|avoir|faire|trouver|montrer|plus|moins|cher|grande|petite|appartement|maison)\b/.test(lower);
  const ar = /[\u0600-\u06FF]/.test(msg);
  const sw = /\b(ninahitaji|tafadhali|nionyeshe|nyumba|gharama|bei|nairobi|mombasa|nafanya|nataka)\b/.test(lower);
  if (ar)  return "Reply in Arabic (العربية).";
  if (sw)  return "Reply in Swahili.";
  if (fr)  return "Reply in French.";
  if (de)  return "Reply in German (Deutsch).";
  return "Reply in the same language as the user's message.";
}

// ── Search helpers ────────────────────────────────────────────────────────────
async function extractFilters(conversationHistory: ChatCompletionMessageParam[]) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract property search filters from the conversation as JSON.
Consider the FULL conversation context — the user may be refining a previous search (e.g. "show cheaper ones", "in a different area", "bigger ones").
Return ONLY a JSON object with these optional fields:
listing_type: "buy"|"rent", property_type: "apartment"|"house"|"villa"|"commercial"|"land"|"office"|"hall"|"production"|"plot"
min_price: number, max_price: number, bedrooms: number, city: string, neighbourhood: string
If the user says "cheaper" or "less than X", set max_price. If "bigger", set a higher min area (not a filter field — ignore).
Carry over filters from the previous search unless the user explicitly changes them.
Return {} if nothing is clear. Return ONLY valid JSON, no explanation.`,
      },
      ...conversationHistory.slice(-8),
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
      const isDE = langInstruction(lastUserMsg).includes("German");
      const isFR = langInstruction(lastUserMsg).includes("French");
      return NextResponse.json({
        reply: isDE
          ? "Gerne helfe ich dir, deine Immobilie einzustellen! Lass uns Schritt für Schritt vorgehen — dauert nur eine Minute.\n\nErst: Wird die Immobilie **verkauft** oder **vermietet**?"
          : isFR
          ? "Je vous aide à mettre votre bien en ligne ! Allons-y étape par étape.\n\nD'abord : ce bien est-il à **vendre** ou à **louer** ?"
          : "I'd love to help you list your property! Let's go through it step by step — it only takes a minute.\n\nFirst: is this property for **sale** or for **rent**?",
        wizard: { step: "listing_type", data: {} },
        chips: isDE ? ["Verkauf", "Vermietung"] : isFR ? ["Vendre", "Louer"] : ["For Sale", "For Rent"],
      });
    }

    // ── Start contract wizard ─────────────────────────────────────────────
    if (intent === "create_contract") {
      const isDE = langInstruction(lastUserMsg).includes("German");
      return NextResponse.json({
        reply: isDE
          ? "Lass uns gemeinsam einen Vertrag erstellen! Ich stelle dir ein paar Fragen und generiere dann einen vollständigen Vertrag.\n\nZuerst — wie lautet dein **Name und deine E-Mail-Adresse** als Vermieter/Verkäufer?\n\n*z.B. Max Müller, max@beispiel.de*"
          : "Let's draft a contract together! I'll ask you a few questions and then generate a full, jurisdiction-compliant agreement.\n\nFirst — what's **your name and email address** as the landlord/vendor?\n\n*e.g. John Müller, john@example.com*",
        wizard: { step: "contract_landlord", data: {} },
      });
    }

    // ── Start profile wizard ──────────────────────────────────────────────
    if (intent === "setup_profile") {
      const isDE = langInstruction(lastUserMsg).includes("German");
      return NextResponse.json({
        reply: isDE
          ? "Lass uns dein Profil einrichten! Ich stelle dir ein paar kurze Fragen — dauert etwa eine Minute.\n\nWie lautet dein **vollständiger Name**?"
          : "Let's set up your profile! I'll ask you a few quick questions — it takes about a minute and helps me pre-fill contracts and personalise your experience.\n\nWhat's your **full name**?",
        wizard: { step: "profile_name", data: {} },
      });
    }

    // ── SEARCH intent ─────────────────────────────────────────────────────
    if (intent === "search") {
      const filters    = await extractFilters(messages as ChatCompletionMessageParam[]);
      const properties = await searchProperties(filters, tenantId);

      const propContext = properties.length
        ? properties.map((p: Record<string, unknown>) => {
            const price = typeof p.price === "number" ? p.price.toLocaleString("en-US") : p.price;
            return `• ${p.title} | ${p.listing_type === "buy" ? "For Sale" : "For Rent"} | ${p.currency} ${price} | ${p.bedrooms} bed | ${p.city} | ID: ${p.id}`;
          }).join("\n")
        : "No matching properties found.";

      const lang = langInstruction(lastUserMsg);
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI real estate assistant for ${tenant?.name || "this platform"}.
${lang} Keep it brief (1–2 sentences). Results are shown as cards below — do not list them again, do not mention IDs.
If no results found, suggest refining the search.
SEARCH RESULTS:\n${propContext}`,
          },
          ...(messages.slice(-8) as ChatCompletionMessageParam[]),
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return NextResponse.json({
        reply: completion.choices[0].message.content ||
          (properties.length ? `${properties.length} Ergebnisse gefunden:` : "Keine passenden Immobilien gefunden."),
        properties,
        filters,
        wizard,
      });
    }

    // ── BOOKING intent ────────────────────────────────────────────────────
    if (intent === "book") {
      const lang = langInstruction(lastUserMsg);
      const extractRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Extract booking details from the conversation as JSON.
Fields: name, email, phone, preferred_date, property_id, property_title, message.
If required fields (name, email, preferred_date) are missing, ask for them politely. ${lang}`,
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
    const lang = langInstruction(lastUserMsg);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly AI real estate assistant for ${tenant?.name || "this platform"}.
Help buyers find properties, book viewings, and help owners list their property.
${lang} Keep replies brief (2–3 sentences). If the user references previously shown listings (in [Listings shown: ...] in the conversation), you can discuss them directly.
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
