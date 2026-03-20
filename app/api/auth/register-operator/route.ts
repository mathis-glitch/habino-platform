import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, platform_name } = await request.json();

    if (!email || !password || !full_name || !platform_name) {
      return NextResponse.json({ error: "Alle Felder sind Pflicht." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }

    const service = createServiceClient();

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,           // skip email confirmation for operator onboarding
      user_metadata: { full_name },
    });

    if (authError || !authData.user) {
      const msg = authError?.message || "Registrierung fehlgeschlagen.";
      // Friendly German messages
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Create tenant record
    const baseSlug = slugify(platform_name) || "plattform";
    let slug = baseSlug;
    let attempt = 0;

    // Ensure slug is unique
    while (true) {
      const { data: existing } = await service
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const { data: tenant, error: tenantError } = await service
      .from("tenants")
      .insert({
        name:           platform_name,
        slug,
        primary_color:  "#00A884",
        secondary_color: "#0F1F3D",
      })
      .select("id, slug")
      .single();

    if (tenantError || !tenant) {
      // Roll back: delete the auth user
      await service.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Plattform konnte nicht erstellt werden." }, { status: 500 });
    }

    // 3. Create user record linking user to tenant
    const { error: userError } = await service.from("users").insert({
      id:        userId,
      tenant_id: tenant.id,
      email,
      full_name,
      role:      "operator_admin",
    });

    if (userError) {
      // Roll back both
      await service.auth.admin.deleteUser(userId);
      await service.from("tenants").delete().eq("id", tenant.id);
      return NextResponse.json({ error: "Benutzerprofil konnte nicht erstellt werden." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      slug: tenant.slug,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
