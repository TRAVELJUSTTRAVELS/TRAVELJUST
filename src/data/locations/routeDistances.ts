export interface RouteCalculationResult {
  distanceKm: number;
  durationText: string;
  durationMinutes: number;
  routeSummary: string;
  highwayCorridor: string;
  tollEstimate: number;
  recommendedService: 'local' | 'outstation' | 'airport_transfer';
}

// Highly accurate, calibrated driving distance matrix for South Indian corridors
export const ROUTE_MATRIX: Record<string, { distanceKm: number; durationMinutes: number; highway: string; toll: number }> = {
  // Mysuru - Airport corridors
  'mysuru-kial_t1': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysuru-kial_t2': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysuru_palace-kempegowda_international_airport': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'kempegowda_international_airport-mysuru_palace': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysore_palace-kempegowda_international_airport': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'kempegowda_international_airport-mysore_palace': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysuru_palace-kial': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'kial-mysuru_palace': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysore_palace-kial': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'kial-mysore_palace': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysuru_palace-kempegowda': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'kempegowda-mysuru_palace': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysore_palace-kempegowda': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'kempegowda-mysore_palace': { distanceKm: 170.0, durationMinutes: 210, highway: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor', toll: 320 },
  'mysuru-mys_airport': { distanceKm: 12.5, durationMinutes: 22, highway: 'NH 766 Kozhikode-Kollegal Highway', toll: 0 },
  'mysuru-mangalore_airport': { distanceKm: 255.0, durationMinutes: 330, highway: 'NH 275 via Madikeri-Mani Ghats', toll: 110 },
  'mysuru-coimbatore_airport': { distanceKm: 200.0, durationMinutes: 270, highway: 'NH 766 & NH 948 via Gundlupet-Sathyamangalam Ghats', toll: 85 },
  'mysuru-calicut_airport': { distanceKm: 210.0, durationMinutes: 295, highway: 'NH 766 via Gundlupet-Sulthan Bathery-Thamarassery Ghat', toll: 60 },
  'mysuru-kannur_airport': { distanceKm: 165.0, durationMinutes: 225, highway: 'SH 88 & Thalassery Highway via Gonikoppal-Mattannur', toll: 40 },
  'mysuru-chennai_airport': { distanceKm: 490.0, durationMinutes: 510, highway: 'NH 275 + NH 48 Expressway via Vellore-Kanchipuram', toll: 580 },

  // Mysuru - Bengaluru & Expressway Corridor (Direct & Reverse)
  'mysuru-bengaluru': { distanceKm: 142.0, durationMinutes: 135, highway: 'NH 275 10-Lane Mysore-Bengaluru Expressway', toll: 320 },
  'bengaluru-mysuru': { distanceKm: 142.0, durationMinutes: 135, highway: 'NH 275 10-Lane Mysore-Bengaluru Expressway', toll: 320 },
  'mysore-bangalore': { distanceKm: 142.0, durationMinutes: 135, highway: 'NH 275 10-Lane Mysore-Bengaluru Expressway', toll: 320 },
  'bangalore-mysore': { distanceKm: 142.0, durationMinutes: 135, highway: 'NH 275 10-Lane Mysore-Bengaluru Expressway', toll: 320 },
  'mysuru-srirangapatna': { distanceKm: 15.0, durationMinutes: 20, highway: 'NH 275 Expressway Entry Corridor', toll: 0 },
  'srirangapatna-mysuru': { distanceKm: 15.0, durationMinutes: 20, highway: 'NH 275 Expressway Entry Corridor', toll: 0 },
  
  // Mandya Corridor (42 km, 35 min)
  'mysuru-mandya': { distanceKm: 42.0, durationMinutes: 35, highway: 'NH 275 10-Lane Expressway via Srirangapatna Bypass', toll: 165 },
  'mysore-mandya': { distanceKm: 42.0, durationMinutes: 35, highway: 'NH 275 10-Lane Expressway via Srirangapatna Bypass', toll: 165 },
  'mandya-mysuru': { distanceKm: 42.0, durationMinutes: 35, highway: 'NH 275 10-Lane Mysore-Bengaluru Expressway', toll: 165 },
  'mandya-mysore': { distanceKm: 42.0, durationMinutes: 35, highway: 'NH 275 10-Lane Mysore-Bengaluru Expressway', toll: 165 },
  
  // Maddur Corridor (60 km, 50 min)
  'mysuru-maddur': { distanceKm: 60.0, durationMinutes: 50, highway: 'NH 275 Expressway via Mandya Elevated Bypass & Shimsha River', toll: 165 },
  'mysore-maddur': { distanceKm: 60.0, durationMinutes: 50, highway: 'NH 275 Expressway via Mandya Elevated Bypass & Shimsha River', toll: 165 },
  'maddur-mysuru': { distanceKm: 60.0, durationMinutes: 50, highway: 'NH 275 10-Lane Expressway via Mandya to Mysuru', toll: 165 },
  'maddur-mysore': { distanceKm: 60.0, durationMinutes: 50, highway: 'NH 275 10-Lane Expressway via Mandya to Mysuru', toll: 165 },

  // Nidaghatta Toll Plaza Corridor (68 km, 55 min)
  'mysuru-nidaghatta': { distanceKm: 68.0, durationMinutes: 55, highway: 'NH 275 Expressway via Mandya & Maddur Bypass to Nidaghatta Toll Plaza', toll: 165 },
  'mysore-nidaghatta': { distanceKm: 68.0, durationMinutes: 55, highway: 'NH 275 Expressway via Mandya & Maddur Bypass to Nidaghatta Toll Plaza', toll: 165 },
  'nidaghatta-mysuru': { distanceKm: 68.0, durationMinutes: 55, highway: 'NH 275 10-Lane Expressway from Nidaghatta Toll Plaza to Mysuru', toll: 165 },
  'nidaghatta-mysore': { distanceKm: 68.0, durationMinutes: 55, highway: 'NH 275 10-Lane Expressway from Nidaghatta Toll Plaza to Mysuru', toll: 165 },

  // Channapatna Corridor (78 km, 65 min)
  'mysuru-channapatna': { distanceKm: 78.0, durationMinutes: 65, highway: 'NH 275 10-Lane Expressway via Mandya-Maddur-Nidaghatta to Toy City Exit', toll: 320 },
  'mysore-channapatna': { distanceKm: 78.0, durationMinutes: 65, highway: 'NH 275 10-Lane Expressway via Mandya-Maddur-Nidaghatta to Toy City Exit', toll: 320 },
  'mysuru-channapattana': { distanceKm: 78.0, durationMinutes: 65, highway: 'NH 275 10-Lane Expressway to Channapattana Gombegala Ooru', toll: 320 },
  'channapatna-mysuru': { distanceKm: 78.0, durationMinutes: 65, highway: 'NH 275 10-Lane Expressway via Maddur & Mandya to Mysuru', toll: 320 },
  'channapatna-mysore': { distanceKm: 78.0, durationMinutes: 65, highway: 'NH 275 10-Lane Expressway via Maddur & Mandya to Mysuru', toll: 320 },
  'channapattana-mysuru': { distanceKm: 78.0, durationMinutes: 65, highway: 'NH 275 10-Lane Expressway via Maddur & Mandya to Mysuru', toll: 320 },

  // Ramanagara Corridor (95 km, 80 min)
  'mysuru-ramanagara': { distanceKm: 95.0, durationMinutes: 80, highway: 'NH 275 10-Lane Expressway via Mandya-Maddur-Channapatna to Silk City', toll: 320 },
  'mysore-ramanagara': { distanceKm: 95.0, durationMinutes: 80, highway: 'NH 275 10-Lane Expressway via Mandya-Maddur-Channapatna to Silk City', toll: 320 },
  'mysuru-ramnagar': { distanceKm: 95.0, durationMinutes: 80, highway: 'NH 275 10-Lane Expressway to Ramnagar / Sholay Hills', toll: 320 },
  'ramanagara-mysuru': { distanceKm: 95.0, durationMinutes: 80, highway: 'NH 275 10-Lane Expressway via Channapatna-Maddur-Mandya to Mysuru', toll: 320 },
  'ramanagara-mysore': { distanceKm: 95.0, durationMinutes: 80, highway: 'NH 275 10-Lane Expressway via Channapatna-Maddur-Mandya to Mysuru', toll: 320 },
  'ramnagar-mysuru': { distanceKm: 95.0, durationMinutes: 80, highway: 'NH 275 10-Lane Expressway from Ramnagar to Mysuru', toll: 320 },

  // Bidadi Corridor (112 km, 95 min)
  'mysuru-bidadi': { distanceKm: 112.0, durationMinutes: 95, highway: 'NH 275 10-Lane Expressway via Ramanagara Bypass to Bidadi KIADB / Wonderla', toll: 320 },
  'mysore-bidadi': { distanceKm: 112.0, durationMinutes: 95, highway: 'NH 275 10-Lane Expressway via Ramanagara Bypass to Bidadi KIADB / Wonderla', toll: 320 },
  'mysuru-bidai': { distanceKm: 112.0, durationMinutes: 95, highway: 'NH 275 10-Lane Expressway to Bidai / Bidadi Tatte Idli Hub', toll: 320 },
  'bidadi-mysuru': { distanceKm: 112.0, durationMinutes: 95, highway: 'NH 275 10-Lane Expressway via Ramanagara & Mandya to Mysuru', toll: 320 },
  'bidadi-mysore': { distanceKm: 112.0, durationMinutes: 95, highway: 'NH 275 10-Lane Expressway via Ramanagara & Mandya to Mysuru', toll: 320 },
  'bidai-mysuru': { distanceKm: 112.0, durationMinutes: 95, highway: 'NH 275 10-Lane Expressway from Bidai to Mysuru', toll: 320 },

  // Kengeri Corridor (128-130 km, 110-115 min)
  'mysuru-kengeri': { distanceKm: 128.0, durationMinutes: 110, highway: 'NH 275 10-Lane Expressway to Kengeri Satellite Town & NICE Road Junction', toll: 320 },
  'mysore-kengeri': { distanceKm: 128.0, durationMinutes: 110, highway: 'NH 275 10-Lane Expressway to Kengeri Satellite Town & NICE Road Junction', toll: 320 },
  'kengeri-mysuru': { distanceKm: 128.0, durationMinutes: 110, highway: 'NH 275 10-Lane Expressway Direct Entry at Kengeri to Mysuru', toll: 320 },
  'kengeri-mysore': { distanceKm: 128.0, durationMinutes: 110, highway: 'NH 275 10-Lane Expressway Direct Entry at Kengeri to Mysuru', toll: 320 },

  // Bengaluru Metro Corridors
  'mysuru-electronic_city': { distanceKm: 135.0, durationMinutes: 125, highway: 'NH 275 Expressway + NICE Ring Road (Exit Electronic City)', toll: 460 },
  'mysuru-hsr_layout': { distanceKm: 146.0, durationMinutes: 145, highway: 'NH 275 Expressway + NICE Road / Hosur Road Link', toll: 460 },
  'mysuru-btm_layout': { distanceKm: 142.0, durationMinutes: 140, highway: 'NH 275 Expressway + Bannerghatta / Silk Board Link', toll: 320 },
  'mysuru-jayanagar': { distanceKm: 140.0, durationMinutes: 135, highway: 'NH 275 Expressway + Kanakapura Rd / South End', toll: 320 },
  'mysuru-jp_nagar': { distanceKm: 138.0, durationMinutes: 130, highway: 'NH 275 Expressway + NICE Road / Kanakapura Rd', toll: 390 },
  'mysuru-banashankari': { distanceKm: 135.0, durationMinutes: 125, highway: 'NH 275 Expressway Direct Exit', toll: 320 },
  'mysuru-rajajinagar': { distanceKm: 144.0, durationMinutes: 138, highway: 'NH 275 Expressway + Chord Road Corridor', toll: 320 },
  'mysuru-malleshwaram': { distanceKm: 146.0, durationMinutes: 140, highway: 'NH 275 Expressway + Outer Ring Road West', toll: 320 },
  'mysuru-koramangala': { distanceKm: 145.0, durationMinutes: 145, highway: 'NH 275 Expressway + Dairy Circle Corridor', toll: 320 },
  'mysuru-indiranagar': { distanceKm: 152.0, durationMinutes: 155, highway: 'NH 275 Expressway + Intermediate Ring Road', toll: 320 },
  'mysuru-whitefield': { distanceKm: 168.0, durationMinutes: 170, highway: 'NH 275 Expressway + NICE Road & Old Madras Road', toll: 480 },
  'mysuru-bellandur': { distanceKm: 152.0, durationMinutes: 155, highway: 'NH 275 Expressway + Outer Ring Road East', toll: 460 },
  'mysuru-manyata': { distanceKm: 160.0, durationMinutes: 160, highway: 'NH 275 Expressway + Outer Ring Road North / Hebbal', toll: 320 },
  'mysuru-yelahanka': { distanceKm: 165.0, durationMinutes: 165, highway: 'NH 275 Expressway + Outer Ring Road / Airport Rd', toll: 320 },
  'mysuru-rr_nagar': { distanceKm: 130.0, durationMinutes: 115, highway: 'NH 275 Expressway + Mysore Road Corridor', toll: 320 },
  'mysuru-majestic': { distanceKm: 142.0, durationMinutes: 135, highway: 'NH 275 10-Lane Expressway + Mysore Road Flyover', toll: 320 },
  'mysuru-mg_road': { distanceKm: 148.0, durationMinutes: 145, highway: 'NH 275 Expressway + CBD Central Corridor', toll: 320 },

  // Mysuru Taluks & Surrounding Regions
  'mysuru-nanjangud': { distanceKm: 24.0, durationMinutes: 32, highway: 'NH 766 Kozhikode-Kollegal Highway (4-Lane)', toll: 0 },
  'mysuru-t_narasipura': { distanceKm: 32.0, durationMinutes: 42, highway: 'SH 84 T. Narasipura Road', toll: 0 },
  'mysuru-somnathpur': { distanceKm: 35.0, durationMinutes: 45, highway: 'Bannur - Somnathpur State Highway', toll: 0 },
  'mysuru-talakadu': { distanceKm: 48.0, durationMinutes: 68, highway: 'SH 84 & Talakadu River Road', toll: 0 },
  'mysuru-piriyapatna': { distanceKm: 70.0, durationMinutes: 85, highway: 'NH 275 Coorg Highway', toll: 0 },
  'mysuru-kr_nagar': { distanceKm: 42.0, durationMinutes: 50, highway: 'SH 86 K.R. Nagar Highway via Bilikere / Elivala', toll: 0 },
  'mysuru-chunchanakatte': { distanceKm: 55.0, durationMinutes: 70, highway: 'SH 86 via K.R. Nagar', toll: 0 },
  'mysuru-saligrama': { distanceKm: 52.0, durationMinutes: 68, highway: 'SH 86 & Saligrama Link', toll: 0 },
  'mysuru-hd_kote': { distanceKm: 50.0, durationMinutes: 65, highway: 'SH 33 H.D. Kote - Mananthavady Road', toll: 0 },
  'mysuru-kabini': { distanceKm: 62.0, durationMinutes: 85, highway: 'SH 33 via Antharasanthe & Karapura', toll: 0 },
  'mysuru-saragur': { distanceKm: 58.0, durationMinutes: 75, highway: 'SH 33 / Begur Link', toll: 0 },
  'mysuru-nugu_dam': { distanceKm: 65.0, durationMinutes: 85, highway: 'Saragur - Beerwal Dam Road', toll: 0 },

  // Mandya & Chamarajanagar Taluks
  'mysuru-melukote': { distanceKm: 52.0, durationMinutes: 65, highway: 'SH 19 & Pandavapura - Melukote Rd', toll: 0 },
  'mysuru-krs_dam': { distanceKm: 18.0, durationMinutes: 25, highway: 'KRS Road via Metagalli & Belagola', toll: 0 },
  'mysuru-ranganathittu': { distanceKm: 16.0, durationMinutes: 22, highway: 'Bangalore Highway & Palahalli Link', toll: 0 },
  'mysuru-shivanasamudra': { distanceKm: 72.0, durationMinutes: 95, highway: 'SH 33 via Bannur & Malavalli', toll: 0 },
  'mysuru-adichunchanagiri': { distanceKm: 105.0, durationMinutes: 120, highway: 'NH 75 via Pandavapura - Bellur Cross', toll: 65 },
  'mysuru-chamarajanagar': { distanceKm: 60.0, durationMinutes: 75, highway: 'NH 766 via Nanjangud & Santhemarahalli', toll: 0 },
  'mysuru-gundlupet': { distanceKm: 60.0, durationMinutes: 70, highway: 'NH 766 4-Lane Highway via Nanjangud', toll: 0 },
  'mysuru-bandipur': { distanceKm: 78.0, durationMinutes: 95, highway: 'NH 766 Nilgiris Corridor via Gundlupet', toll: 0 },
  'mysuru-gopalaswamy_betta': { distanceKm: 75.0, durationMinutes: 105, highway: 'NH 766 via Gundlupet & Hangala', toll: 0 },
  'mysuru-br_hills': { distanceKm: 85.0, durationMinutes: 120, highway: 'SH 84 / Chamarajanagar - Yelandur Route', toll: 0 },
  'mysuru-kollegal': { distanceKm: 65.0, durationMinutes: 85, highway: 'NH 209 / SH 33 via T. Narasipura', toll: 0 },
  'mysuru-mm_hills': { distanceKm: 135.0, durationMinutes: 195, highway: 'NH 948 via Kollegal & Hanur Ghats', toll: 0 },

  // Coorg, Madikeri, Kushalnagar, Hunsur Corridors (Direct & Reverse)
  'mysuru-coorg': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Hunsur-Piriyapatna-Bylakuppe-Kushalnagar-Suntikoppa to Madikeri', toll: 0 },
  'mysore-coorg': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Hunsur-Piriyapatna-Bylakuppe-Kushalnagar-Suntikoppa to Madikeri', toll: 0 },
  'coorg-mysuru': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Suntikoppa-Kushalnagar-Bylakuppe-Piriyapatna-Hunsur to Mysuru', toll: 0 },
  'coorg-mysore': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Suntikoppa-Kushalnagar-Bylakuppe-Piriyapatna-Hunsur to Mysuru', toll: 0 },

  'mysuru-madikeri': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Hunsur-Piriyapatna-Bylakuppe-Kushalnagar-Suntikoppa to Madikeri', toll: 0 },
  'mysore-madikeri': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Hunsur-Piriyapatna-Bylakuppe-Kushalnagar-Suntikoppa to Madikeri', toll: 0 },
  'madikeri-mysuru': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Suntikoppa-Kushalnagar-Piriyapatna-Hunsur to Mysuru', toll: 0 },
  'madikeri-mysore': { distanceKm: 118.0, durationMinutes: 155, highway: 'NH 275 via Suntikoppa-Kushalnagar-Piriyapatna-Hunsur to Mysuru', toll: 0 },

  'mysuru-kushalnagar': { distanceKm: 88.0, durationMinutes: 105, highway: 'NH 275 4-Lane via Hunsur & Piriyapatna to Kushalnagar Gateway', toll: 0 },
  'mysore-kushalnagar': { distanceKm: 88.0, durationMinutes: 105, highway: 'NH 275 4-Lane via Hunsur & Piriyapatna to Kushalnagar Gateway', toll: 0 },
  'kushalnagar-mysuru': { distanceKm: 88.0, durationMinutes: 105, highway: 'NH 275 4-Lane via Piriyapatna & Hunsur to Mysuru', toll: 0 },
  'kushalnagar-mysore': { distanceKm: 88.0, durationMinutes: 105, highway: 'NH 275 4-Lane via Piriyapatna & Hunsur to Mysuru', toll: 0 },

  'mysuru-hunsur': { distanceKm: 45.0, durationMinutes: 48, highway: 'NH 275 4-Lane Coorg Highway via Yelwal & Bilikere', toll: 0 },
  'mysore-hunsur': { distanceKm: 45.0, durationMinutes: 48, highway: 'NH 275 4-Lane Coorg Highway via Yelwal & Bilikere', toll: 0 },
  'hunsur-mysuru': { distanceKm: 45.0, durationMinutes: 48, highway: 'NH 275 4-Lane Highway via Bilikere & Yelwal to Mysuru', toll: 0 },
  'hunsur-mysore': { distanceKm: 45.0, durationMinutes: 48, highway: 'NH 275 4-Lane Highway via Bilikere & Yelwal to Mysuru', toll: 0 },

  'mysuru-bylakuppe': { distanceKm: 85.0, durationMinutes: 100, highway: 'NH 275 via Hunsur & Piriyapatna to Namdroling Monastery / Golden Temple', toll: 0 },
  'bylakuppe-mysuru': { distanceKm: 85.0, durationMinutes: 100, highway: 'NH 275 via Piriyapatna & Hunsur to Mysuru', toll: 0 },
  'mysuru-dubare': { distanceKm: 98.0, durationMinutes: 125, highway: 'NH 275 via Kushalnagar & Nanjarayapatna River Crossing', toll: 0 },
  'dubare-mysuru': { distanceKm: 98.0, durationMinutes: 125, highway: 'NH 275 via Nanjarayapatna & Kushalnagar to Mysuru', toll: 0 },
  'mysuru-mandalpatti': { distanceKm: 135.0, durationMinutes: 195, highway: 'NH 275 & Madikeri Galibeedu 4x4 Jeep Trail', toll: 0 },
  'mandalpatti-mysuru': { distanceKm: 135.0, durationMinutes: 195, highway: 'Galibeedu 4x4 Trail & NH 275 to Mysuru', toll: 0 },
  'mysuru-talakaveri': { distanceKm: 155.0, durationMinutes: 220, highway: 'NH 275 & Madikeri-Bhagamandala Brahmagiri Ghat Rd', toll: 0 },
  'talakaveri-mysuru': { distanceKm: 155.0, durationMinutes: 220, highway: 'Bhagamandala Ghat & NH 275 to Mysuru', toll: 0 },
  'mysuru-virajpet': { distanceKm: 105.0, durationMinutes: 145, highway: 'SH 88 via Hunsur, Anechowkur & Gonikoppal', toll: 0 },
  'virajpet-mysuru': { distanceKm: 105.0, durationMinutes: 145, highway: 'SH 88 via Gonikoppal & Hunsur to Mysuru', toll: 0 },

  // Hassan, Belur, Halebidu & Sakleshpur Corridors (Direct & Reverse)
  'mysuru-hassan': { distanceKm: 115.0, durationMinutes: 135, highway: 'SH 86 via Yelwal-Bilikere-K.R. Nagar-Bherya-Holenarasipura to Hassan', toll: 0 },
  'mysore-hassan': { distanceKm: 115.0, durationMinutes: 135, highway: 'SH 86 via Yelwal-Bilikere-K.R. Nagar-Bherya-Holenarasipura to Hassan', toll: 0 },
  'hassan-mysuru': { distanceKm: 115.0, durationMinutes: 135, highway: 'SH 86 via Holenarasipura-K.R. Nagar-Bilikere to Mysuru', toll: 0 },
  'hassan-mysore': { distanceKm: 115.0, durationMinutes: 135, highway: 'SH 86 via Holenarasipura-K.R. Nagar-Bilikere to Mysuru', toll: 0 },

  'mysuru-belur': { distanceKm: 148.0, durationMinutes: 175, highway: 'SH 86 & NH 373 via Holenarasipura-Hassan to UNESCO Belur Chennakeshava', toll: 0 },
  'belur-mysuru': { distanceKm: 148.0, durationMinutes: 175, highway: 'NH 373 & SH 86 via Hassan-Holenarasipura to Mysuru', toll: 0 },
  'mysuru-halebidu': { distanceKm: 142.0, durationMinutes: 165, highway: 'SH 86 & Hagare Link via Hassan to UNESCO Halebidu Hoysaleshwara', toll: 0 },
  'halebidu-mysuru': { distanceKm: 142.0, durationMinutes: 165, highway: 'Hagare Link & SH 86 via Hassan to Mysuru', toll: 0 },
  'mysuru-shravanabelagola': { distanceKm: 82.0, durationMinutes: 105, highway: 'SH 86 & Channarayapatna Highway to Gommateshwara Monolith', toll: 0 },
  'shravanabelagola-mysuru': { distanceKm: 82.0, durationMinutes: 105, highway: 'Channarayapatna Highway & SH 86 to Mysuru', toll: 0 },
  'mysuru-sakleshpur': { distanceKm: 148.0, durationMinutes: 185, highway: 'SH 86 & NH 75 via Holenarasipura-Hassan-Alur to Manjarabad Fort', toll: 0 },
  'sakleshpur-mysuru': { distanceKm: 148.0, durationMinutes: 185, highway: 'NH 75 & SH 86 via Hassan-Holenarasipura to Mysuru', toll: 0 },

  // Chikkamagaluru (Chikmagalur) Corridors (Direct & Reverse)
  'mysuru-chikkamagaluru': { distanceKm: 175.0, durationMinutes: 220, highway: 'SH 86 & NH 373 via Holenarasipura-Hassan-Belur to Chikkamagaluru Coffee Land', toll: 0 },
  'mysore-chikkamagaluru': { distanceKm: 175.0, durationMinutes: 220, highway: 'SH 86 & NH 373 via Holenarasipura-Hassan-Belur to Chikkamagaluru Coffee Land', toll: 0 },
  'mysuru-chikmagalur': { distanceKm: 175.0, durationMinutes: 220, highway: 'SH 86 & NH 373 via Holenarasipura-Hassan-Belur to Chikmagalur', toll: 0 },
  'mysore-chikmagalur': { distanceKm: 175.0, durationMinutes: 220, highway: 'SH 86 & NH 373 via Holenarasipura-Hassan-Belur to Chikmagalur', toll: 0 },
  'chikkamagaluru-mysuru': { distanceKm: 175.0, durationMinutes: 220, highway: 'NH 373 & SH 86 via Belur-Hassan-Holenarasipura to Mysuru', toll: 0 },
  'chikkamagaluru-mysore': { distanceKm: 175.0, durationMinutes: 220, highway: 'NH 373 & SH 86 via Belur-Hassan-Holenarasipura to Mysuru', toll: 0 },
  'chikmagalur-mysuru': { distanceKm: 175.0, durationMinutes: 220, highway: 'NH 373 & SH 86 via Belur-Hassan-Holenarasipura to Mysuru', toll: 0 },
  'chikmagalur-mysore': { distanceKm: 175.0, durationMinutes: 220, highway: 'NH 373 & SH 86 via Belur-Hassan-Holenarasipura to Mysuru', toll: 0 },
  'mysuru-mullayanagiri': { distanceKm: 195.0, durationMinutes: 255, highway: 'SH 86 & NH 373 via Hassan-Belur-Chikkamagaluru to Mullayanagiri Peak (6,330 ft)', toll: 0 },
  'mysuru-bababudangiri': { distanceKm: 205.0, durationMinutes: 275, highway: 'SH 86 & NH 373 via Hassan-Belur-Chikkamagaluru to Bababudangiri Dattatreya Peetha', toll: 0 },
  'mysuru-kudremukha': { distanceKm: 235.0, durationMinutes: 310, highway: 'SH 86 & SH 66 via Belur-Mudigere-Kalasa to Kudremukha National Park', toll: 0 },
  'mysuru-sringeri': { distanceKm: 245.0, durationMinutes: 315, highway: 'NH 373 & NH 169 via Hassan-Belur-Chikmagalur-Balehonnur to Sharada Peetham', toll: 0 },
  'sringeri-mysuru': { distanceKm: 245.0, durationMinutes: 315, highway: 'NH 169 & NH 373 via Balehonnur-Chikmagalur-Hassan to Mysuru', toll: 0 },

  // Coastal Corridors: Mangaluru, Udupi & Manipal (Direct & Reverse)
  'mysuru-mangaluru': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Hunsur-Kushalnagar-Madikeri-Sampaje Ghat-Sullia-Puttur-Mani to Mangaluru', toll: 110 },
  'mysore-mangaluru': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Hunsur-Kushalnagar-Madikeri-Sampaje Ghat-Sullia-Puttur-Mani to Mangaluru', toll: 110 },
  'mysuru-mangalore': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Hunsur-Kushalnagar-Madikeri-Sampaje Ghat-Sullia-Puttur-Mani to Mangalore', toll: 110 },
  'mysore-mangalore': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Hunsur-Kushalnagar-Madikeri-Sampaje Ghat-Sullia-Puttur-Mani to Mangalore', toll: 110 },
  'mangaluru-mysuru': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Mani-Puttur-Sullia-Sampaje Ghat-Madikeri-Kushalnagar-Hunsur to Mysuru', toll: 110 },
  'mangaluru-mysore': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Mani-Puttur-Sullia-Sampaje Ghat-Madikeri-Kushalnagar-Hunsur to Mysuru', toll: 110 },
  'mangalore-mysuru': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Mani-Puttur-Sullia-Sampaje Ghat-Madikeri-Kushalnagar-Hunsur to Mysuru', toll: 110 },
  'mangalore-mysore': { distanceKm: 255.0, durationMinutes: 325, highway: 'NH 275 via Mani-Puttur-Sullia-Sampaje Ghat-Madikeri-Kushalnagar-Hunsur to Mysuru', toll: 110 },

  'mysuru-udupi': { distanceKm: 305.0, durationMinutes: 375, highway: 'NH 275 & NH 66 Coastal Highway via Madikeri-Mangaluru-Surathkal-Mulki-Kaup to Udupi Sri Krishna Matha', toll: 180 },
  'mysore-udupi': { distanceKm: 305.0, durationMinutes: 375, highway: 'NH 275 & NH 66 Coastal Highway via Madikeri-Mangaluru-Surathkal-Mulki-Kaup to Udupi Sri Krishna Matha', toll: 180 },
  'udupi-mysuru': { distanceKm: 305.0, durationMinutes: 375, highway: 'NH 66 & NH 275 via Mangaluru-Mani-Sampaje-Madikeri-Kushalnagar-Hunsur to Mysuru', toll: 180 },
  'udupi-mysore': { distanceKm: 305.0, durationMinutes: 375, highway: 'NH 66 & NH 275 via Mangaluru-Mani-Sampaje-Madikeri-Kushalnagar-Hunsur to Mysuru', toll: 180 },

  'mysuru-manipal': { distanceKm: 310.0, durationMinutes: 380, highway: 'NH 275 & NH 66 via Madikeri-Mangaluru-Udupi to Manipal University / KMC Hub', toll: 180 },
  'mysore-manipal': { distanceKm: 310.0, durationMinutes: 380, highway: 'NH 275 & NH 66 via Madikeri-Mangaluru-Udupi to Manipal University / KMC Hub', toll: 180 },
  'manipal-mysuru': { distanceKm: 310.0, durationMinutes: 380, highway: 'NH 66 & NH 275 via Udupi-Mangaluru-Sampaje-Madikeri-Kushalnagar to Mysuru', toll: 180 },
  'manipal-mysore': { distanceKm: 310.0, durationMinutes: 380, highway: 'NH 66 & NH 275 via Udupi-Mangaluru-Sampaje-Madikeri-Kushalnagar to Mysuru', toll: 180 },
  'udupi-manipal': { distanceKm: 6.0, durationMinutes: 12, highway: 'Udupi-Manipal Highway (Kalsanka - Tiger Circle)', toll: 0 },
  'manipal-udupi': { distanceKm: 6.0, durationMinutes: 12, highway: 'Manipal-Udupi Highway (Tiger Circle - Kalsanka)', toll: 0 },

  'mysuru-dharmasthala': { distanceKm: 215.0, durationMinutes: 285, highway: 'SH 86 & Charmadi / Shiradi Ghat via Hassan-Belthangady to Lord Manjunatha Temple', toll: 65 },
  'dharmasthala-mysuru': { distanceKm: 215.0, durationMinutes: 285, highway: 'Shiradi / Charmadi Ghat & SH 86 via Hassan to Mysuru', toll: 65 },
  'mysuru-kukke_subrahmanya': { distanceKm: 165.0, durationMinutes: 225, highway: 'SH 88 via Kushalnagar-Somwarpet-Bisle Ghat to Kukke Subrahmanya', toll: 0 },
  'kukke_subrahmanya-mysuru': { distanceKm: 165.0, durationMinutes: 225, highway: 'Bisle Ghat & SH 88 via Somwarpet-Kushalnagar to Mysuru', toll: 0 },
  'mysuru-murudeshwar': { distanceKm: 410.0, durationMinutes: 495, highway: 'NH 275 & NH 66 via Udupi-Kundapura-Bhatkal to 123ft Shiva Statue', toll: 290 },
  'murudeshwar-mysuru': { distanceKm: 410.0, durationMinutes: 495, highway: 'NH 66 & NH 275 via Bhatkal-Kundapura-Udupi-Mangaluru to Mysuru', toll: 290 },
  'mysuru-gokarna': { distanceKm: 480.0, durationMinutes: 570, highway: 'NH 275 & NH 66 via Udupi-Honnavar-Kumta to Om Beach & Atmalinga', toll: 350 },
  'gokarna-mysuru': { distanceKm: 480.0, durationMinutes: 570, highway: 'NH 66 & NH 275 via Kumta-Honnavar-Udupi-Mangaluru to Mysuru', toll: 350 },
  
  // Mysuru <-> Ooty & Nilgiris Direct & Reverse Routes
  'mysuru-ooty': { distanceKm: 125.5, durationMinutes: 195, highway: 'NH 766 & NH 181 via Nanjangud-Gundlupet-Bandipur-Mudumalai-Kalhatty (36 Hairpin Bends) / Gudalur (158 km)', toll: 0 },
  'mysore-ooty': { distanceKm: 125.5, durationMinutes: 195, highway: 'NH 766 & NH 181 via Nanjangud-Gundlupet-Bandipur-Mudumalai-Kalhatty (36 Hairpin Bends)', toll: 0 },
  'ooty-mysuru': { distanceKm: 125.5, durationMinutes: 200, highway: 'NH 181 & NH 766 via Gudalur / Kalhatty-Mudumalai-Bandipur-Gundlupet-Nanjangud to Mysuru', toll: 0 },
  'ooty-mysore': { distanceKm: 125.5, durationMinutes: 200, highway: 'NH 181 & NH 766 via Gudalur / Kalhatty-Mudumalai-Bandipur-Gundlupet-Nanjangud to Mysuru', toll: 0 },
  
  'mysuru-ooty_gudalur': { distanceKm: 158.0, durationMinutes: 240, highway: 'NH 766 & NH 181 via Bandipur-Theppakadu-Gudalur-Naduvattam-Pykara to Ooty', toll: 0 },
  'ooty-mysuru_gudalur': { distanceKm: 158.0, durationMinutes: 240, highway: 'NH 181 & NH 766 via Pykara-Naduvattam-Gudalur-Theppakadu-Bandipur-Gundlupet-Mysuru', toll: 0 },
  
  'mysuru-coonoor': { distanceKm: 144.5, durationMinutes: 235, highway: 'NH 766 & NH 181 via Bandipur-Mudumalai-Ooty-Aruvankadu-Bedford Coonoor', toll: 0 },
  'mysore-coonoor': { distanceKm: 144.5, durationMinutes: 235, highway: 'NH 766 & NH 181 via Bandipur-Mudumalai-Ooty-Aruvankadu-Bedford Coonoor', toll: 0 },
  'coonoor-mysuru': { distanceKm: 144.5, durationMinutes: 240, highway: 'NH 181 & NH 766 via Ooty-Mudumalai-Bandipur-Gundlupet-Nanjangud to Mysuru', toll: 0 },
  'coonoor-mysore': { distanceKm: 144.5, durationMinutes: 240, highway: 'NH 181 & NH 766 via Ooty-Mudumalai-Bandipur-Gundlupet-Nanjangud to Mysuru', toll: 0 },
  'ooty-coonoor': { distanceKm: 19.5, durationMinutes: 45, highway: 'NH 181 Nilgiris Mountain Corridor via Ketti Valley & Aruvankadu', toll: 0 },
  'coonoor-ooty': { distanceKm: 19.5, durationMinutes: 45, highway: 'NH 181 Nilgiris Mountain Corridor via Aruvankadu & Ketti Valley', toll: 0 },

  'mysuru-doddabetta': { distanceKm: 134.5, durationMinutes: 215, highway: 'NH 181 via Ooty Charing Cross & Kotagiri Road Junction to Doddabetta Peak', toll: 0 },
  'mysore-doddabetta': { distanceKm: 134.5, durationMinutes: 215, highway: 'NH 181 via Ooty & Kotagiri Road Junction to Doddabetta Peak', toll: 0 },
  'mysuru-pykara': { distanceKm: 108.0, durationMinutes: 165, highway: 'NH 181 via Bandipur-Mudumalai-Theppakadu & Pykara Lake Boating', toll: 0 },
  'mysore-pykara': { distanceKm: 108.0, durationMinutes: 165, highway: 'NH 181 via Bandipur-Mudumalai-Theppakadu & Pykara Lake Boating', toll: 0 },
  'mysuru-avalanche': { distanceKm: 148.0, durationMinutes: 240, highway: 'NH 181 via Ooty & Emerald Lake-Avalanche Forest Sanctuary Route', toll: 0 },
  'mysuru-kotagiri': { distanceKm: 148.0, durationMinutes: 230, highway: 'SH 15 / NH 181 via Ooty or Mettupalayam-Kotagiri Ghats', toll: 0 },
  'mysuru-mudumalai': { distanceKm: 88.0, durationMinutes: 120, highway: 'NH 766 & NH 181 via Gundlupet & Theppakadu Elephant Camp', toll: 0 },
  'mysore-mudumalai': { distanceKm: 88.0, durationMinutes: 120, highway: 'NH 766 & NH 181 via Gundlupet & Theppakadu Elephant Camp', toll: 0 },
  'mysuru-masinagudi': { distanceKm: 98.0, durationMinutes: 140, highway: 'NH 766 via Gundlupet-Bandipur-Theppakadu & Masinagudi Jungle Corridor', toll: 0 },
  'mysore-masinagudi': { distanceKm: 98.0, durationMinutes: 140, highway: 'NH 766 via Gundlupet-Bandipur-Theppakadu & Masinagudi Jungle Corridor', toll: 0 },
  'mysuru-gudalur': { distanceKm: 110.0, durationMinutes: 155, highway: 'NH 766 & NH 181 via Bandipur-Theppakadu & Gudalur Tea Gateway', toll: 0 },
  
  // Wayanad Corridors
  'mysuru-wayanad': { distanceKm: 125.0, durationMinutes: 165, highway: 'NH 766 via Gundlupet & Sulthan Bathery / SH 33 Bavali', toll: 0 },
  'mysore-wayanad': { distanceKm: 125.0, durationMinutes: 165, highway: 'NH 766 via Gundlupet & Sulthan Bathery / SH 33 Bavali', toll: 0 },
  'wayanad-mysuru': { distanceKm: 125.0, durationMinutes: 165, highway: 'NH 766 via Sulthan Bathery & Gundlupet to Mysuru', toll: 0 },
  'mysuru-wayand': { distanceKm: 125.0, durationMinutes: 165, highway: 'NH 766 via Gundlupet & Sulthan Bathery / SH 33 Bavali', toll: 0 },
  'mysuru-kalpetta': { distanceKm: 138.0, durationMinutes: 190, highway: 'NH 766 via Gundlupet & Sulthan Bathery', toll: 0 },
  'mysuru-sulthan_bathery': { distanceKm: 115.0, durationMinutes: 155, highway: 'NH 766 via Gundlupet & Muthanga Forest', toll: 0 },
  'mysuru-banasura_dam': { distanceKm: 145.0, durationMinutes: 205, highway: 'NH 766 via Sulthan Bathery & Padinjarathara', toll: 0 },
  'mysuru-mananthavady': { distanceKm: 118.0, durationMinutes: 165, highway: 'SH 33 via H.D. Kote & Bavali Forest Checkpost', toll: 0 },
  'mysuru-meppadi': { distanceKm: 148.0, durationMinutes: 210, highway: 'NH 766 via Chundale & Meppadi', toll: 0 },

  // Outstation Corridors
  'mysuru-hampi': { distanceKm: 420.0, durationMinutes: 465, highway: 'NH 150A via Chitradurga & Hospet', toll: 410 },
  'mysuru-tirupati': { distanceKm: 395.0, durationMinutes: 435, highway: 'NH 275 Expressway + NH 75 / NH 206 via Kolar-Chittoor', toll: 490 },
  'mysuru-coimbatore': { distanceKm: 200.0, durationMinutes: 270, highway: 'NH 766 & NH 948 via Gundlupet-Sathyamangalam Tiger Reserve', toll: 85 },
  'mysuru-calicut': { distanceKm: 205.0, durationMinutes: 285, highway: 'NH 766 via Sulthan Bathery-Kalpetta-Thamarassery Ghat', toll: 60 },
  'mysuru-pondicherry': { distanceKm: 440.0, durationMinutes: 480, highway: 'NH 275 + NH 77 via Bengaluru-Krishnagiri-Tiruvannamalai', toll: 450 },

  // Cross-city corridors (Bengaluru - Outstations)
  'bengaluru-kial_t1': { distanceKm: 36.5, durationMinutes: 50, highway: 'NH 44 Airport Expressway via Hebbal & Yelahanka', toll: 115 },
  'bengaluru-kial_t2': { distanceKm: 37.0, durationMinutes: 50, highway: 'NH 44 Airport Expressway', toll: 115 },
  'bengaluru-coorg': { distanceKm: 250.0, durationMinutes: 290, highway: 'NH 275 Expressway & Kushalnagar-Madikeri Highway', toll: 320 },
  'bengaluru-madikeri': { distanceKm: 250.0, durationMinutes: 300, highway: 'NH 275 Expressway & Kushalnagar Highway', toll: 320 },
  'bengaluru-kushalnagar': { distanceKm: 220.0, durationMinutes: 255, highway: 'NH 275 Mysore Expressway + Coorg 4-Lane', toll: 320 },
  'bengaluru-kabini': { distanceKm: 205.0, durationMinutes: 225, highway: 'NH 275 Expressway + SH 33 via Mysuru Ring Road & Antharasanthe', toll: 320 },
  'bengaluru-hassan': { distanceKm: 185.0, durationMinutes: 195, highway: 'NH 75 4-Lane Expressway via Nelamangala & Kunigal', toll: 180 },
  'bengaluru-ooty': { distanceKm: 270.0, durationMinutes: 340, highway: 'NH 275 Expressway + NH 766 Bandipur Route', toll: 320 },
  'bengaluru-wayanad': { distanceKm: 280.0, durationMinutes: 350, highway: 'NH 275 Expressway + NH 766 Sulthan Bathery Corridor', toll: 320 },
  'bengaluru-wayand': { distanceKm: 280.0, durationMinutes: 350, highway: 'NH 275 Expressway + NH 766 Sulthan Bathery Corridor', toll: 320 },
  'bengaluru-tirupati': { distanceKm: 250.0, durationMinutes: 270, highway: 'NH 75 & NH 206 via Hosakote-Kolar-Mulbagal-Chittoor', toll: 240 },
  'bengaluru-chikmagalur': { distanceKm: 245.0, durationMinutes: 270, highway: 'NH 75 4-Lane via Nelamangala-Hassan Bypass', toll: 210 },
  'bengaluru-chikkamagaluru': { distanceKm: 245.0, durationMinutes: 270, highway: 'NH 75 4-Lane via Nelamangala-Hassan Bypass', toll: 210 },
  'bengaluru-coimbatore': { distanceKm: 365.0, durationMinutes: 390, highway: 'NH 44 6-Lane Expressway via Hosur-Salem-Erode', toll: 380 },
  'bengaluru-pondicherry': { distanceKm: 310.0, durationMinutes: 360, highway: 'NH 77 & NH 48 via Krishnagiri-Tiruvannamalai-Gingee', toll: 260 },
  'bengaluru-mangaluru': { distanceKm: 350.0, durationMinutes: 420, highway: 'NH 75 via Hassan & Shiradi Ghat / Sakleshpur', toll: 240 },

  // New Requested Route Matrix Entries (Bidirectional)
  'mysore-kabini': { distanceKm: 65.0, durationMinutes: 95, highway: 'SH 33 / HD Kote Road via Hampapura & Antharasanthe', toll: 0 },
  'kabini-mysore': { distanceKm: 65.0, durationMinutes: 95, highway: 'SH 33 / HD Kote Road to Mysuru', toll: 0 },
  'kabini-mysuru': { distanceKm: 65.0, durationMinutes: 95, highway: 'SH 33 / HD Kote Road to Mysuru', toll: 0 },
  'ooty-bengaluru': { distanceKm: 275.0, durationMinutes: 345, highway: 'NH 181 / NH 766 Bandipur + NH 275 Expressway', toll: 320 },
  'ooty-bangalore': { distanceKm: 275.0, durationMinutes: 345, highway: 'NH 181 / NH 766 Bandipur + NH 275 Expressway', toll: 320 },
  'wayanad-bengaluru': { distanceKm: 280.0, durationMinutes: 350, highway: 'NH 766 Sulthan Bathery-Gundlupet + NH 275 Expressway', toll: 320 },
  'wayanad-bangalore': { distanceKm: 280.0, durationMinutes: 350, highway: 'NH 766 Sulthan Bathery-Gundlupet + NH 275 Expressway', toll: 320 },
  'kabini-bengaluru': { distanceKm: 215.0, durationMinutes: 255, highway: 'SH 33 via HD Kote & NH 275 10-Lane Expressway', toll: 320 },
  'kabini-bangalore': { distanceKm: 215.0, durationMinutes: 255, highway: 'SH 33 via HD Kote & NH 275 10-Lane Expressway', toll: 320 },
  'coorg-bengaluru': { distanceKm: 255.0, durationMinutes: 290, highway: 'NH 275 Madikeri-Kushalnagar + 10-Lane Expressway', toll: 320 },
  'coorg-bangalore': { distanceKm: 255.0, durationMinutes: 290, highway: 'NH 275 Madikeri-Kushalnagar + 10-Lane Expressway', toll: 320 },
};
