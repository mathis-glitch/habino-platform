"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const G  = "#2D6A4F";
const GL = "rgba(45,106,79,0.09)";

interface Analytics {
  period_days: number;
  total_properties: number;
  active_properties: number;
  bookings_total: number;
  bookings_pending: number;
  messages_total: number;
  saves_total: number;
  conversion_rate: string;
  top_properties: Array<{ count: number; property: { id: string; title: string; price: number; currency: string; neighbourhood: string; listing_type: string } }>;
  recent_bookings: Array<{ id: string; name: string; email: string; preferred_date: string; status: string; property_title: string; created_at: string }>;
}

interface DistrictDemand {
  district: string;
  views: number;
  searches: number;
  saves: number;
  total: number;
}

interface BehaviorStats {
  total_events: number;
  unique_sessions: number;
  top_event_types: Array<{ event_type: string; count: number }>;
  district_demand: DistrictDemand[];
  hourly_distribution: Array<{ hour: number; count: number }>;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 20px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", flex: 1, minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: color ?? "#1A1A2E" }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

function DistrictHeatmap({ data, days }: { data: DistrictDemand[]; days: number }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>District Demand Heatmap</h2>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>last {days}d · views + searches + saves</span>
      </div>
      {data.length === 0 ? (
        <p style={{ color: "#9CA3AF", fontSize: 13 }}>No location data yet. Location is collected after users grant permission in the app.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((d, i) => {
            const pct = Math.round((d.total / max) * 100);
            const intensity = Math.max(0.08, d.total / max);
            return (
              <div key={d.district} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Rank */}
                <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? G : "#9CA3AF", width: 20, textAlign: "right" }}>#{i + 1}</span>
                {/* District */}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", width: 100, flexShrink: 0 }}>{d.district}</span>
                {/* Bar */}
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: `rgba(45,106,79,${intensity})`, transition: "width 0.4s ease" }} />
                </div>
                {/* Counts */}
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
                  <span title="Views">👁 {d.views}</span>
                  <span title="Searches">🔍 {d.searches}</span>
                  <span title="Saves">♡ {d.saves}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: G, width: 40, textAlign: "right" }}>{d.total}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HourlyChart({ data }: { data: Array<{ hour: number; count: number }> }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const hours = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h);
    return { hour: h, count: found?.count ?? 0 };
  });
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>Activity by Hour (Addis Ababa time)</h2>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
        {hours.map(({ hour, count }) => (
          <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              title={`${hour}:00 — ${count} events`}
              style={{
                width: "100%", borderRadius: 3,
                height: count > 0 ? Math.max(4, Math.round((count / max) * 52)) : 2,
                background: count > 0 ? G : "#F3F4F6",
                opacity: count > 0 ? 0.4 + 0.6 * (count / max) : 1,
                cursor: "default",
              }}
            />
            {hour % 6 === 0 && (
              <span style={{ fontSize: 9, color: "#9CA3AF" }}>{hour}h</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data,      setData]      = useState<Analytics | null>(null);
  const [behavior,  setBehavior]  = useState<BehaviorStats | null>(null);
  const [days,      setDays]      = useState(30);
  const [loading,   setLoading]   = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/analytics?days=${days}`)
        .then(r => { if (r.status === 401) { router.push("/auth/login"); throw new Error("unauth"); } return r.json(); }),
      fetch(`/api/admin/analytics/behavior?days=${days}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([a, b]) => { setData(a); setBehavior(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days, router]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F7", fontFamily: "'Inter',-apple-system,sans-serif", padding: "24px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Analytics</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9CA3AF" }}>Property performance &amp; user behaviour</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, background: "#fff", cursor: "pointer" }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>Loading…</div>
      ) : data ? (
        <>
          {/* KPI Grid */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Active Listings"  value={data.active_properties} sub={`of ${data.total_properties} total`} color={G} />
            <StatCard label="Bookings"         value={data.bookings_total}    sub={`${data.bookings_pending} pending`} />
            <StatCard label="Messages"         value={data.messages_total}    sub={`last ${data.period_days}d`} />
            <StatCard label="Saves"            value={data.saves_total}       sub={`last ${data.period_days}d`} />
            <StatCard label="Conversion"       value={`${data.conversion_rate}%`} sub="msg → booking" color={data.conversion_rate > "5" ? G : "#FF9F0A"} />
            {behavior && <StatCard label="App Events"  value={behavior.total_events} sub={`last ${days}d`} />}
          </div>

          {/* District Demand Heatmap */}
          {behavior && (
            <DistrictHeatmap data={behavior.district_demand} days={days} />
          )}

          {/* Hourly activity */}
          {behavior && behavior.hourly_distribution.length > 0 && (
            <HourlyChart data={behavior.hourly_distribution} />
          )}

          {/* Top Event Types */}
          {behavior && behavior.top_event_types.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>Event Breakdown</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {behavior.top_event_types.map(e => (
                  <div key={e.event_type} style={{ background: GL, borderRadius: 10, padding: "8px 14px" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>{e.event_type.replace(/_/g, " ")}</span>
                    <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: G }}>{e.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Properties */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>Top Saved Properties</h2>
            {data.top_properties.length === 0 ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>No data yet for this period.</p>
            ) : (
              data.top_properties.map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < data.top_properties.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{row.property?.title ?? "—"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>{row.property?.neighbourhood} · {row.property?.listing_type}</p>
                  </div>
                  <span style={{ background: GL, color: G, fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 8 }}>{row.count} saves</span>
                </div>
              ))
            )}
          </div>

          {/* Recent Bookings */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>Recent Viewing Requests</h2>
            {data.recent_bookings.length === 0 ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>No bookings yet.</p>
            ) : (
              data.recent_bookings.map((b, i) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < data.recent_bookings.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{b.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>{b.property_title} · {new Date(b.preferred_date).toLocaleDateString()}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                    background: b.status === "confirmed" ? "#D1FAE5" : b.status === "pending" ? "#FEF3C7" : "#FEE2E2",
                    color:      b.status === "confirmed" ? "#065F46"  : b.status === "pending" ? "#92400E"  : "#991B1B",
                  }}>{b.status}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p style={{ color: "#9CA3AF", textAlign: "center" }}>Failed to load analytics.</p>
      )}
    </div>
  );
}
