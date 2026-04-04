/**
 * seed-brokers.ts
 * 1. Creates broker_profiles table (via upsert approach)
 * 2. Seeds 100 broker profiles
 * 3. Assigns brokers to existing properties (agent_name + agent_phone + agent_email)
 *
 * Run: npx tsx scripts/seed-brokers.ts
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
const FIRST_NAMES = [
  "Yonas","Abel","Eyob","Henok","Meron","Liya","Ermias","Selamawit","Natnael","Makda",
  "Eden","Robel","Mihret","Dawit","Tigist","Selam","Biruk","Hana","Solomon","Kalkidan",
  "Bereket","Tsion","Tekle","Almaz","Girma","Yeshi","Tesfaye","Mekdes","Amanuel","Bethel",
  "Ahmed","Grace","James","Fatima","David","Sophie","Priya","Carlos","Maria","Amara",
  "Kidane","Meseret","Hailu","Worknesh","Teshome","Azeb","Mulugeta","Yewubdar","Fikadu","Senait",
  "Habtamu","Tigist","Adane","Genet","Kassaye","Hirut","Tadesse","Frehiwot","Abreham","Tinsae",
  "Mintesinot","Emnet","Getahun","Lidya","Mesfin","Mulu","Tesfaw","Konjit","Debebe","Tigabu",
  "Miriam","Daniel","Sarah","Michael","Rebecca","Joshua","Naomi","Elijah","Ruth","Caleb",
  "Amir","Leila","Hassan","Yasmin","Omar","Nadia","Karim","Fatou","Ibrahima","Aminata",
  "Wondwossen","Bisrat","Negash","Tiruwork","Desalegn","Meklit","Assefa","Aziza","Fekadu","Yordanos",
];

const LAST_NAMES = [
  "Kebede","Zegeye","Alemu","Tadesse","Habtamu","Girma","Tesfaye","Bekele","Mekonen","Berhane",
  "Haile","Mengistu","Desta","Worku","Negash","Teshome","Asfaw","Getachew","Mulugeta","Wolde",
  "Assefa","Demeke","Legesse","Bogale","Hunegnaw","Tilahun","Yimer","Gizaw","Teklu","Mitiku",
  "Al-Rashid","Osei","Mwangi","Müller","Santos","Rodrigues","Al-Hassan","Diallo","Amoah","Sharma",
  "Tsegaye","Abebe","Woldemariam","Haregot","Gebremedhin","Tefera","Beyene","Kassa","Mehari","Nega",
];

const AGENCIES = [
  "Addis Prime Realty","Bole Property Group","Ethiopian Real Estate Hub","Capital City Properties",
  "Sunshine Homes ET","CMC Property Advisors","Kazanchis Real Estate","Green Valley Properties",
  "Addis Investment Group","Premier Properties ET","Sky High Realty","Golden Gate Properties",
  "Metro Homes Addis","Continental Properties","Horizon Real Estate","Atlas Property Group",
  "Landmark Realty ET","City Center Properties","Summit Real Estate","Pinnacle Homes",
  "Independent","Independent","Independent","Independent","Independent",
];

const SPECIALITIES = [
  ["residential"],["commercial"],["residential","commercial"],["villa","luxury"],
  ["land","plot"],["office","commercial"],["residential","rental"],["investment"],
  ["residential","villa"],["commercial","office"],
];

const DISTRICTS = [
  "Bole","CMC","Kazanchis","Sarbet","Piassa","Megenagna","Yeka","Gullele",
  "Kotebe","Lafto","Kirkos","Arada","Lideta","Nifas Silk","Kolfe",
];

const LANGUAGES = [
  ["Amharic","English"],["Amharic","English","Oromo"],["Amharic"],
  ["Amharic","English","Arabic"],["English","Amharic"],["Amharic","Tigrinya"],
];

const BIOS = [
  "Experienced real estate professional with deep knowledge of the Addis Ababa market. Specialising in residential and commercial properties across the city.",
  "Passionate about helping families find their dream home in Addis. Over 5 years of experience in property sales and rentals.",
  "Former architect turned property consultant. I bring a unique perspective to every transaction, helping clients understand the true potential of a space.",
  "Specialising in luxury villas and high-end residential properties. My network of qualified buyers and sellers ensures smooth, fast transactions.",
  "Commercial property expert with strong connections in Bole, Kazanchis, and the CBD. Office spaces, retail, and investment properties are my specialty.",
  "Multilingual property advisor serving expat communities and international investors in Addis Ababa since 2019.",
  "Land and development specialist. I help investors identify prime plots and guide them through the acquisition process from start to finish.",
  "Rental market expert. Whether you're looking for a monthly apartment or a long-term lease, I can find the right option at the right price.",
  "Young, dynamic agent with a digital-first approach. I leverage technology to give clients the best market data and fastest response times.",
  "Family property specialist. I understand that a home is more than bricks and mortar — it's where memories are made.",
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

function pick<T>(arr: T[], seed: number): T { return arr[seed % arr.length]; }
function rand(min: number, max: number, seed: number): number {
  return min + (seed % (max - min + 1));
}

async function main() {
  // 1. Get tenant
  const { data: tenant } = await sb.from("tenants").select("id").eq("is_active", true).limit(1).single();
  if (!tenant) { console.error("No active tenant"); process.exit(1); }
  const tenantId = tenant.id;

  // 2. Clear existing brokers
  await sb.from("broker_profiles").delete().eq("tenant_id", tenantId);
  console.log("Cleared existing broker profiles.");

  // 3. Build 100 broker profiles
  const brokers = Array.from({ length: 100 }, (_, i) => {
    const firstName = pick(FIRST_NAMES, i * 7 + 3);
    const lastName  = pick(LAST_NAMES, i * 11 + 5);
    const fullName  = `${firstName} ${lastName}`;
    const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g,"")}@${pick(["habino.app","gmail.com","yahoo.com","realtyaddis.com"], i)}`;
    const phone     = `+2519${String(10000000 + (i * 9337 + 12345) % 90000000).padStart(8,"0")}`;
    const coverDistricts = [
      pick(DISTRICTS, i),
      pick(DISTRICTS, i + 4),
      pick(DISTRICTS, i + 8),
    ].filter((v, idx, arr) => arr.indexOf(v) === idx);

    return {
      tenant_id:      tenantId,
      full_name:      fullName,
      email,
      phone,
      whatsapp:       phone,
      avatar_url:     pick(AVATAR_PHOTOS, i),
      bio:            pick(BIOS, i),
      agency:         pick(AGENCIES, i),
      speciality:     pick(SPECIALITIES, i),
      districts:      coverDistricts,
      languages:      pick(LANGUAGES, i),
      verified:       i % 5 !== 0, // 80% verified
      verified_score: rand(60, 95, i * 13),
      listings_count: rand(2, 45, i * 7),
      rating:         Number((3.5 + (i % 16) * 0.1).toFixed(2)),
      reviews_count:  rand(3, 87, i * 11),
      years_exp:      rand(1, 15, i * 3),
    };
  });

  // 4. Insert brokers
  const { data: inserted, error: insErr } = await sb
    .from("broker_profiles")
    .insert(brokers)
    .select("id, full_name");

  if (insErr) {
    console.error("Insert error:", insErr.message);
    console.log("The broker_profiles table may not exist yet.");
    console.log("Please run the SQL migration first via Supabase Dashboard:");
    console.log("  https://supabase.com/dashboard/project/ikubxgsptautubecukoi/sql/new");
    console.log("  File: supabase/migrations/20260404_profile_score.sql");
    process.exit(1);
  }
  console.log(`✓ Inserted ${inserted?.length} broker profiles.`);

  // 5. Fetch all active properties
  const allProps: { id: string }[] = [];
  let from = 0;
  while (true) {
    const { data } = await sb
      .from("properties")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    allProps.push(...(data as { id: string }[]));
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Found ${allProps.length} properties to assign brokers to.`);

  // 6. Assign brokers to properties (round-robin by index)
  const brokerList = brokers.map((b, i) => ({
    name: b.full_name,
    phone: b.phone,
    email: b.email,
  }));

  // Batch update properties with agent info
  const updates = allProps.map((p, i) => {
    const b = brokerList[i % brokerList.length];
    return { id: p.id, agent_name: b.name, agent_phone: b.phone, agent_email: b.email };
  });

  let updated = 0;
  for (let i = 0; i < updates.length; i += 500) {
    const batch = updates.slice(i, i + 500);
    // Upsert just the agent fields
    await Promise.all(batch.map(u =>
      sb.from("properties").update({
        agent_name: u.agent_name,
        agent_phone: u.agent_phone,
        agent_email: u.agent_email,
      }).eq("id", u.id)
    ));
    updated += batch.length;
    process.stdout.write(`\r  Assigned brokers to ${updated}/${allProps.length} properties...`);
  }
  console.log(`\n✓ All properties assigned to brokers.`);
}

main().catch(console.error);
