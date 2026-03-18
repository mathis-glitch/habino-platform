"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/app/tenant-provider";
import Header from "@/components/layout/Header";
import { ListingForm } from "@/components/admin/ListingForm";
import Link from "next/link";

export default function NewListingPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth/login?redirect=/admin/listings/new");
      } else {
        setReady(true);
      }
    });
  }, [router]);

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
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
          <Link href="/admin" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/listings" className="hover:text-primary">Listings</Link>
          <span>/</span>
          <span className="text-slate-700">New listing</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Add New Listing</h1>
        <ListingForm tenantId={tenant?.id ?? ""} />
      </main>
    </>
  );
}
