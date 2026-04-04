import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/ai-draft
 * Turns a free-text / voice description into a fully structured draft.
 * type: "property" | "broker" | "service"
 */
export async function POST(req: NextRequest) {
  try {
    const { description, type } = await req.json() as {
      description: string;
      type: "property" | "broker" | "service";
    };

    if (!description?.trim()) {
      return NextResponse.json({ error: "No description provided" }, { status: 400 });
    }

    const ADDIS_DISTRICTS = [
      "Bole","CMC","CMC Michael","Kazanchis","Sarbet","Piassa","Megenagna",
      "Yeka","Gullele","Kotebe","Lafto","Kirkos","Arada","Lideta",
      "Nifas Silk","Kolfe","Akaki","Gerji","Summit","Ayat","Jemo","Saris",
    ];

    // ── Property Draft ────────────────────────────────────────────────────────
    if (type === "property") {
      const system = `You are a real estate listing assistant for Habino in Addis Ababa, Ethiopia.
Extract structured data from a property description and return ONLY valid JSON, no markdown.

Known districts: ${ADDIS_DISTRICTS.join(", ")}
Currency: mostly ETB (Ethiopian Birr). Typical rent: ETB 15,000–120,000/mo. Buy: ETB 2M–50M+
Property types: apartment, house, villa, commercial, office, land, plot, hall

Return this exact JSON schema:
{
  "listing_type": "rent|buy",
  "property_type": "apartment|house|villa|commercial|office|land|plot|hall",
  "neighbourhood": "district name or empty string",
  "title": "compelling listing title (max 60 chars)",
  "description": "rich 3-4 sentence description highlighting key features, location benefits, and target tenant/buyer",
  "price": number_or_null,
  "currency": "ETB|USD|EUR",
  "bedrooms": number_or_null,
  "bathrooms": number_or_null,
  "area_sqm": number_or_null,
  "floor": number_or_null,
  "floors_total": number_or_null,
  "year_built": number_or_null,
  "furnished": "furnished|semi-furnished|unfurnished|null",
  "condition": "new|renovated|good|needs-work",
  "amenities": ["list","of","amenities","from: Parking,Generator,Water Storage,Security Guard,CCTV,Elevator,Furnished,Air Conditioning,Internet Ready,Garden,Swimming Pool,Gym,Rooftop Terrace,Storage Room"],
  "nearby_landmarks": "string describing what's nearby",
  "contact_preference": "whatsapp|call|email|any",
  "available_from": "YYYY-MM-DD or null"
}`;

      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: `Extract listing data from this description:\n\n"${description}"` }],
      });

      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
      const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const draft = s !== -1 && e !== -1 ? JSON.parse(raw.slice(s, e + 1)) : {};
      return NextResponse.json({ draft, type: "property" });
    }

    // ── Broker Draft ──────────────────────────────────────────────────────────
    if (type === "broker") {
      const system = `You are a real estate broker profile assistant for Habino in Addis Ababa, Ethiopia.
Extract structured broker profile data and return ONLY valid JSON, no markdown.

Known districts: ${ADDIS_DISTRICTS.join(", ")}
Speciality examples: Luxury Residential, Commercial Properties, Land & Plots, Expat Relocation, Rental Management, Off-Plan Investment, NGO Housing, Short-Term Rentals, Property Management

Return this exact JSON schema:
{
  "full_name": "broker full name",
  "agency": "agency or company name, empty string if independent",
  "bio": "professional bio paragraph (3-4 sentences) — write in first person, highlight expertise, districts served, typical clients, and unique value",
  "speciality": ["array","of","speciality","strings"],
  "districts": ["array","of","Addis","districts","they","serve"],
  "years_exp": number_or_null,
  "languages": ["Amharic","English","etc"],
  "phone": "phone number or empty",
  "email": "email or empty",
  "whatsapp": "whatsapp number or empty",
  "certifications": ["any certifications or empty array"],
  "services_offered": ["Property Sales","Rentals","Valuations","Property Management","etc"],
  "typical_clients": "description of typical clients",
  "avg_deal_size": "e.g. ETB 5M–20M or empty",
  "response_time": "e.g. Within 2 hours or empty"
}`;

      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: `Extract broker profile data:\n\n"${description}"` }],
      });

      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
      const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const draft = s !== -1 && e !== -1 ? JSON.parse(raw.slice(s, e + 1)) : {};
      return NextResponse.json({ draft, type: "broker" });
    }

    // ── Service Draft ─────────────────────────────────────────────────────────
    if (type === "service") {
      const system = `You are a home services listing assistant for Habino in Addis Ababa, Ethiopia.
Extract structured service provider data and return ONLY valid JSON, no markdown.

Known districts: ${ADDIS_DISTRICTS.join(", ")}
Categories: cleaning, garden, household, plumbing, electric, moving, security, painting, ac, petcare

Return this exact JSON schema:
{
  "name": "company or service name",
  "category": "cleaning|garden|household|plumbing|electric|moving|security|painting|ac|petcare",
  "description": "compelling 2-3 sentence service description highlighting what makes them unique",
  "tags": ["relevant","service","tags","max 6"],
  "districts": ["districts","they","serve"],
  "price": "price description e.g. From ETB 800/session",
  "price_num": number_or_null,
  "phone": "phone or empty",
  "working_hours": "e.g. Mon–Sat 7:00–18:00",
  "response_time": "e.g. < 1 hour",
  "staff": "description of team e.g. 5 trained technicians",
  "languages": ["Amharic","English"],
  "founded": "year founded or empty",
  "highlights": ["key","selling","points","max 4"],
  "verified": false
}`;

      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: `Extract service provider data:\n\n"${description}"` }],
      });

      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
      const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const draft = s !== -1 && e !== -1 ? JSON.parse(raw.slice(s, e + 1)) : {};
      return NextResponse.json({ draft, type: "service" });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  } catch (err) {
    console.error("[/api/ai-draft]", err);
    return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
  }
}
