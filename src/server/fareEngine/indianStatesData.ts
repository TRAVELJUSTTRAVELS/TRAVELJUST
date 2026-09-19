import { IndianState } from '../../types/interstateOneWay';

export const ALL_INDIAN_STATES: IndianState[] = [
  // 28 States
  {
    code: 'KA',
    name: 'Karnataka',
    type: 'STATE',
    active: true,
    capital: 'Bengaluru',
    aliases: ['karnataka', 'kar', 'karnatak'],
    majorCities: [
      'mysuru', 'mysore', 'bengaluru', 'bangalore', 'mangalore', 'mangaluru',
      'hubli', 'hubballi', 'dharwad', 'belgaum', 'belagavi', 'shimoga', 'shivamogga',
      'davangere', 'bellary', 'ballari', 'tumkur', 'tumakuru', 'udupi', 'hassan',
      'chikmagalur', 'chikkamagaluru', 'coorg', 'kodagu', 'madikeri', 'nanjangud',
      'mandya', 'srirangapatna', 'chamarajanagar', 'kolar', 'bijapur', 'vijayapura',
      'gulbarga', 'kalaburagi', 'bidar', 'raichur', 'koppal', 'gadag', 'karwar', 'gokarna'
    ]
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'STATE',
    active: true,
    capital: 'Chennai',
    aliases: ['tamil nadu', 'tamilnadu', 'madras'],
    majorCities: [
      'ooty', 'udhagamandalam', 'nilgiri', 'nilgiris', 'coonoor', 'kotagiri', 'gudalur',
      'coimbatore', 'chennai', 'madurai', 'salem', 'vellore', 'tiruchirappalli', 'trichy',
      'hosur', 'erode', 'tiruppur', 'kodaikanal', 'dindigul', 'thanjavur', 'kanyakumari',
      'mudumalai', 'dharmapuri', 'krishnagiri', 'tiruvannamalai', 'ramanathapuram', 'rameswaram',
      'cuddalore', 'kanchipuram', 'nagapattinam', 'namakkal', 'perambalur', 'pudukkottai',
      'sivaganga', 'tenkasi', 'theni', 'thoothukudi', 'tuticorin', 'tirunelveli', 'villupuram', 'virudhunagar'
    ]
  },
  {
    code: 'KL',
    name: 'Kerala',
    type: 'STATE',
    active: true,
    capital: 'Thiruvananthapuram',
    aliases: ['kerala', 'keralam', 'ker'],
    majorCities: [
      'wayanad', 'kalpetta', 'sulthan bathery', 'sultan bathery', 'mananthavady', 'vythiri',
      'meppadi', 'kochi', 'cochin', 'ernakulam', 'kozhikode', 'calicut', 'trivandrum',
      'thiruvananthapuram', 'kannur', 'kasaragod', 'thrissur', 'palakkad', 'alappuzha',
      'alleppey', 'kottayam', 'munnar', 'idukki', 'kollam', 'malappuram', 'guruvayur',
      'bekal', 'thekkady', 'varkala', 'kovalam', 'pathanamthitta'
    ]
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'STATE',
    active: true,
    capital: 'Amaravati',
    aliases: ['andhra pradesh', 'andhra'],
    majorCities: [
      'tirupati', 'chittoor', 'nellore', 'vijayawada', 'visakhapatnam', 'vizag', 'guntur',
      'kurnool', 'kadapa', 'anantapur', 'rajahmundry', 'kakinada', 'tirumala', 'srikalahasti',
      'eluru', 'ongole', 'machilipatnam', 'vizianagaram', 'srikakulam'
    ]
  },
  {
    code: 'TS',
    name: 'Telangana',
    type: 'STATE',
    active: true,
    capital: 'Hyderabad',
    aliases: ['telangana', 'tg'],
    majorCities: [
      'hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar', 'khammam',
      'ramagundam', 'mahbubnagar', 'nalgonda', 'adilabad', 'siddipet'
    ]
  },
  {
    code: 'GA',
    name: 'Goa',
    type: 'STATE',
    active: true,
    capital: 'Panaji',
    aliases: ['goa'],
    majorCities: [
      'panaji', 'panjim', 'margao', 'madgaon', 'vasco da gama', 'mapusa', 'ponda',
      'calangute', 'baga', 'candolim', 'anjuna', 'arambol', 'colva', 'palolem', 'mormugao'
    ]
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    type: 'STATE',
    active: true,
    capital: 'Mumbai',
    aliases: ['maharashtra', 'maha'],
    majorCities: [
      'mumbai', 'pune', 'nagpur', 'nashik', 'aurangabad', 'chhatrapati sambhajinagar',
      'solapur', 'kolhapur', 'thane', 'navi mumbai', 'amravati', 'nanded', 'sangli',
      'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar', 'satara', 'shirdi', 'mahabaleshwar', 'lonavala'
    ]
  },
  { code: 'GJ', name: 'Gujarat', type: 'STATE', active: true, capital: 'Gandhinagar', aliases: ['gujarat'], majorCities: ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'bhavnagar', 'jamnagar'] },
  { code: 'RJ', name: 'Rajasthan', type: 'STATE', active: true, capital: 'Jaipur', aliases: ['rajasthan'], majorCities: ['jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'ajmer', 'jaisalmer'] },
  { code: 'MP', name: 'Madhya Pradesh', type: 'STATE', active: true, capital: 'Bhopal', aliases: ['madhya pradesh', 'mp'], majorCities: ['indore', 'bhopal', 'gwalior', 'jabalpur', 'ujjain'] },
  { code: 'UP', name: 'Uttar Pradesh', type: 'STATE', active: true, capital: 'Lucknow', aliases: ['uttar pradesh', 'up'], majorCities: ['lucknow', 'kanpur', 'varanasi', 'agra', 'noida', 'prayagraj', 'ayodhya'] },
  { code: 'HR', name: 'Haryana', type: 'STATE', active: true, capital: 'Chandigarh', aliases: ['haryana'], majorCities: ['gurugram', 'gurgaon', 'faridabad', 'panipat', 'ambala', 'karnal'] },
  { code: 'PB', name: 'Punjab', type: 'STATE', active: true, capital: 'Chandigarh', aliases: ['punjab'], majorCities: ['amritsar', 'ludhiana', 'jalandhar', 'patiala', 'bathinda', 'mohali'] },
  { code: 'HP', name: 'Himachal Pradesh', type: 'STATE', active: true, capital: 'Shimla', aliases: ['himachal pradesh', 'himachal'], majorCities: ['shimla', 'manali', 'dharamshala', 'kullu', 'solan'] },
  { code: 'UK', name: 'Uttarakhand', type: 'STATE', active: true, capital: 'Dehradun', aliases: ['uttarakhand', 'uttaranchal', 'ua'], majorCities: ['dehradun', 'haridwar', 'rishikesh', 'nainital', 'mussoorie'] },
  { code: 'WB', name: 'West Bengal', type: 'STATE', active: true, capital: 'Kolkata', aliases: ['west bengal', 'bengal'], majorCities: ['kolkata', 'howrah', 'darjeeling', 'siliguri', 'asansol', 'durgapur'] },
  { code: 'OD', name: 'Odisha', type: 'STATE', active: true, capital: 'Bhubaneswar', aliases: ['odisha', 'orissa'], majorCities: ['bhubaneswar', 'cuttack', 'puri', 'rourkela', 'sambalpur'] },
  { code: 'BR', name: 'Bihar', type: 'STATE', active: true, capital: 'Patna', aliases: ['bihar'], majorCities: ['patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'darbhanga'] },
  { code: 'JH', name: 'Jharkhand', type: 'STATE', active: true, capital: 'Ranchi', aliases: ['jharkhand'], majorCities: ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar'] },
  { code: 'CG', name: 'Chhattisgarh', type: 'STATE', active: true, capital: 'Raipur', aliases: ['chhattisgarh'], majorCities: ['raipur', 'bhilai', 'bilaspur', 'korba', 'durg'] },
  { code: 'AS', name: 'Assam', type: 'STATE', active: true, capital: 'Dispur', aliases: ['assam'], majorCities: ['guwahati', 'silchar', 'dibrugarh', 'jorhat', 'tezpur'] },
  { code: 'SK', name: 'Sikkim', type: 'STATE', active: true, capital: 'Gangtok', aliases: ['sikkim'], majorCities: ['gangtok', 'namchi', 'pelling'] },
  { code: 'ML', name: 'Meghalaya', type: 'STATE', active: true, capital: 'Shillong', aliases: ['meghalaya'], majorCities: ['shillong', 'tura', 'cherrapunji'] },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'STATE', active: true, capital: 'Itanagar', aliases: ['arunachal pradesh', 'arunachal'], majorCities: ['itanagar', 'tawang', 'naharlagun'] },
  { code: 'NL', name: 'Nagaland', type: 'STATE', active: true, capital: 'Kohima', aliases: ['nagaland'], majorCities: ['kohima', 'dimapur', 'mokokchung'] },
  { code: 'MN', name: 'Manipur', type: 'STATE', active: true, capital: 'Imphal', aliases: ['manipur'], majorCities: ['imphal', 'churachandpur'] },
  { code: 'MZ', name: 'Mizoram', type: 'STATE', active: true, capital: 'Aizawl', aliases: ['mizoram'], majorCities: ['aizawl', 'lunglei'] },
  { code: 'TR', name: 'Tripura', type: 'STATE', active: true, capital: 'Agartala', aliases: ['tripura'], majorCities: ['agartala', 'dharmanagar'] },

  // 8 Union Territories
  { code: 'DL', name: 'Delhi', type: 'UNION_TERRITORY', active: true, capital: 'New Delhi', aliases: ['delhi', 'nct', 'new delhi'], majorCities: ['new delhi', 'delhi', 'connaught place', 'dwarka', 'rohini'] },
  { code: 'PY', name: 'Puducherry', type: 'UNION_TERRITORY', active: true, capital: 'Pondicherry', aliases: ['puducherry', 'pondicherry', 'pondy'], majorCities: ['pondicherry', 'puducherry', 'auroville', 'karaikal', 'mahe', 'yanam'] },
  { code: 'CH', name: 'Chandigarh', type: 'UNION_TERRITORY', active: true, capital: 'Chandigarh', aliases: ['chandigarh'], majorCities: ['chandigarh'] },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UNION_TERRITORY', active: true, capital: 'Srinagar', aliases: ['jammu and kashmir', 'j&k'], majorCities: ['srinagar', 'jammu', 'anantnag', 'baramulla'] },
  { code: 'LA', name: 'Ladakh', type: 'UNION_TERRITORY', active: true, capital: 'Leh', aliases: ['ladakh'], majorCities: ['leh', 'kargil'] },
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UNION_TERRITORY', active: true, capital: 'Port Blair', aliases: ['andaman', 'nicobar'], majorCities: ['port blair', 'havelock'] },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UNION_TERRITORY', active: true, capital: 'Daman', aliases: ['daman', 'diu', 'dadra'], majorCities: ['daman', 'diu', 'silvassa'] },
  { code: 'LD', name: 'Lakshadweep', type: 'UNION_TERRITORY', active: true, capital: 'Kavaratti', aliases: ['lakshadweep'], majorCities: ['kavaratti', 'agatti'] }
];

export const STATES_BY_CODE = new Map<string, IndianState>(
  ALL_INDIAN_STATES.map((s) => [s.code.toUpperCase(), s])
);

/**
 * Resolve an Indian State from location text and/or structured details
 */
export function resolveIndianState(
  locationText?: string,
  details?: {
    placeId?: string;
    formattedAddress?: string;
    state?: string;
    stateCode?: string;
    city?: string;
  }
): IndianState {
  // 1. Check explicit stateCode
  if (details?.stateCode && details.stateCode.trim().length > 0) {
    const codeMatch = STATES_BY_CODE.get(details.stateCode.trim().toUpperCase());
    if (codeMatch) return codeMatch;
  }

  // 2. Check explicit state field
  if (details?.state && details.state.trim().length > 0) {
    const st = details.state.trim().toLowerCase();
    for (const state of ALL_INDIAN_STATES) {
      if (state.name.toLowerCase() === st) return state;
      if (state.aliases?.some((a) => a.toLowerCase() === st)) return state;
    }
  }

  // 3. Evaluate full text string (address + location input text)
  const fullText = `${locationText || ''} ${details?.formattedAddress || ''} ${details?.city || ''}`.toLowerCase();

  // 3a. Exact state name or aliases match
  for (const state of ALL_INDIAN_STATES) {
    const stateName = state.name.toLowerCase();
    if (fullText.includes(stateName)) return state;
    if (state.aliases?.some((a) => fullText.includes(a))) return state;
    // Word boundary check for 2-letter state codes like \bKA\b, \bTN\b, etc.
    const regex = new RegExp(`\\b${state.code.toLowerCase()}\\b`, 'i');
    if (regex.test(fullText)) return state;
  }

  // 3b. Match major cities
  for (const state of ALL_INDIAN_STATES) {
    if (state.majorCities) {
      for (const city of state.majorCities) {
        if (fullText.includes(city.toLowerCase())) {
          return state;
        }
      }
    }
  }

  // Fallback to Karnataka as default home state for TRAVEL JUST if unidentifiable
  return STATES_BY_CODE.get('KA') || ALL_INDIAN_STATES[0];
}
