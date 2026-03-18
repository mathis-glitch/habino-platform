"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/app/tenant-provider";
import Header from "@/components/layout/Header";
import { ListingForm } from "@/components/admin/ListingForm";
import Link from "next/link";
import { Property } from "@/lib/types";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { tenant } = useTenant();
  const [property, setProperty] = useState<Property | null>(null);
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace(`/auth/login?redirect=/admin/listings/${id}`);
        return;
      }
      if (tenant?.id) {
        const { data: prop } = await supabase
          .from("properties")
          .select("*, images:property_images(id, url, sort_order)")
          .eq("id", id)
          .eq("tenant_id", tenant.id)
          .single();
        if (!prop) {
          setNotFound(true);
        } else {
          setProperty(prop as Property);
        }
      }
      setReady(true);
    });
  }, [router, id, tenant]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Listing not found.
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
          <Link href="/admin" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/listings" className="hover:text-primary">Listings</Link>
          <span>/</span>
          <span className="text-slate-700 line-clamp-1">{property?.title}</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Edit Listing</h1>
        {property && <ListingForm property={property} tenantId={tenant?.id ?? ""} />}
      </main>
    </>
  );
}
