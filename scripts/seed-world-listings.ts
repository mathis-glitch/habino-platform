/**
 * Habino — Global Listings Seed Script
 * Generates ~100,000 realistic property listings across 150+ world cities.
 *
 * Usage:
 *   npx tsx scripts/seed-world-listings.ts
 *
 * Requirements:
 *   npm install -D tsx   (if not already installed)
 */

import { createClient } from "@supabase/supabase-js";
import { EXTENDED_CITIES } from "./city-data-extended";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || "https://ikubxgsptautubecukoi.supabase.co";
const SUPABASE_SR_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY     || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdWJ4Z3NwdGF1dHViZWN1a29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc2ODE2NiwiZXhwIjoyMDg5MzQ0MTY2fQ.c6hUfJODHj9smszXQSfUOU55thu3TNs39bWTksfTPxs";
const BATCH_SIZE        = 250;   // smaller batches avoid statement-timeout on PostGIS tables
const TARGET_TOTAL      = 1_000_000;

const sb = createClient(SUPABASE_URL, SUPABASE_SR_KEY);

// ── World city database ───────────────────────────────────────────────────────
// [city, country, lat, lng, currency, priceIndex (1=cheap … 10=expensive), neighbourhoods[]]
type CityDef = {
  city: string; country: string; lat: number; lng: number;
  currency: string; priceIndex: number; neighbourhoods: string[];
};

