import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export default async function AdminDashboard() {
  const supabase         = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin");

  const headersList = await headers();
  const tenantId    = headersList.get("x-tenant-id");

  if (!tenantId) redirect("/");

  const serviceClient = createServiceClient();

  // Stats
  const { count: totalCount }  = await serviceClient.from("properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId);
  const { count: activeCount }      = await serviceClient.from("properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active");
  const { count: pendingApptCount } = await serviceClient.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending");

  // Recent listings
  const { data: recent } = await serviceClient
    .from("properties")
    .select("id, title, listing_type, price, currency, city, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(8);

  const statusVariant = (s: string) =>
    s === "active" ? "success" : s === "draft" ? "warning" : "default";

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <Link href="/admin/listings/new" className="btn-primary px-5 py-2.5 rounded-lg text-sm">
            + Inserat anlegen
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Inserate gesamt",    value: totalCount  || 0, color: "text-slate-900" },
            { label: "Aktiv",              value: activeCount || 0, color: "text-emerald-600" },
            { label: "Entwurf",            value: (totalCount || 0) - (activeCount || 0), color: "text-slate-900" },
            { label: "Termine ausstehend", value: pendingApptCount || 0, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-5">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent listings table */}
        <div className="card overflow-x-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Listings</h2>
            <Link href="/admin/listings" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Property</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recent as Property[])?.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800 line-clamp-1">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.city}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {formatPrice(p.price, p.currency)}
                  </td>
                  <td className="px-5 py-3.5 capitalize text-slate-600">{p.listing_type}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariant(p.status) as any} className="capitalize">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/listings/${p.id}`} className="text-primary hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {(!recent || recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    No listings yet.{" "}
                    <Link href="/admin/listings/new" className="text-primary hover:underline">
                      Add your first listing
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Link href="/admin/settings" className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Brand Settings</p>
              <p className="text-sm text-slate-500 mt-0.5">Logo, colours, contact info</p>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
          <Link href="/admin/appointments" className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Terminanfragen</p>
              <p className="text-sm text-slate-500 mt-0.5">{pendingApptCount || 0} ausstehend</p>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        </div>
      </main>
    </>
  );
}
