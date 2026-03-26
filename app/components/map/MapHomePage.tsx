"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { PropertyWithCoords } from "./LeafletMap";
import { AIChatPage } from "@/app/components/chat/AIChatPage";

// Load Leaflet map client-side only (no SSR)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => null,
});

// ── City coordinates (500+ cities worldwide) ─────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  // East Africa
  "Nairobi":          [-1.2921,  36.8219], "Nairobi CBD":     [-1.2864,  36.8172],
  "Mombasa":          [-4.0435,  39.6682], "Kisumu":          [-0.0917,  34.7679],
  "Nakuru":           [-0.3031,  36.0800], "Eldoret":         [ 0.5143,  35.2698],
  "Dar es Salaam":    [-6.7924,  39.2083], "Zanzibar":        [-6.1648,  39.1989],
  "Arusha":           [-3.3869,  36.6829], "Dodoma":          [-6.1722,  35.7395],
  "Kampala":          [ 0.3476,  32.5825], "Entebbe":         [ 0.0512,  32.4633],
  "Kigali":           [-1.9441,  30.0619], "Addis Ababa":     [ 9.1450,  38.7251],
  "Dire Dawa":        [ 9.5931,  41.8661], "Maputo":          [-25.9653, 32.5892],
  "Windhoek":         [-22.5597, 17.0832], "Djibouti":        [11.5720,  43.1456],
  "Bujumbura":        [-3.3614,  29.3600], "Juba":            [ 4.8594,  31.5713],
  "Mwanza":           [-2.5167,  32.9000], "Lilongwe":        [-13.9626, 33.7741],
  "Blantyre":         [-15.7866, 35.0168], "Port Louis":      [-20.1619, 57.4989],
  "Victoria":         [-4.6191,  55.4513], "Moroni":          [-11.7017, 43.2551],

  // West Africa
  "Lagos":            [ 6.5244,   3.3792], "Abuja":           [ 9.0765,   7.3986],
  "Port Harcourt":    [ 4.8156,   7.0498], "Kano":            [12.0022,   8.5920],
  "Ibadan":           [ 7.3775,   3.9470], "Enugu":           [ 6.4584,   7.5464],
  "Benin City":       [ 6.3350,   5.6037], "Kaduna":          [10.5105,   7.4165],
  "Accra":            [ 5.6037,  -0.1870], "Accra East":      [ 5.6500,  -0.1500],
  "Kumasi":           [ 6.6885,  -1.6244], "Tamale":          [ 9.4075,  -0.8533],
  "Abidjan":          [ 5.3600,  -4.0083], "Dakar":           [14.7167, -17.4677],
  "Thiès":            [14.7910, -16.9359], "Douala":          [ 4.0483,   9.7043],
  "Yaoundé":          [ 3.8480,  11.5021], "Lomé":            [ 6.1375,   1.2123],
  "Bamako":           [12.6392,  -8.0029], "Conakry":         [ 9.6412, -13.5784],
  "Freetown":         [ 8.4657, -13.2317], "Monrovia":        [ 6.3005, -10.7969],
  "Ouagadougou":      [12.3714,  -1.5197], "Niamey":          [13.5137,   2.1098],
  "Cotonou":          [ 6.3654,   2.4183],
  "Bissau":           [11.8636, -15.5977],

  // North Africa
  "Cairo":            [30.0444,  31.2357], "Alexandria":      [31.2001,  29.9187],
  "Giza":             [30.0131,  31.2089], "Luxor":           [25.6872,  32.6396],
  "Casablanca":       [33.5731,  -7.5898], "Marrakech":       [31.6295,  -7.9811],
  "Rabat":            [33.9716,  -6.8498], "Fes":             [34.0181,  -5.0078],
  "Agadir":           [30.4278,  -9.5981], "Tangier":         [35.7595,  -5.8340],
  "Tunis":            [36.8190,  10.1658], "Sfax":            [34.7406,  10.7603],
  "Algiers":          [36.7538,   3.0588], "Oran":            [35.6969,  -0.6331],
  "Constantine":      [36.3650,   6.6147], "Tripoli":         [32.9018,  13.1801],
  "Benghazi":         [32.1194,  20.0868], "Khartoum":        [15.5007,  32.5599],

  // Southern Africa
  "Cape Town":        [-33.9249, 18.4241], "Johannesburg":    [-26.2041, 28.0473],
  "Durban":           [-29.8587, 31.0218], "Pretoria":        [-25.7479, 28.2293],
  "Port Elizabeth":   [-33.9608, 25.6022], "Bloemfontein":    [-29.0852, 26.1596],
  "Lusaka":           [-15.3875, 28.3228], "Harare":          [-17.8252, 31.0335],
  "Bulawayo":         [-20.1525, 28.5778], "Gaborone":        [-24.6282, 25.9231],
  "Mbabane":          [-26.3186, 31.1410], "Maseru":          [-29.3142, 27.4833],

  // Central Africa
  "Kinshasa":         [-4.3317,  15.3323], "Lubumbashi":      [-11.6609, 27.4794],
  "Brazzaville":      [-4.2692,  15.2718], "Libreville":      [ 0.3924,   9.4536],
  "Bangui":           [ 4.3947,  18.5582], "N'Djamena":       [12.1048,  15.0444],
  "Antananarivo":     [-18.9137, 47.5361], "Toamasina":       [-18.1492, 49.4023],
  // Gulf & Middle East
  "Dubai":            [25.2048,  55.2708], "Abu Dhabi":       [24.4539,  54.3773],
  "Sharjah":          [25.3462,  55.4212], "Ajman":           [25.4052,  55.5136],
  "Riyadh":           [24.7136,  46.6753], "Jeddah":          [21.4858,  39.1925],
  "Mecca":            [21.3891,  39.8579], "Dammam":          [26.4207,  50.0888],
  "Doha":             [25.2854,  51.5310], "Kuwait City":     [29.3759,  47.9774],
  "Muscat":           [23.5880,  58.3829], "Sohar":           [24.3473,  56.7258],
  "Manama":           [26.2235,  50.5876], "Amman":           [31.9539,  35.9106],
  "Aqaba":            [29.5269,  35.0061], "Beirut":          [33.8938,  35.5018],
  "Tel Aviv":         [32.0853,  34.7818], "Jerusalem":       [31.7683,  35.2137],
  "Haifa":            [32.7940,  34.9896], "Baghdad":         [33.3152,  44.3661],
  "Basra":            [30.5085,  47.7804], "Erbil":           [36.1901,  44.0091],
  "Tehran":           [35.6892,  51.3890], "Mashhad":         [36.2605,  59.6168],
  "Isfahan":          [32.6546,  51.6680], "Shiraz":          [29.5918,  52.5836],
  "Ankara":           [39.9334,  32.8597], "Izmir":           [38.4192,  27.1287],
  "Antalya":          [36.8969,  30.7133], "Bursa":           [40.1885,  29.0610],
  "Sana'a":           [15.3694,  44.1910], "Aden":            [12.7755,  45.0361],

  // Central Asia & Caucasus
  "Almaty":           [43.2565,  76.9286], "Tashkent":        [41.2995,  69.2401],
  "Samarkand":        [39.6270,  66.9750], "Bishkek":         [42.8746,  74.5698],
  "Astana":           [51.1801,  71.4460], "Dushanbe":        [38.5598,  68.7738],
  "Ashgabat":         [37.9601,  58.3261], "Baku":            [40.4093,  49.8671],
  "Tbilisi":          [41.6938,  44.8015], "Kutaisi":         [42.2679,  42.6981],
  "Yerevan":          [40.1792,  44.4991],

  // South Asia
  "Mumbai":           [19.0760,  72.8777], "Pune":            [18.5204,  73.8567],
  "Delhi":            [28.6139,  77.2090], "Jaipur":          [26.9124,  75.7873],
  "Bangalore":        [12.9716,  77.5946], "Chennai":         [13.0827,  80.2707],
  "Hyderabad":        [17.3850,  78.4867], "Kolkata":         [22.5726,  88.3639],
  "Ahmedabad":        [23.0225,  72.5714], "Surat":           [21.1702,  72.8311],
  "Lucknow":          [26.8467,  80.9462], "Chandigarh":      [30.7333,  76.7794],
  "Karachi":          [24.8607,  67.0011], "Lahore":          [31.5204,  74.3587],
  "Islamabad":        [33.6844,  73.0479], "Faisalabad":      [31.4504,  73.1350],
  "Colombo":          [ 6.9271,  79.8612], "Kandy":           [ 7.2906,  80.6337],
  "Dhaka":            [23.8103,  90.4125], "Chittagong":      [22.3569,  91.7832],
  "Kathmandu":        [27.7172,  85.3240],

  // East Asia
  "Tokyo":            [35.6762, 139.6503], "Osaka":           [34.6937, 135.5023],
  "Kyoto":            [35.0116, 135.7681], "Yokohama":        [35.4437, 139.6380],
  "Nagoya":           [35.1815, 136.9066], "Fukuoka":         [33.5904, 130.4017],
  "Sapporo":          [43.0618, 141.3545], "Kobe":            [34.6901, 135.1956],
  "Beijing":          [39.9042, 116.4074], "Shanghai":        [31.2304, 121.4737],
  "Guangzhou":        [23.1291, 113.2644], "Shenzhen":        [22.5431, 114.0579],
  "Chengdu":          [30.5728, 104.0668], "Chongqing":       [29.5630, 106.5516],
  "Wuhan":            [30.5928, 114.3055], "Xi'an":           [34.3416, 108.9398],
  "Nanjing":          [32.0603, 118.7969], "Hangzhou":        [30.2741, 120.1551],
  "Tianjin":          [39.3434, 117.3616], "Qingdao":         [36.0671, 120.3826],
  "Suzhou":           [31.2989, 120.5853], "Zhengzhou":       [34.7466, 113.6254],
  "Seoul":            [37.5665, 126.9780], "Busan":           [35.1796, 129.0756],
  "Incheon":          [37.4563, 126.7052], "Daegu":           [35.8714, 128.6014],
  "Taipei":           [25.0330, 121.5654], "Taichung":        [24.1477, 120.6736],
  "Kaohsiung":        [22.6273, 120.3014], "Hong Kong":       [22.3193, 114.1694],
  "Ulaanbaatar":      [47.8864, 106.9057],

  // Southeast Asia
  "Bangkok":          [13.7563, 100.5018], "Phuket":          [ 7.8804,  98.3923],
  "Chiang Mai":       [18.7883,  98.9853], "Pattaya":         [12.9236, 100.8825],
  "Jakarta":          [-6.2088, 106.8456], "Surabaya":        [-7.2575, 112.7521],
  "Bandung":          [-6.9175, 107.6191], "Medan":           [ 3.5952,  98.6722],
  "Bali":             [-8.4095, 115.1889], "Makassar":        [-5.1477, 119.4327],
  "Kuala Lumpur":     [ 3.1390, 101.6869], "Penang":          [ 5.4141, 100.3288],
  "Johor Bahru":      [ 1.4927, 103.7414], "Kota Kinabalu":   [ 5.9788, 116.0753],
  "Ho Chi Minh":      [10.8231, 106.6297], "Hanoi":           [21.0285, 105.8542],
  "Da Nang":          [16.0544, 108.2022], "Hoi An":          [15.8800, 108.3380],
  "Singapore":        [ 1.3521, 103.8198], "Manila":          [14.5995, 120.9842],
  "Cebu":             [10.3157, 123.8854], "Davao":           [ 7.0731, 125.6128],
  "Phnom Penh":       [11.5564, 104.9282], "Siem Reap":       [13.3671, 103.8448],
  "Vientiane":        [17.9757, 102.6331], "Luang Prabang":   [19.8900, 102.1358],
  "Yangon":           [16.8409,  96.1735], "Mandalay":        [21.9588,  96.0891],
  "Naypyidaw":        [19.7633,  96.0785], "Brunei":          [ 4.9031, 114.9398],

  // Western Europe
  "London":           [51.5074,  -0.1278], "Edinburgh":       [55.9533,  -3.1883],
  "Manchester":       [53.4808,  -2.2426], "Birmingham":      [52.4862,  -1.8904],
  "Glasgow":          [55.8642,  -4.2518], "Leeds":           [53.8008,  -1.5491],
  "Bristol":          [51.4545,  -2.5879], "Liverpool":       [53.4084,  -2.9916],
  "Berlin":           [52.5200,  13.4050], "Hamburg":         [53.5753,  10.0153],
  "Munich":           [48.1351,  11.5820], "Frankfurt":       [50.1109,   8.6821],
  "Cologne":          [50.9333,   6.9500], "Stuttgart":       [48.7758,   9.1829],
  "Düsseldorf":       [51.2217,   6.7762], "Dortmund":        [51.5136,   7.4653],
  "Paris":            [48.8566,   2.3522], "Lyon":            [45.7640,   4.8357],
  "Marseille":        [43.2965,   5.3698], "Toulouse":        [43.6047,   1.4442],
  "Nice":             [43.7102,   7.2620], "Nantes":          [47.2184,  -1.5536],
  "Bordeaux":         [44.8378,  -0.5792], "Montpellier":     [43.6108,   3.8767],
  "Barcelona":        [41.3851,   2.1734], "Madrid":          [40.4168,  -3.7038],
  "Valencia":         [39.4699,  -0.3763], "Seville":         [37.3891,  -5.9845],
  "Malaga":           [36.7213,  -4.4214], "Bilbao":          [43.2630,  -2.9349],
  "Amsterdam":        [52.3676,   4.9041], "Rotterdam":       [51.9244,   4.4777],
  "The Hague":        [52.0705,   4.3007], "Utrecht":         [52.0907,   5.1214],
  "Vienna":           [48.2082,  16.3738], "Graz":            [47.0707,  15.4395],
  "Zurich":           [47.3769,   8.5417], "Geneva":          [46.2044,   6.1432],
  "Bern":             [46.9481,   7.4474], "Basel":           [47.5596,   7.5886],
  "Lisbon":           [38.7223,  -9.1393], "Porto":           [41.1579,  -8.6291],
  "Rome":             [41.9028,  12.4964], "Milan":           [45.4642,   9.1900],
  "Naples":           [40.8518,  14.2681], "Turin":           [45.0703,   7.6869],
  "Florence":         [43.7696,  11.2558], "Bologna":         [44.4949,  11.3426],
  "Venice":           [45.4408,  12.3155], "Palermo":         [38.1157,  13.3615],
  "Athens":           [37.9838,  23.7275], "Thessaloniki":    [40.6401,  22.9444],
  "Heraklion":        [35.3387,  25.1442], "Patras":          [38.2466,  21.7346],
  "Stockholm":        [59.3293,  18.0686], "Gothenburg":      [57.7089,  11.9746],
  "Malmö":            [55.6050,  13.0038], "Copenhagen":      [55.6761,  12.5683],
  "Aarhus":           [56.1629,  10.2039], "Helsinki":        [60.1699,  24.9384],
  "Tampere":          [61.4978,  23.7610], "Oslo":            [59.9139,  10.7522],
  "Bergen":           [60.3929,   5.3241], "Dublin":          [53.3498,  -6.2603],
  "Brussels":         [50.8503,   4.3517], "Antwerp":         [51.2194,   4.4025],
  "Luxembourg":       [49.6117,   6.1319], "Nicosia":         [35.1856,  33.3823],

  // Eastern Europe
  "Warsaw":           [52.2297,  21.0122], "Krakow":          [50.0647,  19.9450],
  "Wroclaw":          [51.1079,  17.0385], "Gdansk":          [54.3520,  18.6466],
  "Prague":           [50.0755,  14.4378], "Brno":            [49.1951,  16.6068],
  "Budapest":         [47.4979,  19.0402], "Debrecen":        [47.5316,  21.6273],
  "Bucharest":        [44.4268,  26.1025], "Cluj":            [46.7712,  23.6236],
  "Sofia":            [42.6977,  23.3219], "Plovdiv":         [42.1354,  24.7453],
  "Belgrade":         [44.7866,  20.4489], "Novi Sad":        [45.2671,  19.8335],
  "Zagreb":           [45.8150,  15.9819], "Sarajevo":        [43.8486,  18.3564],
  "Ljubljana":        [46.0511,  14.5051], "Bratislava":      [48.1486,  17.1077],
  "Tirana":           [41.3275,  19.8187], "Skopje":          [41.9981,  21.4254],
  "Podgorica":        [42.4304,  19.2594], "Pristina":        [42.6629,  21.1655],
  "Tallinn":          [59.4370,  24.7536], "Riga":            [56.9496,  24.1052],
  "Vilnius":          [54.6872,  25.2797], "Kaunas":          [54.8985,  23.9036],
  "Kyiv":             [50.4501,  30.5234], "Kharkiv":         [49.9935,  36.2304],
  "Lviv":             [49.8397,  24.0297], "Odessa":          [46.4825,  30.7233],
  "Minsk":            [53.9045,  27.5615], "Chisinau":        [47.0105,  28.8638],
  "Istanbul":         [41.0082,  28.9784],

  // Russia & CIS
  "Moscow":           [55.7558,  37.6173], "Saint Petersburg": [59.9311, 30.3609],
  "Novosibirsk":      [55.0084,  82.9357], "Yekaterinburg":   [56.8389,  60.6057],
  "Kazan":            [55.8304,  49.0661], "Nizhny Novgorod": [56.2965,  43.9361],

  // Americas — USA
  "New York":         [40.7128, -74.0060], "Los Angeles":     [34.0522,-118.2437],
  "Chicago":          [41.8781, -87.6298], "Houston":         [29.7604, -95.3698],
  "Phoenix":          [33.4484,-112.0740], "Philadelphia":    [39.9526, -75.1652],
  "San Antonio":      [29.4241, -98.4936], "San Diego":       [32.7157,-117.1611],
  "Dallas":           [32.7767, -96.7970], "San Francisco":   [37.7749,-122.4194],
  "Austin":           [30.2672, -97.7431], "Seattle":         [47.6062,-122.3321],
  "Denver":           [39.7392,-104.9903], "Boston":          [42.3601, -71.0589],
  "Nashville":        [36.1627, -86.7816], "Atlanta":         [33.7490, -84.3880],
  "Miami":            [25.7617, -80.1918], "Portland":        [45.5231,-122.6765],
  "Las Vegas":        [36.1699,-115.1398], "Orlando":         [28.5383, -81.3792],
  "Minneapolis":      [44.9778, -93.2650], "Honolulu":        [21.3069,-157.8583],

  // Americas — Canada
  "Toronto":          [43.6532, -79.3832], "Vancouver":       [49.2827,-123.1207],
  "Montreal":         [45.5017, -73.5673], "Calgary":         [51.0447,-114.0719],
  "Ottawa":           [45.4215, -75.6972], "Edmonton":        [53.5461,-113.4938],
  "Winnipeg":         [49.8951, -97.1384], "Quebec City":     [46.8139, -71.2080],
  "Halifax":          [44.6488, -63.5752],

  // Americas — Latin America
  "Mexico City":      [19.4326, -99.1332], "Guadalajara":     [20.6597,-103.3496],
  "Monterrey":        [25.6866,-100.3161], "Cancún":          [21.1619, -86.8515],
  "Puebla":           [19.0414, -98.2063], "Tijuana":         [32.5149,-117.0382],
  "Guatemala City":   [14.6349, -90.5069], "San Salvador":    [13.6929, -89.2182],
  "San José":         [ 9.9281, -84.0907], "Panama City":     [ 8.9936, -79.5197],
  "Tegucigalpa":      [14.0723, -87.2062], "Managua":         [12.1149, -86.2362],
  "Havana":           [23.1136, -82.3666], "Santo Domingo":   [18.4861, -69.9312],
  "Kingston":         [17.9970, -76.7936], "San Juan":        [18.4655, -66.1057],
  "Port-au-Prince":   [18.5944, -72.3074], "Nassau":          [25.0480, -77.3558],
  "Bogotá":           [ 4.7110, -74.0721], "Medellín":        [ 6.2442, -75.5812],
  "Cali":             [ 3.4516, -76.5320], "Cartagena":       [10.3910, -75.4794],
  "Barranquilla":     [10.9685, -74.7813], "Lima":            [-12.0464,-77.0428],
  "Arequipa":         [-16.4090, -71.5375], "Quito":          [-0.1807, -78.4678],
  "Guayaquil":        [-2.1962, -79.8862], "Caracas":         [10.4806, -66.9036],
  "Maracaibo":        [10.6544, -71.6020], "La Paz":          [-16.5000, -68.1500],
  "Santa Cruz":       [-17.7833, -63.1833], "Asunción":       [-25.2637, -57.5759],
  "Montevideo":       [-34.9011, -56.1645], "Buenos Aires":   [-34.6037, -58.3816],
  "Córdoba":          [-31.4201, -64.1888], "Rosario":        [-32.9442, -60.6505],
  "Mendoza":          [-32.8908, -68.8272], "Santiago":       [-33.4489, -70.6693],
  "Valparaíso":       [-33.0472, -71.6127], "Concepción":     [-36.8201, -73.0444],
  "São Paulo":        [-23.5505, -46.6333], "Rio de Janeiro": [-22.9068, -43.1729],
  "Brasília":         [-15.7975, -47.8919], "Salvador":       [-12.9714, -38.5014],
  "Fortaleza":        [-3.7172,  -38.5433], "Recife":         [-8.0578, -34.8829],
  "Porto Alegre":     [-30.0277, -51.2287], "Curitiba":       [-25.4284, -49.2733],
  "Belo Horizonte":   [-19.9191, -43.9386], "Manaus":         [-3.1190, -60.0217],
  "Belém":            [-1.4558, -48.5044],

  // Oceania
  "Sydney":           [-33.8688, 151.2093], "Melbourne":      [-37.8136, 144.9631],
  "Brisbane":         [-27.4698, 153.0251], "Perth":          [-31.9505, 115.8605],
  "Adelaide":         [-34.9285, 138.6007], "Gold Coast":     [-28.0167, 153.4000],
  "Canberra":         [-35.2809, 149.1300], "Darwin":         [-12.4634, 130.8456],
  "Hobart":           [-42.8821, 147.3272], "Newcastle":      [-32.9283, 151.7817],
  "Auckland":         [-36.8485, 174.7633], "Wellington":     [-41.2866, 174.7756],
  "Christchurch":     [-43.5320, 172.6306], "Queenstown":     [-45.0312, 168.6626],
  "Suva":             [-18.1248, 178.4501], "Port Moresby":   [-9.4438,  147.1803],
  "Honiara":          [-9.4333, 160.0333], "Apia":           [-13.8333,-171.7667],
  "Nuku'alofa":       [-21.1394,-175.2049],
};