const CITIES: CityDef[] = [
  // ── East Africa ──
  { city:"Nairobi",        country:"Kenya",        lat:-1.2921,  lng:36.8219,  currency:"KES", priceIndex:5, neighbourhoods:["Westlands","Kilimani","Karen","Lavington","Kileleshwa","Parklands","South B","Eastleigh","Langata","Runda","Muthaiga","Gigiri","Spring Valley","Loresho","Hurlingham"] },
  { city:"Mombasa",        country:"Kenya",        lat:-4.0435,  lng:39.6682,  currency:"KES", priceIndex:4, neighbourhoods:["Nyali","Bamburi","Diani","Shanzu","Tudor","Likoni","Mtwapa","Kizingo","Ganjoni","Mikindani"] },
  { city:"Kisumu",         country:"Kenya",        lat:-0.0917,  lng:34.7679,  currency:"KES", priceIndex:3, neighbourhoods:["Milimani","Kondele","Mamboleo","Tom Mboya","Nyamasaria","Riat Hills","Kibuye"] },
  { city:"Nakuru",         country:"Kenya",        lat:-0.3031,  lng:36.0800,  currency:"KES", priceIndex:3, neighbourhoods:["Milimani","Section 58","Shabab","Lanet","Free Area","Kiti"] },
  { city:"Dar es Salaam",  country:"Tanzania",     lat:-6.7924,  lng:39.2083,  currency:"TZS", priceIndex:4, neighbourhoods:["Masaki","Oyster Bay","Kinondoni","Upanga","Msasani","Mikocheni","Kariakoo","Ilala","Temeke","Mbezi Beach","Kawe"] },
  { city:"Arusha",         country:"Tanzania",     lat:-3.3869,  lng:36.6829,  currency:"TZS", priceIndex:3, neighbourhoods:["Sakina","Njiro","Ngarenaro","Kimandolu","Themi","Kaloleni","Sekei"] },
  { city:"Kampala",        country:"Uganda",       lat:0.3476,   lng:32.5825,  currency:"UGX", priceIndex:4, neighbourhoods:["Kololo","Nakasero","Muyenga","Bugolobi","Ntinda","Naguru","Kira","Naalya","Rubaga","Makindye"] },
  { city:"Entebbe",        country:"Uganda",       lat:0.0512,   lng:32.4633,  currency:"UGX", priceIndex:4, neighbourhoods:["Garuga","Nkumba","Kisubi","Abaita","Lunyo"] },
  { city:"Kigali",         country:"Rwanda",       lat:-1.9441,  lng:30.0619,  currency:"RWF", priceIndex:5, neighbourhoods:["Kiyovu","Kimihurura","Nyarutarama","Remera","Gisozi","Kabeza","Kanombe","Kibagabaga","Masaka"] },
  { city:"Addis Ababa",    country:"Ethiopia",     lat:9.1450,   lng:38.7251,  currency:"ETB", priceIndex:4, neighbourhoods:["Bole","CMC","Megenagna","Kazanchis","Piassa","Sarbet","Ayat","Gerji","Old Airport","Lafto","Lideta"] },
  { city:"Nairobi CBD",    country:"Kenya",        lat:-1.2921,  lng:36.8219,  currency:"KES", priceIndex:6, neighbourhoods:["Upper Hill","Upperhill","CBD","Ngara","Pangani","Ziwani","Mlango Kubwa"] },

  // ── West Africa ──
  { city:"Lagos",          country:"Nigeria",      lat:6.5244,   lng:3.3792,   currency:"NGN", priceIndex:6, neighbourhoods:["Victoria Island","Lekki","Ikoyi","Ajah","Ikeja","Magodo","Gbagada","Surulere","Yaba","Ojodu","Sangotedo","Chevron","Agungi","Idado","Osapa"] },
  { city:"Abuja",          country:"Nigeria",      lat:9.0765,   lng:7.3986,   currency:"NGN", priceIndex:6, neighbourhoods:["Maitama","Asokoro","Wuse II","Garki","Gwarinpa","Jabi","Utako","Kubwa","Lugbe","Life Camp","Kado","Katampe","Apo"] },
  { city:"Port Harcourt",  country:"Nigeria",      lat:4.8156,   lng:7.0498,   currency:"NGN", priceIndex:5, neighbourhoods:["GRA Phase I","GRA Phase II","Trans Amadi","Rumuola","Diobu","Elelenwo","Woji","Peter Odili","Rumuibekwe"] },
  { city:"Accra",          country:"Ghana",        lat:5.6037,   lng:-0.1870,  currency:"GHS", priceIndex:5, neighbourhoods:["East Legon","Cantonments","Airport Residential","Labone","Adenta","Spintex","Tema","Osu","Labadi","Achimota","Dansoman","Kasoa"] },
  { city:"Kumasi",         country:"Ghana",        lat:6.6885,   lng:-1.6244,  currency:"GHS", priceIndex:4, neighbourhoods:["Ahodwo","Nhyiaeso","Suame","Bantama","Asokwa","Dichemso","Asawasi"] },
  { city:"Abidjan",        country:"Ivory Coast",  lat:5.3600,   lng:-4.0083,  currency:"XOF", priceIndex:5, neighbourhoods:["Cocody","Plateau","Marcory","Treichville","Adjamé","Yopougon","Riviera","Bingerville","Bassam"] },
  { city:"Dakar",          country:"Senegal",      lat:14.7167,  lng:-17.4677, currency:"XOF", priceIndex:5, neighbourhoods:["Almadies","Ngor","Mermoz","Point E","Fann","Sacré-Cœur","Ouakam","Yoff","Liberté","Medina"] },
  { city:"Douala",         country:"Cameroon",     lat:4.0483,   lng:9.7043,   currency:"XAF", priceIndex:4, neighbourhoods:["Bonanjo","Akwa","Bonapriso","Makepe","Logbessou","Kotto","Deido"] },
  { city:"Yaoundé",        country:"Cameroon",     lat:3.8480,   lng:11.5021,  currency:"XAF", priceIndex:4, neighbourhoods:["Bastos","Odza","Nkol-Eton","Mvan","Simbock","Essos","Mfoundi"] },
  { city:"Lomé",           country:"Togo",         lat:6.1375,   lng:1.2123,   currency:"XOF", priceIndex:3, neighbourhoods:["Bè","Nyékonakpoè","Tokoin","Adéwui","Agoè","Kodjoviakopé","Hédzranawoé"] },
  { city:"Bamako",         country:"Mali",         lat:12.6392,  lng:-8.0029,  currency:"XOF", priceIndex:3, neighbourhoods:["ACI 2000","Badalabougou","Hippodrome","Hamdallaye","Kalaban Coro","Lafiabougou","Quinzambougou"] },
  { city:"Conakry",        country:"Guinea",       lat:9.6412,   lng:-13.5784, currency:"GNF", priceIndex:3, neighbourhoods:["Kaloum","Matam","Ratoma","Dixinn","Matoto"] },

  // ── North Africa ──
  { city:"Cairo",          country:"Egypt",        lat:30.0444,  lng:31.2357,  currency:"EGP", priceIndex:5, neighbourhoods:["Zamalek","Maadi","New Cairo","6th October","Heliopolis","Nasr City","Dokki","Mohandessin","Garden City","Sheikh Zayed","Shorouk","Fifth Settlement"] },
  { city:"Alexandria",     country:"Egypt",        lat:31.2001,  lng:29.9187,  currency:"EGP", priceIndex:4, neighbourhoods:["Stanley","Gleem","Smouha","Montazah","Agami","Borg el-Arab","Miami","Sidi Bishr"] },
  { city:"Casablanca",     country:"Morocco",      lat:33.5731,  lng:-7.5898,  currency:"MAD", priceIndex:6, neighbourhoods:["Maarif","Gauthier","Anfa","Ain Diab","Californie","Bourgogne","Racine","Val Fleuri","Oulfa","Hay Hassani"] },
  { city:"Marrakech",      country:"Morocco",      lat:31.6295,  lng:-7.9811,  currency:"MAD", priceIndex:6, neighbourhoods:["Hivernage","Guéliz","Palmeraie","Médina","Semlalia","Mellah","Targa"] },
  { city:"Rabat",          country:"Morocco",      lat:33.9716,  lng:-6.8498,  currency:"MAD", priceIndex:5, neighbourhoods:["Agdal","Hassan","Souissi","Aviation","Hay Riad","Youssoufia","Akkari"] },
  { city:"Tunis",          country:"Tunisia",      lat:36.8190,  lng:10.1658,  currency:"TND", priceIndex:5, neighbourhoods:["Les Berges du Lac","Ennasr","El Menzah","La Marsa","Carthage","Gammarth","Sidi Bou Said","Centre Ville","Ain Zaghouan"] },
  { city:"Algiers",        country:"Algeria",      lat:36.7538,  lng:3.0588,   currency:"DZD", priceIndex:5, neighbourhoods:["Hydra","El Biar","Bir Mourad Raïs","Ben Aknoun","Kouba","Bab Ezzouar","Dely Ibrahim","Chéraga","Ain Benian"] },

  // ── Southern Africa ──
  { city:"Cape Town",      country:"South Africa", lat:-33.9249, lng:18.4241,  currency:"ZAR", priceIndex:7, neighbourhoods:["Sea Point","Green Point","Camps Bay","Clifton","Constantia","Newlands","Claremont","Pinelands","Bloubergstrand","Woodstock","Observatory","Milnerton","Bellville"] },
  { city:"Johannesburg",   country:"South Africa", lat:-26.2041, lng:28.0473,  currency:"ZAR", priceIndex:7, neighbourhoods:["Sandton","Rosebank","Melrose","Hyde Park","Bryanston","Fourways","Midrand","Morningside","Parktown","Rivonia","Norwood","Parkhurst"] },
  { city:"Durban",         country:"South Africa", lat:-29.8587, lng:31.0218,  currency:"ZAR", priceIndex:6, neighbourhoods:["Umhlanga","Ballito","La Lucia","Morningside","Berea","Westville","Hillcrest","Kloof","Essenwood","Pinetown"] },
  { city:"Pretoria",       country:"South Africa", lat:-25.7479, lng:28.2293,  currency:"ZAR", priceIndex:6, neighbourhoods:["Waterkloof","Lynnwood","Hatfield","Menlyn","Centurion","Brooklyn","Muckleneuk","Montana","Faerie Glen"] },
  { city:"Lusaka",         country:"Zambia",       lat:-15.3875, lng:28.3228,  currency:"ZMW", priceIndex:4, neighbourhoods:["Kabulonga","Woodlands","Roma","Ibex Hill","Chelston","Northmead","Makeni","Longacres","Emmasdale"] },
  { city:"Harare",         country:"Zimbabwe",     lat:-17.8252, lng:31.0335,  currency:"USD", priceIndex:4, neighbourhoods:["Borrowdale","Highlands","Avondale","Gunhill","Pomona","Mabelreign","Budiriro","Greendale","Mount Pleasant"] },
  { city:"Maputo",         country:"Mozambique",   lat:-25.9653, lng:32.5892,  currency:"MZN", priceIndex:4, neighbourhoods:["Sommerschield","Polana Cimento","Malhangalene","Matola","Benfica","Piri","Machava","Costa do Sol"] },
  { city:"Windhoek",       country:"Namibia",      lat:-22.5597, lng:17.0832,  currency:"NAD", priceIndex:5, neighbourhoods:["Olympia","Kleine Kuppe","Eros","Academia","Ludwigsdorf","Khomasdal","Pionierspark"] },

  // ── UAE & Gulf ──
  { city:"Dubai",          country:"UAE",          lat:25.2048,  lng:55.2708,  currency:"AED", priceIndex:9, neighbourhoods:["Dubai Marina","Downtown Dubai","Jumeirah","Palm Jumeirah","DIFC","Business Bay","JLT","JVC","Mirdif","Arabian Ranches","Springs","Meadows","Emaar South","Bluewaters","City Walk"] },
  { city:"Abu Dhabi",      country:"UAE",          lat:24.4539,  lng:54.3773,  currency:"AED", priceIndex:9, neighbourhoods:["Corniche","Khalidiyah","Reem Island","Saadiyat Island","Al Raha","Yas Island","Khalifa City","Muroor","Mohammed Bin Zayed"] },
  { city:"Sharjah",        country:"UAE",          lat:25.3462,  lng:55.4212,  currency:"AED", priceIndex:7, neighbourhoods:["Al Nahda","Al Khan","Muwaileh","Al Majaz","Al Qasimia","Industrial","Al Taawun","Al Mamzar"] },
  { city:"Riyadh",         country:"Saudi Arabia", lat:24.7136,  lng:46.6753,  currency:"SAR", priceIndex:8, neighbourhoods:["Al Olaya","Malaz","Al Nakheel","Al Muruj","Riyadh Al Khabra","Al Yasmin","Al Aqiq","Hittin","Al Sahafa"] },
  { city:"Jeddah",         country:"Saudi Arabia", lat:21.4858,  lng:39.1925,  currency:"SAR", priceIndex:8, neighbourhoods:["Al Hamra","Al Shati","Corniche","Al Rawdah","Al Zahraa","Al Salamah","Al Andalus","Al Basateen"] },
  { city:"Doha",           country:"Qatar",        lat:25.2854,  lng:51.5310,  currency:"QAR", priceIndex:9, neighbourhoods:["West Bay","Pearl Qatar","Lusail","Msheireb","Al Sadd","Madinat Khalifa","Al Wakra","Legtaifiya","Fox Hills"] },
  { city:"Kuwait City",    country:"Kuwait",       lat:29.3759,  lng:47.9774,  currency:"KWD", priceIndex:9, neighbourhoods:["Salmiya","Rumaithiya","Bayan","Mishref","Nuzha","Qibla","Rawda","Dahiyat Abdulla","Salwa"] },
  { city:"Muscat",         country:"Oman",         lat:23.5880,  lng:58.3829,  currency:"OMR", priceIndex:7, neighbourhoods:["Qurum","Al Khuwair","Madinat Al Sultan","Azaiba","Ghubrah","Al Hail","Bausher","Bowshar","Ruwi"] },
  { city:"Manama",         country:"Bahrain",      lat:26.2235,  lng:50.5876,  currency:"BHD", priceIndex:8, neighbourhoods:["Seef","Diplomatic Area","Juffair","Adliya","Hoora","Budaiya","Saar","Amwaj Islands","Riffa"] },

  // ── Asia ──
  { city:"Mumbai",         country:"India",        lat:19.0760,  lng:72.8777,  currency:"INR", priceIndex:8, neighbourhoods:["Bandra","Juhu","Andheri","Worli","Lower Parel","Powai","Borivali","Malad","Navi Mumbai","Thane","Chembur","Versova"] },
  { city:"Bangalore",      country:"India",        lat:12.9716,  lng:77.5946,  currency:"INR", priceIndex:7, neighbourhoods:["Koramangala","Indiranagar","Whitefield","HSR Layout","Electronic City","Jayanagar","BTM","Sarjapur","Hebbal","Yelahanka"] },
  { city:"Delhi",          country:"India",        lat:28.6139,  lng:77.2090,  currency:"INR", priceIndex:7, neighbourhoods:["South Extension","Vasant Vihar","GK","Hauz Khas","Noida","Gurgaon","Dwarka","Rohini","Pitampura","Connaught Place"] },
  { city:"Hyderabad",      country:"India",        lat:17.3850,  lng:78.4867,  currency:"INR", priceIndex:6, neighbourhoods:["Banjara Hills","Jubilee Hills","Madhapur","Gachibowli","Kondapur","Kukatpally","Uppal","Secunderabad"] },
  { city:"Bangkok",        country:"Thailand",     lat:13.7563,  lng:100.5018, currency:"THB", priceIndex:6, neighbourhoods:["Sukhumvit","Silom","Sathorn","Lumpini","Phrom Phong","Thonglor","Ekkamai","Ari","Nonthaburi","Bangna","Rama 9"] },
  { city:"Phuket",         country:"Thailand",     lat:7.8804,   lng:98.3923,  currency:"THB", priceIndex:7, neighbourhoods:["Patong","Kamala","Surin","Bang Tao","Laguna","Rawai","Nai Harn","Kata","Karon","Cherngtalay"] },
  { city:"Jakarta",        country:"Indonesia",    lat:-6.2088,  lng:106.8456, currency:"IDR", priceIndex:5, neighbourhoods:["SCBD","Kuningan","Menteng","Kemang","Senayan","Kebayoran Baru","Pondok Indah","Bintaro","Kelapa Gading","Serpong"] },
  { city:"Bali",           country:"Indonesia",    lat:-8.4095,  lng:115.1889, currency:"IDR", priceIndex:6, neighbourhoods:["Seminyak","Canggu","Ubud","Kuta","Jimbaran","Sanur","Nusa Dua","Legian","Berawa","Pererenan"] },
  { city:"Kuala Lumpur",   country:"Malaysia",     lat:3.1390,   lng:101.6869, currency:"MYR", priceIndex:6, neighbourhoods:["KLCC","Bangsar","Mont Kiara","Damansara","Hartamas","Cheras","Ampang","Puchong","Shah Alam","Petaling Jaya"] },
  { city:"Ho Chi Minh",    country:"Vietnam",      lat:10.8231,  lng:106.6297, currency:"VND", priceIndex:5, neighbourhoods:["District 1","District 2","Thao Dien","Phu My Hung","Binh Thanh","Go Vap","Tan Binh","Binh Chanh"] },
  { city:"Singapore",      country:"Singapore",    lat:1.3521,   lng:103.8198, currency:"SGD", priceIndex:10,neighbourhoods:["Orchard","Holland Village","Buona Vista","Tampines","Jurong","Woodlands","Punggol","Sengkang","Newton","Toa Payoh"] },
  { city:"Manila",         country:"Philippines",  lat:14.5995,  lng:120.9842, currency:"PHP", priceIndex:5, neighbourhoods:["BGC","Makati CBD","Rockwell","Alabang","Eastwood","Ortigas","QC","Mandaluyong","Pasig","Las Piñas"] },
  { city:"Colombo",        country:"Sri Lanka",    lat:6.9271,   lng:79.8612,  currency:"LKR", priceIndex:4, neighbourhoods:["Colombo 03","Colombo 05","Colombo 07","Dehiwala","Mount Lavinia","Nugegoda","Rajagiriya","Battaramulla"] },
  { city:"Karachi",        country:"Pakistan",     lat:24.8607,  lng:67.0011,  currency:"PKR", priceIndex:4, neighbourhoods:["DHA","Clifton","Gulshan","PECHS","North Nazimabad","Bahria Town","Malir","Saddar"] },
  { city:"Lahore",         country:"Pakistan",     lat:31.5204,  lng:74.3587,  currency:"PKR", priceIndex:4, neighbourhoods:["DHA","Gulberg","Model Town","Bahria Town","Johar Town","Iqbal Town","Wapda Town","Cantt"] },

  // ── Europe ──
  { city:"London",         country:"UK",           lat:51.5074,  lng:-0.1278,  currency:"GBP", priceIndex:10,neighbourhoods:["Chelsea","Kensington","Mayfair","Notting Hill","Islington","Hackney","Brixton","Clapham","Canary Wharf","Greenwich","Shoreditch","Battersea","Richmond"] },
  { city:"Berlin",         country:"Germany",      lat:52.5200,  lng:13.4050,  currency:"EUR", priceIndex:7, neighbourhoods:["Mitte","Prenzlauer Berg","Friedrichshain","Kreuzberg","Charlottenburg","Schöneberg","Neukölln","Pankow","Steglitz","Reinickendorf","Spandau"] },
  { city:"Munich",         country:"Germany",      lat:48.1351,  lng:11.5820,  currency:"EUR", priceIndex:9, neighbourhoods:["Maxvorstadt","Schwabing","Bogenhausen","Neuhausen","Pasing","Giesing","Haidhausen","Sendling","Nymphenburg","Lehel"] },
  { city:"Paris",          country:"France",       lat:48.8566,  lng:2.3522,   currency:"EUR", priceIndex:10,neighbourhoods:["Marais","Saint-Germain","Montmartre","Bastille","Oberkampf","Nation","Vincennes","Boulogne","Neuilly","Levallois","Issy"] },
  { city:"Barcelona",      country:"Spain",        lat:41.3851,  lng:2.1734,   currency:"EUR", priceIndex:8, neighbourhoods:["Eixample","Gracia","Sarrià","Barceloneta","Poble Sec","Sant Andreu","Poblenou","Horta","Les Corts","Gràcia Alta"] },
  { city:"Madrid",         country:"Spain",        lat:40.4168,  lng:-3.7038,  currency:"EUR", priceIndex:8, neighbourhoods:["Salamanca","Chamberí","Retiro","Malasaña","Chueca","Lavapiés","Vallecas","Usera","Carabanchel","Moncloa"] },
  { city:"Amsterdam",      country:"Netherlands",  lat:52.3676,  lng:4.9041,   currency:"EUR", priceIndex:9, neighbourhoods:["Jordaan","De Pijp","Oud-West","Watergraafsmeer","Zuidas","Noord","Oost","Buitenveldert","Amstelveen"] },
  { city:"Vienna",         country:"Austria",      lat:48.2082,  lng:16.3738,  currency:"EUR", priceIndex:8, neighbourhoods:["Innere Stadt","Leopoldstadt","Landstraße","Wieden","Mariahilf","Währing","Döbling","Penzing","Favoriten"] },
  { city:"Zurich",         country:"Switzerland",  lat:47.3769,  lng:8.5417,   currency:"CHF", priceIndex:10,neighbourhoods:["Zurich 1","Zurich 2","Zurich 3","Zurich 6","Zurich 7","Zurich 8","Zollikon","Küsnacht","Thalwil","Adliswil"] },
  { city:"Lisbon",         country:"Portugal",     lat:38.7223,  lng:-9.1393,  currency:"EUR", priceIndex:7, neighbourhoods:["Chiado","Alfama","Bairro Alto","Príncipe Real","Avenidas Novas","Alvalade","Benfica","Belém","Cascais","Estoril"] },
  { city:"Warsaw",         country:"Poland",       lat:52.2297,  lng:21.0122,  currency:"PLN", priceIndex:6, neighbourhoods:["Śródmieście","Mokotów","Wilanów","Ursynów","Żoliborz","Bielany","Praga","Wola","Ochota","Bemowo"] },
  { city:"Prague",         country:"Czechia",      lat:50.0755,  lng:14.4378,  currency:"CZK", priceIndex:7, neighbourhoods:["Prague 1","Prague 2","Prague 6","Vinohrady","Žižkov","Smíchov","Karlín","Holešovice","Dejvice","Nusle"] },
  { city:"Budapest",       country:"Hungary",      lat:47.4979,  lng:19.0402,  currency:"HUF", priceIndex:6, neighbourhoods:["District 5","District 6","District 7","District 11","District 2","District 12","District 13","Óbuda"] },
  { city:"Istanbul",       country:"Turkey",       lat:41.0082,  lng:28.9784,  currency:"TRY", priceIndex:6, neighbourhoods:["Beşiktaş","Şişli","Kadıköy","Üsküdar","Beyoğlu","Ataşehir","Maltepe","Bakırköy","Sarıyer","Büyükada"] },
  { city:"Athens",         country:"Greece",       lat:37.9838,  lng:23.7275,  currency:"EUR", priceIndex:6, neighbourhoods:["Kolonaki","Kifisia","Glyfada","Vouliagmeni","Nea Smyrni","Chalandri","Psychiko","Marousi","Piraeus"] },
  { city:"Rome",           country:"Italy",        lat:41.9028,  lng:12.4964,  currency:"EUR", priceIndex:8, neighbourhoods:["Parioli","Prati","Trastevere","Testaccio","EUR","Pigneto","Ostiense","Nomentano","Appio","Trieste"] },
  { city:"Milan",          country:"Italy",        lat:45.4642,  lng:9.1900,   currency:"EUR", priceIndex:9, neighbourhoods:["Brera","Navigli","Porta Venezia","Isola","CityLife","Porta Nuova","Corvetto","Sesto","Monza","Sesto San Giovanni"] },
  { city:"Stockholm",      country:"Sweden",       lat:59.3293,  lng:18.0686,  currency:"SEK", priceIndex:9, neighbourhoods:["Östermalm","Södermalm","Kungsholmen","Vasastan","Lidingö","Nacka","Täby","Solna","Sundbyberg"] },
  { city:"Copenhagen",     country:"Denmark",      lat:55.6761,  lng:12.5683,  currency:"DKK", priceIndex:9, neighbourhoods:["Frederiksberg","Østerbro","Nørrebro","Vesterbro","Hellerup","Gentofte","Lyngby","Roskilde","Brøndby"] },
  { city:"Dublin",         country:"Ireland",      lat:53.3498,  lng:-6.2603,  currency:"EUR", priceIndex:9, neighbourhoods:["Ballsbridge","Clontarf","Rathgar","Ranelagh","Sandymount","Dalkey","Blackrock","Malahide","Swords","Lucan"] },
  { city:"Brussels",       country:"Belgium",      lat:50.8503,  lng:4.3517,   currency:"EUR", priceIndex:7, neighbourhoods:["Ixelles","Etterbeek","Uccle","Woluwé","Laeken","Molenbeek","Forest","Auderghem","Waterloo","Rhode-Saint-Genèse"] },

  // ── Americas ──
  { city:"New York",       country:"USA",          lat:40.7128,  lng:-74.0060, currency:"USD", priceIndex:10,neighbourhoods:["Manhattan","Brooklyn Heights","Upper East Side","Tribeca","Soho","Midtown","Harlem","Queens","The Bronx","Staten Island","Hoboken","Jersey City"] },
  { city:"Miami",          country:"USA",          lat:25.7617,  lng:-80.1918, currency:"USD", priceIndex:9, neighbourhoods:["Brickell","Coconut Grove","Coral Gables","South Beach","Wynwood","Edgewater","Aventura","Doral","Kendall","Hialeah"] },
  { city:"Los Angeles",    country:"USA",          lat:34.0522,  lng:-118.2437,currency:"USD", priceIndex:9, neighbourhoods:["Beverly Hills","Santa Monica","Venice","Hollywood","Silver Lake","Los Feliz","Bel Air","Malibu","Pasadena","Glendale"] },
  { city:"Chicago",        country:"USA",          lat:41.8781,  lng:-87.6298, currency:"USD", priceIndex:8, neighbourhoods:["Lincoln Park","Gold Coast","River North","Wicker Park","Bucktown","Lakeview","Logan Square","Hyde Park","Evanston"] },
  { city:"Toronto",        country:"Canada",       lat:43.6532,  lng:-79.3832, currency:"CAD", priceIndex:9, neighbourhoods:["Yorkville","The Annex","Rosedale","Lawrence Park","Forest Hill","Etobicoke","North York","Scarborough","Mississauga","Brampton"] },
  { city:"Vancouver",      country:"Canada",       lat:49.2827,  lng:-123.1207,currency:"CAD", priceIndex:9, neighbourhoods:["West End","Kitsilano","Yaletown","Mount Pleasant","Coal Harbour","Burnaby","Richmond","Surrey","Coquitlam","North Van"] },
  { city:"São Paulo",      country:"Brazil",       lat:-23.5505, lng:-46.6333, currency:"BRL", priceIndex:6, neighbourhoods:["Jardins","Itaim Bibi","Pinheiros","Vila Madalena","Moema","Brooklin","Alphaville","Tatuapé","Santana","Saúde"] },
  { city:"Rio de Janeiro", country:"Brazil",       lat:-22.9068, lng:-43.1729, currency:"BRL", priceIndex:6, neighbourhoods:["Ipanema","Leblon","Copacabana","Barra da Tijuca","Botafogo","Flamengo","Tijuca","Gavea","São Conrado","Recreio"] },
  { city:"Buenos Aires",   country:"Argentina",    lat:-34.6037, lng:-58.3816, currency:"ARS", priceIndex:5, neighbourhoods:["Palermo","Recoleta","Puerto Madero","Belgrano","Nuñez","Caballito","Flores","San Telmo","Almagro","Villa Crespo"] },
  { city:"Bogotá",         country:"Colombia",     lat:4.7110,   lng:-74.0721, currency:"COP", priceIndex:5, neighbourhoods:["Chapinero","Usaquén","Santa Bárbara","Rosales","Cedritos","Modelia","Suba","Fontibon","Bosa","Kennedy"] },
  { city:"Lima",           country:"Peru",         lat:-12.0464, lng:-77.0428, currency:"PEN", priceIndex:5, neighbourhoods:["Miraflores","San Isidro","Barranco","Surco","La Molina","San Borja","Jesús María","Lince","Pueblo Libre"] },
  { city:"Mexico City",    country:"Mexico",       lat:19.4326,  lng:-99.1332, currency:"MXN", priceIndex:5, neighbourhoods:["Polanco","Lomas de Chapultepec","Condesa","Roma","Coyoacán","Santa Fe","Del Valle","Nápoles","Pedregal","Satélite"] },
  { city:"Santiago",       country:"Chile",        lat:-33.4489, lng:-70.6693, currency:"CLP", priceIndex:6, neighbourhoods:["Las Condes","Providencia","Ñuñoa","Vitacura","Lo Barnechea","La Reina","Peñalolén","Macul","San Miguel"] },

  // ── Australia & Oceania ──
  { city:"Sydney",         country:"Australia",    lat:-33.8688, lng:151.2093, currency:"AUD", priceIndex:9, neighbourhoods:["Mosman","Balmain","Glebe","Newtown","Surry Hills","Bondi","Manly","Chatswood","Parramatta","Campbelltown","Liverpool","North Sydney"] },
  { city:"Melbourne",      country:"Australia",    lat:-37.8136, lng:144.9631, currency:"AUD", priceIndex:9, neighbourhoods:["South Yarra","Toorak","Fitzroy","Carlton","Richmond","Hawthorn","Kew","Malvern","St Kilda","Docklands","Brunswick","Prahran"] },
  { city:"Brisbane",       country:"Australia",    lat:-27.4698, lng:153.0251, currency:"AUD", priceIndex:8, neighbourhoods:["New Farm","Teneriffe","Fortitude Valley","Paddington","Ascot","Hamilton","Toowong","Indooroopilly","Sunnybank"] },
  { city:"Auckland",       country:"New Zealand",  lat:-36.8485, lng:174.7633, currency:"NZD", priceIndex:8, neighbourhoods:["Remuera","Parnell","Herne Bay","Ponsonby","Grey Lynn","Takapuna","Milford","Devonport","Titirangi","Howick"] },

  // ── Sub-Saharan additions ──
  { city:"Kinshasa",       country:"DRC",          lat:-4.3317,  lng:15.3323,  currency:"CDF", priceIndex:4, neighbourhoods:["Gombe","Lingwala","Kintambo","Barumbu","Ngaliema","Limete","Ndjili","Lemba","Makala"] },
  { city:"Antananarivo",   country:"Madagascar",   lat:-18.9137, lng:47.5361,  currency:"MGA", priceIndex:3, neighbourhoods:["Tsaralalana","Analakely","Ampefiloha","Ankadivato","Tanjombato","Andoharanofotsy","Itaosy"] },
  { city:"Accra East",     country:"Ghana",        lat:5.6500,   lng:-0.1500,  currency:"GHS", priceIndex:4, neighbourhoods:["Adenta","Madina","Ashongman","Dome","Accra New Town","Tesano","Abelenkpe"] },
  { city:"Kano",           country:"Nigeria",      lat:12.0022,  lng:8.5920,   currency:"NGN", priceIndex:3, neighbourhoods:["Nasarawa","Bompai","Tarauni","Gwale","Municipal","Kumbotso","Madobi"] },
  { city:"Ibadan",         country:"Nigeria",      lat:7.3775,   lng:3.9470,   currency:"NGN", priceIndex:3, neighbourhoods:["GRA","Bodija","Iyaganku","Ring Road","Agodi","Felele","Challenge","Eleyele"] },
  { city:"Freetown",       country:"Sierra Leone", lat:8.4657,   lng:-13.2317, currency:"SLL", priceIndex:3, neighbourhoods:["Aberdeen","Lumley","Hill Station","Wilberforce","Congo Town","Brookfields","Tengbeh Town"] },

  // ── More East Africa ──
  { city:"Zanzibar",       country:"Tanzania",     lat:-6.1648,  lng:39.1989,  currency:"TZS", priceIndex:5, neighbourhoods:["Stone Town","Nungwi","Kendwa","Paje","Jambiani","Kiwengwa","Bwejuu"] },
  { city:"Eldoret",        country:"Kenya",        lat:0.5143,   lng:35.2698,  currency:"KES", priceIndex:3, neighbourhoods:["Huruma","Langas","Kapsoya","Elgon View","Annex","Pioneer","Munyaka"] },
  { city:"Djibouti",       country:"Djibouti",     lat:11.5720,  lng:43.1456,  currency:"DJF", priceIndex:5, neighbourhoods:["Balbala","Arhiba","Marabout","Gabode","Ambouli","Quartier 7","Hodan"] },
  { city:"Bujumbura",      country:"Burundi",      lat:-3.3614,  lng:29.3600,  currency:"BIF", priceIndex:3, neighbourhoods:["Rohero","Kigobe","Ngagara","Musaga","Bwiza","Buyenzi","Cibitoke"] },
  { city:"Lilongwe",       country:"Malawi",       lat:-13.9626, lng:33.7741,  currency:"MWK", priceIndex:3, neighbourhoods:["Area 3","Area 10","Area 43","Kanengo","Biwi","Area 18","Area 47"] },
  { city:"Blantyre",       country:"Malawi",       lat:-15.7866, lng:35.0168,  currency:"MWK", priceIndex:3, neighbourhoods:["Blantyre CBD","Limbe","Sunnyside","Chilomoni","Ndirande","Naperi","Bangwe"] },
  { city:"Port Louis",     country:"Mauritius",    lat:-20.1619, lng:57.4989,  currency:"MUR", priceIndex:6, neighbourhoods:["Ebène","Quatre Bornes","Curepipe","Moka","Grand Baie","Flic en Flac","Rose Hill"] },
  { city:"Juba",           country:"South Sudan",  lat:4.8594,   lng:31.5713,  currency:"USD", priceIndex:4, neighbourhoods:["Juba Town","Gudele","Munuki","Kator","Lologo","Rock City","Tongping"] },
  { city:"Dodoma",         country:"Tanzania",     lat:-6.1722,  lng:35.7395,  currency:"TZS", priceIndex:3, neighbourhoods:["Chang'ombe","Nkuhungu","Kilimani","Ipagala","Chamwino","Makole","Kikuyu"] },

  // ── More West Africa ──
  { city:"Monrovia",       country:"Liberia",      lat:6.3005,   lng:-10.7969, currency:"LRD", priceIndex:3, neighbourhoods:["Sinkor","Congo Town","Mamba Point","Paynesville","Gbarnga Road","Old Road","Gardnersville"] },
  { city:"Ouagadougou",    country:"Burkina Faso", lat:12.3714,  lng:-1.5197,  currency:"XOF", priceIndex:3, neighbourhoods:["Zone 1","Zone du Bois","Hamdalaye","Patte d'Oie","Karpala","Gounghin","Tampouy"] },
  { city:"Niamey",         country:"Niger",        lat:13.5137,  lng:2.1098,   currency:"XOF", priceIndex:3, neighbourhoods:["Plateau","Lazaret","Koura Kano","Gamkallé","Amirou Biro","Boukoki","Bobiel"] },
  { city:"Cotonou",        country:"Benin",        lat:6.3654,   lng:2.4183,   currency:"XOF", priceIndex:4, neighbourhoods:["Fidjrossè","Cadjehoun","Haie Vive","Akpakpa","Zogbo","Dantokpa","Mènontin"] },
  { city:"Enugu",          country:"Nigeria",      lat:6.4584,   lng:7.5464,   currency:"NGN", priceIndex:4, neighbourhoods:["New Haven","GRA","Independence Layout","Trans Ekulu","Achara Layout","Abakpa","Maryland"] },
  { city:"Benin City",     country:"Nigeria",      lat:6.3350,   lng:5.6037,   currency:"NGN", priceIndex:4, neighbourhoods:["GRA Phase I","GRA Phase II","Ugbowo","Uselu","Airport Road","Oba Market","New Benin"] },
  { city:"Thiès",          country:"Senegal",      lat:14.7910,  lng:-16.9359, currency:"XOF", priceIndex:3, neighbourhoods:["Zone Résidentielle","Médina Fall","Randoulène","Thiès Nord","Diamaguène","Nguinth"] },

  // ── More North Africa ──
  { city:"Tripoli",        country:"Libya",        lat:32.9018,  lng:13.1801,  currency:"LYD", priceIndex:5, neighbourhoods:["Hay Andalus","Gurji","Ain Zara","Siyahiyya","Dahra","Old City","Al-Zawiya"] },
  { city:"Khartoum",       country:"Sudan",        lat:15.5007,  lng:32.5599,  currency:"SDG", priceIndex:4, neighbourhoods:["Riyadh","Khartoum 2","Bahri","Omdurman","Khartoum North","Soba","Salam"] },
  { city:"Giza",           country:"Egypt",        lat:30.0131,  lng:31.2089,  currency:"EGP", priceIndex:4, neighbourhoods:["6th October","Sheikh Zayed","Haram","Dokki","Agouza","Mohandessin","Faisal"] },
  { city:"Fes",            country:"Morocco",      lat:34.0181,  lng:-5.0078,  currency:"MAD", priceIndex:5, neighbourhoods:["Médina","Ville Nouvelle","Saïss","Les Oliviers","Oued Fès","Sahrij Gnaoua","Route d'Immouzer"] },
  { city:"Sfax",           country:"Tunisia",      lat:34.7406,  lng:10.7603,  currency:"TND", priceIndex:4, neighbourhoods:["Sfax Ville","Sakiet Ezzit","Menzel Chaker","Route Mahres","Thyna","Sakiet Eddaier"] },

  // ── More Southern Africa ──
  { city:"Gaborone",       country:"Botswana",     lat:-24.6282, lng:25.9231,  currency:"BWP", priceIndex:5, neighbourhoods:["Gaborone West","Phakalane","Tlokweng","Extension 2","Sebele","Broadhurst","Block 3"] },
  { city:"Bulawayo",       country:"Zimbabwe",     lat:-20.1525, lng:28.5778,  currency:"USD", priceIndex:4, neighbourhoods:["Kumalo","Suburbs","Famona","Hillside","Waterford","Nkulumane","Thorngrove"] },
  { city:"Bloemfontein",   country:"South Africa", lat:-29.0852, lng:26.1596,  currency:"ZAR", priceIndex:5, neighbourhoods:["Westdene","Brandwag","Universitas","Langenhoven Park","Fichardt Park","Willows"] },
  { city:"Port Elizabeth",  country:"South Africa", lat:-33.9608, lng:25.6022,  currency:"ZAR", priceIndex:5, neighbourhoods:["Mill Park","Summerstrand","Walmer","Lorraine","Framesby","Newton Park","Kabega"] },

  // ── More Central Africa ──
  { city:"Lubumbashi",     country:"DRC",          lat:-11.6609, lng:27.4794,  currency:"CDF", priceIndex:4, neighbourhoods:["Annexe","Golf","Kamalondo","Kampemba","Kenya","Ruashi","Rwashi"] },
  { city:"Brazzaville",    country:"Republic of Congo", lat:-4.2692, lng:15.2718, currency:"XAF", priceIndex:4, neighbourhoods:["Centre-Ville","Poto-Poto","Bacongo","Moungali","Ouenzé","Talangaï","Makélékélé"] },
  { city:"Libreville",     country:"Gabon",        lat:0.3924,   lng:9.4536,   currency:"XAF", priceIndex:5, neighbourhoods:["Louis","Akanda","Owendo","Nzeng-Ayong","PK8","Alibandeng","Lalala"] },
  { city:"N'Djamena",      country:"Chad",         lat:12.1048,  lng:15.0444,  currency:"XAF", priceIndex:4, neighbourhoods:["1er Arrondissement","2e Arrondissement","3e Arrondissement","Walia","Toukra","Ridina"] },

  // ── Gulf & Middle East extras ──
  { city:"Amman",          country:"Jordan",       lat:31.9539,  lng:35.9106,  currency:"JOD", priceIndex:6, neighbourhoods:["Abdoun","Sweifiyyeh","Khalda","Dabouq","Rabieh","Tlaa Al-Ali","Wadi Saqra","Shmeisani","Gardens","Um Uthaina"] },
  { city:"Beirut",         country:"Lebanon",      lat:33.8938,  lng:35.5018,  currency:"USD", priceIndex:6, neighbourhoods:["Achrafieh","Hamra","Verdun","Rawche","Badaro","Mar Mikhael","Sodeco","Gemmayzeh","Jnah"] },
  { city:"Tel Aviv",       country:"Israel",       lat:32.0853,  lng:34.7818,  currency:"ILS", priceIndex:10,neighbourhoods:["Rothschild","Neve Tzedek","Florentin","Ramat Aviv","Dizengoff","Port Area","Jaffa","Bavli","North Tel Aviv","Herzliya Pituah"] },
  { city:"Jerusalem",      country:"Israel",       lat:31.7683,  lng:35.2137,  currency:"ILS", priceIndex:9, neighbourhoods:["German Colony","Rehavia","Talbiyeh","Beit HaKerem","Ramot","French Hill","Arnona","Katamon"] },
  { city:"Haifa",          country:"Israel",       lat:32.7940,  lng:34.9896,  currency:"ILS", priceIndex:8, neighbourhoods:["Carmel","Neve Sha'anan","Downtown","German Colony Haifa","Kiryat Haim","Ramat HaNassi"] },
  { city:"Baghdad",        country:"Iraq",         lat:33.3152,  lng:44.3661,  currency:"IQD", priceIndex:5, neighbourhoods:["Mansour","Zayouna","Karrada","Al-Jadriya","Arasat","Kadhimiya","Adhamiya","Saidiya"] },
  { city:"Tehran",         country:"Iran",         lat:35.6892,  lng:51.3890,  currency:"USD", priceIndex:6, neighbourhoods:["Niavaran","Elahieh","Zafaranieh","Shahrak-e-Gharb","Velenjak","Jordan","Narmak","Aghdasieh"] },
  { city:"Ankara",         country:"Turkey",       lat:39.9334,  lng:32.8597,  currency:"TRY", priceIndex:5, neighbourhoods:["Çankaya","Keçiören","Etimesgut","Yenimahalle","Çayyolu","Oran","Dikmen","Bahçelievler"] },
  { city:"Izmir",          country:"Turkey",       lat:38.4192,  lng:27.1287,  currency:"TRY", priceIndex:5, neighbourhoods:["Bornova","Karşıyaka","Buca","Konak","Balçova","Çiğli","Narlıdere","Güzelbahçe"] },
  { city:"Antalya",        country:"Turkey",       lat:36.8969,  lng:30.7133,  currency:"TRY", priceIndex:5, neighbourhoods:["Lara","Konyaaltı","Muratpaşa","Döşemealtı","Kepez","Aksu","Alanya","Belek"] },

  // ── Central Asia & Caucasus ──
  { city:"Almaty",         country:"Kazakhstan",   lat:43.2565,  lng:76.9286,  currency:"KZT", priceIndex:6, neighbourhoods:["Medeu","Bostandyk","Alatau","Almaly","Auezov","Turksib","Zhetysu","Nauryzbai"] },
  { city:"Tashkent",       country:"Uzbekistan",   lat:41.2995,  lng:69.2401,  currency:"UZS", priceIndex:4, neighbourhoods:["Yunusabad","Chilanzar","Mirabad","Sergeli","Bektemir","Shaykhontohur","Olmazor","Uchtepa"] },
  { city:"Samarkand",      country:"Uzbekistan",   lat:39.6270,  lng:66.9750,  currency:"UZS", priceIndex:3, neighbourhoods:["Registan","Siyob","Ibrohimov","Chilonzor","Farabi","Bogishamol","Dagbitkazik"] },
  { city:"Bishkek",        country:"Kyrgyzstan",   lat:42.8746,  lng:74.5698,  currency:"KGS", priceIndex:3, neighbourhoods:["Sverdlovsky","Oktyabrsky","Pervomaysky","Leninsky","Alatau","Asanbay","Kemin"] },
  { city:"Astana",         country:"Kazakhstan",   lat:51.1801,  lng:71.4460,  currency:"KZT", priceIndex:6, neighbourhoods:["Есіл","Байконыр","Сарыарқа","Алматы district","Expo","Left Bank","Khan Shatyr"] },
  { city:"Dushanbe",       country:"Tajikistan",   lat:38.5598,  lng:68.7738,  currency:"TJS", priceIndex:3, neighbourhoods:["Ismoil Somoni","Shohmansur","Sino","Firdavsi","Rudaki","Bokhtar","Hisor"] },
  { city:"Ashgabat",       country:"Turkmenistan", lat:37.9601,  lng:58.3261,  currency:"TMT", priceIndex:4, neighbourhoods:["Azatlyk","Kopetdag","Berkararlyk","Bagtyyarlyk","Chandybil","Parahat","Archabil"] },
  { city:"Baku",           country:"Azerbaijan",   lat:40.4093,  lng:49.8671,  currency:"AZN", priceIndex:6, neighbourhoods:["White City","Nasimi","Sabayil","Binagadi","Khatai","Sabunchu","Yasamal","Nizami"] },
  { city:"Tbilisi",        country:"Georgia",      lat:41.6938,  lng:44.8015,  currency:"GEL", priceIndex:5, neighbourhoods:["Vake","Saburtalo","Mtatsminda","Isani","Gldani","Nadzaladevi","Didube","Chugureti"] },
  { city:"Yerevan",        country:"Armenia",      lat:40.1792,  lng:44.4991,  currency:"AMD", priceIndex:5, neighbourhoods:["Kentron","Arabkir","Davtashen","Erebuni","Malatia","Nor Nork","Kanaker","Shengavit"] },

  // ── South Asia extras ──
  { city:"Chennai",        country:"India",        lat:13.0827,  lng:80.2707,  currency:"INR", priceIndex:6, neighbourhoods:["Adyar","Nungambakkam","Anna Nagar","T. Nagar","Velachery","OMR","ECR","Besant Nagar","Mylapore"] },
  { city:"Pune",           country:"India",        lat:18.5204,  lng:73.8567,  currency:"INR", priceIndex:6, neighbourhoods:["Koregaon Park","Kalyani Nagar","Viman Nagar","Baner","Aundh","Kothrud","Hadapsar","Wakad","Hinjewadi"] },
  { city:"Kolkata",        country:"India",        lat:22.5726,  lng:88.3639,  currency:"INR", priceIndex:5, neighbourhoods:["Salt Lake","New Town","Park Street","Alipore","Ballygunge","Behala","Howrah","Rajarhat"] },
  { city:"Ahmedabad",      country:"India",        lat:23.0225,  lng:72.5714,  currency:"INR", priceIndex:5, neighbourhoods:["Satellite","Bodakdev","Prahlad Nagar","SG Highway","Navrangpura","Vastrapur","Thaltej"] },
  { city:"Jaipur",         country:"India",        lat:26.9124,  lng:75.7873,  currency:"INR", priceIndex:5, neighbourhoods:["Vaishali Nagar","Malviya Nagar","Mansarovar","Jagatpura","C-Scheme","Civil Lines","Jawahar Nagar"] },
  { city:"Islamabad",      country:"Pakistan",     lat:33.6844,  lng:73.0479,  currency:"PKR", priceIndex:5, neighbourhoods:["F-7","F-8","F-10","E-7","G-10","Bahria Town","DHA","Margalla Hills","I-8"] },
  { city:"Dhaka",          country:"Bangladesh",   lat:23.8103,  lng:90.4125,  currency:"BDT", priceIndex:4, neighbourhoods:["Gulshan","Banani","Dhanmondi","Bashundhara","Uttara","Mirpur","Mohammadpur","Khilgaon"] },
  { city:"Chittagong",     country:"Bangladesh",   lat:22.3569,  lng:91.7832,  currency:"BDT", priceIndex:3, neighbourhoods:["Agrabad","Nasirabad","Panchlaish","Khulshi","Halishahar","Bayazid","Kotwali"] },
  { city:"Kathmandu",      country:"Nepal",        lat:27.7172,  lng:85.3240,  currency:"NPR", priceIndex:4, neighbourhoods:["Thamel","Lazimpat","Maharajgunj","Boudha","Patan","Bhaktapur","Kirtipur","Naxal","Baneshwor"] },

  // ── East Asia extras ──
  { city:"Tokyo",          country:"Japan",        lat:35.6762,  lng:139.6503, currency:"JPY", priceIndex:9, neighbourhoods:["Shinjuku","Shibuya","Roppongi","Minato","Setagaya","Meguro","Chiyoda","Nakameguro","Harajuku","Ebisu","Akasaka","Shinagawa"] },
  { city:"Osaka",          country:"Japan",        lat:34.6937,  lng:135.5023, currency:"JPY", priceIndex:8, neighbourhoods:["Namba","Umeda","Shinsaibashi","Tennoji","Nakatsu","Fukushima","Kitahorie","Abeno"] },
  { city:"Yokohama",       country:"Japan",        lat:35.4437,  lng:139.6380, currency:"JPY", priceIndex:8, neighbourhoods:["Minato Mirai","Nishi-ku","Naka-ku","Tsurumi","Kohoku","Midori","Aoba","Totsuka"] },
  { city:"Kyoto",          country:"Japan",        lat:35.0116,  lng:135.7681, currency:"JPY", priceIndex:8, neighbourhoods:["Gion","Higashiyama","Fushimi","Sakyo","Nishikyo","Kita","Nakagyo","Yamashina"] },
  { city:"Nagoya",         country:"Japan",        lat:35.1815,  lng:136.9066, currency:"JPY", priceIndex:7, neighbourhoods:["Sakae","Nagoya Station","Chikusa","Higashi","Meito","Tempaku","Moriyama"] },
  { city:"Fukuoka",        country:"Japan",        lat:33.5904,  lng:130.4017, currency:"JPY", priceIndex:7, neighbourhoods:["Hakata","Nishi","Higashi","Minami","Jonan","Sawara","Chuo"] },
  { city:"Beijing",        country:"China",        lat:39.9042,  lng:116.4074, currency:"CNY", priceIndex:9, neighbourhoods:["Chaoyang","Haidian","Dongcheng","Xicheng","Chengwen","Shunyi","Tongzhou","Daxing","Yanqing"] },
  { city:"Shanghai",       country:"China",        lat:31.2304,  lng:121.4737, currency:"CNY", priceIndex:9, neighbourhoods:["Jing'an","Lujiazui","Xuhui","Changning","Pudong","Hongqiao","Qingpu","Songjiang","Jiading"] },
  { city:"Guangzhou",      country:"China",        lat:23.1291,  lng:113.2644, currency:"CNY", priceIndex:8, neighbourhoods:["Tianhe","Yuexiu","Haizhu","Liwan","Huangpu","Panyu","Baiyun","Nansha","Zengcheng"] },
  { city:"Shenzhen",       country:"China",        lat:22.5431,  lng:114.0579, currency:"CNY", priceIndex:9, neighbourhoods:["Nanshan","Futian","Luohu","Bao'an","Longhua","Longgang","Yantian","Pingshan"] },
  { city:"Chengdu",        country:"China",        lat:30.5728,  lng:104.0668, currency:"CNY", priceIndex:7, neighbourhoods:["Jinjiang","Qingyang","Wuhou","Chenghua","Jinniu","Pidu","Wenjiang","Shuangliu"] },
  { city:"Wuhan",          country:"China",        lat:30.5928,  lng:114.3055, currency:"CNY", priceIndex:6, neighbourhoods:["Jiangan","Jianghan","Qiaokou","Hanyang","Wuchang","Hongshan","Qingshan","Xinzhou"] },
  { city:"Hangzhou",       country:"China",        lat:30.2741,  lng:120.1551, currency:"CNY", priceIndex:8, neighbourhoods:["Westlake","Binjiang","Gongshu","Shangcheng","Jianggan","Xiacheng","Yuhang","Xiaoshan"] },
  { city:"Chongqing",      country:"China",        lat:29.5630,  lng:106.5516, currency:"CNY", priceIndex:6, neighbourhoods:["Yuzhong","Jiulongpo","Nan'an","Banan","Shapingba","Yubei","Dadukou","Jiangbei"] },
  { city:"Nanjing",        country:"China",        lat:32.0603,  lng:118.7969, currency:"CNY", priceIndex:7, neighbourhoods:["Gulou","Xuanwu","Jianye","Qinhuai","Pukou","Jiangning","Lishui","Gaochun"] },
  { city:"Seoul",          country:"South Korea",  lat:37.5665,  lng:126.9780, currency:"KRW", priceIndex:9, neighbourhoods:["Gangnam","Seocho","Mapo","Yongsan","Jongno","Songpa","Nowon","Dobong","Seodaemun","Seongdong","Gwangjin"] },
  { city:"Busan",          country:"South Korea",  lat:35.1796,  lng:129.0756, currency:"KRW", priceIndex:7, neighbourhoods:["Haeundae","Suyeong","Nam-gu","Jung-gu","Dong-gu","Seo-gu","Buk-gu","Yeonje","Sasang"] },
  { city:"Incheon",        country:"South Korea",  lat:37.4563,  lng:126.7052, currency:"KRW", priceIndex:7, neighbourhoods:["Songdo","Yeonsu","Namdong","Bupyeong","Seo-gu","Jung-gu","Dong-gu","Ganghwa"] },
  { city:"Taipei",         country:"Taiwan",       lat:25.0330,  lng:121.5654, currency:"TWD", priceIndex:8, neighbourhoods:["Da'an","Xinyi","Zhongzheng","Songshan","Zhongshan","Wanhua","Neihu","Wenshan","Shilin","Beitou"] },
  { city:"Hong Kong",      country:"China",        lat:22.3193,  lng:114.1694, currency:"HKD", priceIndex:10,neighbourhoods:["Central","Wan Chai","Causeway Bay","Mong Kok","Tsim Sha Tsui","Kowloon Tong","Sham Shui Po","Tai Po","Sai Kung","Clear Water Bay"] },
  { city:"Ulaanbaatar",    country:"Mongolia",     lat:47.8864,  lng:106.9057, currency:"MNT", priceIndex:4, neighbourhoods:["Sukhbaatar","Chingeltei","Bayangol","Khan-Uul","Bayanzurkh","Songinokhairkhan"] },

  // ── Southeast Asia extras ──
  { city:"Hanoi",          country:"Vietnam",      lat:21.0285,  lng:105.8542, currency:"VND", priceIndex:5, neighbourhoods:["Hoan Kiem","Ba Dinh","Tay Ho","Dong Da","Cau Giay","Long Bien","Hoang Mai","Nam Tu Liem"] },
  { city:"Da Nang",        country:"Vietnam",      lat:16.0544,  lng:108.2022, currency:"VND", priceIndex:5, neighbourhoods:["Hai Chau","Thanh Khe","Son Tra","Ngu Hanh Son","Lien Chieu","Cam Le","Hoa Vang"] },
  { city:"Chiang Mai",     country:"Thailand",     lat:18.7883,  lng:98.9853,  currency:"THB", priceIndex:5, neighbourhoods:["Nimmanhaemin","Old City","Santitham","Mueang Mai","Hang Dong","San Sai","Doi Saket"] },
  { city:"Surabaya",       country:"Indonesia",    lat:-7.2575,  lng:112.7521, currency:"IDR", priceIndex:5, neighbourhoods:["Sukolilo","Gubeng","Genteng","Rungkut","Mulyorejo","Wonokromo","Lakarsantri"] },
  { city:"Bandung",        country:"Indonesia",    lat:-6.9175,  lng:107.6191, currency:"IDR", priceIndex:4, neighbourhoods:["Dago","Setiabudi","Buah Batu","Antapani","Arcamanik","Cibeunying","Coblong"] },
  { city:"Medan",          country:"Indonesia",    lat:3.5952,   lng:98.6722,  currency:"IDR", priceIndex:4, neighbourhoods:["Petisah","Polonia","Helvetia","Sunggal","Medan Baru","Tembung","Perjuangan"] },
  { city:"Penang",         country:"Malaysia",     lat:5.4141,   lng:100.3288, currency:"MYR", priceIndex:6, neighbourhoods:["Georgetown","Batu Ferringhi","Gurney","Sungai Nibong","Ayer Itam","Balik Pulau","Tanjung Tokong"] },
  { city:"Johor Bahru",    country:"Malaysia",     lat:1.4927,   lng:103.7414, currency:"MYR", priceIndex:6, neighbourhoods:["Iskandar Puteri","Tebrau","Johor Jaya","Taman Molek","Larkin","Permas Jaya","Ulu Tiram"] },
  { city:"Cebu",           country:"Philippines",  lat:10.3157,  lng:123.8854, currency:"PHP", priceIndex:5, neighbourhoods:["Lahug","IT Park","Banilad","Ayala","Mabolo","Cebu Business Park","North Reclamation"] },
  { city:"Phnom Penh",     country:"Cambodia",     lat:11.5564,  lng:104.9282, currency:"USD", priceIndex:4, neighbourhoods:["BKK1","Tonle Bassac","Toul Kork","7 Makara","Boeng Keng Kang","Chamkarmon","Daun Penh"] },
  { city:"Yangon",         country:"Myanmar",      lat:16.8409,  lng:96.1735,  currency:"MMK", priceIndex:4, neighbourhoods:["Yankin","Hlaing","Kamayut","North Okkalapa","Bahan","Sanchaung","Mayangone","Tarmwe"] },
  { city:"Vientiane",      country:"Laos",         lat:17.9757,  lng:102.6331, currency:"LAK", priceIndex:3, neighbourhoods:["Chanthabouly","Sikhottabong","Xaysetha","Sisattanak","Naxaithong","Xaytany","Hatxayfong"] },

  // ── Western Europe extras ──
  { city:"Edinburgh",      country:"UK",           lat:55.9533,  lng:-3.1883,  currency:"GBP", priceIndex:8, neighbourhoods:["New Town","Old Town","Morningside","Marchmont","Stockbridge","Leith","Inverleith","Corstorphine"] },
  { city:"Manchester",     country:"UK",           lat:53.4808,  lng:-2.2426,  currency:"GBP", priceIndex:7, neighbourhoods:["City Centre","Didsbury","Chorlton","Salford","Stretford","Altrincham","Sale","Urmston"] },
  { city:"Birmingham",     country:"UK",           lat:52.4862,  lng:-1.8904,  currency:"GBP", priceIndex:6, neighbourhoods:["Edgbaston","Moseley","Harborne","Sutton Coldfield","Solihull","Digbeth","Jewellery Quarter"] },
  { city:"Glasgow",        country:"UK",           lat:55.8642,  lng:-4.2518,  currency:"GBP", priceIndex:6, neighbourhoods:["West End","Southside","Merchant City","Dennistoun","Bearsden","Milngavie","Partick"] },
  { city:"Hamburg",        country:"Germany",      lat:53.5753,  lng:10.0153,  currency:"EUR", priceIndex:8, neighbourhoods:["Altona","Eimsbüttel","Harvestehude","Blankenese","Wandsbek","Bergedorf","Barmbek","HafenCity"] },
  { city:"Frankfurt",      country:"Germany",      lat:50.1109,  lng:8.6821,   currency:"EUR", priceIndex:8, neighbourhoods:["Sachsenhausen","Westend","Nordend","Bornheim","Bockenheim","Gallus","Sachsenhausen Nord"] },
  { city:"Cologne",        country:"Germany",      lat:50.9333,  lng:6.9500,   currency:"EUR", priceIndex:7, neighbourhoods:["Innenstadt","Lindenthal","Ehrenfeld","Nippes","Mülheim","Chorweiler","Porz","Rodenkirchen"] },
  { city:"Lyon",           country:"France",       lat:45.7640,  lng:4.8357,   currency:"EUR", priceIndex:7, neighbourhoods:["Presqu'île","Part-Dieu","Croix-Rousse","Vieux Lyon","Confluence","Monplaisir","Bron","Caluire"] },
  { city:"Marseille",      country:"France",       lat:43.2965,  lng:5.3698,   currency:"EUR", priceIndex:6, neighbourhoods:["Vieux-Port","Endoume","Roucas Blanc","Prado","Les Catalans","Madrague","Plombières"] },
  { city:"Nice",           country:"France",       lat:43.7102,  lng:7.2620,   currency:"EUR", priceIndex:8, neighbourhoods:["Promenade des Anglais","Vieux-Nice","Cimiez","Mont Boron","Musiciens","Libération","Saint-Isidore"] },
  { city:"Naples",         country:"Italy",        lat:40.8518,  lng:14.2681,  currency:"EUR", priceIndex:6, neighbourhoods:["Vomero","Posillipo","Fuorigrotta","Chiaia","Centro Storico","Pozzuoli","Bagnoli","Soccavo"] },
  { city:"Turin",          country:"Italy",        lat:45.0703,  lng:7.6869,   currency:"EUR", priceIndex:7, neighbourhoods:["Centro","Crocetta","Cit Turin","San Salvario","Borgo Po","Mirafiori","Barriera di Milano"] },
  { city:"Florence",       country:"Italy",        lat:43.7696,  lng:11.2558,  currency:"EUR", priceIndex:8, neighbourhoods:["Oltrarno","San Niccolò","Duomo","Santa Croce","Novoli","Rifredi","Isolotto","Sesto Fiorentino"] },
  { city:"Valencia",       country:"Spain",        lat:39.4699,  lng:-0.3763,  currency:"EUR", priceIndex:7, neighbourhoods:["Eixample","Rascanya","Benimaclet","Campanar","Patraix","Jesús","Quatre Carreres","Alboraya"] },
  { city:"Seville",        country:"Spain",        lat:37.3891,  lng:-5.9845,  currency:"EUR", priceIndex:6, neighbourhoods:["Centro","Triana","Los Remedios","Nervión","Heliópolis","Bellavista","San Pablo"] },
  { city:"Porto",          country:"Portugal",     lat:41.1579,  lng:-8.6291,  currency:"EUR", priceIndex:7, neighbourhoods:["Foz","Bonfim","Cedofeita","Campanhã","Massarelos","Paranhos","Ramalde","Baixa"] },
  { city:"Rotterdam",      country:"Netherlands",  lat:51.9244,  lng:4.4777,   currency:"EUR", priceIndex:7, neighbourhoods:["Kralingen","Hillegersberg","Overschie","Centrum","Delfshaven","Prins Alexander","Feijenoord"] },
  { city:"Geneva",         country:"Switzerland",  lat:46.2044,  lng:6.1432,   currency:"CHF", priceIndex:10,neighbourhoods:["Champel","Florissant","Eaux-Vives","Plainpalais","Carouge","Paquis","Cologny","Collonge-Bellerive"] },
  { city:"Thessaloniki",   country:"Greece",       lat:40.6401,  lng:22.9444,  currency:"EUR", priceIndex:5, neighbourhoods:["Aristotelous","Ladadika","Nea Paralia","Analipsi","Panorama","Neapoli","Toumba","Kalamaria"] },
  { city:"Oslo",           country:"Norway",       lat:59.9139,  lng:10.7522,  currency:"NOK", priceIndex:10,neighbourhoods:["Frogner","Majorstua","Grünerløkka","Grønland","Aker Brygge","Bjørvika","Ullern","Vinderen","Blindern"] },
  { city:"Helsinki",       country:"Finland",      lat:60.1699,  lng:24.9384,  currency:"EUR", priceIndex:8, neighbourhoods:["Kallio","Töölö","Lauttasaari","Westend","Tapiola","Matinkylä","Herttoniemi","Vuosaari"] },
  { city:"Brussels",       country:"Belgium",      lat:50.8503,  lng:4.3517,   currency:"EUR", priceIndex:7, neighbourhoods:["Ixelles","Etterbeek","Uccle","Woluwé","Laeken","Molenbeek","Forest","Auderghem","Waterloo"] },

  // ── Eastern Europe ──
  { city:"Kyiv",           country:"Ukraine",      lat:50.4501,  lng:30.5234,  currency:"UAH", priceIndex:5, neighbourhoods:["Pechersk","Shevchenkivskyi","Obolon","Holosiivskyi","Podil","Bortnychi","Darnytsya","Desnyanskyi"] },
  { city:"Kharkiv",        country:"Ukraine",      lat:49.9935,  lng:36.2304,  currency:"UAH", priceIndex:4, neighbourhoods:["Saltivka","Pavlove Pole","Alekseyivka","Kholodna Hora","Rohan","Industrialny","Novobavarskyi"] },
  { city:"Lviv",           country:"Ukraine",      lat:49.8397,  lng:24.0297,  currency:"UAH", priceIndex:5, neighbourhoods:["City Centre","Sykhiv","Lychakiv","Shevchenkivskyi","Halychyna","Frankivsk","Rясне"] },
  { city:"Minsk",          country:"Belarus",      lat:53.9045,  lng:27.5615,  currency:"BYN", priceIndex:5, neighbourhoods:["Centralny","Savetski","Pershamaiski","Frunzenski","Zavodski","Leninski","Kastrychnicki","Partizanski"] },
  { city:"Bucharest",      country:"Romania",      lat:44.4268,  lng:26.1025,  currency:"RON", priceIndex:6, neighbourhoods:["Floreasca","Dorobanți","Herăstrău","Drumul Taberei","Berceni","Titan","Militari","Tineretului"] },
  { city:"Sofia",          country:"Bulgaria",     lat:42.6977,  lng:23.3219,  currency:"BGN", priceIndex:5, neighbourhoods:["Lozenets","Boyana","Dragalevtsi","Manastirski Livadi","Oborishte","Serdika","Nadezhda","Liulin"] },
  { city:"Belgrade",       country:"Serbia",       lat:44.7866,  lng:20.4489,  currency:"RSD", priceIndex:5, neighbourhoods:["Vračar","Savski Venac","Stari Grad","Zvezdara","Rakovica","Zemun","Novi Beograd","Surčin"] },
  { city:"Zagreb",         country:"Croatia",      lat:45.8150,  lng:15.9819,  currency:"EUR", priceIndex:6, neighbourhoods:["Gornji Grad","Medveščak","Trnje","Trešnjevka","Črnomerec","Sesvete","Novi Zagreb","Dubrava"] },
  { city:"Bratislava",     country:"Slovakia",     lat:48.1486,  lng:17.1077,  currency:"EUR", priceIndex:6, neighbourhoods:["Staré Mesto","Nové Mesto","Dúbravka","Petržalka","Ružinov","Devínska","Karlova Ves","Rača"] },
  { city:"Ljubljana",      country:"Slovenia",     lat:46.0511,  lng:14.5051,  currency:"EUR", priceIndex:6, neighbourhoods:["Center","Šiška","Šentvid","Moste","Polje","Vič","Bežigrad","Golovec"] },
  { city:"Sarajevo",       country:"Bosnia",       lat:43.8486,  lng:18.3564,  currency:"BAM", priceIndex:4, neighbourhoods:["Centar","Novo Sarajevo","Novi Grad","Stari Grad","Ilidža","Vogošća","Hadžići"] },
  { city:"Tirana",         country:"Albania",      lat:41.3275,  lng:19.8187,  currency:"ALL", priceIndex:4, neighbourhoods:["Blloku","Kombinat","Yzberisht","Don Bosko","Tirana e Re","Lapraka","Kamëz"] },
  { city:"Tallinn",        country:"Estonia",      lat:59.4370,  lng:24.7536,  currency:"EUR", priceIndex:7, neighbourhoods:["Kesklinn","Kalamaja","Kassisaba","Kadriorg","Pirita","Nõmme","Kristiine","Mustamäe","Põhja-Tallinn"] },
  { city:"Riga",           country:"Latvia",       lat:56.9496,  lng:24.1052,  currency:"EUR", priceIndex:6, neighbourhoods:["Centrs","Vecriga","Āgenskalns","Teika","Purvciems","Mežciems","Imanta","Jugla","Pleskodāle"] },
  { city:"Vilnius",        country:"Lithuania",    lat:54.6872,  lng:25.2797,  currency:"EUR", priceIndex:6, neighbourhoods:["Žvėrynas","Antakalnis","Šnipiškės","Naujininkai","Justiniškės","Šeškinė","Pašilaičiai"] },
  { city:"Warsaw",         country:"Poland",       lat:52.2297,  lng:21.0122,  currency:"PLN", priceIndex:6, neighbourhoods:["Śródmieście","Mokotów","Wilanów","Ursynów","Żoliborz","Bielany","Praga","Wola","Ochota"] },
  { city:"Krakow",         country:"Poland",       lat:50.0647,  lng:19.9450,  currency:"PLN", priceIndex:6, neighbourhoods:["Stare Miasto","Kazimierz","Podgórze","Krowodrza","Nowa Huta","Zwierzyniec","Grzegórzki"] },
  { city:"Prague",         country:"Czechia",      lat:50.0755,  lng:14.4378,  currency:"CZK", priceIndex:7, neighbourhoods:["Prague 1","Prague 2","Prague 6","Vinohrady","Žižkov","Smíchov","Karlín","Holešovice"] },
  { city:"Budapest",       country:"Hungary",      lat:47.4979,  lng:19.0402,  currency:"HUF", priceIndex:6, neighbourhoods:["District 5","District 6","District 7","District 11","District 2","District 12","District 13"] },
  { city:"Istanbul",       country:"Turkey",       lat:41.0082,  lng:28.9784,  currency:"TRY", priceIndex:6, neighbourhoods:["Beşiktaş","Şişli","Kadıköy","Üsküdar","Beyoğlu","Ataşehir","Maltepe","Bakırköy","Sarıyer"] },

  // ── Russia ──
  { city:"Moscow",         country:"Russia",       lat:55.7558,  lng:37.6173,  currency:"RUB", priceIndex:7, neighbourhoods:["Arbat","Zamoskvorechye","Basmanny","Presnensky","Khamovniki","Tverskoy","Tagansky","Dorogomilovo","Filevsky Park"] },
  { city:"Saint Petersburg", country:"Russia",     lat:59.9311,  lng:30.3609,  currency:"RUB", priceIndex:6, neighbourhoods:["Petrogradsky","Tsentralny","Admiralteysky","Moskovsky","Vasileostrovskiy","Kalininsky","Vyborgsky","Nevsky"] },
  { city:"Novosibirsk",    country:"Russia",       lat:55.0084,  lng:82.9357,  currency:"RUB", priceIndex:4, neighbourhoods:["Akademgorodok","Kirovsky","Leninsky","Oktiabrsky","Zheleznodorozhny","Central","Pervomaysky"] },
  { city:"Yekaterinburg",  country:"Russia",       lat:56.8389,  lng:60.6057,  currency:"RUB", priceIndex:5, neighbourhoods:["Centre","Akademichesky","Botanichesky","Uktus","Uralmash","Pioneer","Vtuzgorodok"] },

  // ── Americas — USA ──
  { city:"Houston",        country:"USA",          lat:29.7604,  lng:-95.3698, currency:"USD", priceIndex:8, neighbourhoods:["River Oaks","Midtown","Montrose","Heights","Memorial","Galleria","Sugar Land","The Woodlands","Pearland","Katy"] },
  { city:"Dallas",         country:"USA",          lat:32.7767,  lng:-96.7970, currency:"USD", priceIndex:8, neighbourhoods:["Uptown","Deep Ellum","Oak Cliff","Lakewood","Preston Hollow","Highland Park","Plano","Frisco","Allen","McKinney"] },
  { city:"San Francisco",  country:"USA",          lat:37.7749,  lng:-122.4194,currency:"USD", priceIndex:10,neighbourhoods:["Pacific Heights","Noe Valley","Castro","Mission","Soma","Marina","Nob Hill","Richmond","Sunset","Presidio"] },
  { city:"Seattle",        country:"USA",          lat:47.6062,  lng:-122.3321,currency:"USD", priceIndex:9, neighbourhoods:["Capitol Hill","Fremont","Queen Anne","Ballard","Bellevue","Redmond","Kirkland","Mercer Island","Edmonds"] },
  { city:"Boston",         country:"USA",          lat:42.3601,  lng:-71.0589, currency:"USD", priceIndex:9, neighbourhoods:["Back Bay","South End","Beacon Hill","Cambridge","Brookline","Newton","Wellesley","Somerville","Quincy"] },
  { city:"Denver",         country:"USA",          lat:39.7392,  lng:-104.9903,currency:"USD", priceIndex:8, neighbourhoods:["LoDo","Cherry Creek","Congress Park","Capitol Hill","Highland","Washington Park","Stapleton","Parker"] },
  { city:"Atlanta",        country:"USA",          lat:33.7490,  lng:-84.3880, currency:"USD", priceIndex:7, neighbourhoods:["Buckhead","Midtown","Inman Park","Grant Park","Decatur","Sandy Springs","Alpharetta","Marietta"] },
  { city:"Austin",         country:"USA",          lat:30.2672,  lng:-97.7431, currency:"USD", priceIndex:8, neighbourhoods:["South Congress","East Austin","Travis Heights","West Lake Hills","Round Rock","Cedar Park","Pflugerville"] },
  { city:"Las Vegas",      country:"USA",          lat:36.1699,  lng:-115.1398,currency:"USD", priceIndex:7, neighbourhoods:["Summerlin","Henderson","Green Valley","Centennial Hills","Paradise","Spring Valley","Enterprise"] },
  { city:"Minneapolis",    country:"USA",          lat:44.9778,  lng:-93.2650, currency:"USD", priceIndex:7, neighbourhoods:["Uptown","Linden Hills","Minnehaha","Northeast","Kenwood","Edina","Plymouth","Eden Prairie"] },

  // ── Americas — Canada ──
  { city:"Montreal",       country:"Canada",       lat:45.5017,  lng:-73.5673, currency:"CAD", priceIndex:7, neighbourhoods:["Plateau","Outremont","Westmount","NDG","Verdun","Hochelaga","Rosemont","Sud-Ouest"] },
  { city:"Calgary",        country:"Canada",       lat:51.0447,  lng:-114.0719,currency:"CAD", priceIndex:8, neighbourhoods:["Beltline","Inglewood","Altadore","Mount Royal","Kensington","Bridgeland","Springbank Hill","Tuscany"] },
  { city:"Ottawa",         country:"Canada",       lat:45.4215,  lng:-75.6972, currency:"CAD", priceIndex:7, neighbourhoods:["Glebe","Westboro","Hintonburg","Alta Vista","Kanata","Barrhaven","Orleans","Nepean"] },

  // ── Americas — Latin America ──
  { city:"Mexico City",    country:"Mexico",       lat:19.4326,  lng:-99.1332, currency:"MXN", priceIndex:5, neighbourhoods:["Polanco","Lomas","Condesa","Roma","Coyoacán","Santa Fe","Del Valle","Nápoles","Satélite"] },
  { city:"Guadalajara",    country:"Mexico",       lat:20.6597,  lng:-103.3496,currency:"MXN", priceIndex:4, neighbourhoods:["Chapultepec","Providencia","Jardines del Bosque","Tlaquepaque","Zapopan","Tonalá","Huentitán"] },
  { city:"Monterrey",      country:"Mexico",       lat:25.6866,  lng:-100.3161,currency:"MXN", priceIndex:5, neighbourhoods:["San Pedro Garza García","Monterrey Centro","Cumbres","Valle","Del Valle","Chipinque","Obispado"] },
  { city:"Cancún",         country:"Mexico",       lat:21.1619,  lng:-86.8515, currency:"MXN", priceIndex:5, neighbourhoods:["Hotel Zone","Centro","Región 94","Supermanzana 2","Pok-Ta-Pok","Alfredo V Bonfil"] },
  { city:"Guatemala City", country:"Guatemala",    lat:14.6349,  lng:-90.5069, currency:"GTQ", priceIndex:4, neighbourhoods:["Zona 10","Zona 14","Zona 15","Zona 16","Cayalá","Ciudad Cayalá","Vista Hermosa","Lomas de Pamplona"] },
  { city:"San José",       country:"Costa Rica",   lat:9.9281,   lng:-84.0907, currency:"CRC", priceIndex:5, neighbourhoods:["Escazú","Santa Ana","Rohrmoser","Curridabat","Desamparados","La Unión","Tibás","Heredia"] },
  { city:"Panama City",    country:"Panama",       lat:8.9936,   lng:-79.5197, currency:"USD", priceIndex:6, neighbourhoods:["Punta Pacifica","Marbella","San Francisco","El Cangrejo","Costa del Este","Clayton","Casco Viejo","Obarrio"] },
  { city:"Havana",         country:"Cuba",         lat:23.1136,  lng:-82.3666, currency:"USD", priceIndex:4, neighbourhoods:["Vedado","Miramar","Playa","Habana Vieja","Centro Habana","Cerro","Marianao","Boyeros"] },
  { city:"Santo Domingo",  country:"Dominican Rep.",lat:18.4861, lng:-69.9312, currency:"DOP", priceIndex:4, neighbourhoods:["Piantini","Serralles","Naco","Mirador Norte","La Esperilla","Bella Vista","Ensanche Ozama"] },
  { city:"Kingston",       country:"Jamaica",      lat:17.9970,  lng:-76.7936, currency:"JMD", priceIndex:4, neighbourhoods:["New Kingston","Half Way Tree","Liguanea","Cherry Gardens","Norbrook","Constant Spring","Manor Park"] },
  { city:"Medellín",       country:"Colombia",     lat:6.2442,   lng:-75.5812, currency:"COP", priceIndex:4, neighbourhoods:["El Poblado","Envigado","Laureles","Belén","Robledo","Bello","Itagüí","Sabaneta","La Estrella"] },
  { city:"Cali",           country:"Colombia",     lat:3.4516,   lng:-76.5320, currency:"COP", priceIndex:4, neighbourhoods:["Ciudad Jardín","El Peñón","Granada","Oeste","Norte","Pance","Yumbo","Palmira"] },
  { city:"Lima",           country:"Peru",         lat:-12.0464, lng:-77.0428, currency:"PEN", priceIndex:5, neighbourhoods:["Miraflores","San Isidro","Barranco","Surco","La Molina","San Borja","Jesús María","Lince"] },
  { city:"Quito",          country:"Ecuador",      lat:-0.1807,  lng:-78.4678, currency:"USD", priceIndex:4, neighbourhoods:["Cumbayá","González Suárez","Bellavista","Quito Norte","Guapulo","La Floresta","Iñaquito"] },
  { city:"Guayaquil",      country:"Ecuador",      lat:-2.1962,  lng:-79.8862, currency:"USD", priceIndex:4, neighbourhoods:["Urdesa","Alborada","Kennedy","Ceibos","Samborondon","Miraflores","Los Ceibos","Puerto Santa Ana"] },
  { city:"Caracas",        country:"Venezuela",    lat:10.4806,  lng:-66.9036, currency:"USD", priceIndex:4, neighbourhoods:["Chacao","El Rosal","Altamira","La Castellana","Las Mercedes","Baruta","El Hatillo","Country Club"] },
  { city:"La Paz",         country:"Bolivia",      lat:-16.5000, lng:-68.1500, currency:"BOB", priceIndex:3, neighbourhoods:["Sopocachi","Miraflores","Achumani","Calacoto","San Miguel","Irpavi","Mallasa","Chasquipampa"] },
  { city:"Asunción",       country:"Paraguay",     lat:-25.2637, lng:-57.5759, currency:"PYG", priceIndex:3, neighbourhoods:["Villa Aurelia","Recoleta","Trinidad","Sajonia","San Lorenzo","Lambaré","Luque","Fernando de la Mora"] },
  { city:"Montevideo",     country:"Uruguay",      lat:-34.9011, lng:-56.1645, currency:"UYU", priceIndex:5, neighbourhoods:["Pocitos","Punta Carretas","Carrasco","Malvín","Buceo","Cordón","Centro","Parque Batlle"] },
  { city:"Buenos Aires",   country:"Argentina",    lat:-34.6037, lng:-58.3816, currency:"ARS", priceIndex:5, neighbourhoods:["Palermo","Recoleta","Puerto Madero","Belgrano","Nuñez","Caballito","Flores","San Telmo","Almagro"] },
  { city:"Córdoba",        country:"Argentina",    lat:-31.4201, lng:-64.1888, currency:"ARS", priceIndex:4, neighbourhoods:["Nueva Córdoba","Buen Pastor","Güemes","Alta Córdoba","General Paz","Cerro de las Rosas","Villa Belgrano"] },
  { city:"Santiago",       country:"Chile",        lat:-33.4489, lng:-70.6693, currency:"CLP", priceIndex:6, neighbourhoods:["Las Condes","Providencia","Ñuñoa","Vitacura","Lo Barnechea","La Reina","Peñalolén","Macul"] },
  { city:"Valparaíso",     country:"Chile",        lat:-33.0472, lng:-71.6127, currency:"CLP", priceIndex:5, neighbourhoods:["Viña del Mar","Reñaca","Con Con","Cerros","Plan","Playa Ancha","Quilpué"] },
  { city:"São Paulo",      country:"Brazil",       lat:-23.5505, lng:-46.6333, currency:"BRL", priceIndex:6, neighbourhoods:["Jardins","Itaim Bibi","Pinheiros","Vila Madalena","Moema","Brooklin","Alphaville","Tatuapé"] },
  { city:"Rio de Janeiro", country:"Brazil",       lat:-22.9068, lng:-43.1729, currency:"BRL", priceIndex:6, neighbourhoods:["Ipanema","Leblon","Copacabana","Barra da Tijuca","Botafogo","Flamengo","Tijuca","Gavea"] },
  { city:"Brasília",       country:"Brazil",       lat:-15.7975, lng:-47.8919, currency:"BRL", priceIndex:6, neighbourhoods:["Asa Sul","Asa Norte","Lago Sul","Lago Norte","Águas Claras","Taguatinga","Guará","Ceilândia"] },
  { city:"Salvador",       country:"Brazil",       lat:-12.9714, lng:-38.5014, currency:"BRL", priceIndex:4, neighbourhoods:["Barra","Graça","Pituba","Itaigara","Caminho das Árvores","Alphaville","Lauro de Freitas"] },
  { city:"Recife",         country:"Brazil",       lat:-8.0578,  lng:-34.8829, currency:"BRL", priceIndex:4, neighbourhoods:["Boa Viagem","Aflitos","Graças","Espinheiro","Setúbal","Pina","Caruaru","Jaboatão"] },
  { city:"Fortaleza",      country:"Brazil",       lat:-3.7172,  lng:-38.5433, currency:"BRL", priceIndex:4, neighbourhoods:["Meireles","Aldeota","Varjota","Cocó","Edson Queiroz","Eusébio","Caucaia","Maracanaú"] },
  { city:"Curitiba",       country:"Brazil",       lat:-25.4284, lng:-49.2733, currency:"BRL", priceIndex:5, neighbourhoods:["Batel","Champagnat","Santa Felicidade","Bacacheri","Portão","São Lourenço","Boa Vista"] },
  { city:"Belo Horizonte", country:"Brazil",       lat:-19.9191, lng:-43.9386, currency:"BRL", priceIndex:4, neighbourhoods:["Lourdes","Savassi","Belvedere","Serra","Anchieta","Pampulha","Jardim América","Buritis"] },
  { city:"Manaus",         country:"Brazil",       lat:-3.1190,  lng:-60.0217, currency:"BRL", priceIndex:4, neighbourhoods:["Adrianópolis","Parque 10","Aleixo","Chapada","Flores","Petrópolis","Vieiralves","Distrito Industrial"] },

  // ── Oceania extras ──
  { city:"Perth",          country:"Australia",    lat:-31.9505, lng:115.8605, currency:"AUD", priceIndex:8, neighbourhoods:["Subiaco","Cottesloe","Nedlands","Claremont","South Perth","Fremantle","Scarborough","Joondalup"] },
  { city:"Adelaide",       country:"Australia",    lat:-34.9285, lng:138.6007, currency:"AUD", priceIndex:7, neighbourhoods:["Norwood","Unley","Glenelg","Henley Beach","Burnside","Adelaide Hills","Prospect","Kensington"] },
  { city:"Gold Coast",     country:"Australia",    lat:-28.0167, lng:153.4000, currency:"AUD", priceIndex:8, neighbourhoods:["Surfers Paradise","Broadbeach","Burleigh Heads","Coolangatta","Robina","Coomera","Runaway Bay"] },
  { city:"Wellington",     country:"New Zealand",  lat:-41.2866, lng:174.7756, currency:"NZD", priceIndex:7, neighbourhoods:["Thorndon","Mount Victoria","Brooklyn","Karori","Newtown","Hataitai","Kilbirnie","Lower Hutt"] },
  { city:"Christchurch",   country:"New Zealand",  lat:-43.5320, lng:172.6306, currency:"NZD", priceIndex:7, neighbourhoods:["Merivale","Fendalton","Riccarton","Sumner","Lyttelton","Halswell","New Brighton","Hornby"] },
  { city:"Suva",           country:"Fiji",         lat:-18.1248, lng:178.4501, currency:"FJD", priceIndex:4, neighbourhoods:["Lami","Tamavua","Domain","Samabula","Nasinu","Nausori","Deuba","Pacific Harbour"] },
  { city:"Port Moresby",   country:"Papua New Guinea", lat:-9.4438, lng:147.1803, currency:"PGK", priceIndex:5, neighbourhoods:["Waigani","Boroko","Gordons","Hohola","Gerehu","ATS","Six Mile","Murray Barracks"] },
  { city:"Honolulu",       country:"USA",          lat:21.3069,  lng:-157.8583,currency:"USD", priceIndex:9, neighbourhoods:["Honolulu","Kahala","Manoa","Kailua","Hawaii Kai","Kaimuki","Nuuanu","Moanalua","Ewa Beach"] },

  // ── Missing Africa ──
  { city:"Dire Dawa",      country:"Ethiopia",     lat:9.5931,   lng:41.8661,  currency:"ETB", priceIndex:3, neighbourhoods:["Sabian","Addis Ketema","Gendekore","Megala","Ashawa","Legehare","Dire Dawa Airport"] },
  { city:"Mwanza",         country:"Tanzania",     lat:-2.5167,  lng:32.9000,  currency:"TZS", priceIndex:3, neighbourhoods:["Isamilo","Pamba","Nyamagana","Igoma","Butimba","Kirumba","Capri Point"] },
  { city:"Victoria",       country:"Seychelles",   lat:-4.6191,  lng:55.4513,  currency:"SCR", priceIndex:7, neighbourhoods:["Mont Fleuri","Beau Vallon","Bel Air","Anse Aux Pins","Glacis","Mahé North","Grand Anse"] },
  { city:"Moroni",         country:"Comoros",      lat:-11.7017, lng:43.2551,  currency:"KMF", priceIndex:3, neighbourhoods:["Itsandra","Moroni Centre","Bandamadji","Hambou","Dimadjou","Chindini","Badjini"] },
  { city:"Kaduna",         country:"Nigeria",      lat:10.5105,  lng:7.4165,   currency:"NGN", priceIndex:4, neighbourhoods:["Malali","Ungwan Rimi","Sabon Gari","Kakuri","Barnawa","Tudun Wada","Rigasa"] },
  { city:"Tamale",         country:"Ghana",        lat:9.4075,   lng:-0.8533,  currency:"GHS", priceIndex:3, neighbourhoods:["Kalpohin","Lamashegu","Kukuo","Nyohini","Vittin","Choggu","Bagabaga"] },
  { city:"Bissau",         country:"Guinea-Bissau",lat:11.8636,  lng:-15.5977, currency:"XOF", priceIndex:2, neighbourhoods:["Bairro de Belém","Mindara","Chão de Papel","Santa Luzia","Pluba","São Pedro"] },
  { city:"Luxor",          country:"Egypt",        lat:25.6872,  lng:32.6396,  currency:"EGP", priceIndex:3, neighbourhoods:["Karnak","Luxor East Bank","West Bank","Gezira","New Luxor","El Awameyah"] },
  { city:"Agadir",         country:"Morocco",      lat:30.4278,  lng:-9.5981,  currency:"MAD", priceIndex:5, neighbourhoods:["Hay Mohammadi","Dakhla","Sonaba","Founty","Tilila","Ait Melloul","Inezgane"] },
  { city:"Tangier",        country:"Morocco",      lat:35.7595,  lng:-5.8340,  currency:"MAD", priceIndex:5, neighbourhoods:["Malabata","California","Achakar","Marchane","Centre Ville","Médina","Ghandouri"] },
  { city:"Oran",           country:"Algeria",      lat:35.6969,  lng:-0.6331,  currency:"DZD", priceIndex:4, neighbourhoods:["Hay Es Seddikia","Es Senia","Bir El Djir","Hassi Mefsoukh","Gdyel","Ain El Turk","Arzew"] },
  { city:"Constantine",    country:"Algeria",      lat:36.3650,  lng:6.6147,   currency:"DZD", priceIndex:4, neighbourhoods:["Sidi Mabrouk","El Khroub","Ain Abid","Massinissa","Zouaghi","Ali Mendjeli","Didouche Mourad"] },
  { city:"Benghazi",       country:"Libya",        lat:32.1194,  lng:20.0868,  currency:"LYD", priceIndex:4, neighbourhoods:["Sabri","Hawari","Keesh","Sidi Hussein","Qawarsha","Al Laithi","Bouheseen"] },
  { city:"Mbabane",        country:"Eswatini",     lat:-26.3186, lng:31.1410,  currency:"SZL", priceIndex:4, neighbourhoods:["Dalriach","Mbuluzi","Msunduza","Fonteyn","Mhobodleni","Mahwalala","Ngwane Park"] },
  { city:"Maseru",         country:"Lesotho",      lat:-29.3142, lng:27.4833,  currency:"LSL", priceIndex:3, neighbourhoods:["Maseru Central","Qoaling","Thamae","Lithoteng","Ha Matala","Mapoteng","Pioneer"] },
  { city:"Bangui",         country:"CAR",          lat:4.3947,   lng:18.5582,  currency:"XAF", priceIndex:2, neighbourhoods:["Bangui 1","Bangui 2","Bangui 3","Lakouanga","Gobongo","Miskine","Boy-Rabe"] },
  { city:"Toamasina",      country:"Madagascar",   lat:-18.1492, lng:49.4023,  currency:"MGA", priceIndex:3, neighbourhoods:["Ampasimazava","Ambohidrapeto","Tanambao I","Tanambao II","Faravohitra","Analakely","Anjoma"] },

  // ── Missing Gulf & Middle East ──
  { city:"Ajman",          country:"UAE",          lat:25.4052,  lng:55.5136,  currency:"AED", priceIndex:6, neighbourhoods:["Ajman Corniche","Al Nuaimiya","Al Rashidiya","Ajman Industrial","Al Rawda","Al Jurf","Al Mowaihat"] },
  { city:"Mecca",          country:"Saudi Arabia", lat:21.3891,  lng:39.8579,  currency:"SAR", priceIndex:7, neighbourhoods:["Al Aziziyah","Batha Quraysh","Al Masfalah","Ajyad","Kudai","Shisha","Al Zaher"] },
  { city:"Dammam",         country:"Saudi Arabia", lat:26.4207,  lng:50.0888,  currency:"SAR", priceIndex:7, neighbourhoods:["Al Faisaliyah","Al Shulah","Al Jawharah","Al Badiyah","Qatif","Al Khobar","Dhahran"] },
  { city:"Sohar",          country:"Oman",         lat:24.3473,  lng:56.7258,  currency:"OMR", priceIndex:5, neighbourhoods:["Al Multaqa","Al Hambar","Al Jubail","Falaj Al Qabail","Al Wadi","Liwa","Al Hail"] },
  { city:"Aqaba",          country:"Jordan",       lat:29.5269,  lng:35.0061,  currency:"JOD", priceIndex:5, neighbourhoods:["Aqaba City Centre","Al Sakanah","Al Quweira","South Beach","Tala Bay","Saraya","Downtown"] },
  { city:"Basra",          country:"Iraq",         lat:30.5085,  lng:47.7804,  currency:"IQD", priceIndex:4, neighbourhoods:["Ashar","Maaqal","Qurna","Abu Al Khasib","Shatt Al Arab","Al Jubaileh","Al Tanouma"] },
  { city:"Erbil",          country:"Iraq",         lat:36.1901,  lng:44.0091,  currency:"IQD", priceIndex:5, neighbourhoods:["Ankawa","Dream City","English Village","Italian Village","Palestine Street","100 Meter","Gulan"] },
  { city:"Mashhad",        country:"Iran",         lat:36.2605,  lng:59.6168,  currency:"IRR", priceIndex:4, neighbourhoods:["Vakil Abad","Shahrak Shahid Hasheminejad","Saadat Abad","Noghan","Sanabad","Torqabeh","Ahmad Abad"] },
  { city:"Isfahan",        country:"Iran",         lat:32.6546,  lng:51.6680,  currency:"IRR", priceIndex:4, neighbourhoods:["Chaharbagh","Jolfa","Pol-e Chubi","Feiz","Hasht Behesht","Khaju","Shahrak-e Emam Ali"] },
  { city:"Shiraz",         country:"Iran",         lat:29.5918,  lng:52.5836,  currency:"IRR", priceIndex:4, neighbourhoods:["Ghasrodasht","Elahiyeh","Sadra","Darvazeh Quran","Zargandeh","Chamran","Besat"] },
  { city:"Bursa",          country:"Turkey",       lat:40.1885,  lng:29.0610,  currency:"TRY", priceIndex:5, neighbourhoods:["Nilüfer","Osmangazi","Yıldırım","Kestel","Mudanya","Gemlik","İnegöl","Görükle"] },
  { city:"Sana'a",         country:"Yemen",        lat:15.3694,  lng:44.1910,  currency:"YER", priceIndex:2, neighbourhoods:["Old City","Hadda","Sana'a Airport","Haddah","Al Safiyah","Al Hasabah","Al Wahdah"] },
  { city:"Aden",           country:"Yemen",        lat:12.7755,  lng:45.0361,  currency:"YER", priceIndex:2, neighbourhoods:["Maalla","Crater","Khormaksar","Tawahi","Sheik Othman","Mansoura","Al Buraiqeh"] },
  { city:"Kutaisi",        country:"Georgia",      lat:42.2679,  lng:42.6981,  currency:"GEL", priceIndex:3, neighbourhoods:["Kutaisi Centre","Gora","Bagrati","Rioni","Ukimerioni","Kviteli","Sataplia"] },

  // ── Missing South Asia ──
  { city:"Surat",          country:"India",        lat:21.1702,  lng:72.8311,  currency:"INR", priceIndex:5, neighbourhoods:["Adajan","Pal","Vesu","Ghod Dod Road","Athwa","Katargam","Udhna","Varachha"] },
  { city:"Lucknow",        country:"India",        lat:26.8467,  lng:80.9462,  currency:"INR", priceIndex:5, neighbourhoods:["Gomti Nagar","Hazratganj","Aliganj","Indira Nagar","Mahanagar","Vikasnagar","Jankipuram","Alambagh"] },
  { city:"Chandigarh",     country:"India",        lat:30.7333,  lng:76.7794,  currency:"INR", priceIndex:6, neighbourhoods:["Sector 17","Sector 22","Sector 35","Mohali","Panchkula","Sector 9","Manimajra","Zirakpur"] },
  { city:"Faisalabad",     country:"Pakistan",     lat:31.4504,  lng:73.1350,  currency:"PKR", priceIndex:3, neighbourhoods:["Jinnah Colony","Madina Town","Peoples Colony","Canal Road","Railway Road","Gulberg","Satiana Road"] },
  { city:"Kandy",          country:"Sri Lanka",    lat:7.2906,   lng:80.6337,  currency:"LKR", priceIndex:4, neighbourhoods:["Peradeniya","Katugastota","Digana","Tennekumbura","Ampitiya","Kundasale","Theldeniya"] },

  // ── Missing East Asia ──
  { city:"Sapporo",        country:"Japan",        lat:43.0618,  lng:141.3545, currency:"JPY", priceIndex:7, neighbourhoods:["Chuo","Kita","Higashi","Toyohira","Teine","Minami","Nishiku","Atsubetsu"] },
  { city:"Kobe",           country:"Japan",        lat:34.6901,  lng:135.1956, currency:"JPY", priceIndex:7, neighbourhoods:["Kitano","Rokko Island","Suma","Nada","Higashinada","Chuo","Hyogo","Tarumi"] },
  { city:"Xi'an",          country:"China",        lat:34.3416,  lng:108.9398, currency:"CNY", priceIndex:6, neighbourhoods:["Yanta","Beilin","Xincheng","Lianhu","Weiyang","Gaoxin","Chang'an","Hantang"] },
  { city:"Tianjin",        country:"China",        lat:39.3434,  lng:117.3616, currency:"CNY", priceIndex:6, neighbourhoods:["Binhai","Heping","Nankai","Hexi","Hedong","Hebei","Hongqiao","Dongli"] },
  { city:"Qingdao",        country:"China",        lat:36.0671,  lng:120.3826, currency:"CNY", priceIndex:6, neighbourhoods:["Shinan","Shibei","Laoshan","Chengyang","Jiaozhou","Huangdao","Licang","Jimo"] },
  { city:"Suzhou",         country:"China",        lat:31.2989,  lng:120.5853, currency:"CNY", priceIndex:7, neighbourhoods:["Gusu","Wuzhong","Xiangcheng","Huqiu","Wujiang","Kunshan","Changshu","Taicang"] },
  { city:"Zhengzhou",      country:"China",        lat:34.7466,  lng:113.6254, currency:"CNY", priceIndex:5, neighbourhoods:["Erqi","Jinshui","Zhongyuan","Huiji","Guancheng","Shangjie","Xinzheng","Xinmi"] },
  { city:"Daegu",          country:"South Korea",  lat:35.8714,  lng:128.6014, currency:"KRW", priceIndex:6, neighbourhoods:["Jung","Suseong","Dalseo","Buk","Nam","Dong","Seo","Dalseong"] },
  { city:"Taichung",       country:"Taiwan",       lat:24.1477,  lng:120.6736, currency:"TWD", priceIndex:6, neighbourhoods:["Xitun","Beitun","Nantun","South District","West District","East District","Taiping","Wuri"] },
  { city:"Kaohsiung",      country:"Taiwan",       lat:22.6273,  lng:120.3014, currency:"TWD", priceIndex:6, neighbourhoods:["Xinxing","Lingya","Sanmin","Qianjin","Zuoying","Nanzih","Fengshan","Daliao"] },

  // ── Missing Southeast Asia ──
  { city:"Pattaya",        country:"Thailand",     lat:12.9236,  lng:100.8825, currency:"THB", priceIndex:5, neighbourhoods:["North Pattaya","Central Pattaya","South Pattaya","Jomtien","Pratumnak","Na Jomtien","East Pattaya"] },
  { city:"Makassar",       country:"Indonesia",    lat:-5.1477,  lng:119.4327, currency:"IDR", priceIndex:4, neighbourhoods:["Panakkukang","Rappocini","Tamalate","Makassar CBD","Biringkanaya","Manggala","Ujung Tanah"] },
  { city:"Kota Kinabalu",  country:"Malaysia",     lat:5.9788,   lng:116.0753, currency:"MYR", priceIndex:5, neighbourhoods:["KK City Centre","Likas","Menggatal","Kepayan","Penampang","Inanam","Kinarut","Putatan"] },
  { city:"Hoi An",         country:"Vietnam",      lat:15.8800,  lng:108.3380, currency:"VND", priceIndex:5, neighbourhoods:["Cẩm Châu","Cẩm An","Cửa Đại","An Hội","Minh An","Sơn Phong","Cẩm Phô","Tan An"] },
  { city:"Davao",          country:"Philippines",  lat:7.0731,   lng:125.6128, currency:"PHP", priceIndex:4, neighbourhoods:["Poblacion","Buhangin","Talomo","Toril","Calinan","Bunawan","Paquibato","Marilog"] },
  { city:"Siem Reap",      country:"Cambodia",     lat:13.3671,  lng:103.8448, currency:"USD", priceIndex:4, neighbourhoods:["Angkor Wat area","Pub Street","Svay Dangkum","Sala Kamreuk","Wat Bo","Kouk Chak","Banteay Chhmar"] },
  { city:"Luang Prabang",  country:"Laos",         lat:19.8900,  lng:102.1358, currency:"LAK", priceIndex:4, neighbourhoods:["Old Town","Chomphet","Xieng Ngeun","Nam Bak","Pak Xuang","Phonexay","Ban Xang Khong"] },
  { city:"Mandalay",       country:"Myanmar",      lat:21.9588,  lng:96.0891,  currency:"MMK", priceIndex:3, neighbourhoods:["Chanayethazan","Chanmyathazi","Aungmyethazan","Amarapura","Pyigyitagon","Mahaaungmye","Patheingyi"] },
  { city:"Naypyidaw",      country:"Myanmar",      lat:19.7633,  lng:96.0785,  currency:"MMK", priceIndex:3, neighbourhoods:["Zabuthiri","Ottarathiri","Pobbathiri","Tatkon","Oaktarathiri","Lewe","Pyinmana"] },
  { city:"Brunei",         country:"Brunei",       lat:4.9031,   lng:114.9398, currency:"BND", priceIndex:6, neighbourhoods:["Bandar Seri Begawan","Gadong","Kiulap","Batu Bersurat","Lumapas","Kuala Belait","Seria"] },

  // ── Missing Western Europe ──
  { city:"Leeds",          country:"UK",           lat:53.8008,  lng:-1.5491,  currency:"GBP", priceIndex:7, neighbourhoods:["Chapel Allerton","Headingley","Horsforth","Roundhay","Alwoodley","Meanwood","Bramhope","Pool"] },
  { city:"Bristol",        country:"UK",           lat:51.4545,  lng:-2.5879,  currency:"GBP", priceIndex:7, neighbourhoods:["Clifton","Redland","Westbury Park","Cotham","Bishopston","Hotwells","Sneyd Park","Henleaze"] },
  { city:"Liverpool",      country:"UK",           lat:53.4084,  lng:-2.9916,  currency:"GBP", priceIndex:6, neighbourhoods:["Woolton","Allerton","Mossley Hill","Aigburth","Childwall","Old Swan","Waterloo","Crosby"] },
  { city:"Stuttgart",      country:"Germany",      lat:48.7758,  lng:9.1829,   currency:"EUR", priceIndex:8, neighbourhoods:["Stuttgart West","Gänsheide","Degerloch","Vaihingen","Birkach","Plieningen","Sillenbuch","Bad Cannstatt"] },
  { city:"Düsseldorf",     country:"Germany",      lat:51.2217,  lng:6.7762,   currency:"EUR", priceIndex:8, neighbourhoods:["Oberkassel","Kaiserswerth","Gerresheim","Stockum","Golzheim","Flingern","Bilk","Unterbilk"] },
  { city:"Dortmund",       country:"Germany",      lat:51.5136,  lng:7.4653,   currency:"EUR", priceIndex:6, neighbourhoods:["Hombruch","Aplerbeck","Benninghofen","Brackeler Feld","Kirchhörde","Löttringhausen","Schüren"] },
  { city:"Toulouse",       country:"France",       lat:43.6047,  lng:1.4442,   currency:"EUR", priceIndex:7, neighbourhoods:["Compans-Caffarelli","Côte Pavée","Montaudran","Lardenne","Empalot","Sept Deniers","La Roseraie"] },
  { city:"Nantes",         country:"France",       lat:47.2184,  lng:-1.5536,  currency:"EUR", priceIndex:7, neighbourhoods:["Île de Nantes","Hauts-Pavés","Saint-Félix","Erdre","Doulon","Breil","Bellevue","Centre Ville"] },
  { city:"Bordeaux",       country:"France",       lat:44.8378,  lng:-0.5792,  currency:"EUR", priceIndex:7, neighbourhoods:["Chartrons","Saint-Michel","Capucins","Caudéran","Bordeaux Centre","Talence","Mérignac","Pessac"] },
  { city:"Montpellier",    country:"France",       lat:43.6108,  lng:3.8767,   currency:"EUR", priceIndex:7, neighbourhoods:["Antigone","Ecusson","Port Marianne","Croix d'Argent","Mosson","Celleneuve","Ovalie","Les Cévennes"] },
  { city:"Malaga",         country:"Spain",        lat:36.7213,  lng:-4.4214,  currency:"EUR", priceIndex:6, neighbourhoods:["Malagueta","Pedregalejo","El Palo","Centro Histórico","Teatinos","Fuengirola","Torremolinos","Marbella"] },
  { city:"Bilbao",         country:"Spain",        lat:43.2630,  lng:-2.9349,  currency:"EUR", priceIndex:7, neighbourhoods:["Abando","Deusto","Begoña","Rekalde","Ibaiondo","Basurto","Getxo","Barakaldo"] },
  { city:"The Hague",      country:"Netherlands",  lat:52.0705,  lng:4.3007,   currency:"EUR", priceIndex:8, neighbourhoods:["Benoordenhout","Bezuidenhout","Statenkwartier","Segbroek","Scheveningen","Laak","Centrum","Haagse Hout"] },
  { city:"Utrecht",        country:"Netherlands",  lat:52.0907,  lng:5.1214,   currency:"EUR", priceIndex:8, neighbourhoods:["Binnenstad","Lombok","Wittevrouwen","Vleuten-De Meern","Overvecht","Zuilen","Lunetten","Kanaleneiland"] },
  { city:"Graz",           country:"Austria",      lat:47.0707,  lng:15.4395,  currency:"EUR", priceIndex:7, neighbourhoods:["Geidorf","St. Leonhard","Lend","Gries","Waltendorf","Eggenberg","Straßgang","Andritz"] },
  { city:"Bern",           country:"Switzerland",  lat:46.9481,  lng:7.4474,   currency:"CHF", priceIndex:9, neighbourhoods:["Kirchenfeld","Länggasse","Mattenhof","Weissenbühl","Bethlehem","Bümpliz","Münchenbuchsee","Ostermundigen"] },
  { city:"Basel",          country:"Switzerland",  lat:47.5596,  lng:7.5886,   currency:"CHF", priceIndex:9, neighbourhoods:["Grossbasel","Kleinbasel","Gundeldingen","Bruderholz","Riehen","Allschwil","Münchenbuchsee","St. Alban"] },
  { city:"Bologna",        country:"Italy",        lat:44.4949,  lng:11.3426,  currency:"EUR", priceIndex:7, neighbourhoods:["Colli","San Ruffillo","Santo Stefano","Saragozza","Porto","Murri","Savena","Navile"] },
  { city:"Venice",         country:"Italy",        lat:45.4408,  lng:12.3155,  currency:"EUR", priceIndex:9, neighbourhoods:["Dorsoduro","Cannaregio","Castello","San Polo","Santa Croce","Mestre","Marghera","Lido di Venezia"] },
  { city:"Palermo",        country:"Italy",        lat:38.1157,  lng:13.3615,  currency:"EUR", priceIndex:5, neighbourhoods:["Libertà","Politeama","Capo","Ballarò","Borgo Nuovo","Mondello","Notarbartolo","Zisa"] },
  { city:"Heraklion",      country:"Greece",       lat:35.3387,  lng:25.1442,  currency:"EUR", priceIndex:5, neighbourhoods:["Nea Alikarnassos","Gazi","Mastabas","Knossos","Ammoudara","Agia Pelagia","Hersonissos","Malia"] },
  { city:"Patras",         country:"Greece",       lat:38.2466,  lng:21.7346,  currency:"EUR", priceIndex:5, neighbourhoods:["Psila Alonia","Agios Nikolaos","Oikismos","Rio","Daneia","Vrachneika","Kastritsi","Sychaina"] },
  { city:"Gothenburg",     country:"Sweden",       lat:57.7089,  lng:11.9746,  currency:"SEK", priceIndex:8, neighbourhoods:["Haga","Majorna","Linné","Askim","Frölunda","Kungsladugård","Örgryte","Tuve","Angered"] },
  { city:"Malmö",          country:"Sweden",       lat:55.6050,  lng:13.0038,  currency:"SEK", priceIndex:7, neighbourhoods:["Möllevången","Husie","Kirseberg","Limhamn","Hyllie","Husie","Bunkeflostrand","Vellinge"] },
  { city:"Aarhus",         country:"Denmark",      lat:56.1629,  lng:10.2039,  currency:"DKK", priceIndex:8, neighbourhoods:["Trøjborg","Frederiksbjerg","Risskov","Hasle","Viby","Brabrand","Skejby","Åbyhøj"] },
  { city:"Tampere",        country:"Finland",      lat:61.4978,  lng:23.7610,  currency:"EUR", priceIndex:7, neighbourhoods:["Tammela","Kaleva","Pyynikki","Lielahti","Messukylä","Nekala","Hervanta","Lentävänniemi"] },
  { city:"Bergen",         country:"Norway",       lat:60.3929,  lng:5.3241,   currency:"NOK", priceIndex:9, neighbourhoods:["Sandviken","Møhlenpris","Nordnes","Laksevåg","Åsane","Fana","Arna","Ytrebygda"] },
  { city:"Antwerp",        country:"Belgium",      lat:51.2194,  lng:4.4025,   currency:"EUR", priceIndex:7, neighbourhoods:["Deurne","Borgerhout","Berchem","Wilrijk","Hoboken","Ekeren","Merksem","Berendrecht"] },
  { city:"Luxembourg",     country:"Luxembourg",   lat:49.6117,  lng:6.1319,   currency:"EUR", priceIndex:10,neighbourhoods:["Limpertsberg","Kirchberg","Cessange","Belair","Hollerich","Merl","Bonnevoie","Gasperich"] },
  { city:"Nicosia",        country:"Cyprus",       lat:35.1856,  lng:33.3823,  currency:"EUR", priceIndex:6, neighbourhoods:["Agios Andreas","Agios Dometios","Engomi","Latsia","Strovolos","Pallouriotissa","Kaimakli","Lykavitos"] },

  // ── Missing Eastern Europe ──
  { city:"Wroclaw",        country:"Poland",       lat:51.1079,  lng:17.0385,  currency:"PLN", priceIndex:6, neighbourhoods:["Śródmieście","Krzyki","Fabryczna","Psie Pole","Stare Miasto","Nowy Dwór","Różanka","Brochów"] },
  { city:"Gdansk",         country:"Poland",       lat:54.3520,  lng:18.6466,  currency:"PLN", priceIndex:6, neighbourhoods:["Wrzeszcz","Oliwa","Zaspa","Morena","Przymorze","Aniołki","Jasień","Żabianka"] },
  { city:"Brno",           country:"Czech Republic",lat:49.1951, lng:16.6068,  currency:"CZK", priceIndex:6, neighbourhoods:["Žabovřesky","Královo Pole","Bohunice","Bystrc","Líšeň","Řečkovice","Komín","Medlánky"] },
  { city:"Debrecen",       country:"Hungary",      lat:47.5316,  lng:21.6273,  currency:"HUF", priceIndex:5, neighbourhoods:["Belváros","Újkert","Csapókert","Tócóskert","Nagycserke","Józsa","Pallag","Ebes"] },
  { city:"Cluj",           country:"Romania",      lat:46.7712,  lng:23.6236,  currency:"RON", priceIndex:6, neighbourhoods:["Mănăștur","Grigorescu","Mărăști","Zorilor","Buna Ziua","Iris","Gheorgheni","Andrei Mureșanu"] },
  { city:"Plovdiv",        country:"Bulgaria",     lat:42.1354,  lng:24.7453,  currency:"BGN", priceIndex:4, neighbourhoods:["Trakiya","Kamenitsa","Yuzhen","Karshiyaka","Ostromila","Center","Kapana","Kyuchuk Parizh"] },
  { city:"Novi Sad",       country:"Serbia",       lat:45.2671,  lng:19.8335,  currency:"RSD", priceIndex:5, neighbourhoods:["Liman","Novi Sad Center","Grbavica","Rotkvarija","Adamovićevo","Detelinara","Podbara","Klisa"] },
  { city:"Skopje",         country:"North Macedonia",lat:41.9981,lng:21.4254,  currency:"MKD", priceIndex:4, neighbourhoods:["Centar","Karpoš","Aerodrom","Butel","Gazi Baba","Kisela Voda","Čair","Šuto Orizari"] },
  { city:"Podgorica",      country:"Montenegro",   lat:42.4304,  lng:19.2594,  currency:"EUR", priceIndex:5, neighbourhoods:["Stari Aerodrom","Blok 5","Blok 6","Zabjelo","Konik","Tološi","Dajbabe","Golubovci"] },
  { city:"Pristina",       country:"Kosovo",       lat:42.6629,  lng:21.1655,  currency:"EUR", priceIndex:5, neighbourhoods:["Arbëria","Mati 1","Kalabria","Bregu i Diellit","Qyteza Pejton","Ulpiana","Dardania","Lagjja e Spitalit"] },
  { city:"Kaunas",         country:"Lithuania",    lat:54.8985,  lng:23.9036,  currency:"EUR", priceIndex:5, neighbourhoods:["Žaliakalnis","Šilainiai","Dainavos","Vilijampolė","Aleksotas","Petrašiūnai","Centre","Eiguliai"] },
  { city:"Odessa",         country:"Ukraine",      lat:46.4825,  lng:30.7233,  currency:"UAH", priceIndex:4, neighbourhoods:["Primorsky","Malinovsky","Kievsky","Suvorovky","Franky","Slobidka","Arcadia","Lanzheron"] },
  { city:"Chisinau",       country:"Moldova",      lat:47.0105,  lng:28.8638,  currency:"MDL", priceIndex:3, neighbourhoods:["Centru","Botanica","Buiucani","Rîșcani","Ciocana","Sculeni","Durlești","Trușeni"] },
  { city:"Kazan",          country:"Russia",       lat:55.8304,  lng:49.0661,  currency:"RUB", priceIndex:5, neighbourhoods:["Vakhitovsky","Sovetsky","Privolzhsky","Kirovsky","Aviatorsky","Novo-Savinovsky","Moskovskiy"] },
  { city:"Nizhny Novgorod",country:"Russia",       lat:56.2965,  lng:43.9361,  currency:"RUB", priceIndex:5, neighbourhoods:["Nizhny Novgorod Centre","Avtozavodsky","Prioksky","Leninsky","Nizhegorodsky","Kanavinsky","Sovetsky"] },

  // ── Missing Americas — USA ──
  { city:"Phoenix",        country:"USA",          lat:33.4484,  lng:-112.0740,currency:"USD", priceIndex:7, neighbourhoods:["Scottsdale","Paradise Valley","Arcadia","Ahwatukee","Chandler","Mesa","Tempe","Biltmore"] },
  { city:"Philadelphia",   country:"USA",          lat:39.9526,  lng:-75.1652, currency:"USD", priceIndex:7, neighbourhoods:["Rittenhouse","Chestnut Hill","Center City","Society Hill","Manayunk","Fishtown","Main Line","Old City"] },
  { city:"San Antonio",    country:"USA",          lat:29.4241,  lng:-98.4936, currency:"USD", priceIndex:6, neighbourhoods:["Alamo Heights","Terrell Hills","Shavano Park","Stone Oak","Dominion","Helotes","Olmos Park","Tobin Hill"] },
  { city:"San Diego",      country:"USA",          lat:32.7157,  lng:-117.1611,currency:"USD", priceIndex:9, neighbourhoods:["La Jolla","Del Mar","Rancho Santa Fe","Coronado","Point Loma","Mission Hills","North Park","Hillcrest"] },
  { city:"Nashville",      country:"USA",          lat:36.1627,  lng:-86.7816, currency:"USD", priceIndex:7, neighbourhoods:["Green Hills","Belle Meade","Forest Hills","Brentwood","Franklin","12 South","East Nashville","The Gulch"] },
  { city:"Portland",       country:"USA",          lat:45.5231,  lng:-122.6765,currency:"USD", priceIndex:8, neighbourhoods:["Pearl District","Nob Hill","Irvington","Lake Oswego","Beaverton","Hillsboro","West Hills","Sellwood"] },
  { city:"Orlando",        country:"USA",          lat:28.5383,  lng:-81.3792, currency:"USD", priceIndex:7, neighbourhoods:["Winter Park","Baldwin Park","College Park","Dr. Phillips","Windermere","Lake Nona","Celebration","Maitland"] },

  // ── Missing Americas — Canada ──
  { city:"Edmonton",       country:"Canada",       lat:53.5461,  lng:-113.4938,currency:"CAD", priceIndex:7, neighbourhoods:["Glenora","Westmount","Oliver","Strathcona","Terwillegar","Riverbend","Windermere","Summerside"] },
  { city:"Winnipeg",       country:"Canada",       lat:49.8951,  lng:-97.1384, currency:"CAD", priceIndex:6, neighbourhoods:["Tuxedo","River Heights","Fort Richmond","Charleswood","Transcona","St. Boniface","The Forks","Wolseley"] },
  { city:"Quebec City",    country:"Canada",       lat:46.8139,  lng:-71.2080, currency:"CAD", priceIndex:6, neighbourhoods:["Saint-Foy","Sainte-Foy","Charlesbourg","Beauport","Cap-Rouge","L'Ancienne-Lorette","Sillery","Limoilou"] },
  { city:"Halifax",        country:"Canada",       lat:44.6488,  lng:-63.5752, currency:"CAD", priceIndex:6, neighbourhoods:["South End","North End","West End","Dartmouth","Bedford","Sackville","Timberlea","Cole Harbour"] },

  // ── Missing Americas — Latin America ──
  { city:"Puebla",         country:"Mexico",       lat:19.0414,  lng:-98.2063, currency:"MXN", priceIndex:4, neighbourhoods:["Angelópolis","Lomas de Angelópolis","Centro Histórico","Momoxpan","Cholula","San Andrés","Exhacienda"] },
  { city:"Tijuana",        country:"Mexico",       lat:32.5149,  lng:-117.0382,currency:"MXN", priceIndex:4, neighbourhoods:["Playas de Tijuana","Zona Río","Hipódromo","Valle Verde","Otay","Chapultepec","Garita","La Mesa"] },
  { city:"San Salvador",   country:"El Salvador",  lat:13.6929,  lng:-89.2182, currency:"USD", priceIndex:4, neighbourhoods:["San Benito","Escalón","Colonia Miramonte","Antiguo Cuscatlán","Santa Tecla","San José Villanueva"] },
  { city:"Tegucigalpa",    country:"Honduras",     lat:14.0818,  lng:-87.2068, currency:"HNL", priceIndex:3, neighbourhoods:["Palmira","Lomas del Guijarro","Las Minitas","Colonia 21 de Octubre","El Hatillo","Kennedy","Miraflores"] },
  { city:"Managua",        country:"Nicaragua",    lat:12.1328,  lng:-86.2504, currency:"NIO", priceIndex:3, neighbourhoods:["Las Colinas","Camino de Oriente","Santo Domingo","Bello Horizonte","Los Robles","Reparto Schick"] },
  { city:"San Juan",       country:"Puerto Rico",  lat:18.4655,  lng:-66.1057, currency:"USD", priceIndex:6, neighbourhoods:["Condado","Miramar","Santurce","Isla Verde","Hato Rey","Río Piedras","Bayamón","Carolina"] },
  { city:"Port-au-Prince", country:"Haiti",        lat:18.5944,  lng:-72.3074, currency:"HTG", priceIndex:2, neighbourhoods:["Pétionville","Bourdon","Canapé Vert","Delmas","Cite Soleil","Lalue","Turgeau","Carrefour"] },
  { city:"Nassau",         country:"Bahamas",      lat:25.0480,  lng:-77.3554, currency:"BSD", priceIndex:8, neighbourhoods:["Cable Beach","Lyford Cay","Eastern Road","Yamacraw","Nassau Village","Fort Charlotte","Western District"] },
  { city:"Cartagena",      country:"Colombia",     lat:10.3910,  lng:-75.4794, currency:"COP", priceIndex:5, neighbourhoods:["Bocagrande","Castillogrande","Manga","El Cabrero","Blas de Lezo","La Boquilla","Marbella","Crespo"] },
  { city:"Barranquilla",   country:"Colombia",     lat:10.9685,  lng:-74.7813, currency:"COP", priceIndex:4, neighbourhoods:["El Prado","Altos del Prado","Country Club","Bellavista","Villa del Este","Puerto Colombia","Soledad"] },
  { city:"Arequipa",       country:"Peru",         lat:-16.4090, lng:-71.5375, currency:"PEN", priceIndex:4, neighbourhoods:["Cayma","Yanahuara","Selva Alegre","José Luis Bustamante","Sachaca","Cerro Colorado","Paucarpata"] },
  { city:"Maracaibo",      country:"Venezuela",    lat:10.6544,  lng:-71.6020, currency:"USD", priceIndex:3, neighbourhoods:["Bella Vista","El Milagro","Las Delicias","Juana de Ávila","San Francisco","La Lago","Los Haticos"] },
  { city:"Santa Cruz",     country:"Bolivia",      lat:-17.7833, lng:-63.1821, currency:"BOB", priceIndex:4, neighbourhoods:["Equipetrol","Las Palmas","Hamacas","Urubo","Porongo","La Guardia","El Trompillo","Los Batos"] },
  { city:"Rosario",        country:"Argentina",    lat:-32.9442, lng:-60.6505, currency:"ARS", priceIndex:4, neighbourhoods:["Fisherton","Arroyito","Echesortu","Alberdi","Pichincha","La Florida","Puerto Norte","San Lorenzo"] },
  { city:"Mendoza",        country:"Argentina",    lat:-32.8908, lng:-68.8272, currency:"ARS", priceIndex:4, neighbourhoods:["Luján de Cuyo","Maipú","Godoy Cruz","Las Heras","Chacras de Coria","Ciudad Nueva","Palmares"] },
  { city:"Concepción",     country:"Chile",        lat:-36.8270, lng:-73.0498, currency:"CLP", priceIndex:5, neighbourhoods:["Chiguayante","San Pedro de la Paz","Hualpén","Talcahuano","Coronel","Tomé","Lota","Penco"] },
  { city:"Porto Alegre",   country:"Brazil",       lat:-30.0346, lng:-51.2177, currency:"BRL", priceIndex:5, neighbourhoods:["Moinhos de Vento","Petrópolis","Bela Vista","Bom Fim","Tristeza","Ipanema","Higienópolis","Teresópolis"] },
  { city:"Belém",          country:"Brazil",       lat:-1.4558,  lng:-48.4902, currency:"BRL", priceIndex:4, neighbourhoods:["Umarizal","Marco","Batista Campos","Nazaré","Cidade Nova","Val-de-Cans","Castanheira","Sacramenta"] },

  // ── Missing Oceania ──
  { city:"Canberra",       country:"Australia",    lat:-35.2809, lng:149.1300, currency:"AUD", priceIndex:8, neighbourhoods:["Manuka","Kingston","Barton","Yarralumla","Deakin","O'Connor","Turner","Watson","Belconnen"] },
  { city:"Darwin",         country:"Australia",    lat:-12.4634, lng:130.8456, currency:"AUD", priceIndex:7, neighbourhoods:["Darwin CBD","Fannie Bay","Parap","Stuart Park","Ludmilla","Nightcliff","Rapid Creek","Jingili"] },
  { city:"Hobart",         country:"Australia",    lat:-42.8821, lng:147.3272, currency:"AUD", priceIndex:7, neighbourhoods:["Sandy Bay","Battery Point","New Town","Glenorchy","Rosny Park","Bellerive","Kingston","Howrah"] },
  { city:"Newcastle",      country:"Australia",    lat:-32.9283, lng:151.7817, currency:"AUD", priceIndex:7, neighbourhoods:["Newcastle East","Merewether","Bar Beach","Hamilton","New Lambton","Mayfield","Lambton","Wallsend"] },
  { city:"Queenstown",     country:"New Zealand",  lat:-45.0312, lng:168.6626, currency:"NZD", priceIndex:8, neighbourhoods:["Frankton","Sunshine Bay","Fernhill","Lake Hayes","Arrowtown","Wanaka","Jack's Point","Shotover"] },
  { city:"Honiara",        country:"Solomon Islands",lat:-9.4319,lng:160.0556, currency:"SBD", priceIndex:4, neighbourhoods:["Point Cruz","Kukum","Kola'a Ridge","White River","Nggosi","Vura","Panatina","Burns Creek"] },
  { city:"Apia",           country:"Samoa",        lat:-13.8314, lng:-171.7518,currency:"WST", priceIndex:4, neighbourhoods:["Beach Road","Mulinu'u","Taufusi","Matautu","Sogi","Fugalei","Siusega","Vaitele"] },
  { city:"Nuku'alofa",     country:"Tonga",        lat:-21.1393, lng:-175.2049,currency:"TOP", priceIndex:4, neighbourhoods:["Kolofo'ou","Kolomotu'a","Tofoa","Popua","Ha'ateiho","'Eua","Vaini","Pea"] },
];

