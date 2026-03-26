/**
 * Habino — Addis Ababa Seed Script
 * Generates ~5 000 realistic property listings across all Addis Ababa neighbourhoods.
 *
 * Usage:
 *   npx tsx scripts/seed-addis.ts
 *
 * Before running:
 *   1. TRUNCATE TABLE properties RESTART IDENTITY CASCADE;  (Supabase SQL Editor)
 *   2. TRUNCATE TABLE city_listing_counts RESTART IDENTITY CASCADE;
 *   3. npx tsx scripts/seed-addis.ts
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL    || "https://ikubxgsptautubecukoi.supabase.co";
const SUPABASE_SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY   || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdWJ4Z3NwdGF1dHViZWN1a29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc2ODE2NiwiZXhwIjoyMDg5MzQ0MTY2fQ.c6hUfJODHj9smszXQSfUOU55thu3TNs39bWTksfTPxs";
const BATCH_SIZE      = 250;
const TARGET_TOTAL    = 5_000;

const sb = createClient(SUPABASE_URL, SUPABASE_SR_KEY);

// ── Addis Ababa definition ─────────────────────────────────────────────────────
const ADDIS = {
  city:    "Addis Ababa",
  country: "Ethiopia",
  lat:     9.0192,
  lng:     38.7525,
  currency: "ETB",
  priceIndex: 4,
};

/**
 * Real GPS centre-points for every Addis Ababa neighbourhood.
 * These match the CITY_COORDS lookup in MapHomePage.tsx exactly so that
 * seeded pins appear inside the correct neighbourhood on the map.
 *
 * Jitter radius added at generation time: ±0.008° lat/lng ≈ ±500 m
 * — keeps listings visually spread within each neighbourhood without
 * ever drifting into the wrong area.
 */
const NB_COORDS: Record<string, [number, number]> = {
  // ── Core / central ──────────────────────────────────────────────────────────
  "Kazanchis":        [9.0200, 38.7557],
  "Kirkos":           [9.0050, 38.7700],
  "Arada":            [9.0368, 38.7480],
  "Addis Ketema":     [9.0310, 38.7300],
  "Mexico":           [9.0155, 38.7486],
  "Stadium":          [9.0230, 38.7560],
  "Hayahulet":        [9.0130, 38.7520],
  "Kera":             [9.0030, 38.7480],
  "Tor Hailoch":      [9.0010, 38.7350],

  // ── Bole / south-east ───────────────────────────────────────────────────────
  "Bole":             [8.9935, 38.7986],
  "Bole Atlas":       [9.0010, 38.7870],
  "Bole Medhanialem": [9.0070, 38.7790],
  "Old Airport":      [8.9895, 38.7795],
  "Summit":           [9.0050, 38.8010],
  "Urael":            [9.0150, 38.7750],
  "Gerji":            [9.0107, 38.8200],
  "Saris":            [8.9780, 38.7750],

  // ── North / north-east ──────────────────────────────────────────────────────
  "Piassa":           [9.0355, 38.7543],
  "Arat Kilo":        [9.0414, 38.7542],
  "Sidist Kilo":      [9.0486, 38.7634],
  "Megenagna":        [9.0296, 38.7869],
  "Aware":            [9.0380, 38.7980],
  "Lamberet":         [9.0680, 38.7950],
  "CMC":              [9.0562, 38.7864],
  "CMC Michael":      [9.0500, 38.7900],
  "Ayat":             [9.0411, 38.8352],
  "Yeka":             [9.0600, 38.8100],

  // ── North-west ──────────────────────────────────────────────────────────────
  "Merkato":          [9.0271, 38.7352],
  "Addis Ketema NW":  [9.0310, 38.7300],
  "Gulele":           [9.0780, 38.7400],
  "Gullele":          [9.0780, 38.7400],

  // ── West ────────────────────────────────────────────────────────────────────
  "Lideta":           [9.0117, 38.7394],
  "Kolfe":            [9.0200, 38.6900],
  "Kolfe Keranio":    [9.0200, 38.6900],

  // ── South / south-west ──────────────────────────────────────────────────────
  "Sarbet":           [8.9973, 38.7561],
  "Sar Bet":          [8.9973, 38.7561],
  "Nifas Silk-Lafto": [8.9720, 38.7400],
  "Nifas Silk":       [8.9720, 38.7400],
  "Lafto":            [8.9600, 38.7300],
  "Gofa":             [8.9780, 38.7150],
  "Jemo":             [8.9620, 38.7050],
  "Lebu":             [8.9500, 38.7200],

  // ── Far south (Akaki) ────────────────────────────────────────────────────────
  "Akaki Kaliti":     [8.8900, 38.7900],
  "Akaki Kality":     [8.8900, 38.7900],
  "Akaki":            [8.8900, 38.7900],
  "Kality":           [8.8780, 38.7750],
};

