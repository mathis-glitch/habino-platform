"use client";

import Link from "next/link";
import { useTenant } from "@/app/tenant-provider";

export default function Footer() {
  const { tenant } = useTenant();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {tenant?.name || "Habino"}</p>
        <div className="flex items-center gap-4">
          {tenant?.contact_email && (
            <a href={`mailto:${tenant.contact_email}`} className="hover:text-slate-600 transition-colors">
              {tenant.contact_email}
            </a>
          )}
          {tenant?.whatsapp && (
            <a
              href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              WhatsApp
            </a>
          )}
          <Link href="/search" className="hover:text-slate-600 transition-colors">Alle Inserate</Link>
          <Link href="/markt" className="hover:text-slate-600 transition-colors">Marktbericht</Link>
        </div>
      </div>
    </footer>
  );
}