// ── Programmatic neighbourhood generator for cities without detailed data ─────
function generateNeighbourhoods(city: string): string[] {
  const f = city.split(/[\s,\-]/)[0];
  return [
    `${f} Central`, `${f} North`, `${f} South`, `${f} East`, `${f} West`,
    `${f} Heights`, `${f} Park`,  `${f} Gardens`, `New ${f}`, `Old ${f}`,
    `${f} District`, `${f} Hills`,
  ];
}

// ── Merge EXTENDED_CITIES (skip cities already defined above) ─────────────────
{
  const existingKeys = new Set(CITIES.map(c => `${c.city}|${c.country}`));
  for (const [name, country, lat, lng, currency, priceIndex] of EXTENDED_CITIES) {
    const key = `${name}|${country}`;
    if (!existingKeys.has(key)) {
      CITIES.push({ city: name, country, lat, lng, currency, priceIndex,
                    neighbourhoods: generateNeighbourhoods(name) });
      existingKeys.add(key);
    }
  }
}

// ── Property type definitions ─────────────────────────────────────────────────
const PROPERTY_TYPES = ["apartment","house","villa","office","commercial","land","plot","hall","production"] as const;
type PropType = typeof PROPERTY_TYPES[number];

// Weighted distribution
const TYPE_WEIGHTS: Record<PropType, number> = {
  apartment: 32, house: 20, villa: 10, office: 12,
  commercial: 8, land: 6, plot: 5, hall: 4, production: 3,
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
  ],
  house: [
    "Spacious family home with landscaped garden, staff quarters, and double garage.",
    "Detached house with three reception rooms, fitted kitchen, and rear garden.",
    "Corner plot home with open plan living, modern kitchen, and private driveway.",
    "Well-established residential property with large outdoor entertaining area.",
  ],
  villa: [
    "Stunning luxury villa with private pool, landscaped gardens, and sea views.",
    "Executive villa with smart-home features, home cinema, and secure compound.",
    "Contemporary villa with open-plan design, chef's kitchen, and rooftop terrace.",
    "Elegant residence in gated estate, featuring 5 en-suite bedrooms and gym.",
  ],
  office: [
    "Grade-A office space in a prestigious business district with full fit-out.",
    "Open-plan office suite with meeting rooms, reception area, and fibre internet.",
    "Flexible office floor in modern tower, ready for immediate occupation.",
    "Serviced office with shared facilities, 24/7 access, and dedicated parking.",
  ],
  commercial: [
    "Ground-floor retail unit with high foot traffic in a busy commercial strip.",
    "Corner shop premises with large display windows, storage, and customer parking.",
    "Versatile commercial space suitable for retail, showroom, or clinic.",
    "Modern shop front with rear storage, recently refurbished to high standard.",
  ],
  land: [
    "Prime development land with all utilities connected and planning permission.",
    "Clear titled land in a fast-growing area, ideal for residential development.",
    "Large agricultural land with fertile soil, borehole, and road access.",
    "Commercial land in high-visibility location along main arterial road.",
  ],
  plot: [
    "Serviced residential plot ready to build, in a secure gated estate.",
    "Freehold plot with title deed, water and power connections available.",
    "Corner residential plot with good road frontage, ideal for a family home.",
    "Gated community plot with access to club house, pool, and security.",
  ],
  hall: [
    "Purpose-built event hall with catering facilities, parking, and air conditioning.",
    "Conference centre with divisible meeting rooms, AV equipment, and garden.",
    "Multi-purpose hall ideal for weddings, exhibitions, and corporate events.",
    "Modern event space with full kitchen, 500-person capacity, and ample parking.",
  ],
  production: [
    "Industrial warehouse with overhead crane, 3-phase power, and loading bays.",
    "Modern factory unit with office mezzanine, sprinkler system, and yard.",
    "Flexible production space with high eaves, roller-shutter access, and parking.",
    "Light industrial unit in well-managed estate, suitable for manufacturing or storage.",
  ],
};

