"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Placeholder data ─────────────────────────────────────────────────────────
const priceHistory = [
  { monat: "Apr", kauf: 4200, miete: 14.2 },
  { monat: "Mai", kauf: 4280, miete: 14.5 },
  { monat: "Jun", kauf: 4350, miete: 14.8 },
  { monat: "Jul", kauf: 4290, miete: 14.6 },
  { monat: "Aug", kauf: 4420, miete: 15.1 },
  { monat: "Sep", kauf: 4500, miete: 15.4 },
  { monat: "Okt", kauf: 4480, miete: 15.3 },
  { monat: "Nov", kauf: 4550, miete: 15.6 },
  { monat: "Dez", kauf: 4610, miete: 15.8 },
  { monat: "Jan", kauf: 4580, miete: 15.7 },
  { monat: "Feb", kauf: 4650, miete: 16.0 },
  { monat: "Mär", kauf: 4720, miete: 16.3 },
];

const stadtteile = [
  { name: "Altona",       preis: 5800 },
  { name: "Eimsbüttel",   preis: 5500 },
  { name: "Hamburg-Nord", preis: 5100 },
  { name: "Wandsbek",     preis: 4200 },
  { name: "Bergedorf",    preis: 3600 },
  { name: "Harburg",      preis: 3200 },
  { name: "Mitte",        preis: 6200 },
];

// ── Custom tooltip ────────────────────────────────────────────────────────────
function PriceTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "kauf"
            ? `Kauf: ${p.value.toLocaleString("de-DE")} €/m²`
            : `Miete: ${p.value.toFixed(1)} €/m²`}
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-600">Ø {payload[0].value.toLocaleString("de-DE")} €/m²</p>
    </div>
  );
}

// ── Price trend chart ─────────────────────────────────────────────────────────
export function PriceTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={priceHistory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="monat" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="kauf"
          orientation="left"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<PriceTooltip />} />
        <Line yAxisId="kauf" type="monotone" dataKey="kauf" name="kauf"
          stroke="var(--color-primary, #00A884)" strokeWidth={2.5}
          dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RentTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={priceHistory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="monat" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v} €`}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<PriceTooltip />} />
        <Line type="monotone" dataKey="miete" name="miete"
          stroke="#6366f1" strokeWidth={2.5}
          dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Stadtteil bar chart ───────────────────────────────────────────────────────
export function StadtteilChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={stadtteile} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<BarTooltip />} />
        <Bar dataKey="preis" fill="var(--color-primary, #00A884)"
          radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