// ── Deterministic hash helper ─────────────────────────────────────────────────
function hashDeg(seed: string, range: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xfffff;
  return ((h % 10000) / 10000 - 0.5) * 2 * range;
}

// ── Haversine distance in metres ──────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Coordinate assignment ──────────────────────────────────────────────────────
// Uses actual lat/lng stored in the DB. Falls back to CITY_COORDS + hash jitter
// for legacy rows that predate the coordinates migration.
//
// MIN_DIST: only block truly co-incident pins (< 80 m).  The seed script now
// spreads listings via a ring layout so aggressive dedup is no longer needed.
// Micro-jitter for truly co-located pins (same building) so they don't stack
function jitterCoords(lat: number, lng: number, id: string, index: number): [number, number] {
  const angle = (index * 137.508) * Math.PI / 180; // golden angle spread
  const r = 0.00003 * index; // ~3m per step
  return [lat + r * Math.cos(angle), lng + r * Math.sin(angle)];
}

function withCoords(
  props: Property[],
  _placed: Array<[number, number]>,
): PropertyWithCoords[] {
  const result: PropertyWithCoords[] = [];
  // Track exact coordinates to detect co-location
  const seen = new Map<string, number>(); // "lat,lng" → count

  for (const p of props) {
    let lat: number;
    let lng: number;

    if (p.lat != null && p.lng != null) {
      lat = p.lat;
      lng = p.lng;
    } else {
      const base = CITY_COORDS[p.city];
      if (!base) continue;
      const nb = p.neighbourhood || p.city;
      lat = base[0] + hashDeg(nb + "_lat", 0.045) + hashDeg(p.id + "_lat", 0.006);
      lng = base[1] + hashDeg(nb + "_lng", 0.060) + hashDeg(p.id + "_lng", 0.006);
    }

    // If two properties share exact same coords (same building), jitter slightly
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const count = seen.get(key) ?? 0;
    if (count > 0) {
      [lat, lng] = jitterCoords(lat, lng, p.id, count);
    }
    seen.set(key, count + 1);

    result.push({ ...p, lat, lng });
  }
  return result;
}

