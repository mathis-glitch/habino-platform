"use client";

import { useState } from "react";

const T = {
  ink:        "#1A1714",
  ink2:       "#4A4540",
  ink3:       "#7A736C",
  ink4:       "#A89F98",
  ink5:       "#C8C0B8",
  surface:    "#FAFAF8",
  panel:      "#FFFFFF",
  border:     "#E8E2DA",
  border2:    "#F0EBE4",
  accent:     "#1B4332",
  accentMid:  "#2D6A4F",
  accentHi:   "#52B788",
  accentBg:   "#EBF5EF",
  accentBg2:  "#D8F0E3",
  warm:       "#B45309",
  warmBg:     "#FEF3C7",
  cool:       "#1E40AF",
  coolBg:     "#DBEAFE",
};

function Section({ children, pt = true }: { children: React.ReactNode; pt?: boolean }) {
  return (
    <div style={{ padding: pt ? "18px 18px 0" : "0 18px 0" }}>
      {children}
    </div>
  );
}

function SectionLabel({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: T.ink4 }}>
        {title}
      </span>
      {action && (
        <a href={href ?? "#"} style={{ fontSize: 11, fontWeight: 500, color: T.accentMid, cursor: "pointer", textDecoration: "none" }}>
          {action}
        </a>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.border2, margin: "16px 18px" }} />;
}