/** Neighbourhoods used for seeding (all must exist in NB_COORDS above). */
const NEIGHBOURHOODS = [
  // Core / central
  "Kazanchis", "Kirkos", "Arada", "Addis Ketema", "Mexico", "Stadium", "Hayahulet",
  // Bole / south-east
  "Bole", "Bole Atlas", "Bole Medhanialem", "Old Airport", "Gerji", "Urael", "Saris",
  // North / north-east
  "Piassa", "Megenagna", "CMC", "CMC Michael", "Ayat", "Yeka",
  // North-west
  "Merkato", "Gullele",
  // West
  "Lideta", "Kolfe Keranio",
  // South / south-west
  "Sarbet", "Nifas Silk-Lafto", "Lafto", "Gofa", "Lebu",
  // Far south
  "Akaki Kaliti",
];

// ── Property types ────────────────────────────────────────────────────────────
const PROPERTY_TYPES = ["apartment","house","villa","office","commercial","land","plot","hall","production"] as const;
type PropType = typeof PROPERTY_TYPES[number];

const TYPE_WEIGHTS: Record<PropType, number> = {
  apartment: 35, house: 20, villa: 8, office: 14,
  commercial: 8, land: 6, plot: 4, hall: 3, production: 2,
};

// ── Title templates ───────────────────────────────────────────────────────────
const TITLES: Record<PropType, (beds: number, area: number, nb: string) => string> = {
  apartment: (b,a,nb) => `${b > 0 ? b+"-bedroom " : ""}apartment in ${nb}${a ? ` · ${a} m²` : ""}`,
  house:     (b,a,nb) => `${b > 0 ? b+"-bed " : ""}family home in ${nb}${a ? ` · ${a} m²` : ""}`,
  villa:     (b,a,nb) => `Luxury ${b > 0 ? b+"-bedroom " : ""}villa in ${nb}${a ? ` · ${a} m²` : ""}`,
  office:    (_,a,nb) => `Office space in ${nb}${a ? ` — ${a} m²` : ""}`,
  commercial:(_,a,nb) => `Commercial unit in ${nb}${a ? ` — ${a} m²` : ""}`,
  land:      (_,a,nb) => `Land plot in ${nb}${a ? ` — ${a} m²` : ""}`,
  plot:      (_,a,nb) => `Residential plot in ${nb}${a ? ` — ${a} m²` : ""}`,
  hall:      (_,a,nb) => `Event hall / conference space in ${nb}${a ? ` — ${a} m²` : ""}`,
  production:(_,a,nb) => `Warehouse / production unit in ${nb}${a ? ` — ${a} m²` : ""}`,
};

