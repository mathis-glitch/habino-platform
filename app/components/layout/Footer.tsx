"use client";

import Link from "next/link";
import { useTenant } from "@/app/tenant-provider";

export default function Footer() {
  const { tenant } = useTenant();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg mb-2">
              {tenant?.name || "Habino"}
            </p>
            {tenant?.tagline && (
              <p className="text-sm">{tenant.tagline}</p>
            )}
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Explore</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/?type=buy"  className="hover:text-white transition-colors">Properties for Sale</Link>
              <Link href="/?type=rent" className="hover:text-white transition-colors">Properties for Rent</Link>
              <Link href="/market"     className="hover:text-white transition-colors">Market Insights</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Contact</p>
            <div className="flex flex-col gap-2 text-sm">
              {tenant?.contact_email && (
                <a href={`mailto:${tenant.contact_email}`} className="hover:text-white transition-colors">
                  {tenant.contact_email}
                </a>
              )}
              {tenant?.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
          <p>© {year} {tenant?.name || "Habino"}. All rights reserved.</p>
          <p>
            Powered by{" "}
            <a href="https://habino.app" className="hover:text-white transition-colors">
              Habino
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