/* ── Market pulse ─────────────────────────────────────────────────────────── */
function MarketPulse() {
  const bars = [50, 58, 63, 72, 80, 100];
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Bole District</div>
          <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2 }}>Addis Ababa · 2BR Segment</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999,
          background: T.warmBg, border: `1px solid #FDE68A`,
          fontSize: 11, fontWeight: 700, color: T.warm,
        }}>
          🔥 Hot
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { val: "ETB 44.2k", key: "Median rent/mo",    delta: "↑ 8.4% vs last year", up: true },
          { val: "18 days",   key: "Avg days on market", delta: "↓ 5 from last month", up: false },
          { val: "4.2%",      key: "Vacancy rate",       delta: "Lowest in city",      up: true },
          { val: "7.1%",      key: "Rental yield",       delta: "↑ vs 5.9% avg",       up: true },
        ].map((s) => (
          <div key={s.key} style={{
            background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 12, padding: "11px 13px",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: "-0.5px" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: T.ink4, marginTop: 2 }}>{s.key}</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: s.up ? "#16A34A" : "#B91C1C", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Trend bars */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: T.ink4, marginBottom: 20 }}>Rental index · 6-month trend</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, position: "relative" }}>
              <div style={{
                height: `${h}%`, borderRadius: "3px 3px 0 0",
                background: i === bars.length - 1 ? T.accentHi : T.accentBg2,
                cursor: "pointer", transition: "background 0.15s",
              }} />
              <div style={{
                position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)",
                fontSize: 8.5, color: i === bars.length - 1 ? T.accentMid : T.ink5,
                fontWeight: i === bars.length - 1 ? 700 : 400, whiteSpace: "nowrap",
              }}>
                {months[i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Map module ───────────────────────────────────────────────────────────── */
function MapModule() {
  return (
    <div style={{
      height: 140, borderRadius: 16, overflow: "hidden", position: "relative",
      background: "linear-gradient(135deg, #1B2838 0%, #1e3a5f 40%, #163d2b 100%)",
      border: `1px solid ${T.border2}`,
    }}>
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />
      {/* Roads */}
      <div style={{ position: "absolute", left: 0, top: "52%", right: 0, height: 1.5, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", top: 0, left: "55%", bottom: 0, width: 1.5, background: "rgba(255,255,255,0.08)" }} />
      {/* Labels */}
      {[
        { label: "Bole",      top: "18%", left: "34%" },
        { label: "Kazanchis", top: "62%", left: "10%" },
        { label: "CMC",       top: "28%", left: "68%" },
        { label: "Sarbet",    top: "72%", left: "60%" },
      ].map((l) => (
        <div key={l.label} style={{ position: "absolute", top: l.top, left: l.left, fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
          {l.label}
        </div>
      ))}
      {/* Active pin */}
      <div style={{ position: "absolute", top: "30%", left: "45%", width: 14, height: 14, borderRadius: "50%", background: T.accentHi, border: "2px solid #fff", transform: "translate(-50%,-50%)", boxShadow: "0 0 0 4px rgba(82,183,136,0.3)" }} />
      {/* Small pins */}
      {[{ t: "65%", l: "18%" }, { t: "34%", l: "72%" }, { t: "75%", l: "65%" }].map((p, i) => (
        <div key={i} style={{ position: "absolute", top: p.t, left: p.l, width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)", transform: "translate(-50%,-50%)" }} />
      ))}
      {/* Listing badge */}
      <div style={{ position: "absolute", top: "15%", left: "38%", background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(6px)", padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>
        3 listings
      </div>
      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff" }}>Addis Ababa, Ethiopia</span>
        <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Explore full map</span>
      </div>
    </div>
  );
}

/* ── Neighbourhood fit ────────────────────────────────────────────────────── */
const NBHDS = [
  {
    name: "Bole", sub: "International hub · High walkability",
    grade: "A+", gradeStyle: { background: "#D8F0E3", color: "#1B4332" },
    tags: ["🏫 3 int'l schools", "🚶 Walk 72", "🏥 Hospital 1.2km"],
    bars: [
      { label: "Safety",  w: 85, color: T.accentHi },
      { label: "Transit", w: 78, color: T.accentHi },
      { label: "Schools", w: 92, color: T.accentHi },
    ],
    selected: true,
  },
  {
    name: "Old Airport", sub: "Quieter · Leafy · Lower rents",
    grade: "B+", gradeStyle: { background: "#DBEAFE", color: "#1E40AF" },
    tags: ["🏫 1 int'l school", "🚶 Walk 58", "🌿 Green area"],
    bars: [
      { label: "Safety",  w: 80, color: "#60A5FA" },
      { label: "Transit", w: 60, color: "#60A5FA" },
      { label: "Schools", w: 55, color: "#60A5FA" },
    ],
    selected: false,
  },
];

function NeighbourhoodFit() {
  const [selected, setSelected] = useState(0);
  return (
    <>
      {NBHDS.map((n, i) => (
        <div
          key={n.name}
          onClick={() => setSelected(i)}
          style={{
            background: selected === i ? T.accentBg : T.surface,
            border: `1px solid ${selected === i ? T.accentHi : T.border2}`,
            borderRadius: 16, padding: "13px 14px", cursor: "pointer",
            transition: "all 0.2s", marginBottom: i === 0 ? 8 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{n.name}</div>
              <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>{n.sub}</div>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, ...n.gradeStyle,
            }}>
              {n.grade}
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
            {n.tags.map((t) => (
              <span key={t} style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 999, background: T.panel, border: `1px solid ${T.border2}`, color: T.ink3 }}>
                {t}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
            {n.bars.map((b) => (
              <div key={b.label} style={{ flex: 1 }}>
                <div style={{ fontSize: 9.5, color: T.ink4, marginBottom: 4 }}>{b.label}</div>
                <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${b.w}%`, borderRadius: 2, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Saved homes ──────────────────────────────────────────────────────────── */
const SAVED = [
  { price: "ETB 38,000/mo", name: "Bole Medhanealem · 2BD", alert: "↓ Price drop", alertStyle: { background: T.accentBg, color: T.accentMid, border: `1px solid ${T.accentBg2}` }, bg: "linear-gradient(135deg, #1B4332, #52B788)" },
  { price: "ETB 52,000/mo", name: "Cameroon St. · 3BD",     alert: "New photos",   alertStyle: { background: T.warmBg, color: T.warm, border: "1px solid #FDE68A" },               bg: "linear-gradient(135deg, #1e3a5f, #2563EB)" },
  { price: "ETB 44,500/mo", name: "Kazanchis Tower · 2BD",  alert: null,           alertStyle: {},                                                                                  bg: "linear-gradient(135deg, #4A1D1D, #92400E)" },
];

function SavedHomes() {
  return (
    <>
      {SAVED.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex", alignItems: "center", gap: 11,
            padding: "10px 12px", borderRadius: 12,
            border: `1px solid ${T.border2}`, background: T.surface,
            marginBottom: i < SAVED.length - 1 ? 7 : 0,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.panel; (e.currentTarget as HTMLElement).style.borderColor = T.ink5; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.surface; (e.currentTarget as HTMLElement).style.borderColor = T.border2; }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: 0.85 }}>
            🏠
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{s.price}</div>
            <div style={{ fontSize: 11, color: T.ink3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
          </div>
          {s.alert && (
            <div style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 7px", borderRadius: 999, flexShrink: 0, ...s.alertStyle }}>
              {s.alert}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

/* ── RightPanel ───────────────────────────────────────────────────────────── */
export default function RightPanel() {
  return (
    <aside style={{
      width: 300, flexShrink: 0,
      height: "100%",
      borderLeft: `1px solid ${T.border}`,
      background: T.panel,
      display: "flex", flexDirection: "column",
      overflowY: "auto",
      overscrollBehavior: "contain",
    }}>
      {/* Trust strip */}
      <Section>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 12px", borderRadius: 10,
          background: T.surface, border: `1px solid ${T.border2}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.ink3 }}>
            <strong style={{ color: T.ink2, fontWeight: 600 }}>Live market data</strong> · Addis Ababa
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: T.ink4, whiteSpace: "nowrap" }}>4 min ago</span>
        </div>
      </Section>

      <Divider />

      <Section>
        <SectionLabel title="Market Pulse" action="Full report →" />
        <MarketPulse />
      </Section>

      <Divider />

      <Section>
        <SectionLabel title="Location Intelligence" action="Open map →" />
        <MapModule />
      </Section>

      <Divider />

      <Section>
        <SectionLabel title="Neighbourhood Fit" action="Compare more →" />
        <NeighbourhoodFit />
      </Section>

      <Divider />

      <Section>
        <SectionLabel title="Saved Homes" action="View all 12 →" />
        <SavedHomes />
      </Section>

      {/* Bottom breathing room */}
      <div style={{ height: 24 }} />
    </aside>
  );
}
