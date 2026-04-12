import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function esc(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  // Auth check
  const supabase           = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: agents, error } = await service
    .from("sales_agents")
    .select(`
      id, full_name, phone, email, agent_code, status, notes, approved_at, created_at,
      referrals(id, status, type, points, registered_at, qualified_at)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: string[] = [
    // Header
    [
      "Agent ID", "Full Name", "Phone", "Email", "Agent Code", "Status",
      "Notes", "Approved At", "Joined",
      "Total Referrals", "Qualified Referrals", "Pending Referrals", "Total Points",
    ].join(","),
  ];

  for (const agent of agents ?? []) {
    const refs       = (agent.referrals as Record<string, unknown>[]) ?? [];
    const totalRefs  = refs.length;
    const qualRefs   = refs.filter(r => r["status"] === "qualified").length;
    const pendRefs   = refs.filter(r => r["status"] === "pending").length;
    const points     = refs.reduce((s: number, r) => s + ((r["points"] as number) ?? 0), 0);

    rows.push([
      esc(agent.id),
      esc(agent.full_name),
      esc(agent.phone),
      esc(agent.email),
      esc(agent.agent_code),
      esc(agent.status),
      esc(agent.notes),
      esc(agent.approved_at),
      esc(agent.created_at),
      String(totalRefs),
      String(qualRefs),
      String(pendRefs),
      String(points),
    ].join(","));
  }

  // Second sheet: detailed referrals
  rows.push(""); // blank line separator
  rows.push([
    "Agent Code", "Agent Name", "Referral ID", "Type", "Status", "Points", "Registered At", "Qualified At",
  ].join(","));

  for (const agent of agents ?? []) {
    const refs = (agent.referrals as Record<string, unknown>[]) ?? [];
    for (const r of refs) {
      rows.push([
        esc(agent.agent_code),
        esc(agent.full_name),
        esc(r["id"] as string),
        esc(r["type"] as string),
        esc(r["status"] as string),
        String((r["points"] as number) ?? 0),
        esc(r["registered_at"] as string),
        esc(r["qualified_at"] as string),
      ].join(","));
    }
  }

  const csv      = rows.join("\n");
  const filename = `habino-sales-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
