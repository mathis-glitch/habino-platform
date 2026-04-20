/**
 * seed-cities.ts
 *
 * Seeds the cities + districts tables for multi-market support.
 * Cities: Addis Ababa, Nairobi, Dar es Salaam
 *
 * Usage:  npx tsx scripts/seed-cities.ts
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── City definitions ────────────────────────────────────────

interface CityDef {
  name: string;
  country: string;
  country_code: string;
  currency: string;
  lat: number;
  lng: number;
  zoom: number;
  bounds_sw: [number, number];
  bounds_ne: [number, number];
}

interface DistrictDef {
  name: string;
  lat: number;
  lng: number;
  aliases?: string[];
  is_major?: boolean;
}

const CITIES: Record<string, { city: CityDef; districts: DistrictDef[] }> = {
  addis: {
    city: {
      name: "Addis Ababa",
      country: "Ethiopia",
      country_code: "ET",
      currency: "ETB",
      lat: 9.0192,
      lng: 38.7525,
      zoom: 13,
      bounds_sw: [8.82, 38.60],
      bounds_ne: [9.15, 38.95],
    },
    districts: [
      { name: "Bole", lat: 8.9806, lng: 38.7578, is_major: true },
      { name: "Kazanchis", lat: 9.0144, lng: 38.7636, is_major: true },
      { name: "CMC", lat: 9.0322, lng: 38.8164, is_major: true },
      { name: "Sarbet", lat: 9.0172, lng: 38.7423, aliases: ["Sar Bet"] },
      { name: "Megenagna", lat: 9.0214, lng: 38.7883, is_major: true },
      { name: "Gerji", lat: 9.0056, lng: 38.8050 },
      { name: "Piassa", lat: 9.0339, lng: 38.7476, is_major: true },
      { name: "Merkato", lat: 9.0367, lng: 38.7311, is_major: true },
      { name: "Lideta", lat: 9.0122, lng: 38.7322 },
      { name: "Arada", lat: 9.0356, lng: 38.7478, is_major: true },
      { name: "Kolfe Keranio", lat: 9.0211, lng: 38.6933, aliases: ["Kolfe"] },
      { name: "Nifas Silk-Lafto", lat: 8.9578, lng: 38.7367, aliases: ["Nifas Silk", "Lafto"], is_major: true },
      { name: "Yeka", lat: 9.0450, lng: 38.8050, is_major: true },
      { name: "Akaki Kality", lat: 8.8900, lng: 38.7561, aliases: ["Akaki"] },
      { name: "Kirkos", lat: 9.0044, lng: 38.7533, is_major: true },
      { name: "Addis Ketema", lat: 9.0322, lng: 38.7350 },
      { name: "Gulele", lat: 9.0622, lng: 38.7417, aliases: ["Gullele"] },
      { name: "Kotebe", lat: 9.0433, lng: 38.8167 },
      { name: "Summit", lat: 9.0283, lng: 38.7978 },
      { name: "Ayat", lat: 9.0356, lng: 38.8536, is_major: true },
      { name: "Lebu", lat: 8.9539, lng: 38.7078 },
      { name: "Jemo", lat: 8.9481, lng: 38.7156 },
      { name: "Saris", lat: 8.9522, lng: 38.7478 },
      { name: "Gotera", lat: 8.9878, lng: 38.7522 },
      { name: "Mexico", lat: 9.0072, lng: 38.7478, aliases: ["Mexico Square"] },
      { name: "Arat Kilo", lat: 9.0389, lng: 38.7556, is_major: true },
      { name: "Sidist Kilo", lat: 9.0433, lng: 38.7589 },
      { name: "Bole Medhanialem", lat: 8.9961, lng: 38.7856, aliases: ["Medhanialem"] },
      { name: "Atlas", lat: 9.0033, lng: 38.7722 },
      { name: "Urael", lat: 9.0094, lng: 38.7644 },
      { name: "Hayahulet", lat: 9.0283, lng: 38.7656, aliases: ["Hayahulet Mazoria"] },
      { name: "22 Mazoria", lat: 9.0194, lng: 38.7600 },
    ],
  },

  nairobi: {
    city: {
      name: "Nairobi",
      country: "Kenya",
      country_code: "KE",
      currency: "KES",
      lat: -1.2921,
      lng: 36.8219,
      zoom: 13,
      bounds_sw: [-1.45, 36.65],
      bounds_ne: [-1.13, 37.00],
    },
    districts: [
      { name: "Westlands", lat: -1.2673, lng: 36.8117, is_major: true },
      { name: "Karen", lat: -1.3228, lng: 36.7117, is_major: true },
      { name: "Kilimani", lat: -1.2894, lng: 36.7856, is_major: true },
      { name: "Lavington", lat: -1.2797, lng: 36.7711, is_major: true },
      { name: "Langata", lat: -1.3511, lng: 36.7444, is_major: true },
      { name: "Kileleshwa", lat: -1.2783, lng: 36.7878 },
      { name: "Runda", lat: -1.2183, lng: 36.8200, is_major: true },
      { name: "Muthaiga", lat: -1.2494, lng: 36.8344 },
      { name: "Parklands", lat: -1.2617, lng: 36.8183, is_major: true },
      { name: "Upper Hill", lat: -1.2981, lng: 36.8117, is_major: true },
      { name: "CBD", lat: -1.2864, lng: 36.8233, aliases: ["City Centre", "Central"], is_major: true },
      { name: "Eastleigh", lat: -1.2728, lng: 36.8533 },
      { name: "South B", lat: -1.3092, lng: 36.8378 },
      { name: "South C", lat: -1.3183, lng: 36.8256 },
      { name: "Kasarani", lat: -1.2211, lng: 36.8978, is_major: true },
      { name: "Ruaka", lat: -1.2078, lng: 36.7806, is_major: true },
      { name: "Kitisuru", lat: -1.2328, lng: 36.7828 },
      { name: "Spring Valley", lat: -1.2589, lng: 36.7817 },
      { name: "Hurlingham", lat: -1.2939, lng: 36.7939 },
      { name: "Gigiri", lat: -1.2356, lng: 36.8089, is_major: true },
      { name: "Rosslyn", lat: -1.2250, lng: 36.7917 },
      { name: "Loresho", lat: -1.2467, lng: 36.7644 },
      { name: "Ngong Road", lat: -1.2989, lng: 36.7722 },
      { name: "Thika Road", lat: -1.2233, lng: 36.8711, aliases: ["Thika Rd"] },
      { name: "Donholm", lat: -1.2978, lng: 36.8839 },
      { name: "Embakasi", lat: -1.3150, lng: 36.8944, is_major: true },
      { name: "Athi River", lat: -1.4536, lng: 36.9811, aliases: ["Mavoko"] },
      { name: "Syokimau", lat: -1.3756, lng: 36.9417 },
      { name: "Kilimani North", lat: -1.2800, lng: 36.7878 },
      { name: "Riverside", lat: -1.2767, lng: 36.8044 },
    ],
  },

  dar: {
    city: {
      name: "Dar es Salaam",
      country: "Tanzania",
      country_code: "TZ",
      currency: "TZS",
      lat: -6.7924,
      lng: 39.2083,
      zoom: 13,
      bounds_sw: [-6.95, 39.05],
      bounds_ne: [-6.65, 39.40],
    },
    districts: [
      { name: "Masaki", lat: -6.7494, lng: 39.2756, is_major: true },
      { name: "Oyster Bay", lat: -6.7544, lng: 39.2656, is_major: true, aliases: ["Oysterbay"] },
      { name: "Mikocheni", lat: -6.7656, lng: 39.2544, is_major: true },
      { name: "Msasani", lat: -6.7533, lng: 39.2617, is_major: true },
      { name: "Kariakoo", lat: -6.8178, lng: 39.2744, is_major: true },
      { name: "Kinondoni", lat: -6.7744, lng: 39.2428, is_major: true },
      { name: "Sinza", lat: -6.7828, lng: 39.2350 },
      { name: "Kijitonyama", lat: -6.7856, lng: 39.2483 },
      { name: "Ubungo", lat: -6.7928, lng: 39.2094, is_major: true },
      { name: "Mwenge", lat: -6.7711, lng: 39.2250, is_major: true },
      { name: "Tegeta", lat: -6.6778, lng: 39.2339, is_major: true },
      { name: "Mbezi Beach", lat: -6.6917, lng: 39.2161, is_major: true },
      { name: "Ilala", lat: -6.8267, lng: 39.2567, is_major: true },
      { name: "Temeke", lat: -6.8611, lng: 39.2667, is_major: true },
      { name: "Kurasini", lat: -6.8439, lng: 39.2833 },
      { name: "Tabata", lat: -6.8211, lng: 39.2283 },
      { name: "Magomeni", lat: -6.8022, lng: 39.2656 },
      { name: "Upanga", lat: -6.8050, lng: 39.2844, is_major: true },
      { name: "Pugu Road", lat: -6.8289, lng: 39.2039, aliases: ["Pugu"] },
      { name: "Changanyikeni", lat: -6.8233, lng: 39.2156 },
      { name: "Kimara", lat: -6.7900, lng: 39.1894 },
      { name: "Mbagala", lat: -6.8678, lng: 39.2622 },
      { name: "Kawe", lat: -6.7350, lng: 39.2367 },
      { name: "Kunduchi", lat: -6.6700, lng: 39.2150, is_major: true },
      { name: "City Centre", lat: -6.8133, lng: 39.2889, aliases: ["CBD", "Downtown"], is_major: true },
      { name: "Regent Estate", lat: -6.7867, lng: 39.2611 },
      { name: "Ada Estate", lat: -6.7911, lng: 39.2767 },
      { name: "Mzimuni", lat: -6.8200, lng: 39.2750 },
    ],
  },
};

async function main() {
  // Get the first active tenant
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (tErr || !tenant) {
    console.error("No active tenant found:", tErr?.message);
    process.exit(1);
  }

  console.log(`Tenant: ${tenant.id}\n`);

  for (const [key, { city, districts }] of Object.entries(CITIES)) {
    console.log(`── ${city.name} ──`);

    // Upsert city
    const { data: cityRow, error: cErr } = await supabase
      .from("cities")
      .upsert(
        {
          tenant_id: tenant.id,
          name: city.name,
          country: city.country,
          country_code: city.country_code,
          currency: city.currency,
          lat: city.lat,
          lng: city.lng,
          zoom: city.zoom,
          bounds_sw: city.bounds_sw,
          bounds_ne: city.bounds_ne,
          is_active: true,
        },
        { onConflict: "tenant_id,name" },
      )
      .select("id")
      .single();

    if (cErr || !cityRow) {
      console.error(`  Failed to upsert city ${city.name}:`, cErr?.message);
      continue;
    }

    console.log(`  City ID: ${cityRow.id}`);

    // Upsert districts in batches
    const rows = districts.map((d) => ({
      city_id: cityRow.id,
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      aliases: d.aliases ?? [],
      is_major: d.is_major ?? false,
    }));

    const { error: dErr } = await supabase
      .from("districts")
      .upsert(rows, { onConflict: "city_id,name" });

    if (dErr) {
      console.error(`  Failed to upsert districts:`, dErr.message);
    } else {
      console.log(`  ${districts.length} districts seeded`);
    }
  }

  console.log("\nDone.");
}

main();
