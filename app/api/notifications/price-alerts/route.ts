/**
 * POST /api/notifications/price-alerts
 *
 * Finds saved properties whose price dropped since the last check,
 * then sends Expo push notifications to the users who saved them.
 *
 * Call this from a cron (Vercel Cron / GitHub Actions / Supabase pg_cron)
 * once or twice a day. Protected by CRON_SECRET header.
 *
 * Body: {} (no body needed — reads from DB)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to:    string;
  title: string;
  body:  string;
  data?: Record<string, string>;
  sound?: "default";
}

async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (!messages.length) return;
  // Expo recommends batches of max 100
  const batches: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) batches.push(messages.slice(i, i + 100));
  for (const batch of batches) {
    await fetch(EXPO_PUSH_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Accept-Encoding": "gzip, deflate" },
      body:    JSON.stringify(batch),
    });
  }
}

export async function POST(req: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  // Manual calls also accepted with x-cron-secret header
  const auth   = req.headers.get("authorization") ?? "";
  const secret = req.headers.get("x-cron-secret") ?? auth.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Find saved properties where current price < last_notified_price (or never notified)
  //    We store last_notified_price in saved_properties.notified_price
  const { data: savedRows } = await supabase
    .from("saved_properties")
    .select(`
      id,
      user_id,
      property_id,
      notified_price,
      properties!inner(id, title, price, currency, neighbourhood, city, status)
    `)
    .eq("properties.status", "active");

  if (!savedRows?.length) return NextResponse.json({ sent: 0 });

  // Filter to rows where price dropped
  const dropped = savedRows.filter(row => {
    const current = (row as any).properties?.price;
    const prev    = row.notified_price;
    return current != null && (prev == null || current < prev);
  });

  if (!dropped.length) return NextResponse.json({ sent: 0 });

  // 2. Load push tokens for affected user_ids
  const userIds = [...new Set(dropped.map(r => r.user_id))];
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("user_id, token")
    .in("user_id", userIds);

  const tokenMap = new Map((tokens ?? []).map(t => [t.user_id, t.token]));

  // 3. Build push messages
  const messages: ExpoPushMessage[] = [];
  const updates: { id: string; notified_price: number }[] = [];

  for (const row of dropped) {
    const token = tokenMap.get(row.user_id);
    if (!token) continue;
    const prop = (row as any).properties;
    const priceFmt = prop.currency === "ETB"
      ? `ETB ${Number(prop.price).toLocaleString()}`
      : `${prop.currency} ${Number(prop.price).toLocaleString()}`;

    messages.push({
      to:    token,
      title: "Price drop on a saved property 🏘️",
      body:  `${prop.title ?? [prop.neighbourhood, prop.city].filter(Boolean).join(", ")} is now ${priceFmt}`,
      sound: "default",
      data:  { propertyId: prop.id },
    });

    updates.push({ id: row.id, notified_price: prop.price });
  }

  // 4. Send and record
  await sendExpoPush(messages);

  // Update notified_price so we don't re-alert unless price drops further
  for (const u of updates) {
    await supabase.from("saved_properties").update({ notified_price: u.notified_price }).eq("id", u.id);
  }

  return NextResponse.json({ sent: messages.length, checked: savedRows.length });
}
