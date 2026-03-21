/**
 * Habino — GeoNames City Data Preparation Script
 *
 * Downloads the GeoNames cities15000 dataset (~26 000 cities worldwide,
 * population ≥ 15 000, public domain) and converts it to the compact
 * TypeScript format used by seed-world-listings.ts.
 *
 * Run ONCE from your local machine (requires internet):
 *   npx tsx scripts/prepare-geonames.ts
 *
 * Output: scripts/city-data-geonames.ts  (~20 000 cities)
 *
 * After running this script, re-run:
 *   npx tsx scripts/seed-world-listings.ts
 */

import https   from "https";
import fs      from "fs";
import path    from "path";
import zlib    from "zlib";
import { execSync } from "child_process";

const OUT_FILE  = path.join(__dirname, "city-data-geonames.ts");
const ZIP_URL   = "https://download.geonames.org/export/dump/cities15000.zip";
const TMP_ZIP   = path.join(__dirname, "_cities15000.zip");
const TMP_TXT   = path.join(__dirname, "_cities15000.txt");

// ── Country → currency (ISO 4217) ────────────────────────────────────────────
// Source: ISO 3166 + Wikipedia — covers ~250 country codes
const COUNTRY_CURRENCY: Record<string, string> = {
  AD:"EUR",AE:"AED",AF:"AFN",AG:"XCD",AI:"XCD",AL:"ALL",AM:"AMD",AO:"AOA",
  AR:"ARS",AS:"USD",AT:"EUR",AU:"AUD",AW:"AWG",AZ:"AZN",BA:"BAM",BB:"BBD",
  BD:"BDT",BE:"EUR",BF:"XOF",BG:"BGN",BH:"BHD",BI:"BIF",BJ:"XOF",BL:"EUR",
  BM:"BMD",BN:"BND",BO:"BOB",BQ:"USD",BR:"BRL",BS:"BSD",BT:"BTN",BW:"BWP",
  BY:"BYR",BZ:"BZD",CA:"CAD",CC:"AUD",CD:"CDF",CF:"XAF",CG:"XAF",CH:"CHF",
  CI:"XOF",CK:"NZD",CL:"CLP",CM:"XAF",CN:"CNY",CO:"COP",CR:"CRC",CU:"CUP",
  CV:"CVE",CW:"ANG",CX:"AUD",CY:"EUR",CZ:"CZK",DE:"EUR",DJ:"DJF",DK:"DKK",
  DM:"XCD",DO:"DOP",DZ:"DZD",EC:"USD",EE:"EUR",EG:"EGP",EH:"MAD",ER:"ERN",
  ES:"EUR",ET:"ETB",FI:"EUR",FJ:"FJD",FK:"FKP",FM:"USD",FO:"DKK",FR:"EUR",
  GA:"XAF",GB:"GBP",GD:"XCD",GE:"GEL",GF:"EUR",GG:"GBP",GH:"GHS",GI:"GIP",
  GL:"DKK",GM:"GMD",GN:"GNF",GP:"EUR",GQ:"XAF",GR:"EUR",GT:"GTQ",GU:"USD",
  GW:"XOF",GY:"GYD",HK:"HKD",HN:"HNL",HR:"EUR",HT:"HTG",HU:"HUF",ID:"IDR",
  IE:"EUR",IL:"ILS",IM:"GBP",IN:"INR",IO:"USD",IQ:"IQD",IR:"IRR",IS:"ISK",
  IT:"EUR",JE:"GBP",JM:"JMD",JO:"JOD",JP:"JPY",KE:"KES",KG:"KGS",KH:"KHR",
  KI:"AUD",KM:"KMF",KN:"XCD",KP:"KPW",KR:"KRW",KW:"KWD",KY:"KYD",KZ:"KZT",
  LA:"LAK",LB:"LBP",LC:"XCD",LI:"CHF",LK:"LKR",LR:"LRD",LS:"LSL",LT:"EUR",
  LU:"EUR",LV:"EUR",LY:"LYD",MA:"MAD",MC:"EUR",MD:"MDL",ME:"EUR",MF:"EUR",
  MG:"MGA",MH:"USD",MK:"MKD",ML:"XOF",MM:"MMK",MN:"MNT",MO:"MOP",MP:"USD",
  MQ:"EUR",MR:"MRU",MS:"XCD",MT:"EUR",MU:"MUR",MV:"MVR",MW:"MWK",MX:"MXN",
  MY:"MYR",MZ:"MZN",NA:"NAD",NC:"XPF",NE:"XOF",NF:"AUD",NG:"NGN",NI:"NIO",
  NL:"EUR",NO:"NOK",NP:"NPR",NR:"AUD",NU:"NZD",NZ:"NZD",OM:"OMR",PA:"PAB",
  PE:"PEN",PF:"XPF",PG:"PGK",PH:"PHP",PK:"PKR",PL:"PLN",PM:"EUR",PN:"NZD",
  PR:"USD",PS:"ILS",PT:"EUR",PW:"USD",PY:"PYG",QA:"QAR",RE:"EUR",RO:"RON",
  RS:"RSD",RU:"RUB",RW:"RWF",SA:"SAR",SB:"SBD",SC:"SCR",SD:"SDG",SE:"SEK",
  SG:"SGD",SH:"SHP",SI:"EUR",SJ:"NOK",SK:"EUR",SL:"SLL",SM:"EUR",SN:"XOF",
  SO:"SOS",SR:"SRD",SS:"SSP",ST:"STN",SV:"USD",SX:"ANG",SY:"SYP",SZ:"SZL",
  TC:"USD",TD:"XAF",TF:"EUR",TG:"XOF",TH:"THB",TJ:"TJS",TK:"NZD",TL:"USD",
  TM:"TMT",TN:"TND",TO:"TOP",TR:"TRY",TT:"TTD",TV:"AUD",TW:"TWD",TZ:"TZS",
  UA:"UAH",UG:"UGX",UM:"USD",US:"USD",UY:"UYU",UZ:"UZS",VA:"EUR",VC:"XCD",
  VE:"VES",VG:"USD",VI:"USD",VN:"VND",VU:"VUV",WF:"XPF",WS:"WST",YE:"YER",
  YT:"EUR",ZA:"ZAR",ZM:"ZMW",ZW:"USD",
};

