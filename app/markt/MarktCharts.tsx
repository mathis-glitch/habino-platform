"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Shared tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = "ETB ", suffix = "/m²" }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-600 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {prefix}{p.value.toLocaleString()}{suffix}
        </p>
      ))}
    </div>
  );
}

// ── Price trend — Addis Abeba, 12 months (ETB/m²) ────────────────────────────
const trendData: Record<string, Array<{ month: string; buy: number; rent: number }>> = {
  residential: [
    { month: "Apr", buy: 38000, rent: 120 },
    { month: "May", buy: 38500, rent: 122 },
    { month: "Jun", buy: 39200, rent: 125 },
    { month: "Jul", buy: 39000, rent: 124 },
    { month: "Aug", buy: 40100, rent: 128 },
    { month: "Sep", buy: 40800, rent: 130 },
    { month: "Oct", buy: 40500, rent: 129 },
    { month: "Nov", buy: 41200, rent: 132 },
    { month: "Dec", buy: 41900, rent: 135 },
    { month: "Jan", buy: 41600, rent: 134 },
    { month: "Feb", buy: 42400, rent: 137 },
    { month: "Mar", buy: 43100, rent: 140 },
  ],
  commercial: [
    { month: "Apr", buy: 55000, rent: 210 },
    { month: "May", buy: 55800, rent: 214 },
    { month: "Jun", buy: 56500, rent: 218 },
    { month: "Jul", buy: 56200, rent: 216 },
    { month: "Aug", buy: 57400, rent: 222 },
    { month: "Sep", buy: 58100, rent: 225 },
    { month: "Oct", buy: 57900, rent: 224 },
    { month: "Nov", buy: 58700, rent: 228 },
    { month: "Dec", buy: 59400, rent: 232 },
    { month: "Jan", buy: 59100, rent: 230 },
    { month: "Feb", buy: 60000, rent: 235 },
    { month: "Mar", buy: 60800, rent: 239 },
  ],
  land: [
    { month: "Apr", buy: 18000, rent: 0 },
    { month: "May", buy: 18300, rent: 0 },
    { month: "Jun", buy: 18800, rent: 0 },
    { month: "Jul", buy: 18600, rent: 0 },
    { month: "Aug", buy: 19200, rent: 0 },
    { month: "Sep", buy: 19600, rent: 0 },
    { month: "Oct", buy: 19400, rent: 0 },
    { month: "Nov", buy: 19900, rent: 0 },
    { month: "Dec", buy: 20300, rent: 0 },
    { month: "Jan", buy: 20100, rent: 0 },
    { month: "Feb", buy: 20600, rent: 0 },
    { month: "Mar", buy: 21000, rent: 0 },
  ],
};

export function PriceTrendChart({ usageType }: { usageType: string }) {
  const data = trendData[usageType] || trendData.residential;
  const showRent = usageType !== "land";

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="buy" orientation="left" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        {showRent && <YAxis yAxisId="rent" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${v}`} />}
        <Tooltip content={<ChartTooltip prefix="ETB " suffix="/m²" />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line yAxisId="buy" type="monotone" dataKey="buy" name="Sale ETB/m²"
          stroke="var(--color-primary, #7C6EF2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        {showRent && <Line yAxisId="rent" type="monotone" dataKey="rent" name="Rent ETB/m²"
          stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── District bar chart — Addis Abeba (ETB/m²) ────────────────────────────────
const districtData: Record<string, Array<{ name: string; buy: number; rent: number }>> = {
  residential: [
    { name: "Bole",        buy: 52000, rent: 165 },
    { name: "Kazanchis",   buy: 48000, rent: 155 },
    { name: "Sarbet",      buy: 44000, rent: 145 },
    { name: "CMC",         buy: 40000, rent: 135 },
    { name: "Megenagna",   buy: 38000, rent: 130 },
    { name: "Piassa",      buy: 35000, rent: 120 },
    { name: "Arada",       buy: 33000, rent: 115 },
    { name: "Yeka",        buy: 30000, rent: 108 },
  ],
  commercial: [
    { name: "Bole",        buy: 72000, rent: 260 },
    { name: "Kazanchis",   buy: 68000, rent: 248 },
    { name: "Sarbet",      buy: 60000, rent: 225 },
    { name: "CMC",         buy: 54000, rent: 200 },
    { name: "Megenagna",   buy: 50000, rent: 185 },
    { name: "Piassa",      buy: 46000, rent: 172 },
    { name: "Arada",       buy: 42000, rent: 158 },
    { name: "Yeka",        buy: 38000, rent: 145 },
  ],
  land: [
    { name: "Bole",        buy: 38000, rent: 0 },
    { name: "Kazanchis",   buy: 32000, rent: 0 },
    { name: "Sarbet",      buy: 28000, rent: 0 },
    { name: "CMC",         buy: 24000, rent: 0 },
    { name: "Megenagna",   buy: 22000, rent: 0 },
    { name: "Piassa",      buy: 19000, rent: 0 },
    { name: "Arada",       buy: 17000, rent: 0 },
    { name: "Yeka",        buy: 15000, rent: 0 },
  ],
};

export function DistrictChart({ usageType }: { usageType: string }) {
  const data = districtData[usageType] || districtData.residential;
  const showRent = usageType !== "land";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<ChartTooltip prefix="ETB " suffix="/m²" />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="buy" name="Sale ETB/m²" fill="var(--color-primary, #7C6EF2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        {showRent && <Bar dataKey="rent" name="Rent ETB/m²" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />}
      </BarChart>
    </ResponsiveContainer>
  );
}
