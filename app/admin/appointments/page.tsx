import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { AppointmentActions } from "./AppointmentActions";

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin/appointments");

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) redirect("/");

  const serviceClient = createServiceClient();

  const { data: appointments } = await serviceClient
    .from("appointments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const pending   = appointments?.filter((a: { status: string }) => a.status === "pending").length   || 0;
  const confirmed = appointments?.filter((a: { status: string }) => a.status === "confirmed").length || 0;

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      pending:   "bg-amber-100 text-amber-700",
      confirmed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-slate-100 text-slate-500",
    };
    const labels: Record<string, string> = {
      pending: "Ausstehend", confirmed: "Bestätigt", cancelled: "Abgesagt",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>
        {labels[status] || status}
      </span>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-slate-400 hover:text-primary transition-colors">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Terminanfragen</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Gesamt",     value: appointments?.length || 0, color: "text-slate-900" },
            { label: "Ausstehend", value: pending,                   color: "text-amber-600" },
            { label: "Bestätigt",  value: confirmed,                 color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {!appointments?.length ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Noch keine Terminanfragen</p>
              <p className="text-sm text-slate-400 mt-1">Sobald Interessenten über den KI-Agent Termine buchen, erscheinen sie hier.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Interessent</th>
                    <th className="px-5 py-3 text-left">Inserat</th>
                    <th className="px-5 py-3 text-left">Wunschtermin</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Eingang</th>
                    <th className="px-5 py-3 text-left">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt: Record<string, string>) => (
                    <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{appt.name}</p>
                        <a href={`mailto:${appt.email}`} className="text-xs text-primary hover:underline">{appt.email}</a>
                        {appt.phone && <p className="text-xs text-slate-400 mt-0.5">{appt.phone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {appt.property_id ? (
                          <Link href={`/properties/${appt.property_id}`}
                            className="text-primary hover:underline text-xs line-clamp-2">
                            {appt.property_title || appt.property_id}
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{appt.preferred_date}</td>
                      <td className="px-5 py-4">{statusBadge(appt.status)}</td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {new Date(appt.created_at).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-5 py-4">
                        <AppointmentActions id={appt.id} status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
