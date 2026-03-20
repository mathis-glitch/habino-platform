/**
 * seed-demo.ts
 * Populates the database with realistic demo listings for Habino.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires .env.local with:
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

// ── Demo listings ──────────────────────────────────────────────────────────
// Cities: Nairobi, Mombasa, Dar es Salaam, Lagos, Accra
// Mix of rent/buy, apartments/houses/commercial

const DEMO_LISTINGS = [
  // ── Nairobi ──────────────────────────────────────────────────
  {
    title: "Modern 3BR Apartment in Kilimani",
    description: "Spacious 3-bedroom apartment in the heart of Kilimani with stunning city views. Open-plan living area, modern kitchen, ensuite master bedroom, and secure parking. Walking distance to Junction Mall and top restaurants.",
    listing_type: "rent",
    property_type: "apartment",
    price: 85000,
    currency: "KES",
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 120,
    city: "Nairobi",
    neighbourhood: "Kilimani",
    address: "Kirichwa Road, Kilimani",
    agent_name: "James Mwangi",
    agent_phone: "+254 712 345 678",
    agent_email: "james@habino.io",
    features: ["Balcony", "Parking", "Security", "Gym", "Swimming Pool", "Backup Generator"],
    floor: 5,
    parking: 1,
  },
  {
    title: "Executive 4BR Townhouse — Karen",
    description: "Stunning executive townhouse in a quiet Karen estate. Features a private garden, staff quarters, double garage, and high-quality finishes throughout. Ideal for families seeking space and tranquility close to Karen Hub.",
    listing_type: "buy",
    property_type: "house",
    price: 28500000,
    currency: "KES",
    bedrooms: 4,
    bathrooms: 3,
    area_sqm: 280,
    city: "Nairobi",
    neighbourhood: "Karen",
    address: "Karen Hardy, Karen",
    agent_name: "Grace Njoroge",
    agent_phone: "+254 722 987 654",
    agent_email: "grace@habino.io",
    features: ["Garden", "Staff Quarters", "Double Garage", "Borehole", "Solar Water Heater"],
    floor: null,
    parking: 2,
  },
  {
    title: "Studio Apartment — Westlands",
    description: "Compact and fully furnished studio apartment ideal for young professionals. Located minutes from Sarit Centre and Westgate Mall. High-speed WiFi included in rent. Available immediately.",
    listing_type: "rent",
    property_type: "apartment",
    price: 35000,
    currency: "KES",
    bedrooms: 0,
    bathrooms: 1,
    area_sqm: 38,
    city: "Nairobi",
    neighbourhood: "Westlands",
    address: "Mpaka Road, Westlands",
    agent_name: "Peter Kamau",
    agent_phone: "+254 733 111 222",
    agent_email: "peter@habino.io",
    features: ["Furnished", "WiFi Included", "Security", "Rooftop Access"],
    floor: 3,
    parking: 0,
  },
  {
    title: "Prime 2BR Apartment — Lavington",
    description: "Well-maintained 2-bedroom apartment in a serene Lavington compound with just 8 units. Large windows, wooden floors, private balcony. Minutes from Lavington Green Mall and international schools.",
    listing_type: "rent",
    property_type: "apartment",
    price: 65000,
    currency: "KES",
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 95,
    city: "Nairobi",
    neighbourhood: "Lavington",
    address: "James Gichuru Road, Lavington",
    agent_name: "Sarah Otieno",
    agent_phone: "+254 700 555 333",
    agent_email: "sarah@habino.io",
    features: ["Wooden Floors", "Balcony", "Parking", "Compound", "CCTV"],
    floor: 2,
    parking: 1,
  },

  // ── Mombasa ───────────────────────────────────────────────────
  {
    title: "Beachfront Villa — Nyali",
    description: "Rare beachfront 5-bedroom villa in Nyali offering direct ocean access. Infinity pool, lush tropical garden, and panoramic ocean views. Perfect as a primary residence or holiday rental investment.",
    listing_type: "buy",
    property_type: "house",
    price: 65000000,
    currency: "KES",
    bedrooms: 5,
    bathrooms: 5,
    area_sqm: 450,
    city: "Mombasa",
    neighbourhood: "Nyali",
    address: "Nyali Beach Road, Nyali",
    agent_name: "Ali Hassan",
    agent_phone: "+254 741 888 999",
    agent_email: "ali@habino.io",
    features: ["Beachfront", "Infinity Pool", "Tropical Garden", "Staff Quarters", "Generator"],
    floor: null,
    parking: 3,
  },
  {
    title: "Modern 2BR Apartment — Bamburi",
    description: "Contemporary 2-bedroom apartment with ocean glimpses in a secured gated community. Shared pool and BBQ area. Only 5 minutes walk to Bamburi Beach. Great for holiday letting.",
    listing_type: "rent",
    property_type: "apartment",
    price: 45000,
    currency: "KES",
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 85,
    city: "Mombasa",
    neighbourhood: "Bamburi",
    address: "Bamburi Beach Road",
    agent_name: "Fatuma Salim",
    agent_phone: "+254 722 444 555",
    agent_email: "fatuma@habino.io",
    features: ["Pool", "BBQ Area", "Beach Access", "Parking", "Security"],
    floor: 2,
    parking: 1,
  },

  // ── Dar es Salaam ─────────────────────────────────────────────
  {
    title: "3BR Apartment — Masaki Peninsula",
    description: "Luxuriously appointed 3-bedroom apartment in the prestigious Masaki Peninsula. High-end finishes, sea views, 24-hour concierge, and underground parking. Walking distance to fine dining and embassies.",
    listing_type: "rent",
    property_type: "apartment",
    price: 2800,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 3,
    area_sqm: 140,
    city: "Dar es Salaam",
    neighbourhood: "Masaki",
    address: "Haile Selassie Road, Masaki",
    agent_name: "Ibrahim Juma",
    agent_phone: "+255 712 345 678",
    agent_email: "ibrahim@habino.io",
    features: ["Sea Views", "Concierge", "Underground Parking", "Gym", "Generator"],
    floor: 8,
    parking: 2,
  },
  {
    title: "Family Home — Mikocheni",
    description: "Spacious 4-bedroom family home in quiet Mikocheni B. Large compound with garden, domestic quarters, and double garage. Close to international schools and Slipway shopping centre.",
    listing_type: "buy",
    property_type: "house",
    price: 320000,
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area_sqm: 320,
    city: "Dar es Salaam",
    neighbourhood: "Mikocheni",
    address: "Mikocheni B",
    agent_name: "Rose Mkumba",
    agent_phone: "+255 754 222 333",
    agent_email: "rose@habino.io",
    features: ["Garden", "Staff Quarters", "Double Garage", "Borehole", "Security"],
    floor: null,
    parking: 2,
  },

  // ── Lagos ─────────────────────────────────────────────────────
  {
    title: "2BR Apartment — Victoria Island",
    description: "Sleek 2-bedroom apartment on Victoria Island with Atlantic Ocean views. Open-plan living, modern kitchen, 24-hour security, and rooftop terrace access. Ideal for executives.",
    listing_type: "rent",
    property_type: "apartment",
    price: 4500000,
    currency: "NGN",
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 100,
    city: "Lagos",
    neighbourhood: "Victoria Island",
    address: "Adeola Odeku Street, VI",
    agent_name: "Emeka Okafor",
    agent_phone: "+234 803 456 789",
    agent_email: "emeka@habino.io",
    features: ["Ocean Views", "Rooftop Terrace", "24hr Security", "Gym", "Backup Power"],
    floor: 12,
    parking: 1,
  },
  {
    title: "5BR Detached House — Lekki Phase 1",
    description: "Magnificent 5-bedroom fully detached house in a prime Lekki Phase 1 estate. Private pool, home cinema, modern kitchen, boys' quarters, and 3-car garage. Perfect for upscale family living.",
    listing_type: "buy",
    property_type: "house",
    price: 380000000,
    currency: "NGN",
    bedrooms: 5,
    bathrooms: 5,
    area_sqm: 500,
    city: "Lagos",
    neighbourhood: "Lekki Phase 1",
    address: "Admiralty Way, Lekki Phase 1",
    agent_name: "Chinwe Adeyemi",
    agent_phone: "+234 806 111 222",
    agent_email: "chinwe@habino.io",
    features: ["Pool", "Home Cinema", "Boys Quarters", "3-Car Garage", "Smart Home"],
    floor: null,
    parking: 3,
  },

  // ── Accra ─────────────────────────────────────────────────────
  {
    title: "Modern 3BR Apartment — East Legon",
    description: "Stylish 3-bedroom apartment in East Legon's most sought-after estate. Contemporary finishes, fitted kitchen, covered parking, and 24/7 estate security. Walking distance to East Legon Mall.",
    listing_type: "rent",
    property_type: "apartment",
    price: 3200,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 130,
    city: "Accra",
    neighbourhood: "East Legon",
    address: "American House, East Legon",
    agent_name: "Kwame Asante",
    agent_phone: "+233 24 567 890",
    agent_email: "kwame@habino.io",
    features: ["Fitted Kitchen", "Parking", "24hr Security", "Generator", "Swimming Pool"],
    floor: 4,
    parking: 2,
  },
  {
    title: "Land Plot — Tema Community 25",
    description: "Premium 1,000 sqm commercial plot in Tema Community 25 with road frontage. Suitable for commercial development, warehousing, or mixed-use. Title deed available.",
    listing_type: "buy",
    property_type: "land",
    price: 180000,
    currency: "USD",
    bedrooms: 0,
    bathrooms: 0,
    area_sqm: 1000,
    city: "Accra",
    neighbourhood: "Tema",
    address: "Community 25, Tema",
    agent_name: "Ama Boateng",
    agent_phone: "+233 20 123 456",
    agent_email: "ama@habino.io",
    features: ["Title Deed", "Road Frontage", "Commercial Zoning", "Perimeter Wall"],
    floor: null,
    parking: 0,
  },
];

// ── Unsplash image URLs (real estate themed) ──────────────────
const PHOTO_SETS = [
  [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
  ],
  [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  ],
  [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
  ],
  [
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
  ],
];

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting Habino demo seed...\n");

  // 1. Get or create a default tenant
  let { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", "demo")
    .single();

  if (!tenant) {
    const { data: newTenant, error } = await supabase
      .from("tenants")
      .insert({
        name:      "Habino Demo",
        slug:      "demo",
        is_active: true,
      })
      .select("id, name")
      .single();

    if (error) {
      console.error("❌ Could not create tenant:", error.message);
      console.log("💡 Make sure your SUPABASE_SERVICE_ROLE_KEY is set in .env.local");
      process.exit(1);
    }
    tenant = newTenant!;
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`✅ Using existing tenant: ${tenant.name} (${tenant.id})`);
  }

  // 2. Seed properties
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < DEMO_LISTINGS.length; i++) {
    const listing = DEMO_LISTINGS[i];

    // Check if already exists
    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("title", listing.title)
      .single();

    if (existing) {
      console.log(`  ⏭  Skipping (exists): ${listing.title}`);
      skipped++;
      continue;
    }

    // Insert property
    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        tenant_id:     tenant.id,
        title:         listing.title,
        description:   listing.description,
        listing_type:  listing.listing_type,
        property_type: listing.property_type,
        price:         listing.price,
        currency:      listing.currency,
        bedrooms:      listing.bedrooms,
        bathrooms:     listing.bathrooms,
        area_sqm:      listing.area_sqm,
        city:          listing.city,
        neighbourhood: listing.neighbourhood,
        address:       listing.address,
        agent_name:    listing.agent_name,
        agent_phone:   listing.agent_phone,
        agent_email:   listing.agent_email,
        features:      listing.features,
        floor:         listing.floor,
        parking:       listing.parking,
        status:        "active",
      })
      .select("id")
      .single();

    if (error || !property) {
      console.error(`  ❌ Failed: ${listing.title}`, error?.message);
      continue;
    }

    // Insert photos
    const photos = PHOTO_SETS[i % PHOTO_SETS.length];
    for (let j = 0; j < photos.length; j++) {
      await supabase.from("property_images").insert({
        property_id: property.id,
        url:         photos[j],
        sort_order:  j,
      });
    }

    console.log(`  ✅ Created: ${listing.title} (${listing.city})`);
    created++;
  }

  console.log(`\n🎉 Done! ${created} listings created, ${skipped} skipped.`);
  console.log(`\n💡 To view: open your Habino app — the Markt page should now have listings.`);
  console.log(`   If your app uses a different tenant, update the slug in this script.`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
