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

// ── Photo sets (Unsplash, royalty-free) ───────────────────────
const PHOTOS = {
  apartment: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800",
  ],
  house: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  ],
  villa: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
  ],
  modern: [
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
  ],
  commercial: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
    "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800",
  ],
  land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    "https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=800",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800",
    "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800",
  ],
};

// ── All demo listings ─────────────────────────────────────────
const DEMO_LISTINGS = [

  // ══════════════════════════════════════════════
  // KENYA — Nairobi
  // ══════════════════════════════════════════════
  {
    title: "Modern 3BR Apartment — Kilimani",
    description: "Spacious 3-bedroom apartment in the heart of Kilimani with stunning city views. Open-plan living area, modern kitchen, ensuite master bedroom, and secure parking. Walking distance to Junction Mall and top restaurants.",
    listing_type: "rent", property_type: "apartment",
    price: 85000, currency: "KES",
    bedrooms: 3, bathrooms: 2, area_sqm: 120,
    city: "Nairobi", neighbourhood: "Kilimani", address: "Kirichwa Road, Kilimani",
    agent_name: "James Mwangi", agent_phone: "+254 712 345 678", agent_email: "james@habino.io",
    features: ["Balcony", "Parking", "Security", "Gym", "Swimming Pool", "Backup Generator"],
    floor: 5, parking: 1, photos: PHOTOS.apartment,
  },
  {
    title: "Executive 4BR Townhouse — Karen",
    description: "Stunning executive townhouse in a quiet Karen estate. Features a private garden, staff quarters, double garage, and high-quality finishes throughout. Ideal for families seeking space and tranquility close to Karen Hub.",
    listing_type: "buy", property_type: "house",
    price: 28500000, currency: "KES",
    bedrooms: 4, bathrooms: 3, area_sqm: 280,
    city: "Nairobi", neighbourhood: "Karen", address: "Karen Hardy, Karen",
    agent_name: "Grace Njoroge", agent_phone: "+254 722 987 654", agent_email: "grace@habino.io",
    features: ["Garden", "Staff Quarters", "Double Garage", "Borehole", "Solar Water Heater"],
    floor: null, parking: 2, photos: PHOTOS.house,
  },
  {
    title: "Studio Apartment — Westlands",
    description: "Compact and fully furnished studio apartment ideal for young professionals. Located minutes from Sarit Centre and Westgate Mall. High-speed WiFi included in rent. Available immediately.",
    listing_type: "rent", property_type: "apartment",
    price: 35000, currency: "KES",
    bedrooms: 0, bathrooms: 1, area_sqm: 38,
    city: "Nairobi", neighbourhood: "Westlands", address: "Mpaka Road, Westlands",
    agent_name: "Peter Kamau", agent_phone: "+254 733 111 222", agent_email: "peter@habino.io",
    features: ["Furnished", "WiFi Included", "Security", "Rooftop Access"],
    floor: 3, parking: 0, photos: PHOTOS.modern,
  },
  {
    title: "2BR Apartment — Lavington",
    description: "Well-maintained 2-bedroom apartment in a serene Lavington compound. Large windows, wooden floors, private balcony. Minutes from Lavington Green Mall and international schools.",
    listing_type: "rent", property_type: "apartment",
    price: 65000, currency: "KES",
    bedrooms: 2, bathrooms: 2, area_sqm: 95,
    city: "Nairobi", neighbourhood: "Lavington", address: "James Gichuru Road, Lavington",
    agent_name: "Sarah Otieno", agent_phone: "+254 700 555 333", agent_email: "sarah@habino.io",
    features: ["Wooden Floors", "Balcony", "Parking", "Compound", "CCTV"],
    floor: 2, parking: 1, photos: PHOTOS.apartment,
  },
  {
    title: "Office Space — Upper Hill",
    description: "Prime grade-A office space on the 14th floor of a modern tower in Upper Hill CBD. Open-plan layout with glass partitions, high-speed fibre, backup generator, and underground parking.",
    listing_type: "rent", property_type: "commercial",
    price: 120000, currency: "KES",
    bedrooms: 0, bathrooms: 2, area_sqm: 200,
    city: "Nairobi", neighbourhood: "Upper Hill", address: "Upper Hill Road",
    agent_name: "David Kariuki", agent_phone: "+254 721 999 000", agent_email: "david@habino.io",
    features: ["Fibre Internet", "Generator", "Underground Parking", "Reception", "AC"],
    floor: 14, parking: 4, photos: PHOTOS.commercial,
  },

  // ══════════════════════════════════════════════
  // KENYA — Mombasa
  // ══════════════════════════════════════════════
  {
    title: "Beachfront Villa — Nyali",
    description: "Rare beachfront 5-bedroom villa in Nyali offering direct ocean access. Infinity pool, lush tropical garden, and panoramic ocean views. Perfect as primary residence or holiday rental investment.",
    listing_type: "buy", property_type: "house",
    price: 65000000, currency: "KES",
    bedrooms: 5, bathrooms: 5, area_sqm: 450,
    city: "Mombasa", neighbourhood: "Nyali", address: "Nyali Beach Road",
    agent_name: "Ali Hassan", agent_phone: "+254 741 888 999", agent_email: "ali@habino.io",
    features: ["Beachfront", "Infinity Pool", "Tropical Garden", "Staff Quarters", "Generator"],
    floor: null, parking: 3, photos: PHOTOS.villa,
  },
  {
    title: "2BR Apartment — Bamburi Beach",
    description: "Contemporary 2-bedroom apartment with ocean glimpses in a gated community. Shared pool and BBQ area. 5 minutes walk to Bamburi Beach. Great for holiday letting.",
    listing_type: "rent", property_type: "apartment",
    price: 45000, currency: "KES",
    bedrooms: 2, bathrooms: 2, area_sqm: 85,
    city: "Mombasa", neighbourhood: "Bamburi", address: "Bamburi Beach Road",
    agent_name: "Fatuma Salim", agent_phone: "+254 722 444 555", agent_email: "fatuma@habino.io",
    features: ["Pool", "BBQ Area", "Beach Access", "Parking", "Security"],
    floor: 2, parking: 1, photos: PHOTOS.apartment,
  },

  // ══════════════════════════════════════════════
  // ETHIOPIA — Addis Ababa
  // ══════════════════════════════════════════════
  {
    title: "Luxury 3BR Apartment — Bole",
    description: "Beautifully finished 3-bedroom apartment in Bole's most desirable residential tower. Floor-to-ceiling windows, Italian kitchen, marble bathrooms, and rooftop infinity pool with views of the Entoto Hills.",
    listing_type: "rent", property_type: "apartment",
    price: 2500, currency: "USD",
    bedrooms: 3, bathrooms: 2, area_sqm: 130,
    city: "Addis Ababa", neighbourhood: "Bole", address: "Bole Road, Bole Sub-city",
    agent_name: "Selamawit Tadesse", agent_phone: "+251 911 234 567", agent_email: "selamawit@habino.io",
    features: ["Rooftop Pool", "Generator", "Parking", "Concierge", "Gym", "AC"],
    floor: 10, parking: 2, photos: PHOTOS.luxury,
  },
  {
    title: "Family Villa — Old Airport Area",
    description: "Spacious 5-bedroom villa on a large compound in the sought-after Old Airport neighbourhood. Two living rooms, dining room, modern kitchen, staff quarters, and a landscaped garden. Walking distance to major embassies.",
    listing_type: "rent", property_type: "house",
    price: 4500, currency: "USD",
    bedrooms: 5, bathrooms: 4, area_sqm: 400,
    city: "Addis Ababa", neighbourhood: "Old Airport", address: "Old Airport Road, Nifas Silk Lafto",
    agent_name: "Yohannes Bekele", agent_phone: "+251 912 345 678", agent_email: "yohannes@habino.io",
    features: ["Large Compound", "Staff Quarters", "Generator", "Borehole", "Satellite TV"],
    floor: null, parking: 3, photos: PHOTOS.villa,
  },
  {
    title: "Modern 2BR Apartment — Kazanchis",
    description: "Contemporary apartment in Kazanchis diplomatic quarter, ideal for expats. Recently renovated with modern finishes, fitted kitchen, and secure parking. Close to UN offices and major hotels.",
    listing_type: "rent", property_type: "apartment",
    price: 1800, currency: "USD",
    bedrooms: 2, bathrooms: 2, area_sqm: 90,
    city: "Addis Ababa", neighbourhood: "Kazanchis", address: "Ras Desta Damtew Street",
    agent_name: "Hiwot Girma", agent_phone: "+251 913 456 789", agent_email: "hiwot@habino.io",
    features: ["Furnished", "Generator", "Security", "Parking", "Fibre Internet"],
    floor: 5, parking: 1, photos: PHOTOS.modern,
  },
  {
    title: "Commercial Plot — CMC Area",
    description: "Prime 800 sqm commercial plot on CMC Road with direct road access. All utilities connected. Suitable for retail, hotel, or mixed-use development. Title deed available.",
    listing_type: "buy", property_type: "land",
    price: 8500000, currency: "ETB",
    bedrooms: 0, bathrooms: 0, area_sqm: 800,
    city: "Addis Ababa", neighbourhood: "CMC", address: "CMC Road, Yeka Sub-city",
    agent_name: "Dawit Alemu", agent_phone: "+251 914 567 890", agent_email: "dawit@habino.io",
    features: ["Title Deed", "Road Frontage", "All Utilities", "Commercial Zoning"],
    floor: null, parking: 0, photos: PHOTOS.land,
  },

  // ══════════════════════════════════════════════
  // SOUTH AFRICA — Cape Town
  // ══════════════════════════════════════════════
  {
    title: "Atlantic Seaboard Apartment — Sea Point",
    description: "Stylish 2-bedroom apartment with direct Atlantic Ocean views in the heart of Sea Point. Open-plan living, designer kitchen, underfloor heating, and a private balcony. Walk to the promenade and top restaurants.",
    listing_type: "rent", property_type: "apartment",
    price: 25000, currency: "ZAR",
    bedrooms: 2, bathrooms: 2, area_sqm: 95,
    city: "Cape Town", neighbourhood: "Sea Point", address: "Beach Road, Sea Point",
    agent_name: "Nadia van der Berg", agent_phone: "+27 82 345 6789", agent_email: "nadia@habino.io",
    features: ["Ocean Views", "Balcony", "Underfloor Heating", "Secure Parking", "Fibre"],
    floor: 6, parking: 1, photos: PHOTOS.luxury,
  },
  {
    title: "Cape Winelands Farm — Stellenbosch",
    description: "Magnificent 6-bedroom wine farm estate on 12 hectares of Stellenbosch vineyards. Cellar, tasting room, guest cottages, and a historic Cape Dutch manor house. Exceptional investment opportunity.",
    listing_type: "buy", property_type: "house",
    price: 45000000, currency: "ZAR",
    bedrooms: 6, bathrooms: 5, area_sqm: 650,
    city: "Cape Town", neighbourhood: "Stellenbosch", address: "R44, Stellenbosch",
    agent_name: "Pieter Venter", agent_phone: "+27 83 456 7890", agent_email: "pieter@habino.io",
    features: ["Vineyard", "Wine Cellar", "Guest Cottages", "Tasting Room", "Staff Quarters"],
    floor: null, parking: 6, photos: PHOTOS.villa,
  },
  {
    title: "3BR House — Claremont",
    description: "Well-appointed 3-bedroom family home in sought-after Claremont. Large garden, renovated kitchen, double garage, and excellent proximity to top schools including Bishops and SACS.",
    listing_type: "buy", property_type: "house",
    price: 6800000, currency: "ZAR",
    bedrooms: 3, bathrooms: 2, area_sqm: 220,
    city: "Cape Town", neighbourhood: "Claremont", address: "Main Road, Claremont",
    agent_name: "Thandi Dlamini", agent_phone: "+27 84 567 8901", agent_email: "thandi@habino.io",
    features: ["Garden", "Double Garage", "Alarm System", "Solar Panels", "Irrigation"],
    floor: null, parking: 2, photos: PHOTOS.house,
  },

  // ══════════════════════════════════════════════
  // SOUTH AFRICA — Johannesburg
  // ══════════════════════════════════════════════
  {
    title: "1BR Apartment — Sandton CBD",
    description: "Modern 1-bedroom apartment in a premium Sandton tower with gym, pool, and concierge. Walking distance to Sandton City Mall and Gautrain station. Ideal for professionals.",
    listing_type: "rent", property_type: "apartment",
    price: 16500, currency: "ZAR",
    bedrooms: 1, bathrooms: 1, area_sqm: 65,
    city: "Johannesburg", neighbourhood: "Sandton", address: "Rivonia Road, Sandton",
    agent_name: "Sipho Nkosi", agent_phone: "+27 72 678 9012", agent_email: "sipho@habino.io",
    features: ["Gym", "Pool", "Concierge", "Gautrain Access", "Secure Parking", "Generator"],
    floor: 18, parking: 1, photos: PHOTOS.modern,
  },
  {
    title: "5BR Cluster Home — Fourways",
    description: "Spacious 5-bedroom cluster home in a prestigious Fourways estate. Guest suite, entertainment area with built-in braai, solar system, and 3-car garage. Top security estate with 24hr guards.",
    listing_type: "buy", property_type: "house",
    price: 5200000, currency: "ZAR",
    bedrooms: 5, bathrooms: 4, area_sqm: 380,
    city: "Johannesburg", neighbourhood: "Fourways", address: "William Nicol Drive, Fourways",
    agent_name: "Lerato Molefe", agent_phone: "+27 73 789 0123", agent_email: "lerato@habino.io",
    features: ["Solar System", "Built-in Braai", "3-Car Garage", "Guest Suite", "Estate Security"],
    floor: null, parking: 3, photos: PHOTOS.house,
  },

  // ══════════════════════════════════════════════
  // TANZANIA — Dar es Salaam
  // ══════════════════════════════════════════════
  {
    title: "3BR Apartment — Masaki Peninsula",
    description: "Luxuriously appointed apartment in the prestigious Masaki Peninsula. High-end finishes, sea views, 24-hour concierge, and underground parking. Walking distance to fine dining and embassies.",
    listing_type: "rent", property_type: "apartment",
    price: 2800, currency: "USD",
    bedrooms: 3, bathrooms: 3, area_sqm: 140,
    city: "Dar es Salaam", neighbourhood: "Masaki", address: "Haile Selassie Road, Masaki",
    agent_name: "Ibrahim Juma", agent_phone: "+255 712 345 678", agent_email: "ibrahim@habino.io",
    features: ["Sea Views", "Concierge", "Underground Parking", "Gym", "Generator"],
    floor: 8, parking: 2, photos: PHOTOS.luxury,
  },
  {
    title: "Family Home — Mikocheni",
    description: "Spacious 4-bedroom family home in quiet Mikocheni B. Large compound with garden, domestic quarters, and double garage. Close to international schools and Slipway shopping centre.",
    listing_type: "buy", property_type: "house",
    price: 320000, currency: "USD",
    bedrooms: 4, bathrooms: 3, area_sqm: 320,
    city: "Dar es Salaam", neighbourhood: "Mikocheni", address: "Mikocheni B",
    agent_name: "Rose Mkumba", agent_phone: "+255 754 222 333", agent_email: "rose@habino.io",
    features: ["Garden", "Staff Quarters", "Double Garage", "Borehole", "Security"],
    floor: null, parking: 2, photos: PHOTOS.house,
  },
  {
    title: "Beach Cottage — Zanzibar Stone Town",
    description: "Charming 2-bedroom restored Swahili cottage steps from the Indian Ocean in Zanzibar Stone Town. Original coral architecture, rooftop terrace, and modern amenities. UNESCO World Heritage location.",
    listing_type: "buy", property_type: "house",
    price: 185000, currency: "USD",
    bedrooms: 2, bathrooms: 2, area_sqm: 110,
    city: "Dar es Salaam", neighbourhood: "Zanzibar Stone Town", address: "Hurumzi Street, Stone Town",
    agent_name: "Zuwena Omar", agent_phone: "+255 777 888 999", agent_email: "zuwena@habino.io",
    features: ["Rooftop Terrace", "Historic Architecture", "Ocean Views", "UNESCO Area"],
    floor: null, parking: 0, photos: PHOTOS.villa,
  },

  // ══════════════════════════════════════════════
  // UGANDA — Kampala
  // ══════════════════════════════════════════════
  {
    title: "3BR Apartment — Kololo Hill",
    description: "Premium 3-bedroom apartment on the prestigious Kololo Hill with panoramic views of Kampala. Spacious living areas, modern kitchen, backup power, and security. Minutes from international schools and embassies.",
    listing_type: "rent", property_type: "apartment",
    price: 2200, currency: "USD",
    bedrooms: 3, bathrooms: 2, area_sqm: 125,
    city: "Kampala", neighbourhood: "Kololo", address: "Acacia Avenue, Kololo",
    agent_name: "Ronald Ssekandi", agent_phone: "+256 774 123 456", agent_email: "ronald@habino.io",
    features: ["City Views", "Generator", "Security", "Parking", "Fibre Internet"],
    floor: 5, parking: 2, photos: PHOTOS.modern,
  },
  {
    title: "Commercial Building — Nakasero",
    description: "Fully tenanted 6-storey commercial building in Nakasero CBD generating strong rental income. Mix of offices, retail on ground floor. Well-maintained with generator and parking. Ideal institutional investment.",
    listing_type: "buy", property_type: "commercial",
    price: 2800000, currency: "USD",
    bedrooms: 0, bathrooms: 8, area_sqm: 1800,
    city: "Kampala", neighbourhood: "Nakasero", address: "Kampala Road, Nakasero",
    agent_name: "Patricia Namutebi", agent_phone: "+256 782 234 567", agent_email: "patricia@habino.io",
    features: ["Fully Tenanted", "Generator", "Parking", "Retail Ground Floor", "Title Deed"],
    floor: null, parking: 20, photos: PHOTOS.commercial,
  },

  // ══════════════════════════════════════════════
  // RWANDA — Kigali
  // ══════════════════════════════════════════════
  {
    title: "2BR Apartment — Kiyovu",
    description: "Modern 2-bedroom apartment in Kiyovu, Kigali's premier residential neighbourhood. City and valley views, fitted kitchen, backup power, and 24-hour security. Close to major business districts.",
    listing_type: "rent", property_type: "apartment",
    price: 1500, currency: "USD",
    bedrooms: 2, bathrooms: 2, area_sqm: 90,
    city: "Kigali", neighbourhood: "Kiyovu", address: "KN 5 Road, Kiyovu",
    agent_name: "Amina Uwimana", agent_phone: "+250 788 123 456", agent_email: "amina@habino.io",
    features: ["City Views", "Generator", "Security", "Parking", "DSTV"],
    floor: 4, parking: 1, photos: PHOTOS.apartment,
  },
  {
    title: "Smart Home — Rebero",
    description: "Contemporary 4-bedroom smart home on Rebero hill with spectacular panoramic views of Kigali. Solar energy, rainwater harvesting, smart home automation, landscaped garden and double garage.",
    listing_type: "buy", property_type: "house",
    price: 480000, currency: "USD",
    bedrooms: 4, bathrooms: 3, area_sqm: 300,
    city: "Kigali", neighbourhood: "Rebero", address: "KG 9 Avenue, Rebero",
    agent_name: "Jean-Pierre Habimana", agent_phone: "+250 722 234 567", agent_email: "jp@habino.io",
    features: ["Smart Home", "Solar Energy", "Rainwater Harvesting", "Panoramic Views", "Garden"],
    floor: null, parking: 2, photos: PHOTOS.modern,
  },

  // ══════════════════════════════════════════════
  // NIGERIA — Lagos
  // ══════════════════════════════════════════════
  {
    title: "2BR Apartment — Victoria Island",
    description: "Sleek 2-bedroom apartment on Victoria Island with Atlantic Ocean views. Open-plan living, modern kitchen, 24-hour security, and rooftop terrace access. Ideal for executives.",
    listing_type: "rent", property_type: "apartment",
    price: 4500000, currency: "NGN",
    bedrooms: 2, bathrooms: 2, area_sqm: 100,
    city: "Lagos", neighbourhood: "Victoria Island", address: "Adeola Odeku Street, VI",
    agent_name: "Emeka Okafor", agent_phone: "+234 803 456 789", agent_email: "emeka@habino.io",
    features: ["Ocean Views", "Rooftop Terrace", "24hr Security", "Gym", "Backup Power"],
    floor: 12, parking: 1, photos: PHOTOS.luxury,
  },
  {
    title: "5BR Detached House — Lekki Phase 1",
    description: "Magnificent 5-bedroom fully detached house in Lekki Phase 1. Private pool, home cinema, modern kitchen, boys' quarters, and 3-car garage. Perfect for upscale family living.",
    listing_type: "buy", property_type: "house",
    price: 380000000, currency: "NGN",
    bedrooms: 5, bathrooms: 5, area_sqm: 500,
    city: "Lagos", neighbourhood: "Lekki Phase 1", address: "Admiralty Way, Lekki Phase 1",
    agent_name: "Chinwe Adeyemi", agent_phone: "+234 806 111 222", agent_email: "chinwe@habino.io",
    features: ["Pool", "Home Cinema", "Boys Quarters", "3-Car Garage", "Smart Home"],
    floor: null, parking: 3, photos: PHOTOS.villa,
  },
  {
    title: "Studio — Yaba Tech Hub",
    description: "Compact furnished studio in the heart of Yaba, Lagos's tech hub. Walking distance to co-working spaces, tech companies, and the University of Lagos. Fast WiFi, 24hr power, and rooftop terrace.",
    listing_type: "rent", property_type: "apartment",
    price: 950000, currency: "NGN",
    bedrooms: 0, bathrooms: 1, area_sqm: 35,
    city: "Lagos", neighbourhood: "Yaba", address: "Herbert Macaulay Way, Yaba",
    agent_name: "Tunde Fashola", agent_phone: "+234 807 333 444", agent_email: "tunde@habino.io",
    features: ["Furnished", "24hr Power", "Fast WiFi", "Rooftop Terrace", "Co-working Nearby"],
    floor: 3, parking: 0, photos: PHOTOS.modern,
  },

  // ══════════════════════════════════════════════
  // GHANA — Accra
  // ══════════════════════════════════════════════
  {
    title: "3BR Apartment — East Legon",
    description: "Stylish 3-bedroom apartment in East Legon's most sought-after estate. Contemporary finishes, fitted kitchen, covered parking, and 24/7 security. Walking distance to East Legon Mall.",
    listing_type: "rent", property_type: "apartment",
    price: 3200, currency: "USD",
    bedrooms: 3, bathrooms: 2, area_sqm: 130,
    city: "Accra", neighbourhood: "East Legon", address: "American House, East Legon",
    agent_name: "Kwame Asante", agent_phone: "+233 24 567 890", agent_email: "kwame@habino.io",
    features: ["Fitted Kitchen", "Parking", "24hr Security", "Generator", "Swimming Pool"],
    floor: 4, parking: 2, photos: PHOTOS.apartment,
  },
  {
    title: "4BR Villa — Airport Residential",
    description: "Elegant 4-bedroom villa in Accra's prestigious Airport Residential area. Private pool, landscaped garden, boys' quarters, and double garage. Close to Kotoka International Airport and top international schools.",
    listing_type: "buy", property_type: "house",
    price: 850000, currency: "USD",
    bedrooms: 4, bathrooms: 4, area_sqm: 380,
    city: "Accra", neighbourhood: "Airport Residential", address: "Liberation Road, Airport Residential",
    agent_name: "Ama Boateng", agent_phone: "+233 20 123 456", agent_email: "ama@habino.io",
    features: ["Private Pool", "Garden", "Boys Quarters", "Double Garage", "Title Deed"],
    floor: null, parking: 2, photos: PHOTOS.villa,
  },

  // ══════════════════════════════════════════════
  // EGYPT — Cairo
  // ══════════════════════════════════════════════
  {
    title: "3BR Apartment — New Cairo",
    description: "Contemporary 3-bedroom apartment in the prestigious Fifth Settlement, New Cairo. Compound living with pool, gym, and tennis court. Close to Cairo Festival City Mall and AUC campus.",
    listing_type: "rent", property_type: "apartment",
    price: 25000, currency: "EGP",
    bedrooms: 3, bathrooms: 2, area_sqm: 150,
    city: "Cairo", neighbourhood: "New Cairo", address: "Fifth Settlement, New Cairo",
    agent_name: "Mohamed El-Sayed", agent_phone: "+20 100 234 5678", agent_email: "mohamed@habino.io",
    features: ["Compound", "Pool", "Gym", "Tennis Court", "Covered Parking", "24hr Security"],
    floor: 3, parking: 1, photos: PHOTOS.modern,
  },
  {
    title: "Penthouse — Zamalek Island",
    description: "Exceptional penthouse on Zamalek Island with sweeping Nile views and panoramic views of Cairo's skyline. 4 bedrooms, wraparound terrace, private jacuzzi, and premium finishes. The ultimate Cairo address.",
    listing_type: "buy", property_type: "apartment",
    price: 18000000, currency: "EGP",
    bedrooms: 4, bathrooms: 3, area_sqm: 280,
    city: "Cairo", neighbourhood: "Zamalek", address: "26th of July Street, Zamalek",
    agent_name: "Yasmine Hassan", agent_phone: "+20 101 345 6789", agent_email: "yasmine@habino.io",
    features: ["Nile Views", "Wraparound Terrace", "Jacuzzi", "Premium Finishes", "Doorman"],
    floor: 12, parking: 2, photos: PHOTOS.luxury,
  },

  // ══════════════════════════════════════════════
  // MOROCCO — Casablanca & Marrakech
  // ══════════════════════════════════════════════
  {
    title: "2BR Apartment — Casablanca Anfa",
    description: "Elegant 2-bedroom apartment in Casablanca's Anfa neighbourhood, overlooking the Atlantic. High-end building with concierge, gym, and rooftop pool. Prime location near the iconic Hassan II Mosque.",
    listing_type: "rent", property_type: "apartment",
    price: 18000, currency: "MAD",
    bedrooms: 2, bathrooms: 2, area_sqm: 100,
    city: "Casablanca", neighbourhood: "Anfa", address: "Boulevard d'Anfa",
    agent_name: "Rachid Benali", agent_phone: "+212 661 234 567", agent_email: "rachid@habino.io",
    features: ["Ocean Views", "Concierge", "Rooftop Pool", "Gym", "Secured Parking"],
    floor: 8, parking: 1, photos: PHOTOS.luxury,
  },
  {
    title: "Riad — Marrakech Medina",
    description: "Exquisite 5-bedroom riad in the heart of the Marrakech Medina. Fully restored with traditional zellige tilework, central fountain courtyard, rooftop terrace, plunge pool, and a working hammam. Turnkey rental income.",
    listing_type: "buy", property_type: "house",
    price: 4200000, currency: "MAD",
    bedrooms: 5, bathrooms: 5, area_sqm: 350,
    city: "Marrakech", neighbourhood: "Medina", address: "Derb Chorfa, Medina",
    agent_name: "Fatima Zahra", agent_phone: "+212 662 345 678", agent_email: "fatima@habino.io",
    features: ["Courtyard", "Plunge Pool", "Hammam", "Rooftop Terrace", "Historic Architecture"],
    floor: null, parking: 0, photos: PHOTOS.villa,
  },

  // ══════════════════════════════════════════════
  // UAE — Dubai (for diaspora/international)
  // ══════════════════════════════════════════════
  {
    title: "1BR Studio — Dubai Marina",
    description: "Bright 1-bedroom apartment with marina views in a premium Dubai Marina tower. Access to beach, infinity pool, and gym. Close to the Walk and Bluewaters Island. Ideal for professionals and investors.",
    listing_type: "rent", property_type: "apartment",
    price: 7500, currency: "AED",
    bedrooms: 1, bathrooms: 1, area_sqm: 65,
    city: "Dubai", neighbourhood: "Dubai Marina", address: "Marina Walk, Dubai Marina",
    agent_name: "Omar Al-Farsi", agent_phone: "+971 50 123 4567", agent_email: "omar@habino.io",
    features: ["Marina Views", "Beach Access", "Infinity Pool", "Gym", "Concierge"],
    floor: 22, parking: 1, photos: PHOTOS.luxury,
  },
];

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting Habino demo seed...\n");
  console.log(`📦 Total listings to seed: ${DEMO_LISTINGS.length}\n`);

  // 1. Get or create a default tenant
  let { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", "demo")
    .single();

  if (!tenant) {
    const { data: newTenant, error } = await supabase
      .from("tenants")
      .insert({ name: "Habino Demo", slug: "demo", is_active: true })
      .select("id, name")
      .single();

    if (error) {
      console.error("❌ Could not create tenant:", error.message);
      console.log("💡 Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local");
      process.exit(1);
    }
    tenant = newTenant!;
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})\n`);
  } else {
    console.log(`✅ Using existing tenant: ${tenant.name} (${tenant.id})\n`);
  }

  // 2. Seed properties
  let created = 0;
  let skipped = 0;
  let failed  = 0;

  for (const listing of DEMO_LISTINGS) {
    const { photos, ...data } = listing as typeof listing & { photos: string[] };

    // Check if already exists (by title)
    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("title", data.title)
      .single();

    if (existing) {
      console.log(`  ⏭  Skip: ${data.title}`);
      skipped++;
      continue;
    }

    // Insert property
    const { data: property, error } = await supabase
      .from("properties")
      .insert({ ...data, tenant_id: tenant.id, status: "active" })
      .select("id")
      .single();

    if (error || !property) {
      console.error(`  ❌ Failed: ${data.title}`, error?.message);
      failed++;
      continue;
    }

    // Insert photos
    for (let i = 0; i < photos.length; i++) {
      await supabase.from("property_images").insert({
        property_id: property.id,
        url:         photos[i],
        sort_order:  i,
      });
    }

    console.log(`  ✅ ${data.city} — ${data.title}`);
    created++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`🎉 Done! ${created} created · ${skipped} skipped · ${failed} failed`);
  console.log(`\n💡 Open your Habino app — the Markt page should now be full.`);
}

main().catch((e) => { console.error("Fatal error:", e); process.exit(1); });
