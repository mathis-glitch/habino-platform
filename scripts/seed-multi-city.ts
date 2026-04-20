/**
 * seed-multi-city.ts
 * ──────────────────
 * Seeds listings, brokers, and service providers for Nairobi and Dar es Salaam.
 * (Addis Ababa data already exists from seed-addis.ts)
 *
 * Usage:
 *   npx tsx scripts/seed-multi-city.ts
 *   npx tsx scripts/seed-multi-city.ts --city=Nairobi
 *   npx tsx scripts/seed-multi-city.ts --city="Dar es Salaam"
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── City configurations ─────────────────────────────────────────────────────────

interface CityConf {
  name: string;
  country: string;
  countryCode: string;
  currency: string;
  fxToUSD: number; // 1 USD = X local currency
  districts: Array<{ name: string; lat: number; lng: number }>;
  brokerNames: string[];
  agencyNames: string[];
  serviceNames: Record<string, string[]>;
  languages: string[];
  phonePrefix: string;
}

const NAIROBI: CityConf = {
  name: "Nairobi",
  country: "Kenya",
  countryCode: "KE",
  currency: "KES",
  fxToUSD: 129,
  districts: [
    { name: "Westlands", lat: -1.2673, lng: 36.8117 },
    { name: "Karen", lat: -1.3228, lng: 36.7117 },
    { name: "Kilimani", lat: -1.2894, lng: 36.7856 },
    { name: "Lavington", lat: -1.2797, lng: 36.7711 },
    { name: "Langata", lat: -1.3511, lng: 36.7444 },
    { name: "Kileleshwa", lat: -1.2783, lng: 36.7878 },
    { name: "Runda", lat: -1.2183, lng: 36.8200 },
    { name: "Muthaiga", lat: -1.2494, lng: 36.8344 },
    { name: "Parklands", lat: -1.2617, lng: 36.8183 },
    { name: "Upper Hill", lat: -1.2981, lng: 36.8117 },
    { name: "CBD", lat: -1.2864, lng: 36.8233 },
    { name: "South B", lat: -1.3092, lng: 36.8378 },
    { name: "South C", lat: -1.3183, lng: 36.8256 },
    { name: "Kasarani", lat: -1.2211, lng: 36.8978 },
    { name: "Ruaka", lat: -1.2078, lng: 36.7806 },
    { name: "Gigiri", lat: -1.2356, lng: 36.8089 },
    { name: "Hurlingham", lat: -1.2939, lng: 36.7939 },
    { name: "Embakasi", lat: -1.3150, lng: 36.8944 },
    { name: "Syokimau", lat: -1.3756, lng: 36.9417 },
    { name: "Riverside", lat: -1.2767, lng: 36.8044 },
  ],
  brokerNames: [
    "James Mwangi", "Grace Wanjiku", "Peter Ochieng", "Faith Njeri", "David Kamau",
    "Mercy Akinyi", "John Kariuki", "Sarah Wambui", "Michael Otieno", "Lucy Wairimu",
    "Samuel Kiptoo", "Agnes Nyambura", "Daniel Mutua", "Mary Wangari", "Joseph Ogutu",
    "Catherine Muthoni", "Patrick Kiprono", "Ann Njoki", "George Ndungu", "Rose Chebet",
  ],
  agencyNames: [
    "Nairobi Prime Realty", "Karen Hills Properties", "Westlands Property Group",
    "Kilimani Estates", "Runda Real Estate", "Gigiri Property Advisors",
    "Parklands Homes", "Upper Hill Realtors", "Kasarani Property Hub",
    "Lavington Property Partners",
  ],
  serviceNames: {
    cleaning: ["Sparkle Clean Nairobi", "Fresh House Services", "Mama Fua Premium"],
    garden: ["Green Thumb Kenya", "Nairobi Garden Care", "Eden Landscaping"],
    plumbing: ["Fix It Plumbing", "Nairobi Pipes & Drains", "WaterWorks KE"],
    electric: ["PowerFix Electricians", "Bright Light Solutions", "Voltage Masters"],
    moving: ["Movers Kenya", "Easy Move Nairobi", "Swift Logistics"],
    security: ["SafeHome Kenya", "GuardForce Nairobi", "Sentinel Security"],
    painting: ["Colour Masters", "Pro Paint Kenya", "Brush & Roll"],
    ac: ["CoolTech Nairobi", "AC Masters Kenya", "Climate Control"],
    legal: ["LegalEase Kenya", "Property Law Associates", "Deed & Title Services"],
    it: ["TechFix Nairobi", "Digital Solutions KE", "Smart Home Installations"],
  },
  languages: ["English", "Swahili"],
  phonePrefix: "+2547",
};

const DAR: CityConf = {
  name: "Dar es Salaam",
  country: "Tanzania",
  countryCode: "TZ",
  currency: "TZS",
  fxToUSD: 2650,
  districts: [
    { name: "Masaki", lat: -6.7494, lng: 39.2756 },
    { name: "Oyster Bay", lat: -6.7544, lng: 39.2656 },
    { name: "Mikocheni", lat: -6.7656, lng: 39.2544 },
    { name: "Msasani", lat: -6.7533, lng: 39.2617 },
    { name: "Kariakoo", lat: -6.8178, lng: 39.2744 },
    { name: "Kinondoni", lat: -6.7744, lng: 39.2428 },
    { name: "Sinza", lat: -6.7828, lng: 39.2350 },
    { name: "Ubungo", lat: -6.7928, lng: 39.2094 },
    { name: "Mwenge", lat: -6.7711, lng: 39.2250 },
    { name: "Tegeta", lat: -6.6778, lng: 39.2339 },
    { name: "Mbezi Beach", lat: -6.6917, lng: 39.2161 },
    { name: "Ilala", lat: -6.8267, lng: 39.2567 },
    { name: "Temeke", lat: -6.8611, lng: 39.2667 },
    { name: "Upanga", lat: -6.8050, lng: 39.2844 },
    { name: "Kunduchi", lat: -6.6700, lng: 39.2150 },
    { name: "City Centre", lat: -6.8133, lng: 39.2889 },
    { name: "Kawe", lat: -6.7350, lng: 39.2367 },
    { name: "Kimara", lat: -6.7900, lng: 39.1894 },
  ],
  brokerNames: [
    "Hassan Mwinyi", "Amina Saleh", "Joseph Massawe", "Rehema Said", "Emmanuel Shirima",
    "Zainab Mohamed", "Charles Mbwana", "Fatima Rashid", "Robert Kisanga", "Halima Juma",
    "Frank Mwakasege", "Saida Abbas", "Patrick Mwakyembe", "Neema Mushi", "George Kapinga",
    "Mariam Kileo", "Oscar Mhando", "Stella Kamara", "Ibrahim Seleman", "Happiness Mwita",
  ],
  agencyNames: [
    "Dar Property Hub", "Masaki Real Estate", "Oyster Bay Realtors",
    "Mikocheni Homes", "Peninsula Property Group", "Harbour City Estates",
    "Msasani Property Partners", "Upanga Real Estate", "Tegeta Properties",
    "Dar Luxury Living",
  ],
  serviceNames: {
    cleaning: ["Safi Clean Dar", "Bright Home Services", "Mama Clean TZ"],
    garden: ["Green Gardens Dar", "Tanzania Landscaping", "Tropical Garden Care"],
    plumbing: ["Dar Plumbing Solutions", "WaterFix TZ", "Flow Masters"],
    electric: ["PowerTech Dar", "ElectroFix Tanzania", "Bright Wires"],
    moving: ["Dar Movers", "SafeShift Tanzania", "Quick Move TZ"],
    security: ["SecureHome Dar", "Guardian Security TZ", "SafePoint"],
    painting: ["Paint Pro Dar", "Colour Experts TZ", "Brush Masters"],
    ac: ["CoolAir Dar", "AC Fix Tanzania", "Tropical Climate Tech"],
    legal: ["Dar Legal Services", "TZ Property Law", "Land Rights Associates"],
    it: ["TechHub Dar", "Digital Fix TZ", "Smart Systems Tanzania"],
  },
  languages: ["Swahili", "English"],
  phonePrefix: "+2557",
};

// ── Property types & pricing ────────────────────────────────────────────────────

const PROPERTY_TYPES = ["apartment","house","villa","office","commercial","land","plot","hall","production"] as const;
type PropType = typeof PROPERTY_TYPES[number];

const TYPE_WEIGHTS: Record<PropType, number> = {
  apartment: 35, house: 20, villa: 8, office: 14,
  commercial: 8, land: 6, plot: 4, hall: 3, production: 2,
};

const TITLES: Record<PropType, (beds: number, area: number, nb: string) => string> = {
  apartment: (b,a,nb) => `${b > 0 ? b+"-bedroom " : ""}apartment in ${nb}${a ? ` · ${a} m²` : ""}`,
  house:     (b,a,nb) => `${b > 0 ? b+"-bed " : ""}family home in ${nb}${a ? ` · ${a} m²` : ""}`,
  villa:     (b,a,nb) => `Luxury ${b > 0 ? b+"-bedroom " : ""}villa in ${nb}${a ? ` · ${a} m²` : ""}`,
  office:    (_,a,nb) => `Office space in ${nb}${a ? ` — ${a} m²` : ""}`,
  commercial:(_,a,nb) => `Commercial unit in ${nb}${a ? ` — ${a} m²` : ""}`,
  land:      (_,a,nb) => `Land plot in ${nb}${a ? ` — ${a} m²` : ""}`,
  plot:      (_,a,nb) => `Residential plot in ${nb}${a ? ` — ${a} m²` : ""}`,
  hall:      (_,a,nb) => `Event hall in ${nb}${a ? ` — ${a} m²` : ""}`,
  production:(_,a,nb) => `Warehouse in ${nb}${a ? ` — ${a} m²` : ""}`,
};

const DESCS: Record<PropType, string[]> = {
  apartment: [
    "Modern apartment with open-plan living area, full kitchen, and secure parking.",
    "Well-maintained unit with city views, fibre internet, and 24/7 security.",
    "Recently renovated apartment in a prime location with excellent amenities.",
  ],
  house: [
    "Spacious family home with a private garden, modern kitchen, and ample parking.",
    "Beautifully designed house in a quiet residential neighbourhood.",
    "Well-built home with rooftop terrace, servant quarters, and CCTV.",
  ],
  villa: [
    "Stunning luxury villa with swimming pool, landscaped garden, and panoramic views.",
    "Executive villa in an exclusive neighbourhood with 24-hour security.",
  ],
  office: [
    "Professional office space with fibre connectivity, AC, and shared reception.",
    "Open-plan office in a modern business hub with ample parking.",
  ],
  commercial: [
    "Prime commercial space on a busy road with excellent foot traffic.",
    "Versatile retail unit suitable for shops, restaurants, or service businesses.",
  ],
  land: [
    "Well-located plot with clean title deed, ideal for residential development.",
    "Flat, accessible land parcel near major infrastructure.",
  ],
  plot: [
    "Residential plot in a developing neighbourhood with road access and utilities.",
  ],
  hall: [
    "Versatile event space with modern amenities, perfect for conferences and celebrations.",
  ],
  production: [
    "Industrial warehouse with high ceilings, loading bay, and three-phase power.",
  ],
};

// Price bases in USD
const PRICE_BASES: Record<PropType, [number, number]> = {
  apartment:  [80_000,   800],
  house:      [120_000, 1200],
  villa:      [350_000, 3000],
  office:     [60_000,   600],
  commercial: [50_000,   500],
  land:       [40_000,     0],
  plot:       [30_000,     0],
  hall:       [100_000, 1500],
  production: [80_000,   800],
};

function getSpecs(type: PropType): { bedrooms: number; bathrooms: number; area_sqm: number } {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  switch (type) {
    case "apartment":  return { bedrooms: rand(1,4), bathrooms: rand(1,2), area_sqm: rand(40,160) };
    case "house":      return { bedrooms: rand(2,5), bathrooms: rand(1,3), area_sqm: rand(100,350) };
    case "villa":      return { bedrooms: rand(3,6), bathrooms: rand(2,5), area_sqm: rand(200,800) };
    case "office":     return { bedrooms: 0, bathrooms: rand(1,3), area_sqm: rand(30,500) };
    case "commercial": return { bedrooms: 0, bathrooms: rand(1,2), area_sqm: rand(20,400) };
    case "land":       return { bedrooms: 0, bathrooms: 0, area_sqm: rand(200,5000) };
    case "plot":       return { bedrooms: 0, bathrooms: 0, area_sqm: rand(150,2000) };
    case "hall":       return { bedrooms: 0, bathrooms: rand(2,4), area_sqm: rand(100,1000) };
    case "production": return { bedrooms: 0, bathrooms: rand(1,2), area_sqm: rand(200,3000) };
  }
}

function getPrice(type: PropType, listingType: "buy" | "rent", fx: number): number {
  const [buyBase, rentBase] = PRICE_BASES[type];
  const base = listingType === "buy" ? buyBase : rentBase;
  if (base === 0) return 0; // land/plots can't be rented
  const jitter = 0.5 + Math.random() * 1.0;
  const raw = base * jitter * fx;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / mag) * mag;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(): PropType {
  const total = Object.values(TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [type, weight] of Object.entries(TYPE_WEIGHTS)) {
    r -= weight;
    if (r <= 0) return type as PropType;
  }
  return "apartment";
}

const PHOTOS: Record<string, string[]> = {
  apartment: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
  ],
  house: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
  ],
  villa: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
  ],
  office: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=500&fit=crop",
  ],
};

// ── Service provider categories ─────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  "cleaning", "garden", "plumbing", "electric", "moving",
  "security", "painting", "ac", "legal", "it",
];

const SERVICE_TAGS: Record<string, string[]> = {
  cleaning: ["Deep clean", "Move-in/out", "Office cleaning", "Window wash"],
  garden: ["Lawn care", "Tree trimming", "Landscaping", "Irrigation"],
  plumbing: ["Leak repair", "Pipe installation", "Drain clearing", "Water heater"],
  electric: ["Wiring", "Generator", "Solar panel", "Light fixtures"],
  moving: ["Packing", "Furniture assembly", "Storage", "Cross-city"],
  security: ["CCTV install", "Alarm systems", "Guard service", "Access control"],
  painting: ["Interior", "Exterior", "Waterproofing", "Decorative"],
  ac: ["AC install", "AC repair", "Fridge repair", "Appliance service"],
  legal: ["Title search", "Contract review", "Land dispute", "Registration"],
  it: ["WiFi setup", "Smart home", "CCTV networking", "Computer repair"],
};

const AVATAR_URLS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=96&h=96&fit=crop&crop=faces",
];

// ══════════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════

async function seedListings(tenantId: string, city: CityConf, count = 2000) {
  console.log(`\n── Seeding ${count} listings for ${city.name} ──`);

  const batch: Record<string, unknown>[] = [];

  for (let i = 0; i < count; i++) {
    const type = weightedPick();
    const listingType = (type === "land" || type === "plot") ? "buy" : (Math.random() < 0.42 ? "rent" : "buy");
    const specs = getSpecs(type);
    const price = getPrice(type, listingType, city.fxToUSD);
    if (price === 0) continue;

    const district = pick(city.districts);
    const agent = pick(city.brokerNames);
    const lat = district.lat + (Math.random() - 0.5) * 0.012;
    const lng = district.lng + (Math.random() - 0.5) * 0.012;

    batch.push({
      tenant_id: tenantId,
      title: TITLES[type](specs.bedrooms, specs.area_sqm, district.name),
      description: pick(DESCS[type]),
      listing_type: listingType,
      property_type: type,
      price,
      currency: city.currency,
      bedrooms: specs.bedrooms,
      bathrooms: specs.bathrooms,
      area_sqm: specs.area_sqm,
      city: city.name,
      neighbourhood: district.name,
      address: `${district.name}, ${city.name}, ${city.country}`,
      agent_name: agent,
      agent_email: `${agent.toLowerCase().replace(/ /g, ".")}@habino.app`,
      status: "active",
      lat, lng,
    });

    // Batch insert every 250
    if (batch.length >= 250) {
      const { error } = await sb.from("properties").insert(batch);
      if (error) console.error(`  Insert error: ${error.message}`);
      else process.stdout.write(".");
      batch.length = 0;
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    const { error } = await sb.from("properties").insert(batch);
    if (error) console.error(`  Insert error: ${error.message}`);
  }
  console.log(`\n  Done: ~${count} listings`);

  // Update city_listing_counts
  const { count: listingCount } = await sb
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("city", city.name);

  await sb.from("city_listing_counts").upsert({
    tenant_id: tenantId,
    city: city.name,
    country: city.country,
    lat: city.districts[0].lat,
    lng: city.districts[0].lng,
    listing_count: listingCount ?? count,
  }, { onConflict: "tenant_id,city,country" });
}

async function seedImages(tenantId: string, cityName: string) {
  console.log(`\n── Seeding images for ${cityName} ──`);

  const { data: props, error } = await sb
    .from("properties")
    .select("id, property_type")
    .eq("tenant_id", tenantId)
    .eq("city", cityName)
    .is("id", null) // trick: get IDs without images
    .limit(0);

  // Get all property IDs for this city
  const { data: allProps } = await sb
    .from("properties")
    .select("id, property_type")
    .eq("tenant_id", tenantId)
    .eq("city", cityName);

  if (!allProps?.length) { console.log("  No properties found"); return; }

  // Check which already have images
  const propIds = allProps.map(p => p.id);
  const { data: existing } = await sb
    .from("property_images")
    .select("property_id")
    .in("property_id", propIds.slice(0, 1000));

  const existingSet = new Set((existing ?? []).map(e => e.property_id));
  const needImages = allProps.filter(p => !existingSet.has(p.id));

  console.log(`  ${needImages.length} properties need images`);

  const imgBatch: Record<string, unknown>[] = [];
  for (const p of needImages) {
    const photos = PHOTOS[p.property_type] ?? PHOTOS.apartment;
    for (let i = 0; i < photos.length; i++) {
      imgBatch.push({ property_id: p.id, url: photos[i], sort_order: i });
    }
    if (imgBatch.length >= 500) {
      await sb.from("property_images").insert(imgBatch);
      process.stdout.write(".");
      imgBatch.length = 0;
    }
  }
  if (imgBatch.length > 0) {
    await sb.from("property_images").insert(imgBatch);
  }
  console.log(`\n  Done`);
}

async function seedBrokers(tenantId: string, city: CityConf) {
  console.log(`\n── Seeding brokers for ${city.name} ──`);

  const brokers = city.brokerNames.map((name, i) => {
    const districts = Array.from({ length: 3 }, () => pick(city.districts).name);
    const phone = `${city.phonePrefix}${String(Math.floor(Math.random() * 90000000 + 10000000))}`;
    return {
      tenant_id: tenantId,
      full_name: name,
      email: `${name.toLowerCase().replace(/ /g, ".")}@habino.app`,
      phone,
      whatsapp: phone,
      avatar_url: AVATAR_URLS[i % AVATAR_URLS.length],
      bio: `Experienced real estate professional specializing in properties across ${city.name}. Dedicated to helping clients find their perfect home.`,
      agency: city.agencyNames[i % city.agencyNames.length],
      speciality: pick([["residential"], ["residential", "commercial"], ["commercial", "villa"], ["residential", "land"]]),
      districts: [...new Set(districts)],
      languages: city.languages,
      verified: i % 5 !== 0,
      verified_score: 60 + Math.floor(Math.random() * 35),
      listings_count: Math.floor(Math.random() * 40) + 2,
      rating: Number((3.5 + (i % 16) * 0.1).toFixed(2)),
      reviews_count: Math.floor(Math.random() * 80) + 3,
      years_exp: Math.floor(Math.random() * 14) + 1,
      verification_status: i % 5 !== 0 ? "verified" : "unverified",
    };
  });

  const { error } = await sb.from("broker_profiles").insert(brokers);
  if (error) console.error(`  Error: ${error.message}`);
  else console.log(`  ${brokers.length} brokers seeded`);
}

async function seedServices(tenantId: string, city: CityConf) {
  console.log(`\n── Seeding service providers for ${city.name} ──`);

  const providers: Record<string, unknown>[] = [];

  for (const cat of SERVICE_CATEGORIES) {
    const names = city.serviceNames[cat] ?? [`${cat} Services`];
    for (let i = 0; i < 5; i++) {
      const name = i < names.length ? names[i] : `${pick(names)} ${pick(["Plus", "Pro", "Express", "Premium"])}`;
      const contactName = pick(city.brokerNames);
      const phone = `${city.phonePrefix}${String(Math.floor(Math.random() * 90000000 + 10000000))}`;
      const district = pick(city.districts);
      const priceFrom = Math.round((300 + Math.random() * 4700) * city.fxToUSD / 130); // normalize to ~ETB scale

      providers.push({
        tenant_id: tenantId,
        category: cat,
        name,
        contact_name: contactName,
        phone,
        whatsapp: phone,
        email: `${name.toLowerCase().replace(/ /g, ".").replace(/[^a-z.]/g, "")}@gmail.com`,
        address: `${district.name}, ${city.name}`,
        district: district.name,
        description: `Professional ${cat} services in ${city.name}. Serving ${district.name} and surrounding areas.`,
        price_from: priceFrom,
        currency: city.currency,
        price_unit: pick(["session", "hour", "day", "job"]),
        service_areas: Array.from({ length: 3 }, () => pick(city.districts).name),
        working_hours: "Mon–Sat 8:00–18:00",
        response_time: pick(["< 1 hour", "< 2 hours", "Same day", "< 4 hours"]),
        languages: city.languages,
        team_size: pick(["Solo operator", "2–5 staff", "5–10 staff", "10+ staff"]),
        founded_year: String(2015 + Math.floor(Math.random() * 10)),
        tags: (SERVICE_TAGS[cat] ?? []).slice(0, 3),
        highlights: pick([
          ["Background-checked", "Insured"],
          ["Licensed", "5+ years experience"],
          ["Satisfaction guarantee", "Free estimate"],
        ]),
        photo_url: AVATAR_URLS[i % AVATAR_URLS.length],
        rating: Number((3.5 + Math.random() * 1.5).toFixed(2)),
        reviews_count: Math.floor(Math.random() * 100) + 5,
        verified: Math.random() > 0.25,
        status: "active",
      });
    }
  }

  const { error } = await sb.from("service_providers").insert(providers);
  if (error) console.error(`  Error: ${error.message}`);
  else console.log(`  ${providers.length} service providers seeded`);
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cityArg = args.find(a => a.startsWith("--city="))?.split("=")[1];

  // Get tenant
  const { data: tenant } = await sb
    .from("tenants")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!tenant) { console.error("No active tenant"); process.exit(1); }
  console.log(`Tenant: ${tenant.id}`);

  const ALL_CITIES = [NAIROBI, DAR];
  const targets = cityArg
    ? ALL_CITIES.filter(c => c.name.toLowerCase() === cityArg.toLowerCase())
    : ALL_CITIES;

  if (targets.length === 0) {
    console.error(`City "${cityArg}" not found. Available: ${ALL_CITIES.map(c => c.name).join(", ")}`);
    process.exit(1);
  }

  for (const city of targets) {
    console.log(`\n══════ ${city.name.toUpperCase()} ══════`);
    await seedListings(tenant.id, city, 2000);
    await seedImages(tenant.id, city.name);
    await seedBrokers(tenant.id, city);
    await seedServices(tenant.id, city);
  }

  console.log("\n\nAll done!");
}

main();
