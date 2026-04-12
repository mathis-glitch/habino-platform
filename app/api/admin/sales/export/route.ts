import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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
    const refs       = (agent.referrals as any[]) ?? [];
    const totalRefs  = refs.length;
    const qualRefs   = refs.filter(r => r.status === "qualified").length;
    const pendRefs   = refs.filter(r => r.status === "pending").length;
    const points     = refs.reduce((s: number, r: any) => s + (r.points ?? 0), 0);

    function esc(v: string | null | undefined): string {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

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
    const refs = (agent.referrals as any[]) ?? [];
    for (const r of refs) {
      function esc2(v: string | null | undefined): string {
        if (v == null) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      }
      rows.push([
        esc2(agent.agent_code),
        esc2(agent.full_name),
        esc2(r.id),
        esc2(r.type),
        esc2(r.status),
        String(r.points ?? 0),
        esc2(r.registered_at),
        esc2(r.qualified_at),
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
