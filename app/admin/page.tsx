import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase         = await createClient();
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

  // Onboarding checklist
  const hasListings  = total > 0;
  const hasContact   = !!tenant?.contact_email;
  const hasColor     = !!tenant?.primary_color;
  const onboardingComplete = hasListings && hasContact;

  function statusLabel(s: string) {
    return s === "active" ? "Aktiv" : s === "draft" ? "Entwurf" : s;
  }
  function statusColor(s: string) {
    return s === "active"
      ? "bg-emerald-100 text-emerald-700"
      : s === "draft"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-500";
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-400">Willkommen zurück</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Admin Dashboard</h1>
          </div>
          <Link href="/admin/listings/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: "var(--color-primary)" }}>
            + Inserat anlegen
          </Link>
        </div>

        {/* Onboarding checklist — shown until complete */}
        {!onboardingComplete && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Erste Schritte</p>
            <h2 className="text-lg font-bold mb-5">Richten Sie Ihre Plattform ein</h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  done: true,
                  label: "Account erstellt",
                  desc: "Sie sind angemeldet und bereit.",
                  href: undefined,
                  action: undefined,
                },
                {
                  done: hasListings,
                  label: "Erstes Inserat anlegen",
                  desc: "Veröffentlichen Sie Ihre erste Immobilie.",
                  href: "/admin/listings/new",
                  action: "Jetzt anlegen →",
                },
                {
                  done: hasContact,
                  label: "Kontaktdaten hinterlegen",
                  desc: "E-Mail & Telefon für Interessentenanfragen.",
                  href: "/admin/settings",
                  action: "Einstellungen öffnen →",
                },
                {
                  done: hasColor,
                  label: "Brand anpassen",
                  desc: "Logo, Farben und Namen Ihrer Plattform.",
                  href: "/admin/settings",
                  action: "Brand einstellen →",
                },
              ].map(({ done, label, desc, href, action }) => (
                <div key={label} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${done ? "opacity-50" : "bg-white/5"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500" : "bg-white/10 border border-white/20"}`}>
                    {done && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? "line-through text-slate-400" : "text-white"}`}>{label}</p>
                    {!done && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
                  </div>
                  {!done && href && (
                    <Link href={href} className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                      {action}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Inserate gesamt",    value: total,  color: "text-slate-900" },
            { label: "Aktiv",              value: active, color: "text-emerald-600" },
            { label: "Entwurf",            value: draft,  color: "text-slate-500" },
            { label: "Termine ausstehend", value: appts,  color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Neueste Inserate</h2>
            <Link href="/admin/listings" className="text-sm hover:underline" style={{ color: "var(--color-primary)" }}>
              Alle anzeigen →
            </Link>
          </div>

          {(!recent || recent.length === 0) ? (
            <div className="px-5 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Noch keine Inserate</p>
              <p className="text-sm text-slate-400 mt-1">Legen Sie jetzt Ihr erstes Inserat an.</p>
              <Link href="/admin/listings/new"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--color-primary)" }}>
                + Inserat anlegen
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Immobilie</th>
                    <th className="px-5 py-3 text-left">Preis</th>
                    <th className="px-5 py-3 text-left">Typ</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(recent as Property[]).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800 line-clamp-1">{p.title}</p>
                        <p className="text-xs text-slate-400">{p.city}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{formatPrice(p.price, p.currency)}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.listing_type === "buy" ? "Kaufen" : "Mieten"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/listings/${p.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/settings"
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Brand & Einstellungen</p>
              <p className="text-sm text-slate-500 mt-0.5">Logo, Farben, Kontakt</p>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
          <Link href="/admin/appointments"
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Terminanfragen</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {appts > 0 ? `${appts} ausstehend` : "Alle Anfragen anzeigen"}
              </p>
            </div>
            {appts > 0 && (
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                {appts}
              </span>
            )}
            {appts === 0 && <span className="text-slate-400">→</span>}
          </Link>
        </div>
      </main>
    </>
  );
}
