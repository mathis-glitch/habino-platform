"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Shared tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = "$", suffix = "/m²" }: {
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

// ── Price trend (buy vs rent on same chart, dual axis) ────────────────────────
const trendData: Record<string, Array<{ month: string; buy: number; rent: number }>> = {
  residential: [
    { month: "Apr", buy: 4200, rent: 14.2 },
    { month: "May", buy: 4280, rent: 14.5 },
    { month: "Jun", buy: 4350, rent: 14.8 },
    { month: "Jul", buy: 4290, rent: 14.6 },
    { month: "Aug", buy: 4420, rent: 15.1 },
    { month: "Sep", buy: 4500, rent: 15.4 },
    { month: "Oct", buy: 4480, rent: 15.3 },
    { month: "Nov", buy: 4550, rent: 15.6 },
    { month: "Dec", buy: 4610, rent: 15.8 },
    { month: "Jan", buy: 4580, rent: 15.7 },
    { month: "Feb", buy: 4650, rent: 16.0 },
    { month: "Mar", buy: 4720, rent: 16.3 },
  ],
  commercial: [
    { month: "Apr", buy: 5800, rent: 22.0 },
    { month: "May", buy: 5850, rent: 22.5 },
    { month: "Jun", buy: 5920, rent: 22.8 },
    { month: "Jul", buy: 5900, rent: 22.6 },
    { month: "Aug", buy: 6000, rent: 23.2 },
    { month: "Sep", buy: 6080, rent: 23.5 },
    { month: "Oct", buy: 6050, rent: 23.4 },
    { month: "Nov", buy: 6120, rent: 23.8 },
    { month: "Dec", buy: 6200, rent: 24.1 },
    { month: "Jan", buy: 6180, rent: 24.0 },
    { month: "Feb", buy: 6250, rent: 24.4 },
    { month: "Mar", buy: 6320, rent: 24.8 },
  ],
  land: [
    { month: "Apr", buy: 1200, rent: 0 },
    { month: "May", buy: 1220, rent: 0 },
    { month: "Jun", buy: 1250, rent: 0 },
    { month: "Jul", buy: 1240, rent: 0 },
    { month: "Aug", buy: 1280, rent: 0 },
    { month: "Sep", buy: 1310, rent: 0 },
    { month: "Oct", buy: 1300, rent: 0 },
    { month: "Nov", buy: 1330, rent: 0 },
    { month: "Dec", buy: 1350, rent: 0 },
    { month: "Jan", buy: 1340, rent: 0 },
    { month: "Feb", buy: 1360, rent: 0 },
    { month: "Mar", buy: 1390, rent: 0 },
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
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
        {showRent && <YAxis yAxisId="rent" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v}`} />}
        <Tooltip content={<ChartTooltip prefix="$" suffix="/m²" />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line yAxisId="buy" type="monotone" dataKey="buy" name="Sale $/m²"
          stroke="var(--color-primary, #00A884)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        {showRent && <Line yAxisId="rent" type="monotone" dataKey="rent" name="Rent $/m²"
          stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── District bar chart ────────────────────────────────────────────────────────
const districtData: Record<string, Array<{ name: string; buy: number; rent: number }>> = {
  residential: [
    { name: "City Centre",  buy: 6200, rent: 18.5 },
    { name: "West End",     buy: 5800, rent: 17.2 },
    { name: "North",        buy: 5100, rent: 15.8 },
    { name: "East Side",    buy: 4400, rent: 14.2 },
    { name: "South",        buy: 3800, rent: 12.6 },
    { name: "Suburbs",      buy: 3200, rent: 11.0 },
  ],
  commercial: [
    { name: "City Centre",  buy: 8500, rent: 32.0 },
    { name: "West End",     buy: 7200, rent: 26.5 },
    { name: "North",        buy: 6100, rent: 22.0 },
    { name: "East Side",    buy: 5200, rent: 19.5 },
    { name: "South",        buy: 4800, rent: 17.0 },
    { name: "Suburbs",      buy: 3900, rent: 14.5 },
  ],
  land: [
    { name: "City Centre",  buy: 3200, rent: 0 },
    { name: "West End",     buy: 2400, rent: 0 },
    { name: "North",        buy: 1800, rent: 0 },
    { name: "East Side",    buy: 1400, rent: 0 },
    { name: "South",        buy: 1100, rent: 0 },
    { name: "Suburbs",      buy: 800,  rent: 0 },
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
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
        <Tooltip content={<ChartTooltip prefix="$" suffix="/m²" />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="buy" name="Sale $/m²" fill="var(--color-primary, #00A884)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        {showRent && <Bar dataKey="rent" name="Rent $/m²" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />}
      </BarChart>
    </ResponsiveContainer>
  );
}
