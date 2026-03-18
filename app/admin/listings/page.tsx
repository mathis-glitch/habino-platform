"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/app/tenant-provider";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export default function AdminListingsPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [listings, setListings] = useState<Property[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/auth/login?redirect=/admin/listings");
        return;
      }
      // Fetch listings for this tenant
      if (tenant?.id) {
        const { data: rows } = await supabase
          .from("properties")
          .select("id, title, listing_type, price, currency, city, status, created_at")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false });
        setListings((rows as Property[]) || []);
      }
      setReady(true);
    });
  }, [router, tenant]);

  const statusVariant = (s: string) =>
    s === "active" ? "success" : s === "draft" ? "warning" : "default";

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Listings</h1>
            <p className="text-slate-500 text-sm mt-0.5">{listings.length} total</p>
          </div>
          <Link href="/admin/listings/new" className="btn-primary px-5 py-2.5 rounded-lg text-sm">
            + Add listing
          </Link>
        </div>

        <div className="card overflow-x-auto">
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
              {listings.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.city}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{formatPrice(p.price, p.currency)}</td>
                  <td className="px-5 py-3.5 capitalize text-slate-600">{p.listing_type}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariant(p.status) as any} className="capitalize">{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <Link href={`/admin/listings/${p.id}`} className="text-primary hover:underline">Edit</Link>
                    {p.status === "active" && (
                      <Link href={`/properties/${p.id}`} target="_blank"
                        className="text-slate-400 hover:text-slate-600">View ↗</Link>
                    )}
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
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
      </main>
    </>
  );
}
