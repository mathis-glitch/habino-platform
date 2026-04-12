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

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 20px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", flex: 1, minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: color ?? "#1A1A2E" }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data,   setData]   = useState<Analytics | null>(null);
  const [days,   setDays]   = useState(30);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(r => { if (r.status === 401) { router.push("/auth/login"); throw new Error("unauth"); } return r.json(); })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days, router]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F7", fontFamily: "'Inter',-apple-system,sans-serif", padding: "24px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Analytics</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9CA3AF" }}>Property performance overview</p>
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
          </div>

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
