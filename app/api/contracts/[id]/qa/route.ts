/**
 * POST /api/contracts/[id]/qa
 *
 * AI contract clause Q&A. Lets a party to a contract ask plain-language
 * questions about any clause and receive a grounded, transparent answer.
 *
 * Auth: user must be landlord_user_id or tenant_user_id on the contract.
 *
 * Body:
 *   {
 *     question: string,
 *     history?: { role: "user" | "assistant"; content: string }[]
 *   }
 *
 * Returns: streaming text (Server-Sent Events compatible via ReadableStream).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import type { ContractData } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

function buildContractContext(contract: Record<string, unknown>): string {
  const data = contract.contract_data as ContractData | null;
  if (!data) return "No contract content available.";

  const lines: string[] = [
    `CONTRACT TYPE: ${contract.contract_type}`,
    `STATUS: ${contract.status}`,
    `PARTIES:`,
    `  Landlord: ${contract.landlord_name} (${contract.landlord_email})`,
    `  Tenant:   ${contract.tenant_name} (${contract.tenant_email})`,
    `DATES: ${contract.start_date} → ${contract.end_date ?? "open-ended"}`,
    `NOTICE PERIOD: ${contract.notice_period_days} days`,
  ];

  if (contract.monthly_rent) {
    lines.push(`MONTHLY RENT: ${contract.currency} ${contract.monthly_rent}`);
    lines.push(`PAYMENT DAY: ${contract.payment_day} of each month`);
  }
  if (contract.deposit_amount) {
    lines.push(`DEPOSIT: ${contract.currency} ${contract.deposit_amount}`);
  }
  if (contract.purchase_price) {
    lines.push(`PURCHASE PRICE: ${contract.currency} ${contract.purchase_price}`);
  }

  lines.push(`JURISDICTION: ${contract.country_code} — ${contract.governing_law ?? "local law"}`);
  lines.push(`FURNISHED: ${data.furnished ? "Yes" : "No"}`);
  lines.push(`PETS ALLOWED: ${data.pets_allowed ? "Yes" : "No"}`);
  lines.push(`SUBLETTING: ${data.subletting_allowed ? "Allowed" : "Not allowed"}`);

  if (data.utilities_included?.length) {
    lines.push(`UTILITIES INCLUDED: ${data.utilities_included.join(", ")}`);
  }
  if (data.special_conditions?.length) {
    lines.push(`SPECIAL CONDITIONS:\n${data.special_conditions.map(c => `  - ${c}`).join("\n")}`);
  }
  if (data.jurisdiction_notes) {
    lines.push(`JURISDICTION NOTES: ${data.jurisdiction_notes}`);
  }

  lines.push("\nCLAUSES:");
  for (const clause of data.clauses ?? []) {
    lines.push(`\n[${clause.title}]\n${clause.body}`);
  }

  return lines.join("\n");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Auth ────────────────────────────────────────────────────────────────────
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Load contract (verify party) ────────────────────────────────────────────
  const svc = createServiceClient();
  const { data: contract, error } = await svc
    .from("contracts")
    .select("*")
    .eq("id", id)
    .or(`landlord_user_id.eq.${user.id},tenant_user_id.eq.${user.id}`)
    .single();

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found or access denied" }, { status: 404 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({}));
  const question: string = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });

  const history: { role: "user" | "assistant"; content: string }[] = body.history ?? [];

  // ── Build context ───────────────────────────────────────────────────────────
  const contractContext = buildContractContext(contract as Record<string, unknown>);

  const systemPrompt = `You are a helpful contract assistant for Habino, a real estate platform in Addis Ababa.
A user who is a party to the following contract is asking you questions about it.

Your role:
- Explain clauses clearly in plain language (non-legal, conversational)
- Always ground your answers in the contract text provided below
- If a question cannot be answered from the contract, say so honestly
- NEVER give legal advice or tell the user what they "should" do legally
- NEVER invent clauses or terms that are not in the contract
- Keep answers concise (2–4 sentences unless more detail is needed)
- If a clause seems unusual or potentially unfavorable to the user, note it neutrally without legal judgment

CONTRACT CONTENT:
${contractContext}`;

  // ── Stream response ─────────────────────────────────────────────────────────
  const messages: Anthropic.MessageParam[] = [
    ...history.map(h => ({ role: h.role, content: h.content } as Anthropic.MessageParam)),
    { role: "user", content: question },
  ];

  const stream = await anthropic.messages.stream({
    model:      "claude-sonnet-4-6",
    max_tokens: 512,
    system:     systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type":  "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
