import { NextRequest, NextResponse } from "next/server";

// GET /api/geocode?q=Bole+Addis+Ababa
// Proxy to Nominatim so we don't expose user IPs and can cache server-side
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ results: [] });

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=et`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Habino/1.0 (habino.app)" },
    next: { revalidate: 3600 }, // cache 1h
  });

  if (!res.ok) return NextResponse.json({ results: [] });

  const data = await res.json();
  const results = (data as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: { suburb?: string; neighbourhood?: string; city?: string; town?: string; county?: string };
  }>).map(item => ({
    label:        item.display_name,
    neighbourhood: item.address?.suburb ?? item.address?.neighbourhood ?? null,
    city:         item.address?.city ?? item.address?.town ?? item.address?.county ?? null,
    lat:          parseFloat(item.lat),
    lng:          parseFloat(item.lon),
  }));

  return NextResponse.json({ results });
}
