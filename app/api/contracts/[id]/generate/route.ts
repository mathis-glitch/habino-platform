import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { ContractData, ContractClause } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Jurisdiction-specific legal requirements per country
const JURISDICTION_NOTES: Record<string, string> = {
  KE: "Governed by the Landlord and Tenant (Shops, Hotels and Catering Establishments) Act (Cap. 301) and the Distress for Rent Act (Cap. 293) of Kenya. Tenancy agreements for residential premises are governed by the Rent Restriction Act. Stamp duty may apply.",
  DE: "Governed by the German Civil Code (Bürgerliches Gesetzbuch, BGB), §§ 535–580a (Mietrecht). Rent increases subject to Mietspiegel regulations. Deposit capped at 3 months' cold rent (§551 BGB). Notice periods per §573c BGB apply.",
  AE: "Governed by Law No. 26 of 2007 (as amended by Law No. 33 of 2008) regulating landlord-tenant relationships in Dubai, and Federal Law No. 5 of 1985 (Civil Transactions Law). Disputes resolved via RERA / Rental Dispute Settlement Centre.",
  GB: "Governed by the Housing Act 1988 (as amended), Landlord and Tenant Act 1985, and Deregulation Act 2015. Assured Shorthold Tenancy (AST) rules apply. Deposit must be protected in a government-approved scheme within 30 days.",
  US: "Governed by applicable state landlord-tenant law. Federal Fair Housing Act applies. Security deposit limits, habitability standards, and notice requirements vary by state.",
  ZA: "Governed by the Rental Housing Act 50 of 1999 (as amended by Act 35 of 2014) and the Consumer Protection Act 68 of 2008. Deposit held in interest-bearing account.",
  NG: "Governed by applicable state tenancy laws (e.g., Lagos State Tenancy Law 2011). Advance rent payment practices common; parties should comply with local regulations.",
  GH: "Governed by the Rent Act, 1963 (Act 220) as amended. Advance rent capped at 6 months for residential premises. Disputes referred to the Rent Control Department.",
  FR: "Governed by the French Civil Code and Law No. 89-462 of 6 July 1989 (as amended by the ALUR Law). Deposit capped at 1 month's rent for unfurnished, 2 months for furnished. Notice periods apply.",
  ES: "Governed by the Urban Rentals Act (Ley de Arrendamientos Urbanos, LAU) 29/1994, as amended. Minimum contract duration of 5 years (7 if landlord is legal entity). Annual rent updates linked to CPI.",
};

function getJurisdictionNote(countryCode: string): string {
  return JURISDICTION_NOTES[countryCode.toUpperCase()]
    ?? `This agreement is subject to the applicable laws and regulations of ${countryCode}. Parties should seek independent legal advice to ensure compliance with local requirements.`;
}

function getGoverningLaw(countryCode: string): string {
  const laws: Record<string, string> = {
    KE: "Laws of Kenya",
    DE: "Laws of the Federal Republic of Germany (BGB)",
    AE: "Laws of the Emirate of Dubai / UAE Federal Law",
    GB: "Laws of England and Wales",
    US: "Applicable US State Law",
    ZA: "Laws of the Republic of South Africa",
    NG: "Applicable Nigerian State Law",
    GH: "Laws of the Republic of Ghana",
    FR: "Laws of the French Republic",
    ES: "Laws of the Kingdom of Spain",
  };
  return laws[countryCode.toUpperCase()] ?? `Laws of ${countryCode}`;
}

function contractTypeLabel(type: string): string {
  return {
    residential_rental:  "Residential Tenancy Agreement",
    commercial_rental:   "Commercial Lease Agreement",
    purchase:            "Property Sale and Purchase Agreement",
    option_to_purchase:  "Option to Purchase Agreement",
    short_term_rental:   "Short-Term Rental Agreement",
  }[type] ?? "Real Estate Agreement";
}

