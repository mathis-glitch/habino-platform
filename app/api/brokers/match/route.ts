/**
 * POST /api/brokers/match
 *
 * Find brokers that best match a user's property search criteria.
 * Accepts a free-text description of what the user is looking for
 * and returns the top 3 semantically matching broker profiles.
 *
 * Body:
 *   { q: string }   — e.g. "3-bedroom apartment for rent in Bole under 25000 ETB"
 *
 * Falls back to top-rated brokers if no embeddings exist yet.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function getTenantId(request: NextRequest): Promise<string | null> {
  let tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    const svc = createServiceClient();
    const { data } = await svc.from("tenants").select("id").eq("is_active", true).limit(1).single();
    tenantId = data?.id ?? null;
  }
  return tenantId;
}

export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const q = (body.q ?? "").trim();
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

  const supabase = createServiceClient();

  // ── 1. Run embedding + fallback fetch in parallel ────────────────────────
  const BROKER_FIELDS = "id, full_name, avatar_url, agency, bio, speciality, districts, property_types, years_exp, rating, verified, transaction_count, certifications, ai_summary";

  const [embResult, fallbackResult] = await Promise.allSettled([
    openai.embeddings.create({ model: "text-embedding-3-small", input: q }),
    supabase.from("broker_profiles").select(BROKER_FIELDS)
      .eq("tenant_id", tenantId)
      .order("verified", { ascending: false })
      .order("rating",   { ascending: false })
      .limit(5),
  ]);

  let brokers: Record<string, unknown>[] = [];
  let usedSemantic = false;

  if (embResult.status === "fulfilled") {
    try {
      const queryEmbedding = embResult.value.data[0].embedding;
      const { data: matches } = await supabase.rpc("search_brokers_semantic", {
        query_embedding:  queryEmbedding,
        tenant_id_filter: tenantId,
        match_count:      5,
        threshold:        0.30,
      });
      if (matches && matches.length > 0) {
        const ids = matches.map((m: { id: string }) => m.id);
        const { data } = await supabase
          .from("broker_profiles").select(BROKER_FIELDS).in("id", ids);
        brokers = ids.map((id: string) => data?.find((b: { id: string }) => b.id === id)).filter(Boolean) as Record<string, unknown>[];
        usedSemantic = true;
      }
    } catch { /* fall through */ }
  }

  // ── 2. Fallback: use already-fetched top-rated brokers ────────────────────
  if (!usedSemantic || brokers.length === 0) {
    brokers = fallbackResult.status === "fulfilled" ? (fallbackResult.value.data ?? []) : [];
  }

  if (brokers.length === 0) {
    return NextResponse.json({ brokers: [], match_reason: null });
  }

  // ── 3. Generate a short match explanation via Claude ──────────────────────
  // One fast non-streaming call to produce "why this broker matches your search"
  let matchReason: string | null = null;
  try {
    const brokerSummaries = brokers.slice(0, 3).map((b, i) => {
      const specs = Array.isArray(b.speciality) ? (b.speciality as string[]).join(", ") : "";
      const areas = Array.isArray(b.districts)  ? (b.districts  as string[]).join(", ") : "";
      return `${i + 1}. ${b.full_name} (${b.agency ?? "Independent"}) — specialises in ${specs || "residential"}, covers ${areas || "Addis Ababa"}, ${b.years_exp ?? "?"} yrs exp, rating ${b.rating ?? "?"}/5`;
    }).join("\n");

    const msg = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system:     "You are a concise real estate assistant for Habino in Addis Ababa. Write one short sentence (max 20 words) explaining why these brokers match the user's search. No bullet points, no intro, just the sentence.",
      messages: [{
        role:    "user",
        content: `User is looking for: "${q}"\n\nMatched brokers:\n${brokerSummaries}`,
      }],
    });

    matchReason = (msg.content[0] as { type: string; text: string }).text?.trim() ?? null;
  } catch {
    // Non-critical — proceed without explanation
  }

  return NextResponse.json({
    brokers:      brokers.slice(0, 3),
    match_reason: matchReason,
    semantic:     usedSemantic,
  });
}
