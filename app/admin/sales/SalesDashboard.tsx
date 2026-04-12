"use client";

import { useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Referral {
  id: string;
  status: "pending" | "qualified";
  type: "standard" | "broker" | "servicer";
  points: number;
  registered_at: string;
  qualified_at: string | null;
}

interface Agent {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  agent_code: string;
  status: "pending" | "active" | "suspended";
  notes: string | null;
  approved_at: string | null;
  created_at: string;
  referrals: Referral[];
}

const STATUS_LABELS: Record<Agent["status"], string> = {
  pending:   "Pending",
  active:    "Active",
  suspended: "Suspended",
};

const STATUS_STYLE: Record<Agent["status"], React.CSSProperties> = {
  pending:   { background: "rgba(255,159,10,0.10)", color: "#F59E0B",  border: "1px solid rgba(255,159,10,0.2)" },
  active:    { background: "rgba(52,199,89,0.10)",  color: "#22C55E",  border: "1px solid rgba(52,199,89,0.2)"  },
  suspended: { background: "rgba(255,69,58,0.10)",  color: "#EF4444",  border: "1px solid rgba(255,69,58,0.2)"  },
};

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function AgentRow({ agent, onUpdated }: { agent: Agent; onUpdated: (a: Agent) => void }) {
  const [expanded,   setExpanded]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [notes,      setNotes]      = useState(agent.notes ?? "");
  const [isPending,  startTransition] = useTransition();

  const points    = agent.referrals.reduce((s, r) => s + r.points, 0);
  const qualified = agent.referrals.filter(r => r.status === "qualified").length;
  const pending   = agent.referrals.filter(r => r.status === "pending").length;

  async function setStatus(status: Agent["status"]) {
    const db = supabase();
    const update: Record<string, unknown> = { status };
    if (status === "active" && !agent.approved_at) {
      update.approved_at = new Date().toISOString();
    }
    const { data, error } = await db.from("sales_agents").update(update).eq("id", agent.id).select().single();
    if (!error && data) onUpdated({ ...agent, ...data });
  }

  async function saveNotes() {
    const db = supabase();
    const { data, error } = await db.from("sales_agents").update({ notes }).eq("id", agent.id).select().single();
    if (!error && data) { onUpdated({ ...agent, ...data }); setEditing(false); }
  }

  return (
    <>
      <tr
        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        <td style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{agent.full_name}</p>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{agent.email ?? agent.phone ?? "—"}</p>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <code style={{
            fontSize: 12, fontWeight: 700, color: "var(--color-primary)",
            background: "rgba(124,110,242,0.08)", padding: "3px 8px", borderRadius: 6,
          }}>
            {agent.agent_code}
          </code>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <span style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 20,
            fontSize: 11, fontWeight: 700, ...STATUS_STYLE[agent.status],
          }}>
            {STATUS_LABELS[agent.status]}
          </span>
        </td>
        <td style={{ padding: "14px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{agent.referrals.length}</p>
          <p style={{ fontSize: 10, color: "var(--text-3)" }}>{qualified} qual.</p>
        </td>
        <td style={{ padding: "14px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)" }}>{points}</p>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "var(--text-3)" }}>
            {new Date(agent.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <svg width="12" height="12" fill="none" stroke="var(--text-3)" strokeWidth={2} viewBox="0 0 24 24"
            style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: "var(--surface3)" }}>
          <td colSpan={7} style={{ padding: "16px 20px" }}>
            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {agent.status !== "active" && (
                <button onClick={e => { e.stopPropagation(); startTransition(() => setStatus("active")); }}
                  disabled={isPending}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "rgba(52,199,89,0.12)", color: "#22C55E",
                    fontSize: 12, fontWeight: 700,
                  }}>
                  ✓ Approve
                </button>
              )}
              {agent.status !== "suspended" && (
                <button onClick={e => { e.stopPropagation(); startTransition(() => setStatus("suspended")); }}
                  disabled={isPending}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "rgba(255,69,58,0.08)", color: "#EF4444",
                    fontSize: 12, fontWeight: 700,
                  }}>
                  ⊘ Suspend
                </button>
              )}
              {agent.status !== "pending" && (
                <button onClick={e => { e.stopPropagation(); startTransition(() => setStatus("pending")); }}
                  disabled={isPending}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer",
                    background: "var(--surface2)", color: "var(--text-2)",
                    fontSize: 12, fontWeight: 600,
                  }}>
                  Reset to Pending
                </button>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin Notes</p>
              {editing ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, padding: 10, borderRadius: 8, fontSize: 13, color: "var(--text-1)",
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      resize: "vertical", fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); saveNotes(); }}
                      style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--color-primary)", color: "white", fontSize: 12, fontWeight: 600 }}>
                      Save
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditing(false); setNotes(agent.notes ?? ""); }}
                      style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", background: "transparent", color: "var(--text-2)", fontSize: 12 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <p style={{ flex: 1, fontSize: 13, color: agent.notes ? "var(--text-1)" : "var(--text-3)", fontStyle: agent.notes ? "normal" : "italic" }}>
                    {agent.notes ?? "No notes yet"}
                  </p>
                  <button onClick={e => { e.stopPropagation(); setEditing(true); }}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", background: "transparent", color: "var(--text-2)", fontSize: 11, flexShrink: 0 }}>
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Referral detail */}
            {agent.referrals.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Referrals</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {agent.referrals.map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10,
                      background: "var(--surface2)", border: "1px solid var(--border)",
                    }}>
                      <span style={{ fontSize: 14 }}>
                        {r.type === "broker" ? "🏢" : r.type === "servicer" ? "🔧" : "👤"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                          {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                          Registered {new Date(r.registered_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {r.qualified_at && ` · Qualified ${new Date(r.qualified_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <span style={{
                        padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        ...(r.status === "qualified"
                          ? { background: "rgba(52,199,89,0.10)", color: "#22C55E" }
                          : { background: "rgba(255,159,10,0.10)", color: "#F59E0B" }),
                      }}>
                        {r.status === "qualified" ? "Qualified" : "Pending"}
                      </span>
                      {r.points > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>+{r.points} pt{r.points !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function SalesDashboard({ agents: initialAgents }: { agents: Agent[] }) {
  const [agents,     setAgents]     = useState<Agent[]>(initialAgents);
  const [statusFilter, setFilter]  = useState<"all" | Agent["status"]>("all");
  const [search,     setSearch]    = useState("");

  const filtered = agents.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.agent_code.toLowerCase().includes(q) ||
        (a.email?.toLowerCase().includes(q) ?? false) ||
        (a.phone?.includes(q) ?? false)
      );
    }
    return true;
  });

  function updateAgent(updated: Agent) {
    setAgents(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
  }

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search agent, code, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8,
            background: "var(--surface3)", border: "1px solid var(--border)",
            fontSize: 13, color: "var(--text-1)", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "pending", "active", "suspended"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: statusFilter === f ? "var(--color-primary)" : "var(--surface3)",
                color:      statusFilter === f ? "white" : "var(--text-2)",
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "56px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>No agents found.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--surface3)" }}>
                {["Agent", "Code", "Status", "Referrals", "Points", "Joined", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: h === "Referrals" || h === "Points" ? "center" : "left",
                    fontSize: 11, fontWeight: 600, color: "var(--text-3)",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(agent => (
                <AgentRow key={agent.id} agent={agent} onUpdated={updateAgent}/>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