// ── POST /api/contracts/[id]/generate ────────────────────────
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  // Load contract + property
  const { data: contract } = await supabase
    .from("contracts")
    .select(`*, property:properties(*)`)
    .eq("id", id)
    .eq("landlord_user_id", user.id)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (!["draft", "pending_review"].includes(contract.status)) {
    return NextResponse.json({ error: "Only draft contracts can be regenerated" }, { status: 400 });
  }

  const prop     = contract.property as Record<string, unknown>;
  const typeLabel = contractTypeLabel(contract.contract_type);
  const govLaw   = getGoverningLaw(contract.country_code);
  const jurNote  = getJurisdictionNote(contract.country_code);
  const lang     = contract.language ?? "en";

  const financialSection = contract.contract_type === "purchase"
    ? `Purchase price: ${contract.currency} ${contract.purchase_price?.toLocaleString() ?? "TBD"}`
    : `Monthly rent: ${contract.currency} ${contract.monthly_rent?.toLocaleString() ?? "TBD"}, due on day ${contract.payment_day} of each month. Security deposit: ${contract.currency} ${contract.deposit_amount?.toLocaleString() ?? "TBD"} (equivalent to ${contract.deposit_amount && contract.monthly_rent ? (contract.deposit_amount / contract.monthly_rent).toFixed(1) : "?"} months' rent).`;

  const systemPrompt = `You are an expert international real estate lawyer drafting a legally sound ${typeLabel}.
You must produce a complete, professional contract in ${lang === "de" ? "German" : lang === "fr" ? "French" : lang === "es" ? "Spanish" : "English"}.
The contract must comply with the jurisdiction: ${govLaw}.
Jurisdiction note: ${jurNote}

Output a JSON object with this exact structure (no markdown, no explanation, only the JSON):
{
  "clauses": [
    { "title": string, "body": string, "type": "standard" | "special" | "jurisdiction_specific" }
  ],
  "special_conditions": string[],
  "utilities_included": string[],
  "furnished": boolean,
  "pets_allowed": boolean,
  "subletting_allowed": boolean,
  "jurisdiction_notes": string,
  "generated_at": "ISO timestamp",
  "model": "gpt-4o"
}

Include all standard clauses for this contract type and jurisdiction:
- Parties and property identification
- Term and commencement
- Rent / purchase price and payment terms
- Security deposit handling (per local law)
- Landlord obligations (quiet enjoyment, maintenance)
- Tenant obligations (care, use restrictions)
- Alterations and improvements
- Assignment and subletting
- Termination and notice requirements (per local law)
- Default and remedies
- Dispute resolution and governing law
- Entire agreement / severability
- Any jurisdiction-specific mandatory clauses

Each clause body should be 2-5 paragraphs of formal legal prose.`;

  const userPrompt = `Draft a ${typeLabel} with the following details:

PARTIES:
Landlord/Vendor: ${contract.landlord_name} (${contract.landlord_email})${contract.landlord_address ? `, ${contract.landlord_address}` : ""}
Tenant/Purchaser: ${contract.tenant_name} (${contract.tenant_email})${contract.tenant_address ? `, ${contract.tenant_address}` : ""}${contract.tenant_id_number ? `, ID/Passport: ${contract.tenant_id_number}` : ""}

PROPERTY:
${prop.title} — ${prop.address ?? `${prop.neighbourhood ?? ""}, ${prop.city}`}
Type: ${prop.property_type} | ${prop.bedrooms ?? "?"} bed, ${prop.bathrooms ?? "?"} bath${prop.area_sqm ? `, ${prop.area_sqm} m²` : ""}

CONTRACT TERMS:
Start date: ${contract.start_date}
End date: ${contract.end_date ?? "Open-ended / rolling"}
Notice period: ${contract.notice_period_days} days
${financialSection}
Furnished: ${contract.contract_data?.furnished ?? false}
Pets allowed: ${contract.contract_data?.pets_allowed ?? false}
Subletting: ${contract.contract_data?.subletting_allowed ?? false}
Utilities included: ${contract.contract_data?.utilities_included?.join(", ") || "None specified"}
${contract.notes ? `Special notes from parties: ${contract.notes}` : ""}

JURISDICTION: ${govLaw}
Country: ${contract.country_code}`;

  let contractData: ContractData;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw);

    contractData = {
      clauses:              parsed.clauses               ?? [],
      special_conditions:   parsed.special_conditions    ?? [],
      utilities_included:   parsed.utilities_included    ?? [],
      furnished:            parsed.furnished              ?? false,
      pets_allowed:         parsed.pets_allowed          ?? false,
      subletting_allowed:   parsed.subletting_allowed    ?? false,
      jurisdiction_notes:   parsed.jurisdiction_notes    ?? jurNote,
      generated_at:         new Date().toISOString(),
      model:                completion.model,
    };

  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json({ error: "Contract generation failed. Please try again." }, { status: 500 });
  }

  // Save generated content + update governing law
  const { data: updated, error: saveError } = await supabase
    .from("contracts")
    .update({
      contract_data:     contractData,
      governing_law:     govLaw,
      jurisdiction_city: contract.jurisdiction_city ?? (prop.city as string) ?? null,
      status:            "pending_review",
    })
    .eq("id", id)
    .select()
    .single();

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

  return NextResponse.json({ contract: updated });
}