// ── Price ranges by type and price index ────────────────────────────────────
function getPrice(type: PropType, listingType: "buy"|"rent", pi: number, currency: string): number {
  // Base monthly rent in USD equivalent, then scale by priceIndex
  const bases: Record<PropType, [number, number]> = {
    // [buyUSD, rentUSD per month]
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
  const scale = 0.3 + (pi / 10) * 1.7; // 0.3x (cheapest) to 2.0x (most expensive)
  const jitter = 0.6 + Math.random() * 0.8; // ±40%

  const fxMap: Record<string, number> = {
    // Africa
    KES:130, TZS:2600, UGX:3700, ETB:57, RWF:1300, NGN:1550, GHS:15,
    XOF:620, XAF:620, ZAR:18, ZMW:26, MZN:64, NAD:18, LSL:18, SZL:18,
    MAD:10, EGP:50, TND:3.1, DZD:135, LYD:4.8, SDG:600,
    GNF:8600, SLL:21000, CDF:2800, MGA:4600, LRD:157,
    MUR:45, SCR:13.5, KMF:461, DJF:178, BIF:2880, MWK:1730, BWP:13.5,
    // Middle East
    AED:3.67, SAR:3.75, QAR:3.64, KWD:0.31, OMR:0.38, BHD:0.38,
    JOD:0.71, ILS:3.7, IQD:1310, IRR:42000, YER:250,
    // Asia
    INR:84, THB:35, IDR:16000, MYR:4.5, VND:25000, SGD:1.35,
    PHP:58, LKR:300, PKR:280, BDT:110, NPR:133, MMK:2100,
    KHR:4100, LAK:21700, BND:1.35,
    // East Asia
    JPY:150, CNY:7.2, KRW:1350, TWD:32, HKD:7.8, MNT:3400,
    // Central Asia & Caucasus
    KZT:470, UZS:12500, KGS:89, TJS:10.9, TMT:3.5,
    AZN:1.7, GEL:2.7, AMD:388,
    // Europe
    GBP:0.79, EUR:0.92, CHF:0.88, PLN:4.0, CZK:23, HUF:370,
    TRY:34, SEK:10.5, DKK:7, NOK:10.6,
    RON:4.6, BGN:1.8, RSD:108, BAM:1.8, ALL:93, MKD:56,
    RUB:90, UAH:37, BYN:3.2, MDL:17.5,
    // Americas
    USD:1, CAD:1.36, AUD:1.55, NZD:1.65,
    BRL:5.1, ARS:1000, COP:4200, PEN:3.7, MXN:17, CLP:970,
    BOB:6.9, PYG:7500, UYU:39, GTQ:7.8, CRC:510, HNL:25, NIO:36.5,
    DOP:58, JMD:156, HTG:130, CUP:120,
    // Oceania
    FJD:2.25, PGK:3.8, WST:2.7, TOP:2.35, SBD:8.4, BSD:1.0,
  };
  const fx = fxMap[currency] ?? 1;
  const base = listingType === "buy" ? buyBase : rentBase;
  const usd  = base * scale * jitter;
  // Round to clean number
  const raw  = usd * fx;
  const mag  = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / mag) * mag;
}

