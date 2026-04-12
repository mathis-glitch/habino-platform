import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import SalesDashboard from "./SalesDashboard";

export const dynamic = "force-dynamic";

export default async function SalesAdminPage() {
  const supabase           = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin/sales");

  const service = createServiceClient();

  // Load all agents with their referral counts
  const { data: agents } = await service
    .from("sales_agents")
    .select(`
      id, full_name, phone, email, agent_code, status, notes, approved_at, created_at,
      referrals(id, status, type, points, registered_at, qualified_at)
    `)
    .order("created_at", { ascending: false });

  // Aggregate stats
  const totalAgents    = agents?.length ?? 0;
  const activeAgents   = agents?.filter(a => a.status === "active").length ?? 0;
  const pendingAgents  = agents?.filter(a => a.status === "pending").length ?? 0;
  const totalReferrals = agents?.reduce((s, a) => s + (a.referrals?.length ?? 0), 0) ?? 0;
  const qualifiedRefs  = agents?.reduce((s, a) => s + (a.referrals?.filter((r: any) => r.status === "qualified").length ?? 0), 0) ?? 0;
  const totalPoints    = agents?.reduce((s, a) => s + (a.referrals?.reduce((ps: number, r: any) => ps + (r.points ?? 0), 0) ?? 0), 0) ?? 0;

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Admin</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
              Sales Team
            </h1>
          </div>
          <a
            href="/api/admin/sales/export"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 18px", borderRadius: 9,
              background: "var(--surface2)", color: "var(--text-2)",
              border: "1px solid var(--border)",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4-4-4M12 3v13"/>
            </svg>
            Export CSV
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Agents",      value: totalAgents,    sub: `${activeAgents} active · ${pendingAgents} pending`, color: "var(--text-1)" },
            { label: "Total Referrals",   value: totalReferrals, sub: `${qualifiedRefs} qualified`,                         color: "var(--ok)"    },
            { label: "Points Awarded",    value: totalPoints,    sub: "across all agents",                                  color: "var(--color-primary)" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "20px 20px 18px",
            }}>
              <p style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6, fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Pending approvals highlight */}
        {pendingAgents > 0 && (
          <div style={{
            padding: "14px 18px", borderRadius: 12, marginBottom: 20,
            background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.2)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,159,10,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, color: "#F59E0B", fontWeight: 600 }}>
              {pendingAgents} agent application{pendingAgents > 1 ? "s" : ""} waiting for approval
            </p>
          </div>
        )}

        {/* Interactive table */}
        <SalesDashboard agents={agents ?? []} />

      </main>
    </>
  );
}