// ── Description templates ─────────────────────────────────────────────────────
const DESCS: Record<PropType, string[]> = {
  apartment: [
    "Modern apartment with open-plan living area, full kitchen, and secure parking.",
    "Well-maintained unit with city views, fibre internet, and 24/7 security.",
    "Spacious apartment in a prime location with access to gym and swimming pool.",
    "Recently renovated flat with bright interiors, close to shopping and transport.",
    "Newly built apartment with high-quality finishes, backup generator, and elevator.",
    "Furnished apartment in a quiet compound with garden and guard service.",
  ],
  house: [
    "Spacious family home with landscaped garden, staff quarters, and double garage.",
    "Detached house with three reception rooms, modern kitchen, and rear garden.",
    "Corner plot home with open plan living, high-spec kitchen, and private driveway.",
    "Well-established residential property with large outdoor entertaining area.",
    "Traditional compound house with multiple rooms, borehole, and fruit trees.",
  ],
  villa: [
    "Stunning luxury villa with private pool, landscaped gardens, and panoramic views.",
    "Executive villa with smart-home features, home cinema, and secure compound.",
    "Contemporary villa with open-plan design, chef's kitchen, and rooftop terrace.",
    "Elegant residence in gated estate, featuring en-suite bedrooms and home gym.",
  ],
  office: [
    "Grade-A office space in a prestigious Addis Ababa business district.",
    "Open-plan office suite with meeting rooms, reception area, and fibre internet.",
    "Flexible office floor in modern tower, ready for immediate occupation.",
    "Serviced office with shared facilities, 24/7 access, and dedicated parking.",
    "Corner office unit with good natural light, IT infrastructure, and generator backup.",
  ],
  commercial: [
    "Ground-floor retail unit with high foot traffic in a busy Addis commercial strip.",
    "Corner shop premises with large display windows, storage, and customer parking.",
    "Versatile commercial space suitable for retail, showroom, or clinic.",
    "Modern shop front with rear storage, recently refurbished to high standard.",
  ],
  land: [
    "Prime development land with all utilities connected and clear title.",
    "Serviced land in a fast-growing Addis Ababa suburb, ideal for residential development.",
    "Large plot with fertile soil, borehole, and road access on city outskirts.",
    "Commercial land in high-visibility location along main arterial road.",
  ],
  plot: [
    "Serviced residential plot ready to build, in a secure gated estate.",
    "Freehold plot with title deed, water and power connections available.",
    "Corner residential plot with good road frontage, ideal for a family home.",
    "Gated community plot with access to club house and round-the-clock security.",
  ],
  hall: [
    "Purpose-built event hall with catering facilities, parking, and air conditioning.",
    "Conference centre with divisible meeting rooms, AV equipment, and garden.",
    "Multi-purpose hall ideal for weddings, exhibitions, and corporate events.",
    "Modern event space with full kitchen, 300-person capacity, and ample parking.",
  ],
  production: [
    "Industrial warehouse with overhead crane, 3-phase power, and loading bays.",
    "Modern factory unit with office mezzanine, sprinkler system, and yard.",
    "Flexible production space with high eaves, roller-shutter access, and parking.",
    "Light industrial unit in well-managed estate, suitable for manufacturing or storage.",
  ],
};

// ── ETB pricing ────────────────────────────────────────────────────────────────
// ETB/USD ≈ 57 · priceIndex 4 → scale = 0.3 + (4/10)*1.7 = 0.98
function getPrice(type: PropType, listingType: "buy"|"rent"): number {
  const bases: Record<PropType, [number, number]> = {
    // [buyUSD, rentUSD/month]
    apartment:  [80_000,   800],
    house:      [120_000, 1200],
    villa:      [350_000, 3000],
    office:     [200_000, 1500],
    commercial: [150_000, 1200],
    land:       [60_000,    400],
    plot:       [40_000,    300],
    hall:       [300_000, 2500],
    production: [250_000, 2000],
  };
  const [buyBase, rentBase] = bases[type];
  const scale  = 0.3 + (ADDIS.priceIndex / 10) * 1.7; // 0.98
  const jitter = 0.6 + Math.random() * 0.8;            // ±40%
  const fx     = 57;                                    // ETB per USD
  const base   = listingType === "buy" ? buyBase : rentBase;
  const raw    = base * scale * jitter * fx;
  const mag    = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / mag) * mag;
}

