/**
 * seed-services.ts
 * Seeds 500 service providers into the service_providers table.
 *
 * Run: npx tsx scripts/seed-services.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Data pools ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "cleaning",  label: "Cleaning",          emoji: "🧹" },
  { key: "garden",    label: "Gardening",          emoji: "🌿" },
  { key: "household", label: "Household Help",     emoji: "🏠" },
  { key: "plumbing",  label: "Plumbing",           emoji: "🔧" },
  { key: "electric",  label: "Electrical",         emoji: "⚡" },
  { key: "moving",    label: "Moving & Delivery",  emoji: "📦" },
  { key: "security",  label: "Security",           emoji: "🔒" },
  { key: "painting",  label: "Painting",           emoji: "🎨" },
  { key: "ac",        label: "AC & Appliances",    emoji: "❄️" },
  { key: "petcare",   label: "Pet Care",           emoji: "🐾" },
  { key: "legal",     label: "Legal & Admin",      emoji: "⚖️" },
  { key: "it",        label: "IT & Tech",          emoji: "💻" },
];

const FIRST_NAMES = [
  "Yonas","Abel","Eyob","Henok","Meron","Liya","Ermias","Selamawit","Natnael","Makda",
  "Eden","Robel","Mihret","Dawit","Tigist","Selam","Biruk","Hana","Solomon","Kalkidan",
  "Bereket","Tsion","Tekle","Almaz","Girma","Yeshi","Tesfaye","Mekdes","Amanuel","Bethel",
  "Ahmed","Grace","James","Fatima","David","Sophie","Priya","Carlos","Maria","Amara",
  "Kidane","Meseret","Hailu","Worknesh","Teshome","Azeb","Mulugeta","Yewubdar","Fikadu","Senait",
];

const LAST_NAMES = [
  "Kebede","Zegeye","Alemu","Tadesse","Habtamu","Girma","Tesfaye","Bekele","Mekonen","Berhane",
  "Haile","Mengistu","Desta","Worku","Negash","Teshome","Asfaw","Getachew","Mulugeta","Wolde",
  "Assefa","Demeke","Legesse","Bogale","Hunegnaw","Tilahun","Yimer","Gizaw","Teklu","Mitiku",
  "Al-Rashid","Osei","Mwangi","Müller","Santos","Rodrigues","Al-Hassan","Diallo","Amoah","Sharma",
];

const DISTRICTS = [
  "Bole","CMC","Kazanchis","Sarbet","Piassa","Megenagna","Yeka","Gullele",
  "Kotebe","Lafto","Kirkos","Arada","Lideta","Nifas Silk","Kolfe",
];

const LANGUAGES_POOL = [
  ["Amharic","English"],
  ["Amharic","English","Oromo"],
  ["Amharic"],
  ["Amharic","English","Arabic"],
  ["English","Amharic"],
  ["Amharic","Tigrinya"],
];

const RESPONSE_TIMES = ["< 1 hour","< 2 hours","< 4 hours","Same day","Next day"];

const WORKING_HOURS_POOL = [
  "Mon–Sat 8:00–18:00",
  "Mon–Fri 8:00–17:00, Sat 8:00–13:00",
  "Mon–Sun 7:00–19:00",
  "Mon–Sat 7:00–20:00",
  "24/7",
  "24/7 emergency, regular Mon–Sat 8:00–18:00",
];

const TEAM_SIZES = [
  "Solo operator","2 staff","3–5 staff","5–10 staff","10+ staff","20+ staff",
];

const HIGHLIGHTS_POOL = [
  "Background-checked staff","Insured & bonded","Free consultation","Free first visit",
  "Eco-friendly products","Licensed & certified","24/7 availability","Emergency call-out",
  "1-year warranty","Free quote","Flexible hours","Monthly contracts available",
];

const AVATAR_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=96&h=96&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=96&h=96&fit=crop&crop=faces&auto=format",
];

// Per-category business name prefixes and service tags
const CATEGORY_DATA: Record<string, { prefixes: string[]; tags: string[][]; descriptions: string[] }> = {
  cleaning: {
    prefixes: ["Clean Pro","SparkleHouse","Fresh Start","EcoClean","Shine Addis","Pristine","Crystal","Diamond Clean"],
    tags: [["Deep clean","Office","Move-in/out"],["Weekly service","Home","Eco-friendly"],["Post-construction","Move-out","Disinfection"]],
    descriptions: [
      "Professional home and office cleaning with eco-friendly products. Our trained team delivers spotless results every visit.",
      "Specialising in deep cleaning and move-in/out services across Addis Ababa. Flexible scheduling, same-week booking.",
      "From weekly maintenance to post-construction cleanup, we handle every cleaning need with care and attention to detail.",
    ],
  },
  garden: {
    prefixes: ["GreenThumb","Bloom Garden","EcoLawn","Nature's Touch","Garden Masters","Leaf & Soil","Roots & Shoots"],
    tags: [["Lawn care","Planting","Design"],["Landscaping","Monthly maintenance"],["Irrigation","Tree pruning","Turf"]],
    descriptions: [
      "Expert garden design, regular maintenance, and landscaping across Addis Ababa. Bringing green spaces to life.",
      "Full-service gardening from lawn care to irrigation systems. We transform neglected gardens into beautiful outdoor spaces.",
      "Monthly maintenance packages available. Local plant expertise and water-efficient design for the Ethiopian climate.",
    ],
  },
  household: {
    prefixes: ["HomeHelp","Casa Care","Trusted Hands","Comfort Home","Daily Help","Family First"],
    tags: [["Cooking","Childcare","Daily help"],["Laundry","Shopping","Errands"],["Live-in","Part-time","Full-time"]],
    descriptions: [
      "Trusted household helpers for daily chores, cooking, and childcare assistance. All staff background-checked and vetted.",
      "From part-time to live-in household staff. We match reliable, trained workers to your family's needs.",
      "Flexible household help covering cooking, cleaning, childcare, and errands. Monthly and daily contracts available.",
    ],
  },
  plumbing: {
    prefixes: ["Addis Fix","FlowPro","PipeMaster","AquaTech","FastFlow","Water Works","Pipe Pro"],
    tags: [["Emergency","Installation","Repairs"],["Leak fix","Boiler","Drainage"],["24/7","Licensed","Certified"]],
    descriptions: [
      "Licensed plumbers for repairs, installations, and emergency call-outs city-wide. 1-year warranty on all work.",
      "Emergency and scheduled plumbing services. Water heaters, leak detection, pipe installation — we do it all.",
      "Certified plumbing team available 24/7 for emergencies. Fast response, fair pricing, guaranteed work.",
    ],
  },
  electric: {
    prefixes: ["Volta","PowerTech","BrightSpark","Amped","Circuit Pro","ElectroPro","Watt Masters"],
    tags: [["Wiring","Safety check","Generator"],["Solar install","Backup power"],["CCTV wiring","Smart home"]],
    descriptions: [
      "Certified electricians for wiring, installation, and safety inspections. Generator and solar panel installation available.",
      "From basic socket installation to full rewiring and generator hookup. Safety-certified, licensed, and insured.",
      "Smart home wiring, CCTV setup, and electrical safety audits. Fast turnaround, certified team.",
    ],
  },
  moving: {
    prefixes: ["Move It","SwiftMove","EasyMove","CityMovers","Carry Pro","Transport ET","Fast Move"],
    tags: [["Furniture","Packing","Same-day"],["Office relocation","Fragile items"],["Long-distance","Storage"]],
    descriptions: [
      "Professional moving and delivery services across all districts of Addis Ababa. 2 trucks available, same-day booking.",
      "Office and residential relocation specialists. Full packing service, fragile item care, and storage options.",
      "From single items to full house moves. Reliable, experienced movers with modern equipment and fair rates.",
    ],
  },
  security: {
    prefixes: ["ShieldGuard","SafeHouse","Fortress","Eagle Eye","Guardian","SecureNet","Watch Pro"],
    tags: [["CCTV","Guards","24/7"],["Armed & unarmed","Patrol"],["CCTV install","Alarm systems"]],
    descriptions: [
      "Trained security personnel and CCTV installation for homes and compounds. 24/7 monitoring available.",
      "Professional guard services with CCTV installation and alarm systems. Background-checked, uniformed staff.",
      "Residential and commercial security solutions. Monthly contracts, armed/unarmed options, alarm monitoring.",
    ],
  },
  painting: {
    prefixes: ["ColorMasters","PaintPro","Brush & Roll","Finish Line","Perfect Coat","Addis Paint","Hue Masters"],
    tags: [["Interior","Exterior","Consultation"],["Premium paints","Texture","Feature walls"],["Commercial","Residential","Spray"]],
    descriptions: [
      "Interior and exterior painting with premium paints. Free colour consultation. 2-year workmanship warranty.",
      "From feature walls to full exterior repaints. Our skilled painters deliver flawless results on every project.",
      "Commercial and residential painting. Surface preparation included, premium brands, colour matching service.",
    ],
  },
  ac: {
    prefixes: ["CoolTech","FrostPro","AirMasters","Chill Zone","ArcticAir","AC Pro ET","Cool Breeze"],
    tags: [["Installation","Repair","All brands"],["Annual maintenance","Cleaning"],["Commercial AC","VRF systems"]],
    descriptions: [
      "AC installation, servicing, and repair for all brands. Home and office. Free diagnosis on first visit.",
      "Specialised in split, cassette, and commercial AC systems. Annual maintenance plans available city-wide.",
      "Fast AC repair and installation. All major brands serviced. Spare parts in stock, same-day response.",
    ],
  },
  petcare: {
    prefixes: ["Paws & Care","Pet Friends","Happy Tails","Fur Family","Waggy","Pet Bliss","Animal Care ET"],
    tags: [["Dog walking","Pet sitting","Insured"],["Grooming","Vet transport"],["Home visits","Overnight stay"]],
    descriptions: [
      "Dog walking, pet sitting, and home visits while you're away. Insured, vet-partnered, photo updates sent daily.",
      "Professional pet care from qualified animal lovers. Walking, sitting, grooming, and emergency vet transport.",
      "We treat your pets like family. Daily walks, overnight sitting, and home visits. First visit free.",
    ],
  },
  legal: {
    prefixes: ["LexEthiopia","ContractPro","LegalEase","Notary Plus","Law Assist","Admin Pro","Document ET"],
    tags: [["Contracts","Notary","Apostille"],["Property docs","Title deed"],["Work permit","Visa assist"]],
    descriptions: [
      "Legal document preparation, notarisation, and property contract services. Fast turnaround, English and Amharic.",
      "Specialising in real estate contracts, title deeds, and notary services. Licensed professionals.",
      "Work permits, visa assistance, and administrative document services. We navigate the paperwork so you don't have to.",
    ],
  },
  it: {
    prefixes: ["TechFix","BytePro","NetSolve","IT Masters","DataSafe","CloudIT ET","Pixel Pro"],
    tags: [["Computer repair","Network","Support"],["CCTV","Smart home","WiFi"],["Data recovery","Virus removal"]],
    descriptions: [
      "On-site computer repair, network setup, and IT support for homes and businesses across Addis Ababa.",
      "WiFi network installation, CCTV setup, and smart home configuration. Fast response, affordable rates.",
      "Data recovery, virus removal, and hardware upgrades. Remote support available. All brands serviced.",
    ],
  },
};

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }
function rand(min: number, max: number, seed: number): number {
  return min + (Math.abs(seed) % (max - min + 1));
}
function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const shuffled = [...arr].sort((a, b) => (seed * arr.indexOf(a) - seed * arr.indexOf(b)));
  return shuffled.slice(0, n);
}

async function main() {
  // 1. Get tenant
  const { data: tenant } = await sb.from("tenants").select("id").eq("is_active", true).limit(1).single();
  if (!tenant) { console.error("No active tenant"); process.exit(1); }
  const tenantId = tenant.id;

  // 2. Clear existing service providers
  const { error: delErr } = await sb.from("service_providers").delete().eq("tenant_id", tenantId);
  if (delErr) {
    console.log("Note: service_providers table may not exist yet. Error:", delErr.message);
    console.log("Please run the following SQL in Supabase Dashboard:");
    console.log(`
CREATE TABLE IF NOT EXISTS public.service_providers (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE,
  category       text NOT NULL,
  name           text NOT NULL,
  contact_name   text,
  phone          text,
  whatsapp       text,
  email          text,
  address        text,
  district       text,
  description    text,
  price_from     numeric,
  currency       text DEFAULT 'ETB',
  price_unit     text DEFAULT 'session',
  service_areas  text[] DEFAULT '{}',
  working_hours  text,
  response_time  text,
  languages      text[] DEFAULT '{}',
  team_size      text,
  founded_year   text,
  tags           text[] DEFAULT '{}',
  highlights     text[] DEFAULT '{}',
  photo_url      text,
  rating         numeric(3,2) DEFAULT 4.5,
  reviews_count  int DEFAULT 0,
  verified       boolean DEFAULT false,
  status         text DEFAULT 'active',
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_providers_tenant_category ON service_providers(tenant_id, category);
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON service_providers FOR SELECT USING (true);
CREATE POLICY "service role all" ON service_providers USING (true) WITH CHECK (true);
    `);
    process.exit(1);
  }
  console.log("Cleared existing service providers.");

  // 3. Build 500 providers (spread across 12 categories, ~41 per category)
  const providers = Array.from({ length: 500 }, (_, i) => {
    const cat = CATEGORIES[i % CATEGORIES.length];
    const catData = CATEGORY_DATA[cat.key];
    const firstName = pick(FIRST_NAMES, i * 7 + 3);
    const lastName  = pick(LAST_NAMES,  i * 11 + 5);
    const fullName  = `${firstName} ${lastName}`;
    const businessSuffix = pick(catData.prefixes, i * 3 + 1);
    const businessName   = `${pick(["", firstName + "'s ", lastName + " "], i * 5 + 2)}${businessSuffix}`.trim();
    const phone = `+2519${String(10000000 + (i * 9337 + 12345) % 90000000).padStart(8, "0")}`;
    const district = pick(DISTRICTS, i * 2 + 1);

    // Service areas: 2–5 districts
    const areaCount = rand(2, 5, i * 13);
    const serviceAreas = pickN(DISTRICTS, areaCount, i * 17 + 3);

    return {
      tenant_id:     tenantId,
      category:      cat.key,
      name:          businessName,
      contact_name:  fullName,
      phone,
      whatsapp:      phone,
      email:         `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}@gmail.com`,
      address:       `${district} area, Addis Ababa`,
      district,
      description:   pick(catData.descriptions, i),
      price_from:    pick([400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 3500, 5000], i * 7),
      currency:      "ETB",
      price_unit:    pick(["session","hour","day","month","job","sqm","fixed"], i * 3),
      service_areas: serviceAreas,
      working_hours: pick(WORKING_HOURS_POOL, i),
      response_time: pick(RESPONSE_TIMES, i),
      languages:     pick(LANGUAGES_POOL, i),
      team_size:     pick(TEAM_SIZES, i * 5),
      founded_year:  String(pick([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], i * 3)),
      tags:          pick(catData.tags, i),
      highlights:    pickN(HIGHLIGHTS_POOL, rand(2, 4, i), i),
      photo_url:     pick(AVATAR_PHOTOS, i),
      rating:        Number((3.5 + (i % 16) * 0.1).toFixed(2)),
      reviews_count: rand(3, 150, i * 11),
      verified:      i % 4 !== 0, // 75% verified
      status:        "active",
    };
  });

  // 4. Insert in batches of 100
  let inserted = 0;
  for (let i = 0; i < providers.length; i += 100) {
    const batch = providers.slice(i, i + 100);
    const { error } = await sb.from("service_providers").insert(batch);
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} error:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r  Inserted ${inserted}/${providers.length} service providers...`);
  }
  console.log(`\n✓ Done — ${inserted} service providers seeded.`);
}

main().catch(console.error);
