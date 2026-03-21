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

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || "https://ikubxgsptautubecukoi.supabase.co";
const SUPABASE_SR_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY     || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdWJ4Z3NwdGF1dHViZWN1a29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc2ODE2NiwiZXhwIjoyMDg5MzQ0MTY2fQ.c6hUfJODHj9smszXQSfUOU55thu3TNs39bWTksfTPxs";
const BATCH_SIZE        = 500;
const TARGET_TOTAL      = 120_000;

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
];

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
    KES:130, TZS:2600, UGX:3700, ETB:57, RWF:1300, NGN:1550, GHS:15,
    XOF:620, XAF:620, ZAR:18, ZMW:26, MZN:64, NAD:18, USD:1,
    MAD:10, EGP:50, TND:3.1, DZD:135, DZD2:135,
    AED:3.67, SAR:3.75, QAR:3.64, KWD:0.31, OMR:0.38, BHD:0.38,
    INR:84, THB:35, IDR:16000, MYR:4.5, VND:25000, SGD:1.35,
    PHP:58, LKR:300, PKR:280,
    GBP:0.79, EUR:0.92, CHF:0.88, PLN:4.0, CZK:23, HUF:370,
    TRY:34, SEK:10.5, DKK:7, NOK:10.6,
    USD2:1, CAD:1.36, AUD:1.55, NZD:1.65,
    BRL:5.1, ARS:1000, COP:4200, PEN:3.7, MXN:17, CLP:970,
    GNF:8600, SLL:21000, CDF:2800, MGA:4600,
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

  // 2. Check existing count
  const { count: existing } = await sb.from("properties").select("id", { count:"exact", head:true });
  console.log(`ℹ️  Existing listings: ${existing ?? 0}`);

  // 3. Generate listings
  console.log(`\n📍 Generating listings for ${CITIES.length} cities…`);

  // Calculate per-city count so total ≈ TARGET_TOTAL
  // Larger priceIndex cities get more listings
  const totalWeight = CITIES.reduce((s,c) => s + c.priceIndex, 0);
  const cityListings: Array<{ city: CityDef; count: number }> = CITIES.map(city => ({
    city,
    count: Math.round((city.priceIndex / totalWeight) * TARGET_TOTAL * 1.05),
  }));

  let batch: object[] = [];
  let totalInserted   = 0;
  let batchNum        = 0;

  async function flush() {
    if (!batch.length) return;
    batchNum++;
    const { error } = await sb.from("properties").insert(batch);
    if (error) {
      console.error(`  ❌ Batch ${batchNum} error:`, error.message);
    } else {
      totalInserted += batch.length;
      process.stdout.write(`\r  ✅ Inserted ${totalInserted.toLocaleString()} listings…`);
    }
    batch = [];
  }

  for (const { city, count } of cityListings) {
    for (let i = 0; i < count; i++) {
      const type        = pickWeighted(TYPE_WEIGHTS);
      const listingType = Math.random() < 0.42 ? "buy" : "rent";
      const nb          = pick(city.neighbourhoods);
      const specs       = getSpecs(type);
      const price       = getPrice(type, listingType, city.priceIndex, city.currency);
      const desc        = pick(DESCS[type]);
      const agent       = pick(AGENT_NAMES);

      // Jitter coordinates for neighbourhood-level spread (~±0.025°)
      const lat = city.lat + (Math.random() - 0.5) * 0.05;
      const lng = city.lng + (Math.random() - 0.5) * 0.05;

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
        // Store lat/lng in address field isn't ideal — we store it in a JSON col if present
        // For map display the app uses city lookup + hash offset (works fine without exact coords)
      });

      if (batch.length >= BATCH_SIZE) await flush();
    }
  }

  await flush(); // final partial batch

  console.log(`\n\n🎉 Done! Inserted ${totalInserted.toLocaleString()} listings across ${CITIES.length} cities.`);
  console.log("   Open Habino and search any city to see them on the map.");
}

main().catch(console.error);
