import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/properties/[id]/images — upload one or more images
// Auth not required; validated via tenant middleware (x-tenant-id header)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = createServiceClient();

  // Verify property belongs to this tenant
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Parse multipart form
  const formData = await request.formData();
  const files    = formData.getAll("files") as File[];

  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  // Max 10 images total
  const { count } = await supabase
    .from("property_images")
    .select("*", { count: "exact", head: true })
    .eq("property_id", id);

  const currentCount = count || 0;
  if (currentCount + files.length > 10) {
    return NextResponse.json({ error: `Max 10 images. Currently have ${currentCount}.` }, { status: 400 });
  }

  const uploaded: { id: string; url: string; sort_order: number }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file     = files[i];
    const ext      = file.name.split(".").pop() || "jpg";
    const filePath = `${tenantId}/${id}/${Date.now()}-${i}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer      = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, buffer, { contentType: file.type || "image/jpeg", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    const { data: imgRecord } = await supabase
      .from("property_images")
      .insert({ property_id: id, url: publicUrl, sort_order: currentCount + i })
      .select("id, url, sort_order")
      .single();

    if (imgRecord) uploaded.push(imgRecord);
  }

  return NextResponse.json({ images: uploaded });
}

// DELETE /api/properties/[id]/images?imageId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: img } = await supabase
    .from("property_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("property_id", id)
    .single();

  if (!img) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  await supabase.from("property_images").delete().eq("id", imageId);

  // Best-effort: delete from storage
  try {
    const url  = new URL(img.url);
    const path = url.pathname.split("/property-images/")[1];
    if (path) await supabase.storage.from("property-images").remove([path]);
  } catch { /* ignore */ }

  return NextResponse.json({ success: true });
}
