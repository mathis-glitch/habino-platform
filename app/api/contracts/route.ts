import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { GenerateContractPayload } from "@/lib/types";

// ── Auth helper ───────────────────────────────────────────────
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

// ── GET /api/contracts ────────────────────────────────────────
// Returns all contracts where the authenticated user is landlord or tenant
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  const { searchParams } = new URL(request.url);
  const role       = searchParams.get("role");       // "landlord" | "tenant" | null = both
  const status     = searchParams.get("status");
  const propertyId = searchParams.get("property_id");

  let query = supabase
    .from("contracts")
    .select(`
      *,
      property:properties(id, title, city, neighbourhood, address, listing_type, property_type, price, currency, images:property_images(id, url, sort_order))
    `)
    .order("created_at", { ascending: false });

  if (role === "landlord") {
    query = query.eq("landlord_user_id", user.id);
  } else if (role === "tenant") {
    query = query.eq("tenant_user_id", user.id);
  } else {
    query = query.or(`landlord_user_id.eq.${user.id},tenant_user_id.eq.${user.id}`);
  }

  if (status) query = query.eq("status", status);
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contracts: data ?? [] });
}

// ── POST /api/contracts ───────────────────────────────────────
// Creates a contract record (AI generation happens in /[id]/generate)
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = createServiceClient();
  const body: GenerateContractPayload = await request.json();

  // Validate property belongs to tenant
  const { data: property } = await supabase
    .from("properties")
    .select("id, title, city, address, listing_type, price, currency")
    .eq("id", body.property_id)
    .eq("tenant_id", tenantId)
    .single();

  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      tenant_id:          tenantId,
      property_id:        body.property_id,
      landlord_user_id:   user.id,
      landlord_name:      body.landlord_name,
      landlord_email:     body.landlord_email,
      landlord_address:   body.landlord_address ?? null,
      tenant_user_id:     null,   // linked when tenant creates account
      tenant_name:        body.tenant_name,
      tenant_email:       body.tenant_email,
      tenant_address:     body.tenant_address ?? null,
      tenant_id_number:   body.tenant_id_number ?? null,
      contract_type:      body.contract_type,
      status:             "draft",
      start_date:         body.start_date,
      end_date:           body.end_date ?? null,
      notice_period_days: body.notice_period_days ?? 30,
      monthly_rent:       body.monthly_rent ?? null,
      purchase_price:     body.purchase_price ?? null,
      deposit_amount:     body.deposit_amount ?? null,
      currency:           body.currency,
      payment_day:        body.payment_day ?? 1,
      country_code:       body.country_code,
      governing_law:      null,   // filled in by AI generation
      jurisdiction_city:  null,
      language:           body.language ?? "en",
      contract_data:      {},
      signatures:         {},
      notes:              body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contract }, { status: 201 });
}