function fmtFull(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

// ── Property detail panel ─────────────────────────────────────────────────────
import { TYPE_COLORS, TYPE_LABELS } from "./LeafletMap";

function PropertyDetailPanel({ property, onClose }: { property: PropertyWithCoords; onClose: () => void }) {
  const img      = property.images?.[0]?.url;
  const color    = TYPE_COLORS[property.property_type] || "#6B7280";
  const typeLabel = TYPE_LABELS[property.property_type] || property.property_type;
  const priceFmt = fmtFull(property.price, property.currency);
  const isRent   = property.listing_type === "rent";
  const ppm      = property.area_sqm && property.area_sqm > 0
    ? fmtFull(Math.round(property.price / property.area_sqm), property.currency) + "/m²"
    : null;
  const isResidential = ["apartment","house","villa"].includes(property.property_type);
  const initials = (property.agent_name || "HA").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="flex flex-col overflow-hidden h-full" style={{ borderRadius: 20 }}>

        {/* Colour header stripe */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3"
          style={{ background: `${color}18`, borderBottom: `2px solid ${color}30` }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{typeLabel}</span>
            <span className="text-xs text-slate-400 ml-1">{isRent ? "· For Rent" : "· For Sale"}</span>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Image */}
          {img && (
            <div className="relative w-full h-40 bg-slate-100">
              <Image src={img} alt={property.title} fill className="object-cover" />
            </div>
          )}
          {!img && (
            <div className="w-full h-28 flex items-center justify-center text-5xl"
              style={{ background: `${color}10` }}>
              {property.property_type === "apartment" ? "🏢"
                : property.property_type === "house" ? "🏠"
                : property.property_type === "villa" ? "🏡"
                : property.property_type === "office" ? "🏗️"
                : property.property_type === "land" || property.property_type === "plot" ? "🌿"
                : property.property_type === "hall" ? "🎪"
                : property.property_type === "production" ? "🏭"
                : "🏢"}
            </div>
          )}

          <div className="px-4 pt-4 pb-2">
            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-2xl font-extrabold text-slate-900">{priceFmt}</span>
              {isRent && <span className="text-sm text-slate-400 font-medium">/mo</span>}
            </div>
            <p className="text-sm font-medium text-slate-700 mb-0.5">{property.title}</p>
            <p className="text-xs text-slate-400 mb-3">
              {[property.neighbourhood, property.city].filter(Boolean).join(" · ")}
            </p>

            {/* Specs grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {isResidential && property.bedrooms > 0 && (
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-slate-800">{property.bedrooms}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Beds</p>
                </div>
              )}
              {isResidential && property.bathrooms > 0 && (
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-slate-800">{property.bathrooms}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Baths</p>
                </div>
              )}
              {property.area_sqm && (
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-slate-800">{property.area_sqm}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">m²</p>
                </div>
              )}
              {ppm && (
                <div className="rounded-xl p-2 text-center" style={{ background: `${color}12` }}>
                  <p className="text-[11px] font-bold" style={{ color }}>{ppm}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">per m²</p>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                {property.description}
              </p>
            )}

            {/* Agent */}
            {property.agent_name && (
              <div className="border border-slate-100 rounded-xl p-3 mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Agent</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: color }}>{initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{property.agent_name}</p>
                    {property.agent_email && (
                      <a href={`mailto:${property.agent_email}`}
                        className="text-xs text-slate-400 hover:underline truncate block">{property.agent_email}</a>
                    )}
                    {property.agent_phone && (
                      <a href={`tel:${property.agent_phone}`}
                        className="text-xs text-slate-400 hover:underline block">{property.agent_phone}</a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-slate-100/60">
          <Link href={`/properties/${property.id}`}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}>
            View listing
          </Link>
          <Link href={`/?chat=1&q=${encodeURIComponent(`Book a viewing for "${property.title}"`)}`}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            Ask AI
          </Link>
        </div>
    </div>
  );
}

// ── Habino control-centre panel ───────────────────────────────────────────────
function HabinoPanel({ onClose }: { onClose: () => void }) {
  const items = [
    { href: "/profile",  icon: "👤", label: "Profile" },
    { href: "/home",     icon: "📄", label: "Contracts" },
    { href: "/saved",    icon: "🔖", label: "Saved Properties" },
    { href: "/listings", icon: "🏠", label: "My Listings" },
  ];
  return (
    <div
      className="fixed z-[200] overflow-hidden"
      style={{
        left: "16px",
        top: "16px",
        width: "clamp(220px, 18vw, 280px)",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        borderRadius: "20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
        border: "1px solid rgba(255,255,255,0.55)",
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60">
        <span className="text-sm font-bold text-slate-800">Habino</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Nav items */}
      <nav className="p-2 flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-slate-900 transition-all">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// ── Deterministic "rating" from property ID (avoids hydration mismatch) ───────
function pseudoRating(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return (4.5 + (h % 50) / 100).toFixed(2);
}

// ── Airbnb-style property listing card ────────────────────────────────────────
function PropertyListingCard({
  property, onSelect, highlighted,
}: {
  property: PropertyWithCoords;
  onSelect: () => void;
  highlighted: boolean;
}) {
  const img   = (property as Property & { images?: { url: string }[] }).images?.[0]?.url;
  const color = TYPE_COLORS[property.property_type] || "#6B7280";
  const label = TYPE_LABELS[property.property_type] || property.property_type;
  const isRent = property.listing_type === "rent";
  const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency", currency: property.currency, maximumFractionDigits: 0,
  }).format(property.price);
  const isResidential = ["apartment", "house", "villa"].includes(property.property_type);
  const propEmoji =
    property.property_type === "apartment" ? "🏢"
    : property.property_type === "house"     ? "🏠"
    : property.property_type === "villa"     ? "🏡"
    : property.property_type === "office"    ? "🏗️"
    : (property.property_type === "land" || property.property_type === "plot") ? "🌿"
    : property.property_type === "hall"      ? "🎪"
    : property.property_type === "production"? "🏭"
    : "🏢";
  const p = property as Property;

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer group"
      style={highlighted ? { borderRadius: 18, outline: `2px solid ${color}`, outlineOffset: 2 } : {}}
    >
      {/* ── Image ── */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-100" style={{ aspectRatio: "4/3" }}>
        {img ? (
          <Image src={img} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ background: `${color}12` }}>
            {propEmoji}
          </div>
        )}

        {/* Type badge — top left */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {label}
          </span>
        </div>

        {/* Heart — top right */}
        <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <svg className="w-5 h-5 drop-shadow" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Rent / Sale — bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: isRent ? "#F59E0B" : color }}>
            {isRent ? "For Rent" : "For Sale"}
          </span>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="mt-2.5 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
            {label} in {p.city}
          </p>
          <div className="flex items-center gap-0.5 shrink-0 mt-px">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="#1e293b">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-medium text-slate-800">{pseudoRating(p.id)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.neighbourhood}</p>

        {/* Specs: beds/baths for residential + m² for all + price/m² */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          {isResidential && p.bedrooms  > 0 && <span className="text-xs text-slate-500">{p.bedrooms} bed</span>}
          {isResidential && p.bathrooms > 0 && <span className="text-xs text-slate-400">· {p.bathrooms} bath</span>}
          {p.area_sqm && (
            <span className="text-xs font-medium text-slate-600">{isResidential ? "·" : ""} {p.area_sqm.toLocaleString()} m²</span>
          )}
          {p.area_sqm && p.area_sqm > 0 && (
            <span className="text-xs font-semibold" style={{ color }}>
              · {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(Math.round(p.price / p.area_sqm))}/m²
            </span>
          )}
        </div>

        <p className="text-sm mt-1.5 font-semibold text-slate-900">
          {priceFmt}{isRent && <span className="text-slate-400 text-xs font-normal"> / month</span>}
        </p>

        {/* Agent / broker badge */}
        {p.agent_name && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
              style={{ background: color }}>
              {p.agent_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <span className="text-[10px] text-slate-400 truncate">{p.agent_name}</span>
            <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Broker</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Deterministic city hash for simulated market data ─────────────────────────
function cityHash(s: string): number {
  let h = 5381;
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  return h;
}

// ── Market Data Dashboard ─────────────────────────────────────────────────────
function MarketDataDashboard({
  context,
  properties,
}: {
  context: { city: string; country: string; currency: string } | null;
  properties: PropertyWithCoords[];
}) {
  if (!context) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", padding: 32 }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>📊</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8, textAlign: "center" }}>Ask about a market</p>
        <p style={{ fontSize: 13, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
          Search for properties in the AI chat and the Data panel will show you market analytics for that city or neighbourhood.
        </p>
      </div>
    );
  }

  const { city, country, currency } = context;
  const h = cityHash(city + country);

  // ── Derive real stats from actual search results ──────────────────────────
  const rentProps  = properties.filter(p => p.listing_type === "rent");
  const saleProps  = properties.filter(p => p.listing_type !== "rent");
  const avgPrice   = properties.length
    ? Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length)
    : null;
  const avgRent    = rentProps.length
    ? Math.round(rentProps.reduce((s, p) => s + p.price, 0) / rentProps.length)
    : null;
  const propsWithArea = properties.filter(p => p.area_sqm && p.area_sqm > 0);
  const avgPpm = propsWithArea.length
    ? Math.round(propsWithArea.reduce((s, p) => s + p.price / p.area_sqm!, 0) / propsWithArea.length)
    : null;

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  for (const p of properties) typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1;
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxTypeCount = topTypes[0]?.[1] ?? 1;

  // ── Simulated 12-month price trend (deterministic from city hash) ─────────
  const basePrice = avgPrice ?? (50000 + (h % 200000));
  const months    = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const trend: number[] = months.map((_, i) => {
    const wave = Math.sin((i / 11) * Math.PI * 2 + (h % 100) / 50) * 0.06;
    const drift = (i / 11) * ((h % 3 === 0) ? 0.12 : -0.04);
    const noise = (((h >> i) & 0xf) / 15 - 0.5) * 0.05;
    return Math.round(basePrice * (1 + wave + drift + noise));
  });
  const tMin = Math.min(...trend) * 0.96;
  const tMax = Math.max(...trend) * 1.02;
  const tRange = tMax - tMin;

  // SVG dimensions
  const SW = 280, SH = 88, PAD_X = 8, PAD_Y = 10;
  const pts = trend.map((v, i) => {
    const x = PAD_X + (i / 11) * (SW - PAD_X * 2);
    const y = SH - PAD_Y - ((v - tMin) / tRange) * (SH - PAD_Y * 2);
    return `${x},${y}`;
  }).join(" ");

  // Fill path
  const firstPt = pts.split(" ")[0].split(",");
  const lastPt  = pts.split(" ")[11].split(",");
  const fillPath = `M ${firstPt[0]},${SH - PAD_Y} L ${pts.split(" ").map(p => p).join(" L ")} L ${lastPt[0]},${SH - PAD_Y} Z`;

  // YoY change (last vs first month)
  const yoy = ((trend[11] - trend[0]) / trend[0] * 100).toFixed(1);
  const yoyUp = parseFloat(yoy) >= 0;

  // Market sentiment (derived from hash + trend)
  const sentimentScore = (h % 5);
  const sentiments = ["Buyer's Market", "Slightly Buyer's", "Balanced", "Slightly Seller's", "Seller's Market"];
  const sentimentColors = ["#2563eb", "#0891b2", "#8b5cf6", "#d97706", "#dc2626"];
  const sentiment = sentiments[sentimentScore];
  const sentimentColor = sentimentColors[sentimentScore];

  // Days on market (simulated)
  const dom = 18 + (h % 42);

  // Format currency
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0, notation: n >= 1_000_000 ? "compact" : "standard" }).format(n);

  const CARD = { background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" };
  const LABEL = { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.06em" };
  const VALUE = { fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4, letterSpacing: "-0.02em" };
  const SUB = { fontSize: 11, color: "#64748b", marginTop: 2 };

  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: "#f8fafc" }}>
      <div style={{ padding: "20px 20px 32px" }}>

        {/* City header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>{city}</h2>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{country}</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
            Real estate market overview · {properties.length > 0 ? `${properties.length} listings analysed` : "Simulated market data"}
          </p>
        </div>

        {/* ── Key metric cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={CARD}>
            <div style={LABEL}>Avg. Price</div>
            <div style={VALUE}>{avgPrice ? fmt(avgPrice) : fmt(basePrice)}</div>
            <div style={SUB}>{saleProps.length > 0 ? `${saleProps.length} for sale` : "for sale"}</div>
          </div>
          <div style={CARD}>
            <div style={LABEL}>Avg. Rent / mo</div>
            <div style={VALUE}>{avgRent ? fmt(avgRent) : fmt(Math.round(basePrice * 0.005))}</div>
            <div style={SUB}>{rentProps.length > 0 ? `${rentProps.length} rentals` : "rentals"}</div>
          </div>
          <div style={CARD}>
            <div style={LABEL}>Price / m²</div>
            <div style={VALUE}>{avgPpm ? fmt(avgPpm) : fmt(Math.round(basePrice / (40 + h % 60)))}</div>
            <div style={SUB}>{propsWithArea.length > 0 ? `from ${propsWithArea.length} listings` : "estimated"}</div>
          </div>
          <div style={CARD}>
            <div style={LABEL}>Days on Market</div>
            <div style={VALUE}>{dom}</div>
            <div style={SUB}>avg. time to close</div>
          </div>
        </div>

        {/* ── Price trend chart ── */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={LABEL}>12-Month Price Trend</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: yoyUp ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                {yoyUp ? "▲" : "▼"} {Math.abs(parseFloat(yoy))}% YoY
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Peak</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{fmt(Math.max(...trend))}</div>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${SW} ${SH}`} style={{ display: "block" }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={yoyUp ? "#16a34a" : "#dc2626"} stopOpacity="0.15" />
                <stop offset="100%" stopColor={yoyUp ? "#16a34a" : "#dc2626"} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Fill area */}
            <path d={fillPath} fill="url(#trendGrad)" />
            {/* Line */}
            <polyline
              points={pts}
              fill="none"
              stroke={yoyUp ? "#16a34a" : "#dc2626"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Month labels */}
            {months.map((m, i) => (
              <text key={m + i} x={PAD_X + (i / 11) * (SW - PAD_X * 2)} y={SH - 1} textAnchor="middle" fontSize="7" fill="#94a3b8">{m}</text>
            ))}
          </svg>
        </div>

        {/* ── Property type breakdown ── */}
        {topTypes.length > 0 && (
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ ...LABEL, marginBottom: 12 }}>Property Types</div>
            {topTypes.map(([type, count]) => {
              const color = TYPE_COLORS[type] || "#6B7280";
              const label = TYPE_LABELS[type] || type;
              const pct   = Math.round((count / properties.length) * 100);
              return (
                <div key={type} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / maxTypeCount) * 100}%`, background: color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Rent vs Sale split ── */}
        {(rentProps.length > 0 || saleProps.length > 0) && (
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ ...LABEL, marginBottom: 12 }}>Listing Type Split</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "For Rent", count: rentProps.length, color: "#2563eb" },
                { label: "For Sale", count: saleProps.length, color: "#2E7D46" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Market health ── */}
        <div style={CARD}>
          <div style={{ ...LABEL, marginBottom: 12 }}>Market Health</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
              background: `${sentimentColor}18`, border: `2px solid ${sentimentColor}40`,
              fontSize: 20,
            }}>
              {sentimentScore <= 1 ? "🐂" : sentimentScore === 2 ? "⚖️" : sentimentScore === 3 ? "🔥" : "🚀"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: sentimentColor }}>{sentiment}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {sentimentScore <= 1 ? "More supply than demand — good time to buy." : sentimentScore === 2 ? "Supply and demand are roughly balanced." : "High demand, low supply — competitive market."}
              </div>
            </div>
          </div>
          {/* Sentiment bar */}
          <div style={{ marginTop: 12, height: 6, borderRadius: 99, background: "linear-gradient(to right, #2563eb, #8b5cf6, #dc2626)", position: "relative" }}>
            <div style={{
              position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
              left: `${(sentimentScore / 4) * 100}%`,
              width: 12, height: 12, borderRadius: 99, background: "white",
              border: `2.5px solid ${sentimentColor}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: "#2563eb", fontWeight: 600 }}>BUYER'S</span>
            <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 600 }}>SELLER'S</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Rotating market ticker for Map+Data combined view ─────────────────────────
function MarketTicker({ properties, context }: {
  properties: PropertyWithCoords[];
  context: { city: string; country: string; currency: string } | null;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  if (!context || properties.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 12 }}>
        Search for properties to see market stats
      </div>
    );
  }

  const { city, currency } = context;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const propsWithArea = properties.filter(p => p.area_sqm && p.area_sqm > 0);
  const avgPricePerM2 = propsWithArea.length > 0
    ? Math.round(propsWithArea.reduce((s, p) => s + p.price / p.area_sqm!, 0) / propsWithArea.length) : 0;
  const avgPrice = Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length);
  const minPrice = Math.min(...properties.map(p => p.price));
  const maxPrice = Math.max(...properties.map(p => p.price));
  const rentCount = properties.filter(p => p.listing_type === "rent").length;
  const buyCount  = properties.filter(p => p.listing_type === "buy").length;
  const avgArea   = propsWithArea.length > 0
    ? Math.round(propsWithArea.reduce((s, p) => s + p.area_sqm!, 0) / propsWithArea.length) : 0;

  const stats = [
    { label: "Ø Price/m²", value: avgPricePerM2 > 0 ? fmt(avgPricePerM2) : "—", sub: city, icon: "📐" },
    { label: "Average Price", value: fmt(avgPrice), sub: `${properties.length} listings`, icon: "💰" },
    { label: "Price Range", value: `${fmt(minPrice)} – ${fmt(maxPrice)}`, sub: city, icon: "📊" },
    { label: "Ø Area", value: avgArea > 0 ? `${avgArea.toLocaleString()} m²` : "—", sub: "per listing", icon: "📏" },
    { label: "For Rent", value: String(rentCount), sub: `${buyCount} for sale`, icon: "🏠" },
  ].filter(s => s.value !== "—");

  const stat = stats[tick % stats.length];

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "white" }}>
      <div style={{ textAlign: "center", transition: "opacity .4s" }}>
        <div style={{ fontSize: 22, marginBottom: 2 }}>{stat.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{stat.label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{stat.value}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{stat.sub}</div>
      </div>
      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
        {stats.map((_, i) => (
          <div key={i} style={{ width: 4, height: 4, borderRadius: 99, background: i === tick % stats.length ? "#0f172a" : "#e2e8f0", transition: "background .4s" }} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MapHomePage() {
  const [properties,     setProperties]     = useState<PropertyWithCoords[]>([]);
  const [selected,       setSelected]       = useState<PropertyWithCoords | null>(null);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [habinoOpen,     setHabinoOpen]     = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [outputMode,     setOutputMode]     = useState<"idle" | "listings" | "map">("idle");
  const [marketContext,  setMarketContext]  = useState<{ city: string; country: string; currency: string } | null>(null);
  const [mapCenter,      setMapCenter]      = useState<[number, number]>([20, 10]);
  const [mapZoom,        setMapZoom]        = useState(12);

  // Called by AIChatPage when Claude returns matching properties
  const handlePropertiesFound = useCallback((ids: string[], props?: Property[]) => {
    setHighlightedIds(ids);
    if (props && props.length > 0) {
      const withC = withCoords(props, []);
      setProperties(withC);
      const first = props[0];
      if (first) {
        setMarketContext({
          city: first.city || "Unknown",
          country: (first as Property & { country?: string }).country || "",
          currency: first.currency || "USD",
        });
      }
      const withLatLng = props.filter(p => p.lat != null && p.lng != null);
      if (withLatLng.length > 0) {
        const avgLat = withLatLng.reduce((s, p) => s + p.lat!, 0) / withLatLng.length;
        const avgLng = withLatLng.reduce((s, p) => s + p.lng!, 0) / withLatLng.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
      }
    }
  }, []);

  // Called by AIChatPage to auto-switch the output panel
  // "data" maps to "map" since the combined Map+Data tab handles both
  const handleViewSuggested = useCallback((view: "listings" | "map" | "data") => {
    setOutputMode(view === "data" ? "map" : view);
  }, []);

  // ── Shared style constants ────────────────────────────────────────────────
  const HEADER_H = 56;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ── Mode label for right panel header ────────────────────────────────────
  const MODE_META = {
    idle:     { label: "Results",      icon: "✦" },
    listings: { label: properties.length > 0 ? `${properties.length} Listings` : "Listings", icon: "⊞" },
    map:      { label: marketContext ? `Map · ${marketContext.city}` : "Map & Data", icon: "🗺" },
  };

  // ── Subtle mode-switch pills ──────────────────────────────────────────────
  function ModePill({ mode, label }: { mode: "listings" | "map"; label: string }) {
    const active = outputMode === mode;
    return (
      <button onClick={() => setOutputMode(mode)} style={{
        padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
        border: `1px solid ${active ? "#0f172a" : "#e2e8f0"}`,
        background: active ? "#0f172a" : "transparent",
        color: active ? "white" : "#94a3b8",
        cursor: "pointer", transition: "all .12s",
      }}>{label}</button>
    );
  }

  // ── MOBILE: full-screen chat overlay ─────────────────────────────────────
  if (isMobile && chatOpen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setChatOpen(false)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
            ← Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>AI Search</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <AIChatPage sidebarMode onPropertiesFound={handlePropertiesFound} onViewSuggested={handleViewSuggested} />
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP: 50 / 50 split ────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, display: "flex", background: "white" }}>

      {/* ═══════════════════════════════════════════════════
          LEFT — AI Chat (50 %)
      ═══════════════════════════════════════════════════ */}
      <div style={{
        width: isMobile ? "100%" : "50%",
        height: "100%",
        display: isMobile ? "none" : "flex",
        flexDirection: "column",
        borderRight: "1px solid #e2e8f0",
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
          <Link href="/" style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", textDecoration: "none" }}>habino</Link>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setHabinoOpen(o => !o)}
            style={{
              padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              color: "white", border: "none", cursor: "pointer",
              backgroundColor: habinoOpen ? "var(--color-secondary)" : "var(--color-primary)",
            }}>
            ☰ Menu
          </button>
        </div>
        {/* Chat */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <AIChatPage sidebarMode onPropertiesFound={handlePropertiesFound} onViewSuggested={handleViewSuggested} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT — Dynamic Output Panel (50 %)
      ═══════════════════════════════════════════════════ */}
      <div style={{ width: isMobile ? "100%" : "50%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Header */}
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 8, flexShrink: 0, position: "relative", zIndex: 10, background: "white" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {MODE_META[outputMode].icon} {MODE_META[outputMode].label}
          </span>
          <div style={{ flex: 1 }} />
          {outputMode !== "idle" && (
            <div style={{ display: "flex", gap: 4 }}>
              <ModePill mode="listings" label="Listings" />
              <ModePill mode="map"      label="Map & Data" />
            </div>
          )}
          {outputMode === "idle" && (
            <span style={{ fontSize: 11, color: "#cbd5e1" }}>Ask the AI to search</span>
          )}
        </div>

        {/* Content area — position: relative so PropertyDetailPanel can be contained */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {/* IDLE STATE */}
          {outputMode === "idle" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>✦</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Your results appear here</p>
              <p style={{ fontSize: 13, textAlign: "center", lineHeight: 1.7, maxWidth: 300 }}>
                Ask the AI on the left to search for properties or find the location of a listing.
              </p>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 280 }}>
                {[
                  "Find 2-bed apartments for rent in Munich",
                  "Show me offices in Nairobi under 300,000 KES",
                  "Land for sale over 5,000 m²",
                ].map(ex => (
                  <div key={ex} style={{ padding: "10px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                    &ldquo;{ex}&rdquo;
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAP + DATA combined (always in DOM so Leaflet stays alive) ── */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            visibility: outputMode === "map" ? "visible" : "hidden",
            pointerEvents: outputMode === "map" ? "auto" : "none",
          }}>
            {/* Map — top 65% */}
            <div style={{ flex: "0 0 65%", position: "relative" }}>
              <LeafletMap
                center={mapCenter}
                zoom={mapZoom}
                properties={properties}
                selectedId={selected?.id ?? null}
                highlightedIds={highlightedIds}
                onSelect={(p) => { setSelected(p); setMapCenter([p.lat, p.lng]); setMapZoom(15); }}
                onBoundsChange={() => {}}
                cityClusters={[]}
                currentZoom={mapZoom}
                onCityClick={() => {}}
              />
            </div>
            {/* Divider */}
            <div style={{ height: 1, background: "#e2e8f0", flexShrink: 0 }} />
            {/* Rotating stats — bottom 35% */}
            <div style={{ flex: "0 0 35%", position: "relative", overflow: "hidden" }}>
              <MarketTicker properties={properties} context={marketContext} />
            </div>
          </div>

          {/* LISTINGS */}
          <div style={{
            position: "absolute", inset: 0, overflowY: "auto", background: "white",
            visibility: outputMode === "listings" ? "visible" : "hidden",
            pointerEvents: outputMode === "listings" ? "auto" : "none",
          }}>
            <div style={{ padding: 20 }}>
              {properties.length > 0 && (
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{properties.length} results</span>
                  {marketContext && <span style={{ fontSize: 12, color: "#94a3b8" }}>in {marketContext.city}</span>}
                  {marketContext && (
                    <button onClick={() => setOutputMode("map")} style={{
                      marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#8b5cf6",
                      background: "#f5f3ff", border: "none", borderRadius: 8,
                      padding: "4px 10px", cursor: "pointer",
                    }}>
                      🗺 Map & Data →
                    </button>
                  )}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {properties.map(p => (
                  <PropertyListingCard
                    key={p.id}
                    property={p}
                    highlighted={highlightedIds.includes(p.id)}
                    onSelect={() => {
                      setSelected(p);
                      setMapCenter([p.lat, p.lng]);
                      setMapZoom(15);
                      setOutputMode("map");
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PropertyDetailPanel — contained within right panel (no full-screen takeover) */}
          {selected && (
            <>
              {/* Backdrop — only covers right panel content area */}
              <div style={{ position: "absolute", inset: 0, zIndex: 40 }} onClick={() => setSelected(null)} />
              {/* Panel card — centered in this area */}
              <div style={{
                position: "absolute", inset: 0, zIndex: 41,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{
                  pointerEvents: "auto",
                  width: "clamp(300px, 80%, 440px)",
                  maxHeight: "90%",
                  background: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: 20,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  <PropertyDetailPanel property={selected} onClose={() => setSelected(null)} />
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* MOBILE — floating AI button */}
      {isMobile && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed", bottom: 72, right: 16, zIndex: 100,
            width: 48, height: 48, borderRadius: 14,
            background: "var(--color-primary)", color: "white",
            border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>
          AI
        </button>
      )}

      {/* Habino menu panel */}
      {habinoOpen && <HabinoPanel onClose={() => setHabinoOpen(false)} />}
    </div>
  );
}