// ── Country → base priceIndex (1–8) — adjusted up for large/wealthy cities ───
// Based on World Bank income groups + regional cost-of-living estimates
const COUNTRY_BASE_PI: Record<string, number> = {
  // High income
  US:9,CH:9,NO:9,DK:8,SE:8,AU:8,NZ:8,GB:8,IE:8,IS:8,SG:9,JP:8,
  HK:9,LU:8,NL:8,BE:8,AT:8,FI:8,FR:8,DE:8,CA:8,IT:7,ES:7,PT:6,
  GR:6,CY:6,MT:6,CZ:6,SK:6,SI:6,EE:6,LV:5,LT:5,HR:5,PL:5,HU:5,
  IL:8,AE:9,QA:9,KW:8,BH:7,OM:7,SA:7,KR:7,TW:7,
  // Upper middle income
  BR:6,MX:6,AR:5,CL:6,CO:5,ZA:6,TR:5,RU:6,CN:7,TH:5,MY:6,
  RO:5,BG:5,RS:4,ME:4,BA:4,MK:4,AL:3,
  // Lower middle income
  IN:5,VN:4,PH:4,ID:4,EG:4,MA:4,NG:5,KE:5,GH:4,TN:4,JO:5,
  LB:5,IQ:4,PK:3,BD:3,MM:3,KH:3,LA:3,
  // Low income
  ET:3,UG:3,TZ:3,RW:3,MZ:3,ZM:3,ZW:3,SD:3,
};

function getBasePI(cc: string): number {
  return COUNTRY_BASE_PI[cc] ?? 4;
}

