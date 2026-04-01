import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase           = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin");

  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");
  if (!tenantId) redirect("/");

  const serviceClient = createServiceClient();

  const { count: totalCount }       = await serviceClient.from("properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId);
  const { count: activeCount }      = await serviceClient.from("properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  const { count: pendingApptCount } = await serviceClient.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending");

  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("name, contact_email, primary_color")
    .eq("id", tenantId)
    .single();

  const { data: recent } = await serviceClient
    .from("properties")
    .select("id, title, listing_type, price, currency, city, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(8);

  const total  = totalCount  || 0;
  const active = activeCount || 0;
  const draft  = total - active;
  const appts  = pendingApptCount || 0;

  const hasListings = total > 0;
  const hasContact  = !!tenant?.contact_email;
  const hasColor    = !!tenant?.primary_color;
  const onboardingComplete = hasListings && hasContact;

  function statusLabel(s: string) {
    return s === "active" ? "Aktiv" : s === "draft" ? "Entwurf" : s;
  }

  function statusStyle(s: string): React.CSSProperties {
    if (s === "active") return {
      background: "rgba(48,209,88,0.1)", color: "var(--ok)", border: "1px solid rgba(48,209,88,0.2)",
    };
    if (s === "draft") return {
      background: "rgba(255,159,10,0.1)", color: "var(--warn)", border: "1px solid rgba(255,159,10,0.2)",
    };
    return { background: "var(--surface3)", color: "var(--text-3)", border: "1px solid var(--border)" };
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Willkommen zurück</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
              Admin Dashboard
            </h1>
          </div>
          <Link href="/admin/listings/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 9,
            background: "var(--color-primary)", color: "white",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 4px 16px rgba(124,110,242,0.2)",
          }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Inserat erstellen
          </Link>
        </div>

        {/* Onboarding checklist */}
        {!onboardingComplete && (
          <div style={{
            borderRadius: 14, padding: 24, marginBottom: 28,
            background: "linear-gradient(145deg, #1A1829 0%, #111119 100%)",
            border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 6 }}>
              Erste Schritte
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 20, letterSpacing: "-0.01em" }}>
              Plattform einrichten
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { done: true,        label: "Account erstellt",        desc: "Du bist angemeldet und startklar.", href: undefined,             action: undefined },
                { done: hasListings, label: "Erstes Inserat anlegen",  desc: "Veröffentliche deine erste Immobilie.", href: "/admin/listings/new", action: "Jetzt erstellen →" },
                { done: hasContact,  label: "Kontaktdaten hinterlegen",desc: "E-Mail & Telefon für Anfragen.", href: "/admin/settings",     action: "Einstellungen öffnen →" },
                { done: hasColor,    label: "Marke anpassen",          desc: "Logo, Farben und Plattformname.", href: "/admin/settings",     action: "Brand einrichten →" },
              ].map(({ done, label, desc, href, action }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: 14, borderRadius: 10, opacity: done ? 0.45 : 1,
                  background: done ? "transparent" : "rgba(255,255,255,0.04)",
                  border: done ? "none" : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? "var(--ok)" : "rgba(255,255,255,0.08)",
                    border: done ? "none" : "1px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white",
                  }}>
                    {done && (
                      <svg width="13" height="13" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: done ? "var(--text-3)" : "var(--text-1)", textDecoration: done ? "line-through" : "none" }}>
                      {label}
                    </p>
                    {!done && <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{desc}</p>}
                  </div>
                  {!done && href && (
                    <Link href={href} style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text-2)",
                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                      padding: "6px 12px", borderRadius: 8, textDecoration: "none", flexShrink: 0,
                    }}>
                      {action}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Inserate gesamt", value: total,  color: "var(--text-1)"  },
            { label: "Aktiv",           value: active, color: "var(--ok)"      },
            { label: "Entwürfe",        value: draft,  color: "var(--text-3)"  },
            { label: "Offene Termine",  value: appts,  color: "var(--warn)"    },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "20px 20px 18px",
            }}>
              <p style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Recent listings */}
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden", marginBottom: 20,
        }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Aktuelle Inserate</h2>
            <Link href="/admin/listings" style={{ fontSize: 12, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>
              Alle anzeigen →
            </Link>
          </div>

          {(!recent || recent.length === 0) ? (
            <div style={{ padding: "56px 20px", textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "var(--surface3)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "var(--text-3)",
              }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 6 }}>Noch keine Inserate</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>Erstelle dein erstes Inserat.</p>
              <Link href="/admin/listings/new" style={{
                display: "inline-block", padding: "9px 20px", borderRadius: 9,
                background: "var(--color-primary)", color: "white",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
                + Inserat erstellen
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--surface3)" }}>
                    {["Objekt", "Preis", "Typ", "Status", "Aktion"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left",
                        fontSize: 11, fontWeight: 600, color: "var(--text-3)",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recent as Property[]).map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{p.title}</p>
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.city}</p>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-2)" }}>{formatPrice(p.price, p.currency)}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-2)" }}>
                        {p.listing_type === "buy" ? "Kauf" : "Miete"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: 6,
                          fontSize: 11, fontWeight: 600, ...statusStyle(p.status),
                        }}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Link href={`/admin/listings/${p.id}`} style={{ fontSize: 12, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>
                          Bearbeiten
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              href: "/admin/settings",
              title: "Marke & Einstellungen",
              desc: "Logo, Farben, Kontakt",
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              ),
              badge: null,
            },
            {
              href: "/admin/appointments",
              title: "Besichtigungsanfragen",
              desc: appts > 0 ? `${appts} offen` : "Alle Anfragen",
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              ),
              badge: appts > 0 ? appts : null,
            },
          ].map(({ href, title, desc, icon, badge }) => (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderRadius: 12,
              background: "var(--surface2)", border: "1px solid var(--border)",
              textDecoration: "none", transition: "border-color 0.12s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: "var(--surface3)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-2)",
                }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{desc}</p>
                </div>
              </div>
              {badge !== null ? (
                <span style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,159,10,0.12)", border: "1px solid rgba(255,159,10,0.2)",
                  color: "var(--warn)", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {badge}
                </span>
              ) : (
                <svg width="14" height="14" fill="none" stroke="var(--text-3)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
                </svg>
              )}
            </Link>
          ))}
        </div>

      </main>
    </>
  );
}