// ── Bedroom/bathroom/area by type ────────────────────────────────────────────
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

// ── Weighted random pick ──────────────────────────────────────────────────────
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

// ── Agent names pool ──────────────────────────────────────────────────────────
const AGENT_NAMES = [
  "James Mwangi","Fatima Al-Hassan","David Osei","Aisha Kamau","Emmanuel Eze",
  "Sophie Müller","Carlos Rodrigues","Priya Sharma","Ahmed Al-Rashid","Maria Santos",
  "John Njoroge","Grace Amoah","Pierre Dubois","Yuki Tanaka","Omar Abdullah",
  "Elena Popescu","Samuel Okafor","Diana Nkrumah","Lucas Fernandez","Amara Diallo",
  "Wei Chen","Hiroshi Yamamoto","Min-jun Kim","Lin Xiaoming","Park Soo-yeon",
  "Mehmet Yilmaz","Natasha Ivanova","Stefan Müller","Anna Kowalska","Andrei Popescu",
  "Ravi Patel","Sunita Krishnan","Ahmed Hassan","Layla Mohammed","Hassan Ibrahim",
  "Isabella Romano","Marco Bianchi","Luisa García","Roberto Martínez","Ana Pereira",
  "Olga Petrova","Dmitri Volkov","Sasha Kozlov","Katya Sorokina","Ivan Petrov",
  "Nguyen Thi Thu","Bui Van Minh","Farrukh Tashkentov","Asel Bakytbekova","Giorgi Beridze",
  "Sipho Ndlovu","Thandiwe Mokoena","Kwame Asante","Adaeze Obi","Chidi Okeke",
  "Valentina López","Diego Herrera","Camila Fernández","Pablo Morales","Ana Beatriz Silva",
  "Tariq Mahmoud","Nour Al-Farsi","Khalid bin Rashid","Sara Al-Mansoori","Yasmin Khalil",
  "Raj Venkataraman","Deepika Nair","Karan Mehta","Aarav Joshi","Pooja Iyer",
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌍 Habino — Global Listings Seeder");
  console.log("──────────────────────────────────");

  // 1. Get tenant ID
  const { data: tenants, error: tErr } = await sb.from("tenants").select("id,name").limit(5);
  if (tErr || !tenants?.length) {
    console.error("❌ Could not fetch tenants:", tErr?.message);
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  console.log(`✅ Using tenant: ${tenants[0].name} (${tenantId})`);

  // 2. Clear existing listings for this tenant (clean re-seed)
  const { count: existing } = await sb.from("properties").select("id", { count:"exact", head:true }).eq("tenant_id", tenantId);
  console.log(`ℹ️  Existing listings for this tenant: ${existing ?? 0}`);
  if (existing && existing > 0) {
    console.log("🗑️  Clearing old listings for clean re-seed…");
    const { error: delErr } = await sb.from("properties").delete().eq("tenant_id", tenantId);
    if (delErr) console.error("  ⚠️  Delete warning:", delErr.message);
    else console.log("  ✅ Old listings cleared.");
  }

  // 3. Drop slow indexes before bulk insert — rebuilding at end is much faster
  //    than maintaining them incrementally across 1M rows.
  console.log("\n⚡ Dropping indexes for fast bulk insert…");
  const dropIndexSql = `
    DROP INDEX IF EXISTS properties_coords_idx;
    DROP INDEX IF EXISTS properties_geom_gist;
  `;
  const { error: dropErr } = await sb.rpc("exec_sql" as any, { sql: dropIndexSql }).maybeSingle();
  if (dropErr) {
    // exec_sql RPC doesn't exist — indexes will stay; batch size compensates
    console.log("  ℹ️  Index drop skipped (run manually for faster seeding).");
  } else {
    console.log("  ✅ Indexes dropped.");
  }

  // 3. Generate listings
  console.log(`\n📍 Generating ${TARGET_TOTAL.toLocaleString()} listings across ${CITIES.length} cities…`);

  // ── Power-law distribution by city importance ─────────────────────────────
  // Weight = priceIndex² → major cities (pi=10) get 100× more listings than
  // tiny towns (pi=1).  With 1 500 cities this produces roughly:
  //   priceIndex 10 → ~3 000–5 000 listings   (NYC, London, Tokyo)
  //   priceIndex 8  → ~2 000 listings           (Berlin, Sydney)
  //   priceIndex 5  → ~600 listings             (Nairobi, Cluj)
  //   priceIndex 2  → ~60 listings              (small regional towns)
  const w = (pi: number) => pi * pi;
  const totalWeight  = CITIES.reduce((s, c) => s + w(c.priceIndex), 0);
  const cityListings: Array<{ city: CityDef; count: number }> = CITIES.map(city => ({
    city,
    count: Math.max(1, Math.round((w(city.priceIndex) / totalWeight) * TARGET_TOTAL * 1.05)),
  }));

  let batch: object[] = [];
  let totalInserted   = 0;
  let batchNum        = 0;

  async function flush() {
    if (!batch.length) return;
    batchNum++;
    // Retry up to 4× with exponential back-off (handles transient timeouts)
    let lastErr: string | null = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      const { error } = await sb.from("properties").insert(batch);
      if (!error) {
        totalInserted += batch.length;
        process.stdout.write(`\r  ✅ Inserted ${totalInserted.toLocaleString()} listings…`);
        lastErr = null;
        break;
      }
      lastErr = error.message;
      if (attempt < 4) {
        await new Promise(r => setTimeout(r, 500 * attempt)); // 0.5s, 1s, 1.5s
      }
    }
    if (lastErr) console.error(`\n  ❌ Batch ${batchNum} failed after retries:`, lastErr);
    batch = [];
  }

  for (const { city, count } of cityListings) {
    // Pre-compute stable neighbourhood centres for this city.
    // Neighbourhoods are arranged in a ring around the city centre so listings
    // spread realistically across the urban area rather than piling on one point.
    // Ring radius scales with city importance (priceIndex 1–10 → ~4–17 km).
    const cityRadius = 0.03 + city.priceIndex * 0.013; // degrees (~4 km … ~17 km)
    const nbCount    = city.neighbourhoods.length;
    // Rotate the ring per-city so rings don't all start at the same angle
    const ringOffset = (city.lat % 1 + city.lng % 1) * Math.PI;
    const nbCentres  = city.neighbourhoods.map((_, idx) => {
      const angle = ringOffset + (idx / nbCount) * 2 * Math.PI;
      return {
        lat: city.lat + Math.sin(angle) * cityRadius,
        lng: city.lng + Math.cos(angle) * cityRadius * 1.35, // slightly wider E-W
      };
    });

    for (let i = 0; i < count; i++) {
      const type        = pickWeighted(TYPE_WEIGHTS);
      const listingType = Math.random() < 0.42 ? "buy" : "rent";
      const nb          = pick(city.neighbourhoods);
      const specs       = getSpecs(type);
      const price       = getPrice(type, listingType, city.priceIndex, city.currency);
      const desc        = pick(DESCS[type]);
      const agent       = pick(AGENT_NAMES);

      // Place listing near its neighbourhood centre with small local jitter (~1 km).
      // This keeps same-neighbourhood listings visually grouped while the ring
      // layout ensures city-wide spread and avoids everything piling on one point.
      const nbCentre = nbCentres[city.neighbourhoods.indexOf(nb)];
      const lat = nbCentre.lat + (Math.random() - 0.5) * 0.016; // ±~900 m
      const lng = nbCentre.lng + (Math.random() - 0.5) * 0.022; // ±~1.1 km

      batch.push({
        tenant_id:     tenantId,
        title:         TITLES[type](specs.bedrooms, specs.area_sqm, nb),
        description:   desc,
        listing_type:  listingType,
        property_type: type,
        price,
        currency:      city.currency,
        bedrooms:      specs.bedrooms,
        bathrooms:     specs.bathrooms,
        area_sqm:      specs.area_sqm,
        city:          city.city,
        neighbourhood: nb,
        address:       `${nb}, ${city.city}, ${city.country}`,
        agent_name:    agent,
        agent_email:   `${agent.toLowerCase().replace(" ",".")  }@habino.app`,
        status:        "active",
        lat,
        lng,
      });

      if (batch.length >= BATCH_SIZE) await flush();
    }
  }

  await flush(); // final partial batch

  // ── 4. Rebuild indexes now that all data is inserted ──────────────────────
  console.log(`\n\n🔧 Rebuilding spatial indexes…`);
  console.log("   (If this fails, run the two CREATE INDEX statements from migration");
  console.log("    002 + 004 manually in the Supabase SQL Editor.)");
  const rebuildSql = `
    CREATE INDEX IF NOT EXISTS properties_coords_idx
      ON properties(tenant_id, lat, lng)
      WHERE lat IS NOT NULL AND lng IS NOT NULL;
    CREATE INDEX IF NOT EXISTS properties_geom_gist
      ON properties USING GIST (geom)
      WHERE geom IS NOT NULL;
  `;
  const { error: rebuildErr } = await sb.rpc("exec_sql" as any, { sql: rebuildSql }).maybeSingle();
  if (rebuildErr) {
    console.log("  ℹ️  Auto-rebuild skipped — run migrations 002+004 in Supabase SQL Editor.");
  } else {
    console.log("  ✅ Indexes rebuilt.");
  }

  // ── 5. Populate city_listing_counts (cluster layer) ───────────────────────
  // This table powers the lightweight city-bubble layer at low zoom levels.
  // It's replaced wholesale after every re-seed.
  console.log(`\n\n🗺️  Refreshing city cluster table…`);
  const { error: delCityErr } = await sb
    .from("city_listing_counts")
    .delete()
    .eq("tenant_id", tenantId);
  if (delCityErr) console.warn("  ⚠️  Could not clear city clusters:", delCityErr.message);

  const cityCountRows = cityListings.map(({ city, count }) => ({
    tenant_id:     tenantId,
    city:          city.city,
    country:       city.country,
    lat:           city.lat,
    lng:           city.lng,
    listing_count: count,
  }));

  // Insert in batches of 500
  for (let i = 0; i < cityCountRows.length; i += 500) {
    const { error: cityErr } = await sb
      .from("city_listing_counts")
      .insert(cityCountRows.slice(i, i + 500));
    if (cityErr) console.warn(`  ⚠️  City cluster batch error:`, cityErr.message);
  }
  console.log(`  ✅ ${cityCountRows.length} city clusters written.`);

  console.log(`\n🎉 Done! Inserted ${totalInserted.toLocaleString()} listings across ${CITIES.length} cities.`);
  console.log("   Open Habino — the map now shows city bubbles at world zoom, pins when zoomed in.");
  console.log("   (Tip: run migration 003_city_clusters.sql in Supabase SQL editor if you haven't yet.)");
}

main().catch(console.error);
