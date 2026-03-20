import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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

// ── GET /api/contracts/[id] ───────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      property:properties(id, title, city, neighbourhood, address, listing_type, property_type, price, currency, images:property_images(id, url, sort_order))
    `)
    .eq("id", id)
    .or(`landlord_user_id.eq.${user.id},tenant_user_id.eq.${user.id}`)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ contract: data });
}

// ── PATCH /api/contracts/[id] ─────────────────────────────────
// Update status, notes, signatures
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const body = await request.json();

  // Only allow patching safe fields
  const allowed = [
    "status", "notes", "signatures", "pdf_url", "pdf_storage_path",
    "signed_at", "activated_at", "end_date", "tenant_user_id",
    "landlord_address", "tenant_address", "tenant_id_number",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Verify user is a party to this contract
  const { data: existing } = await supabase
    .from("contracts")
    .select("id, landlord_user_id, tenant_user_id")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParty = existing.landlord_user_id === user.id || existing.tenant_user_id === user.id;
  if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("contracts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contract: data });
}

// ── DELETE /api/contracts/[id] ────────────────────────────────
// Only draft contracts can be deleted
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("contracts")
    .select("id, status, landlord_user_id, pdf_storage_path")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.landlord_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["draft", "pending_review"].includes(existing.status))
    return NextResponse.json({ error: "Only draft contracts can be deleted" }, { status: 400 });

  // Remove PDF from storage if present
  if (existing.pdf_storage_path) {
    await supabase.storage.from("contracts").remove([existing.pdf_storage_path]);
  }

  await supabase.from("contracts").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