// Population → bonus priceIndex (0–2 extra points for very large cities)
function popBonus(pop: number): number {
  if (pop >= 5_000_000) return 2;
  if (pop >= 1_000_000) return 1;
  return 0;
}

// ── Download helper ───────────────────────────────────────────────────────────
function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (e) => { fs.unlinkSync(dest); reject(e); });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📥 Downloading GeoNames cities15000 (~8 MB)…");
  await download(ZIP_URL, TMP_ZIP);
  console.log("   ✅ Downloaded.");

  console.log("📦 Unzipping…");
  execSync(`unzip -o "${TMP_ZIP}" -d "${__dirname}" cities15000.txt`);
  fs.renameSync(path.join(__dirname, "cities15000.txt"), TMP_TXT);
  fs.unlinkSync(TMP_ZIP);
  console.log("   ✅ Unzipped.");

  console.log("🔄 Parsing + converting to TypeScript…");
  const raw = fs.readFileSync(TMP_TXT, "utf8");
  fs.unlinkSync(TMP_TXT);

  const lines = raw.split("\n").filter(Boolean);
  console.log(`   ${lines.length.toLocaleString()} city rows found.`);

  type CityRow = { name: string; cc: string; lat: number; lng: number; pop: number };
  const cities: CityRow[] = [];

  for (const line of lines) {
    const cols = line.split("\t");
    // GeoNames columns: 0=id,1=name,2=asciiname,3=alt,4=lat,5=lng,
    //                   6=feat_class,7=feat_code,8=cc,...,14=population
    if (cols.length < 15) continue;
    const featureClass = cols[6];
    if (featureClass !== "P") continue; // only populated places

    const name = cols[1].trim();
    const cc   = cols[8].trim().toUpperCase();
    const lat  = parseFloat(cols[4]);
    const lng  = parseFloat(cols[5]);
    const pop  = parseInt(cols[14]) || 0;
    if (isNaN(lat) || isNaN(lng) || !name) continue;

    cities.push({ name, cc, lat, lng, pop });
  }

  // Sort by population desc, deduplicate same name+country
  cities.sort((a, b) => b.pop - a.pop);
  const seen = new Set<string>();
  const unique: CityRow[] = [];
  for (const c of cities) {
    const key = `${c.name.toLowerCase()}|${c.cc}`;
    if (!seen.has(key)) { seen.add(key); unique.push(c); }
  }

  console.log(`   ${unique.length.toLocaleString()} unique cities after dedup.`);

  // Convert to compact format
  const lines_out: string[] = [];
  for (const c of unique) {
    const currency = COUNTRY_CURRENCY[c.cc] ?? "USD";
    const pi = Math.min(10, getBasePI(c.cc) + popBonus(c.pop));
    const lat = parseFloat(c.lat.toFixed(4));
    const lng = parseFloat(c.lng.toFixed(4));
    // Escape any double quotes in city names
    const name = c.name.replace(/"/g, '\\"');
    lines_out.push(`  ["${name}","${c.cc}",${lat},${lng},"${currency}",${pi}],`);
  }

  const tsContent = `// AUTO-GENERATED by scripts/prepare-geonames.ts — do not edit manually
// Source: GeoNames cities15000 (public domain, creativecommons.org/licenses/by/4.0)
// ${unique.length.toLocaleString()} cities worldwide with population ≥ 15 000
// Country codes are ISO 3166-1 alpha-2 (2-letter), not country names

export type CompactCityGeo = [
  name: string, countryCode: string, lat: number, lng: number,
  currency: string, priceIndex: number
];

export const GEONAMES_CITIES: CompactCityGeo[] = [
${lines_out.join("\n")}
];
`;

  fs.writeFileSync(OUT_FILE, tsContent, "utf8");
  console.log(`\n✅ Written to scripts/city-data-geonames.ts`);
  console.log(`   ${unique.length.toLocaleString()} cities ready for seeding.`);
  console.log("\nNext step: npx tsx scripts/seed-world-listings.ts");
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
