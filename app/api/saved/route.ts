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

// GET /api/saved — list saved property IDs for the current user
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ saved: [] });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("saved_properties")
    .select("property_id")
    .eq("user_id", user.id);

  return NextResponse.json({ saved: (data ?? []).map((r: { property_id: string }) => r.property_id) });
}

// POST /api/saved — save a property
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { property_id } = await request.json();
  if (!property_id) return NextResponse.json({ error: "property_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("saved_properties")
    .upsert({ user_id: user.id, property_id }, { onConflict: "user_id,property_id", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/saved — unsave a property
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { property_id } = await request.json();
  if (!property_id) return NextResponse.json({ error: "property_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("saved_properties")
    .delete()
    .eq("user_id", user.id)
    .eq("property_id", property_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
