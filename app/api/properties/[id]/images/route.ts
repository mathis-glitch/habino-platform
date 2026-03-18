import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify property belongs to this tenant
  const serviceClient = createServiceClient();
  const { data: property } = await serviceClient
    .from("properties")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Parse multipart form
  const formData = await request.formData();
  const files    = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Get current image count
  const { count } = await serviceClient
    .from("property_images")
    .select("*", { count: "exact", head: true })
    .eq("property_id", id);

  const currentCount = count || 0;
  if (currentCount + files.length > 10) {
    return NextResponse.json({ error: `Max 10 images. Currently have ${currentCount}.` }, { status: 400 });
  }

  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file      = files[i];
    const ext       = file.name.split(".").pop() || "jpg";
    const filePath  = `${tenantId}/${id}/${Date.now()}-${i}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer      = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from("property-images")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { data: { publicUrl } } = serviceClient.storage
      .from("property-images")
      .getPublicUrl(filePath);

    // Insert into property_images table
    await serviceClient.from("property_images").insert({
      property_id: id,
      url:         publicUrl,
      sort_order:  currentCount + i,
    });

    uploadedUrls.push(publicUrl);
  }

  return NextResponse.json({ urls: uploadedUrls });
}
