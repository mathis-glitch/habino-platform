/**
 * seed-demo.ts — Habino bulk demo data generator
 *
 * Generates 10,000+ realistic listings across Africa & the Middle East.
 * No photos required — fast batch inserts.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts [--count=10000] [--clear]
 *
 * Flags:
 *   --count=N   Number of listings to generate (default: 10000)
 *   --clear     Delete all existing demo listings first
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── CLI args ──────────────────────────────────────────────────
const args    = process.argv.slice(2);
const COUNT   = parseInt(args.find(a => a.startsWith("--count="))?.split("=")[1] ?? "10000");
const CLEAR   = args.includes("--clear");
const BATCH   = 100; // Supabase batch insert size

// ── Helper: seeded random ─────────────────────────────────────
let seed = 42;
function rand(min: number, max: number): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  const t = (seed >>> 0) / 0xffffffff;
  return Math.floor(t * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T { return arr[rand(0, arr.length - 1)]; }
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
// DATA TABLES
// ══════════════════════════════════════════════════════════════

const CITIES: {
  name: string; country: string; currency: string;
  neighbourhoods: string[];
  priceBase: { apartment: number; house: number; villa: number; commercial: number; land: number; office: number; hall: number; production: number; plot: number };
  priceUnit: "monthly_rent" | "sqm" | "total";
}[] = [
  // ── Kenya ────────────────────────────────────────────────
  { name: "Nairobi", country: "KE", currency: "KES",
    neighbourhoods: ["Kilimani","Westlands","Karen","Lavington","Parklands","Upper Hill","Kileleshwa","Runda","Gigiri","Muthaiga","South C","Rongai","Ngong","Kitengela","Syokimau","Kasarani","Githurai","Ruaka","Ruiru"],
    priceBase: { apartment:75000, house:180000, villa:350000, commercial:150000, land:8000000, office:120000, hall:200000, production:180000, plot:5000000 },
    priceUnit: "monthly_rent" },
  { name: "Mombasa", country: "KE", currency: "KES",
    neighbourhoods: ["Nyali","Bamburi","Shanzu","Mtwapa","Likoni","Tudor","Kisauni","Changamwe","Diani","Ukunda"],
    priceBase: { apartment:40000, house:120000, villa:250000, commercial:80000, land:5000000, office:60000, hall:150000, production:120000, plot:3000000 },
    priceUnit: "monthly_rent" },
  { name: "Nakuru", country: "KE", currency: "KES",
    neighbourhoods: ["Section 58","London","Milimani","Kiamunyi","Pipeline","Pangani","Free Area","Lanet"],
    priceBase: { apartment:25000, house:60000, villa:150000, commercial:50000, land:2000000, office:40000, hall:80000, production:70000, plot:1500000 },
    priceUnit: "monthly_rent" },
  { name: "Kisumu", country: "KE", currency: "KES",
    neighbourhoods: ["Milimani","Nyalenda","Kondele","Migosi","Mamboleo","Riat","Lolwe","Obunga"],
    priceBase: { apartment:20000, house:50000, villa:120000, commercial:40000, land:1500000, office:30000, hall:70000, production:60000, plot:1200000 },
    priceUnit: "monthly_rent" },

  // ── Ethiopia ─────────────────────────────────────────────
  { name: "Addis Ababa", country: "ET", currency: "USD",
    neighbourhoods: ["Bole","Kazanchis","CMC","Old Airport","Sarbet","Megenagna","Gerji","Ayat","Summit","Wello Sefer","Lideta","Merkato","Piassa","Gofa","Kality"],
    priceBase: { apartment:1200, house:3000, villa:6000, commercial:2500, land:200000, office:2000, hall:4000, production:3500, plot:150000 },
    priceUnit: "monthly_rent" },
  { name: "Dire Dawa", country: "ET", currency: "ETB",
    neighbourhoods: ["Sabian","Kezira","Ganda","Legehare","Megala","Addis Ketema"],
    priceBase: { apartment:8000, house:20000, villa:50000, commercial:15000, land:500000, office:12000, hall:30000, production:25000, plot:300000 },
    priceUnit: "monthly_rent" },

  // ── South Africa ─────────────────────────────────────────
  { name: "Cape Town", country: "ZA", currency: "ZAR",
    neighbourhoods: ["Sea Point","Green Point","De Waterkant","Woodstock","Observatory","Claremont","Rondebosch","Newlands","Constantia","Hout Bay","Camps Bay","Clifton","Stellenbosch","Somerset West","Bellville","Parow","Brackenfell","Goodwood"],
    priceBase: { apartment:18000, house:35000, villa:80000, commercial:30000, land:3000000, office:25000, hall:60000, production:50000, plot:2000000 },
    priceUnit: "monthly_rent" },
  { name: "Johannesburg", country: "ZA", currency: "ZAR",
    neighbourhoods: ["Sandton","Rosebank","Parktown","Greenside","Melville","Bryanston","Fourways","Midrand","Centurion","Soweto","Alexandra","Randburg","Roodepoort","Boksburg","Germiston","Edenvale","Bedfordview","Northcliff","Craighall"],
    priceBase: { apartment:14000, house:28000, villa:70000, commercial:25000, land:2500000, office:22000, hall:55000, production:45000, plot:1800000 },
    priceUnit: "monthly_rent" },
  { name: "Durban", country: "ZA", currency: "ZAR",
    neighbourhoods: ["Umhlanga","Ballito","La Lucia","Morningside","Berea","Glenwood","Musgrave","Westville","Pinetown","Hillcrest","Amanzimtoti"],
    priceBase: { apartment:12000, house:22000, villa:55000, commercial:20000, land:2000000, office:18000, hall:45000, production:38000, plot:1500000 },
    priceUnit: "monthly_rent" },
  { name: "Pretoria", country: "ZA", currency: "ZAR",
    neighbourhoods: ["Hatfield","Arcadia","Sunnyside","Waterkloof","Menlo Park","Brooklyn","Lynnwood","Garsfontein","Moreleta Park","Faerie Glen"],
    priceBase: { apartment:11000, house:20000, villa:50000, commercial:18000, land:1800000, office:16000, hall:40000, production:35000, plot:1300000 },
    priceUnit: "monthly_rent" },

  // ── Tanzania ─────────────────────────────────────────────
  { name: "Dar es Salaam", country: "TZ", currency: "USD",
    neighbourhoods: ["Masaki","Oyster Bay","Msasani","Mikocheni","Kinondoni","Kariakoo","Ilala","Ubungo","Temeke","Mbagala","Kigamboni"],
    priceBase: { apartment:1000, house:2500, villa:5000, commercial:2000, land:150000, office:1800, hall:3500, production:3000, plot:120000 },
    priceUnit: "monthly_rent" },
  { name: "Arusha", country: "TZ", currency: "USD",
    neighbourhoods: ["Njiro","Sakina","Kijenge","Sekei","Themi","Kaloleni","Dodoma Road","Sinoni"],
    priceBase: { apartment:700, house:1800, villa:4000, commercial:1500, land:100000, office:1200, hall:2500, production:2000, plot:80000 },
    priceUnit: "monthly_rent" },

  // ── Uganda ───────────────────────────────────────────────
  { name: "Kampala", country: "UG", currency: "USD",
    neighbourhoods: ["Kololo","Naguru","Muyenga","Bugolobi","Ntinda","Bukoto","Nakasero","Makindye","Kira","Naalya","Najeera","Kirinya","Bweyogerere"],
    priceBase: { apartment:800, house:2000, villa:4500, commercial:1800, land:120000, office:1500, hall:3000, production:2500, plot:90000 },
    priceUnit: "monthly_rent" },
  { name: "Entebbe", country: "UG", currency: "USD",
    neighbourhoods: ["Kitooro","Katabi","Abaita Ababiri","Nakiwogo","Bugonga"],
    priceBase: { apartment:600, house:1500, villa:3500, commercial:1300, land:80000, office:1100, hall:2200, production:2000, plot:60000 },
    priceUnit: "monthly_rent" },

  // ── Rwanda ───────────────────────────────────────────────
  { name: "Kigali", country: "RW", currency: "USD",
    neighbourhoods: ["Kiyovu","Nyarutarama","Kimihurura","Gacuriro","Remera","Kabeza","Kacyiru","Gisozi","Kanombe","Masaka","Rebero","Kibagabaga"],
    priceBase: { apartment:900, house:2200, villa:5000, commercial:2000, land:130000, office:1700, hall:3200, production:2800, plot:100000 },
    priceUnit: "monthly_rent" },

  // ── Nigeria ──────────────────────────────────────────────
  { name: "Lagos", country: "NG", currency: "NGN",
    neighbourhoods: ["Victoria Island","Lekki Phase 1","Lekki Phase 2","Ikoyi","Banana Island","Yaba","Surulere","Ikeja","Maryland","Ojota","Ajah","Sangotedo","Epe","Badagry","Apapa","Ogba","Magodo","Gbagada","Festac"],
    priceBase: { apartment:3000000, house:8000000, villa:20000000, commercial:6000000, land:300000000, office:5000000, hall:12000000, production:10000000, plot:200000000 },
    priceUnit: "monthly_rent" },
  { name: "Abuja", country: "NG", currency: "NGN",
    neighbourhoods: ["Maitama","Asokoro","Wuse 2","Gwarinpa","Jabi","Utako","Garki","Central Business District","Apo","Katampe","Lokogoma","Kubwa"],
    priceBase: { apartment:2500000, house:7000000, villa:18000000, commercial:5000000, land:250000000, office:4500000, hall:10000000, production:9000000, plot:180000000 },
    priceUnit: "monthly_rent" },
  { name: "Port Harcourt", country: "NG", currency: "NGN",
    neighbourhoods: ["GRA Phase 1","GRA Phase 2","Old GRA","New GRA","Rumuola","Rumuomasi","Trans-Amadi","Rumuola","Woji","Eliozu"],
    priceBase: { apartment:2000000, house:5000000, villa:14000000, commercial:4000000, land:180000000, office:3500000, hall:8000000, production:7000000, plot:140000000 },
    priceUnit: "monthly_rent" },

  // ── Ghana ────────────────────────────────────────────────
  { name: "Accra", country: "GH", currency: "USD",
    neighbourhoods: ["East Legon","Airport Residential","Cantonments","Labone","Trasacco","Spintex","Achimota","Adenta","Tema","Kasoa","Dansoman","Osu","Labadi","Teshie"],
    priceBase: { apartment:1500, house:3500, villa:8000, commercial:2800, land:200000, office:2500, hall:5000, production:4500, plot:150000 },
    priceUnit: "monthly_rent" },
  { name: "Kumasi", country: "GH", currency: "USD",
    neighbourhoods: ["Ahodwo","Nhyiaeso","Asokwa","Bantama","Suame","Tafo","Oforikrom","Kwadaso","Subin"],
    priceBase: { apartment:800, house:2000, villa:5000, commercial:1800, land:120000, office:1500, hall:3000, production:2800, plot:90000 },
    priceUnit: "monthly_rent" },

  // ── Egypt ────────────────────────────────────────────────
  { name: "Cairo", country: "EG", currency: "EGP",
    neighbourhoods: ["Zamalek","Maadi","Heliopolis","New Cairo","Nasr City","Mohandessin","Dokki","Garden City","Fifth Settlement","Sheikh Zayed","6th October","Rehab City","Shorouk"],
    priceBase: { apartment:20000, house:45000, villa:100000, commercial:35000, land:5000000, office:30000, hall:70000, production:60000, plot:3000000 },
    priceUnit: "monthly_rent" },
  { name: "Alexandria", country: "EG", currency: "EGP",
    neighbourhoods: ["Gleem","Sidi Gaber","Smouha","Stanley","Roushdy","Kafr Abdo","Laurent","Sporting","Agami","Borg El Arab"],
    priceBase: { apartment:15000, house:35000, villa:80000, commercial:28000, land:3500000, office:22000, hall:55000, production:48000, plot:2500000 },
    priceUnit: "monthly_rent" },

  // ── Morocco ──────────────────────────────────────────────
  { name: "Casablanca", country: "MA", currency: "MAD",
    neighbourhoods: ["Anfa","Maarif","Ain Diab","CIL","Hay Riad","Sidi Maarouf","Ain Sebaa","Hay Hassani","Bernoussi","Sidi Bernoussi"],
    priceBase: { apartment:8000, house:18000, villa:50000, commercial:15000, land:2000000, office:12000, hall:30000, production:25000, plot:1500000 },
    priceUnit: "monthly_rent" },
  { name: "Marrakech", country: "MA", currency: "MAD",
    neighbourhoods: ["Gueliz","Hivernage","Medina","Palmeraie","Amelkis","Route de Fes","Targa","Massira"],
    priceBase: { apartment:7000, house:15000, villa:45000, commercial:12000, land:1500000, office:10000, hall:25000, production:22000, plot:1200000 },
    priceUnit: "monthly_rent" },
  { name: "Rabat", country: "MA", currency: "MAD",
    neighbourhoods: ["Agdal","Hassan","Souissi","Hay Riad","Ocean","Medina","Akkari","Takaddoum"],
    priceBase: { apartment:7500, house:16000, villa:40000, commercial:13000, land:1600000, office:11000, hall:28000, production:24000, plot:1300000 },
    priceUnit: "monthly_rent" },

  // ── UAE ──────────────────────────────────────────────────
  { name: "Dubai", country: "AE", currency: "AED",
    neighbourhoods: ["Dubai Marina","JBR","Palm Jumeirah","Downtown Dubai","Business Bay","DIFC","JVC","Jumeirah","Mirdif","Silicon Oasis","Al Quoz","Dubai Investment Park","Jebel Ali"],
    priceBase: { apartment:8000, house:20000, villa:50000, commercial:15000, land:3000000, office:12000, hall:30000, production:25000, plot:2500000 },
    priceUnit: "monthly_rent" },
  { name: "Abu Dhabi", country: "AE", currency: "AED",
    neighbourhoods: ["Corniche","Al Reem Island","Yas Island","Saadiyat Island","Khalidiyah","Tourist Club Area","Al Mushrif","Muroor","Mussafah"],
    priceBase: { apartment:7000, house:18000, villa:45000, commercial:13000, land:2500000, office:10000, hall:28000, production:22000, plot:2000000 },
    priceUnit: "monthly_rent" },
];

// ── Property type configs ─────────────────────────────────────
const PROP_TYPES = [
  { type: "apartment", label: "Wohnung",          bedroomsRange: [0,4], bathroomsRange: [1,3], areaRange: [35,200], listingTypes: ["rent","buy"] as const, weight: 35 },
  { type: "house",     label: "Einfamilienhaus",   bedroomsRange: [2,6], bathroomsRange: [1,4], areaRange: [100,500], listingTypes: ["rent","buy"] as const, weight: 20 },
  { type: "villa",     label: "Villa",             bedroomsRange: [3,7], bathroomsRange: [2,5], areaRange: [200,800], listingTypes: ["rent","buy"] as const, weight: 10 },
  { type: "commercial",label: "Gewerbe",           bedroomsRange: [0,0], bathroomsRange: [1,4], areaRange: [50,2000], listingTypes: ["rent","buy"] as const, weight: 10 },
  { type: "office",    label: "Büro",              bedroomsRange: [0,0], bathroomsRange: [1,6], areaRange: [30,1000], listingTypes: ["rent","buy"] as const, weight: 8 },
  { type: "hall",      label: "Halle",             bedroomsRange: [0,0], bathroomsRange: [1,4], areaRange: [200,5000], listingTypes: ["rent","buy"] as const, weight: 5 },
  { type: "production",label: "Produktionsfläche", bedroomsRange: [0,0], bathroomsRange: [1,6], areaRange: [500,10000], listingTypes: ["rent","buy"] as const, weight: 4 },
  { type: "land",      label: "Grundstück",        bedroomsRange: [0,0], bathroomsRange: [0,0], areaRange: [200,20000], listingTypes: ["buy"] as const, weight: 5 },
  { type: "plot",      label: "Baugrundstück",     bedroomsRange: [0,0], bathroomsRange: [0,0], areaRange: [200,5000], listingTypes: ["buy","rent"] as const, weight: 3 },
];

// Weighted pick for property type
function pickPropType() {
  const total = PROP_TYPES.reduce((s, p) => s + p.weight, 0);
  let r = rand(0, total - 1);
  for (const p of PROP_TYPES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PROP_TYPES[0];
}

// ── Title templates ───────────────────────────────────────────
const ADJECTIVES = ["Modern","Spacious","Elegant","Bright","Quiet","Prime","Newly Built","Renovated","Stunning","Executive","Cozy","Stylish","Luxury","Contemporary","Comfortable","Well-maintained","Premium","Exclusive","Charming","Exceptional"];

const CONDITION = ["— Move-in Ready","","","","— Available Now","— Negotiable","— Long-term","","— Short-term Available",""];

function makeTitle(propLabel: string, bedrooms: number, neighbourhood: string, listingType: string): string {
  const adj  = pick(ADJECTIVES);
  const cond = pick(CONDITION);
  if (bedrooms > 0) {
    return `${adj} ${bedrooms}BR ${propLabel} — ${neighbourhood}${cond}`;
  }
  return `${adj} ${propLabel} — ${neighbourhood}${cond}`;
}

// ── Description templates ─────────────────────────────────────
const DESC_PARTS = {
  apartment: [
    "Well-designed apartment with natural light and modern finishes.",
    "Open-plan living area, fitted kitchen, and private balcony.",
    "Located in a secure compound with 24-hour security.",
    "High-speed internet connection and backup power.",
    "Walking distance to shops, restaurants, and public transport.",
    "Available for immediate occupation.",
  ],
  house: [
    "Spacious family home on a quiet residential street.",
    "Large compound with mature garden and perimeter wall.",
    "Modern kitchen, dining area, and generous living spaces.",
    "Domestic quarters, double garage, and ample parking.",
    "Close to international schools and shopping centres.",
    "Ideal for families seeking space and security.",
  ],
  villa: [
    "Exceptional villa offering the finest in luxury living.",
    "Private swimming pool, landscaped garden, and outdoor entertaining area.",
    "High-quality finishes, smart home features, and premium appliances.",
    "Staff quarters, multiple garages, and a private entrance.",
    "Nestled in a prestigious neighbourhood with 24-hour security.",
    "A rare opportunity in one of the city's most sought-after areas.",
  ],
  commercial: [
    "Prime commercial space in a high-footfall location.",
    "Ground-floor retail unit with wide shopfront and excellent visibility.",
    "Suitable for retail, food and beverage, or service businesses.",
    "Three-phase power, loading bay access, and ample storage.",
    "Flexible lease terms available for qualified tenants.",
  ],
  office: [
    "Modern grade-A office space in a premium business address.",
    "Open-plan layout with raised floors, suspended ceilings, and fibre connectivity.",
    "Air-conditioned throughout with backup generator and UPS.",
    "Dedicated parking allocation and 24-hour access control.",
    "Ideal for corporates, NGOs, embassies, or professional firms.",
  ],
  hall: [
    "Large warehouse and logistics hall with high clearance height.",
    "Roller-shutter access doors, loading docks, and concrete flooring.",
    "Three-phase industrial power supply and fire suppression system.",
    "Secure perimeter fencing, CCTV, and 24-hour guard service.",
    "Suitable for storage, distribution, light manufacturing, or events.",
  ],
  production: [
    "Purpose-built production facility with heavy-duty infrastructure.",
    "High-bay structure with overhead crane rails and industrial power.",
    "Fully equipped with drainage, ventilation, and fire protection.",
    "Extensive yard area for truck turning and container handling.",
    "Excellent access to main arterial roads and industrial zones.",
  ],
  land: [
    "Prime land parcel with clean title deed and all utilities available.",
    "Flat topography ideal for residential, commercial, or mixed-use development.",
    "Road frontage with easy access from main road.",
    "Located in a high-growth area with strong development potential.",
    "Suitable for immediate construction — no encumbrances.",
  ],
  plot: [
    "Serviced residential plot in an established neighbourhood.",
    "Water, electricity, and drainage connections available at boundary.",
    "Flat terrain suitable for bungalow or multi-storey construction.",
    "Title deed available and transfer can be completed within 30 days.",
    "Excellent investment opportunity in a rapidly appreciating area.",
  ],
};

function makeDescription(type: string): string {
  const parts = DESC_PARTS[type as keyof typeof DESC_PARTS] ?? DESC_PARTS.apartment;
  const shuffled = shuffle(parts);
  return shuffled.slice(0, rand(3, Math.min(5, parts.length))).join(" ");
}

// ── Agents per country ────────────────────────────────────────
const AGENTS: Record<string, { name: string; phone: string; email: string }[]> = {
  KE: [
    { name: "James Mwangi",    phone: "+254 712 345 678", email: "james@habino.io" },
    { name: "Grace Njoroge",   phone: "+254 722 987 654", email: "grace@habino.io" },
    { name: "Sarah Otieno",    phone: "+254 700 555 333", email: "sarah@habino.io" },
    { name: "Peter Kamau",     phone: "+254 733 111 222", email: "peter@habino.io" },
    { name: "Alice Wanjiku",   phone: "+254 721 888 000", email: "alice@habino.io" },
    { name: "David Kariuki",   phone: "+254 729 000 111", email: "david@habino.io" },
  ],
  ET: [
    { name: "Selamawit Tadesse", phone: "+251 911 234 567", email: "selamawit@habino.io" },
    { name: "Yohannes Bekele",   phone: "+251 912 345 678", email: "yohannes@habino.io" },
    { name: "Hiwot Girma",       phone: "+251 913 456 789", email: "hiwot@habino.io" },
    { name: "Dawit Alemu",       phone: "+251 914 567 890", email: "dawit@habino.io" },
  ],
  ZA: [
    { name: "Nadia van der Berg", phone: "+27 82 345 6789", email: "nadia@habino.io" },
    { name: "Sipho Nkosi",        phone: "+27 72 678 9012", email: "sipho@habino.io" },
    { name: "Thandi Dlamini",     phone: "+27 84 567 8901", email: "thandi@habino.io" },
    { name: "Pieter Venter",      phone: "+27 83 456 7890", email: "pieter@habino.io" },
    { name: "Lerato Molefe",      phone: "+27 73 789 0123", email: "lerato@habino.io" },
  ],
  TZ: [
    { name: "Ibrahim Juma",   phone: "+255 712 345 678", email: "ibrahim@habino.io" },
    { name: "Rose Mkumba",    phone: "+255 754 222 333", email: "rose@habino.io" },
    { name: "Zuwena Omar",    phone: "+255 777 888 999", email: "zuwena@habino.io" },
  ],
  UG: [
    { name: "Ronald Ssekandi",   phone: "+256 774 123 456", email: "ronald@habino.io" },
    { name: "Patricia Namutebi", phone: "+256 782 234 567", email: "patricia@habino.io" },
  ],
  RW: [
    { name: "Amina Uwimana",       phone: "+250 788 123 456", email: "amina@habino.io" },
    { name: "Jean-Pierre Habimana",phone: "+250 722 234 567", email: "jp@habino.io" },
  ],
  NG: [
    { name: "Emeka Okafor",   phone: "+234 803 456 789", email: "emeka@habino.io" },
    { name: "Chinwe Adeyemi", phone: "+234 806 111 222", email: "chinwe@habino.io" },
    { name: "Tunde Fashola",  phone: "+234 807 333 444", email: "tunde@habino.io" },
  ],
  GH: [
    { name: "Kwame Asante", phone: "+233 24 567 890", email: "kwame@habino.io" },
    { name: "Ama Boateng",  phone: "+233 20 123 456", email: "ama@habino.io" },
  ],
  EG: [
    { name: "Mohamed El-Sayed", phone: "+20 100 234 5678", email: "mohamed@habino.io" },
    { name: "Yasmine Hassan",   phone: "+20 101 345 6789", email: "yasmine@habino.io" },
  ],
  MA: [
    { name: "Rachid Benali",  phone: "+212 661 234 567", email: "rachid@habino.io" },
    { name: "Fatima Zahra",   phone: "+212 662 345 678", email: "fatima@habino.io" },
  ],
  AE: [
    { name: "Omar Al-Farsi", phone: "+971 50 123 4567", email: "omar@habino.io" },
    { name: "Layla Al-Mansoori", phone: "+971 52 234 5678", email: "layla@habino.io" },
  ],
};

// ── Price generator ───────────────────────────────────────────
function generatePrice(
  city: typeof CITIES[0],
  propType: string,
  listingType: string,
  areaSqm: number
): number {
  const base = city.priceBase[propType as keyof typeof city.priceBase] ?? city.priceBase.apartment;
  // Add ±40% variation
  const variation = 0.6 + (rand(0, 80) / 100);
  let price = Math.round(base * variation);

  // Buy prices = rent * 120-180x multiplier
  if (listingType === "buy" && !["land","plot"].includes(propType)) {
    price = price * rand(120, 180);
  }

  // Scale commercial/industrial by area
  if (["hall","production","land","plot"].includes(propType)) {
    price = Math.round((price / 1000) * (areaSqm / 100)) * 100;
    if (price < 1) price = base;
  }

  // Round to clean numbers
  if (price > 1000000) return Math.round(price / 100000) * 100000;
  if (price > 100000)  return Math.round(price / 10000) * 10000;
  if (price > 10000)   return Math.round(price / 1000) * 1000;
  return Math.round(price / 500) * 500;
}

// ── Generate one listing ──────────────────────────────────────
function generateListing(tenantId: string) {
  const city     = pick(CITIES);
  const propConf = pickPropType();
  const listingType = pick(propConf.listingTypes);
  const neighbourhood = pick(city.neighbourhoods);
  const agents   = AGENTS[city.country] ?? AGENTS["KE"];
  const agent    = pick(agents);

  const bedrooms  = rand(propConf.bedroomsRange[0], propConf.bedroomsRange[1]);
  const bathrooms = rand(propConf.bathroomsRange[0], propConf.bathroomsRange[1]);
  const area_sqm  = rand(propConf.areaRange[0], propConf.areaRange[1]);
  const price     = generatePrice(city, propConf.type, listingType, area_sqm);

  return {
    tenant_id:     tenantId,
    title:         makeTitle(propConf.label, bedrooms, neighbourhood, listingType),
    description:   makeDescription(propConf.type),
    listing_type:  listingType,
    property_type: propConf.type,
    price,
    currency:      city.currency,
    bedrooms,
    bathrooms,
    area_sqm,
    city:          city.name,
    neighbourhood,
    address:       null,
    agent_name:    agent.name,
    agent_phone:   agent.phone,
    agent_email:   agent.email,
    status:        "active",
  };
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 Habino Demo Seed — generating ${COUNT.toLocaleString()} listings\n`);

  // Find tenant
  let { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .single();

  if (!tenant) {
    console.error("❌ No tenant found. Create one first.");
    process.exit(1);
  }
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})\n`);

  // Optionally clear existing demo listings
  if (CLEAR) {
    console.log("🗑  Clearing existing listings...");
    const { count } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id);
    await supabase.from("properties").delete().eq("tenant_id", tenant.id);
    console.log(`   Deleted ${count ?? 0} listings\n`);
  }

  // Generate and insert in batches
  let totalCreated = 0;
  let totalFailed  = 0;
  const batches    = Math.ceil(COUNT / BATCH);

  for (let b = 0; b < batches; b++) {
    const batchSize = Math.min(BATCH, COUNT - totalCreated);
    const rows = Array.from({ length: batchSize }, () => generateListing(tenant.id));

    const { data, error } = await supabase
      .from("properties")
      .insert(rows)
      .select("id");

    if (error) {
      console.error(`  ❌ Batch ${b + 1} failed:`, error.message);
      totalFailed += batchSize;
    } else {
      totalCreated += data?.length ?? 0;
    }

    // Progress every 10 batches
    if ((b + 1) % 10 === 0 || b === batches - 1) {
      const pct = Math.round(((b + 1) / batches) * 100);
      process.stdout.write(`\r  Progress: ${totalCreated.toLocaleString()} / ${COUNT.toLocaleString()} listings (${pct}%)`);
    }
  }

  console.log(`\n\n${"─".repeat(50)}`);
  console.log(`🎉 Done!`);
  console.log(`   ✅ Created : ${totalCreated.toLocaleString()}`);
  console.log(`   ❌ Failed  : ${totalFailed.toLocaleString()}`);
  if (totalFailed > 0) {
    console.log(`\n💡 Failed listings are usually caused by missing DB columns.`);
    console.log(`   Run: npx tsx scripts/seed-demo.ts --clear to retry with a clean slate.`);
  }
  console.log(`\n🔗 Open your Habino app — Markt should now have ${totalCreated.toLocaleString()} listings.`);
}

main().catch((e) => { console.error("\nFatal error:", e); process.exit(1); });