// ── Specs by type ─────────────────────────────────────────────────────────────
function getSpecs(type: PropType): { bedrooms: number; bathrooms: number; area_sqm: number } {
  const r = () => Math.random();
  switch (type) {
    case "apartment":
      { const b = [1,2,2,2,3,3,4][Math.floor(r()*7)]; return { bedrooms:b, bathrooms:Math.max(1,Math.round(b*0.6)), area_sqm: 40+Math.round(r()*120) }; }
    case "house":
      { const b = [2,3,3,4,4,5][Math.floor(r()*6)]; return { bedrooms:b, bathrooms:Math.max(1,Math.round(b*0.7)), area_sqm: 100+Math.round(r()*250) }; }
    case "villa":
      { const b = [3,4,4,5,5,6][Math.floor(r()*6)]; return { bedrooms:b, bathrooms:Math.max(2,b-1), area_sqm: 200+Math.round(r()*600) }; }
    case "office":
      return { bedrooms:0, bathrooms:0, area_sqm: 50+Math.round(r()*800) };
    case "commercial":
      return { bedrooms:0, bathrooms:0, area_sqm: 30+Math.round(r()*500) };
    case "land":
      return { bedrooms:0, bathrooms:0, area_sqm: 500+Math.round(r()*9500) };
    case "plot":
      return { bedrooms:0, bathrooms:0, area_sqm: 200+Math.round(r()*2800) };
    case "hall":
      return { bedrooms:0, bathrooms:2+Math.floor(r()*4), area_sqm: 200+Math.round(r()*1500) };
    case "production":
      return { bedrooms:0, bathrooms:0, area_sqm: 300+Math.round(r()*5000) };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const total = Object.values<number>(weights).reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries<number>(weights)) {
    r -= w;
    if (r <= 0) return k as T;
  }
  return Object.keys(weights)[0] as T;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Agent names (Ethiopian & international) ────────────────────────────────────
const AGENT_NAMES = [
  "Abebe Girma","Tigist Haile","Dawit Bekele","Meron Tadesse","Samuel Alemu",
  "Hana Tesfaye","Yonas Kebede","Selam Wolde","Biruk Assefa","Tigist Mengistu",
  "Kidus Gebre","Almaz Tekeste","Fikadu Desta","Bethlehem Tsega","Abel Zegeye",
  "Liya Habtamu","Ermias Asfaw","Selamawit Berhane","Natnael Girma","Makda Tesfaye",
  "Henok Tadesse","Eden Haile","Robel Mengistu","Mihret Bekele","Eyob Alemu",
  // International agents also active in Addis
  "James Mwangi","Fatima Al-Hassan","David Osei","Sophie Müller","Carlos Rodrigues",
  "Priya Sharma","Ahmed Al-Rashid","Maria Santos","Grace Amoah","Amara Diallo",
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🇪🇹 Habino — Addis Ababa Seeder");
  console.log("────────────────────────────────");

  // 1. Get tenant ID
  const slugArg = process.argv.find(a => a.startsWith("--tenant="))?.split("=")[1]
    ?? process.env.SEED_TENANT_SLUG
    ?? process.env.NEXT_PUBLIC_DEV_TENANT_SLUG;

  const { data: tenants, error: tErr } = await sb
    .from("tenants")
    .select("id,name,slug")
    .limit(20);

  if (tErr || !tenants?.length) {
    console.error("❌ Could not fetch tenants:", tErr?.message);
    process.exit(1);
  }

  const tenant = slugArg
    ? tenants.find(t => t.slug === slugArg) ?? tenants[0]
    : tenants[0];

  if (slugArg && !tenants.find(t => t.slug === slugArg)) {
    console.warn(`⚠️  Tenant "${slugArg}" not found — using first tenant.`);
  }

  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${tenant.name} / ${tenant.slug} (${tenantId})`);

  // 2. Clear existing listings for this tenant
  const { count: existing } = await sb
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  console.log(`ℹ️  Existing listings: ${existing ?? 0}`);
  if (existing && existing > 0) {
    console.log("🗑️  Clearing old listings…");
    const { error: delErr } = await sb.from("properties").delete().eq("tenant_id", tenantId);
    if (delErr) console.error("  ⚠️  Delete warning:", delErr.message);
    else console.log("  ✅ Cleared.");
  }

  // 3. Generate listings
  console.log(`\n📍 Generating ${TARGET_TOTAL.toLocaleString()} Addis Ababa listings…`);
  console.log(`   Using real GPS coordinates for ${NEIGHBOURHOODS.length} neighbourhoods.`);

  let batch:         object[] = [];
  let totalInserted  = 0;
  let batchNum       = 0;

  async function flush() {
    if (!batch.length) return;
    batchNum++;
    let lastErr: string | null = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      const { error } = await sb.from("properties").insert(batch);
      if (!error) {
        totalInserted += batch.length;
        process.stdout.write(`\r  ✅ Inserted ${totalInserted.toLocaleString()} / ${TARGET_TOTAL.toLocaleString()} listings…`);
        lastErr = null;
        break;
      }
      lastErr = error.message;
      if (attempt < 4) await new Promise(r => setTimeout(r, 500 * attempt));
    }
    if (lastErr) console.error(`\n  ❌ Batch ${batchNum} failed:`, lastErr);
    batch = [];
  }

  for (let i = 0; i < TARGET_TOTAL; i++) {
    const type        = pickWeighted(TYPE_WEIGHTS);
    const listingType = Math.random() < 0.42 ? "buy" : "rent";
    const nb          = pick(NEIGHBOURHOODS);
    const specs       = getSpecs(type);
    const price       = getPrice(type, listingType);
    const desc        = pick(DESCS[type]);
    const agent       = pick(AGENT_NAMES);

    // Use the real GPS centre for this neighbourhood, then add a small jitter
    // so listings spread naturally within the area (±0.006° ≈ ±450 m).
    // This keeps every pin inside the correct neighbourhood boundary.
    const [nbLat, nbLng] = NB_COORDS[nb] ?? [ADDIS.lat, ADDIS.lng];
    const lat = nbLat + (Math.random() - 0.5) * 0.012;
    const lng = nbLng + (Math.random() - 0.5) * 0.012;

    batch.push({
      tenant_id:     tenantId,
      title:         TITLES[type](specs.bedrooms, specs.area_sqm, nb),
      description:   desc,
      listing_type:  listingType,
      property_type: type,
      price,
      currency:      ADDIS.currency,
      bedrooms:      specs.bedrooms,
      bathrooms:     specs.bathrooms,
      area_sqm:      specs.area_sqm,
      city:          ADDIS.city,
      neighbourhood: nb,
      address:       `${nb}, ${ADDIS.city}, ${ADDIS.country}`,
      agent_name:    agent,
      agent_email:   `${agent.toLowerCase().replace(" ", ".")}@habino.app`,
      status:        "active",
      lat,
      lng,
    });

    if (batch.length >= BATCH_SIZE) await flush();
  }

  await flush();

  // 4. Upsert city cluster row for Addis Ababa
  console.log(`\n\n🗺️  Updating city cluster table…`);
  const { error: clusterErr } = await sb
    .from("city_listing_counts")
    .upsert({
      tenant_id:     tenantId,
      city:          ADDIS.city,
      country:       ADDIS.country,
      lat:           ADDIS.lat,
      lng:           ADDIS.lng,
      listing_count: totalInserted,
    }, { onConflict: "tenant_id,city,country", ignoreDuplicates: false });

  if (clusterErr) {
    console.warn("  ⚠️  City cluster upsert warning:", clusterErr.message);
  } else {
    console.log(`  ✅ City cluster updated (${totalInserted.toLocaleString()} listings).`);
  }

  console.log(`\n🎉 Done! ${totalInserted.toLocaleString()} Addis Ababa listings seeded.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
