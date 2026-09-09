import React, { useState } from 'react';
import {
  X,
  Code2,
  Database,
  MapPin,
  Route,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface TechnicalArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalArchitectureModal: React.FC<TechnicalArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'maps_setup' | 'fare_engine'>('architecture');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const schemaSQL = `-- =========================================================================
-- DATABASE SCHEMA: TravelJust - Google Maps Platform & Dynamic Fare Engine
-- Database: PostgreSQL 15+ / Cloud SQL / Supabase / Neon
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Google Places Cache (Reduces Google Maps Places API billing by up to 80%)
CREATE TABLE IF NOT EXISTS google_places_cache (
  place_id VARCHAR(255) PRIMARY KEY,
  place_name VARCHAR(255) NOT NULL,
  formatted_address TEXT NOT NULL,
  area_locality VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
  country VARCHAR(50) NOT NULL DEFAULT 'India',
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  category VARCHAR(50) DEFAULT 'general', -- 'airports', 'hotels_resorts', 'railway_stations', 'tourist_attractions'
  place_types JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON google_places_cache (place_name);
CREATE INDEX IF NOT EXISTS idx_places_city ON google_places_cache (city);

-- 2. Google Routes & Distance Matrix Cache
CREATE TABLE IF NOT EXISTS routes_distance_cache (
  route_hash VARCHAR(64) PRIMARY KEY, -- SHA256(origin_place_id + ':' + dest_place_id + ':' + sorted_waypoints)
  origin_title VARCHAR(255) NOT NULL,
  destination_title VARCHAR(255) NOT NULL,
  origin_lat NUMERIC(10, 7),
  origin_lng NUMERIC(10, 7),
  destination_lat NUMERIC(10, 7),
  destination_lng NUMERIC(10, 7),
  distance_km NUMERIC(8, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  duration_text VARCHAR(100) NOT NULL,
  highway_corridor VARCHAR(150),
  toll_estimate_inr NUMERIC(8, 2) DEFAULT 0.00,
  toll_info JSONB DEFAULT '{}'::JSONB,
  polyline_overview TEXT,
  computed_via VARCHAR(50) DEFAULT 'GOOGLE_ROUTES_API', -- 'GOOGLE_ROUTES_API' or 'HAVERSINE_MATRIX'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_routes_hash ON routes_distance_cache(route_hash);

-- 3. Dynamic Vehicle Pricing Rules & Rate Master
CREATE TABLE IF NOT EXISTS vehicle_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_type VARCHAR(50) NOT NULL UNIQUE, -- 'sedan', 'suv', 'crysta', 'tempo'
  vehicle_name VARCHAR(100) NOT NULL,
  base_price_factor NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  oneway_per_km_rate NUMERIC(6, 2) NOT NULL,
  roundtrip_per_km_rate NUMERIC(6, 2) NOT NULL,
  roundtrip_min_km_per_day INTEGER NOT NULL DEFAULT 300,
  driver_allowance_per_day NUMERIC(6, 2) NOT NULL DEFAULT 300.00,
  local_hourly_rate NUMERIC(6, 2) NOT NULL,
  airport_base_fare NUMERIC(6, 2) NOT NULL,
  night_charge_percent NUMERIC(4, 2) DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed regional baseline pricing
INSERT INTO vehicle_pricing_rules 
  (vehicle_type, vehicle_name, base_price_factor, oneway_per_km_rate, roundtrip_per_km_rate, roundtrip_min_km_per_day, driver_allowance_per_day, local_hourly_rate, airport_base_fare)
VALUES
  ('sedan', 'Dzire / Etios Sedan', 1.00, 13.50, 12.00, 300, 300.00, 150.00, 1299.00),
  ('suv', 'Ertiga / Carens 6-Seater', 1.35, 18.50, 16.00, 300, 400.00, 200.00, 1799.00),
  ('crysta', 'Toyota Innova Crysta VIP', 1.65, 22.00, 19.50, 300, 500.00, 250.00, 2299.00),
  ('tempo', 'Force Urbania 12-16S Luxury', 2.00, 26.00, 24.00, 300, 600.00, 350.00, 2999.00)
ON CONFLICT (vehicle_type) DO UPDATE SET updated_at = NOW();

-- 4. Cab Bookings Record with Google Maps verification details
CREATE TABLE IF NOT EXISTS cab_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref VARCHAR(20) UNIQUE NOT NULL, -- e.g. TJ-2026-8921
  service_type VARCHAR(20) NOT NULL, -- 'oneway', 'roundtrip', 'local', 'airport'
  pickup_address TEXT NOT NULL,
  pickup_place_id VARCHAR(255),
  pickup_lat NUMERIC(10, 7),
  pickup_lng NUMERIC(10, 7),
  drop_address TEXT NOT NULL,
  drop_place_id VARCHAR(255),
  drop_lat NUMERIC(10, 7),
  drop_lng NUMERIC(10, 7),
  travel_date DATE NOT NULL,
  return_date DATE,
  pickup_time VARCHAR(10) NOT NULL,
  calculated_distance_km NUMERIC(8, 2) NOT NULL,
  calculated_duration_mins INTEGER,
  highway_corridor VARCHAR(150),
  estimated_tolls NUMERIC(8, 2) DEFAULT 0.00,
  vehicle_type VARCHAR(50) NOT NULL,
  base_fare NUMERIC(10, 2) NOT NULL,
  driver_allowance NUMERIC(10, 2) DEFAULT 0.00,
  gst_amount NUMERIC(10, 2) NOT NULL,
  total_fare NUMERIC(10, 2) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  booking_status VARCHAR(30) DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

  const routesAPICode = `// =========================================================================
// GOOGLE ROUTES API: Accurate Road Distance & Dynamic Pricing Client
// Endpoint: https://routes.googleapis.com/directions/v2:computeRoutes
// =========================================================================

export async function computeGoogleRoute(origin: { placeId?: string; lat?: number; lng?: number }, destination: { placeId?: string; lat?: number; lng?: number }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  // Format waypoints using Place ID (preferred) or Lat/Lng coordinates
  const originPayload = origin.placeId
    ? { placeId: origin.placeId }
    : { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } };

  const destinationPayload = destination.placeId
    ? { placeId: destination.placeId }
    : { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } };

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      // Minimal field mask for optimized Google billing:
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.travelAdvisory.tollInfo',
    },
    body: JSON.stringify({
      origin: originPayload,
      destination: destinationPayload,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
      computeAlternativeRoutes: false,
      extraComputations: ['TOLLS'],
    }),
  });

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  const distanceKm = Math.round((route.distanceMeters / 1000) * 10) / 10;
  const durationSeconds = parseInt(route.duration.replace('s', ''), 10);
  const durationMinutes = Math.round(durationSeconds / 60);

  return {
    distanceKm,
    durationMinutes,
    durationText: \`\${Math.floor(durationMinutes / 60)}h \${durationMinutes % 60}m\`,
    tollEstimate: route.travelAdvisory?.tollInfo?.estimatedPrice?.[0]?.units || 0,
  };
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14CD03]/20 border border-[#14CD03]/40 flex items-center justify-center text-[#14CD03]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Google Maps Platform & Technical Architecture</h2>
              <p className="text-xs text-slate-400">Routes API • Places Autocomplete • Database Schema • Dynamic Pricing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#14CD03]" />
            <span>Architecture Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>Database Schema (PostgreSQL DDL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maps_setup')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'maps_setup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-purple-600" />
            <span>Google Maps API Setup & Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fare_engine')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'fare_engine'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dynamic Fare Engine Rules</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 text-sm">
          {/* TAB 1: ARCHITECTURE FLOW */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-bold text-emerald-950 flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Google Maps Platform Integration Pipeline & Data Flow</span>
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Every search follows a verified, end-to-end pipeline that transforms places autocompletions into Google Routes API driving corridors, extracts actual road distances and travel times, and feeds them into the vehicle fare engine.
                </p>
              </div>

              {/* Verified Visual Data Flow Diagram */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-100 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold uppercase tracking-wider pb-2 border-b border-slate-800">
                  <span>Architecture Specification (Live In Production)</span>
                  <span className="text-slate-400 font-normal">Mysuru Palace ➔ Kempegowda Airport (~170 km · ~3h 30m)</span>
                </div>
                <div className="overflow-x-auto whitespace-pre leading-relaxed text-slate-300">
{`FROM (e.g. Mysuru Palace, Mysuru)
 ↓
Google Places Autocomplete
 ↓
Exact Place ID (loc_mys_palace)
 ↓
Coordinates (12.3051, 76.6551)
 ↓
             Google Routes API (/directions/v2:computeRoutes)
                    ↓
              Actual road route (NH 275 Expressway + NH 44)
                    ↓
       ┌────────────┴────────────┐
       ↓                         ↓
Distance (~170 km)         Duration (~3 hr 30 min)
       ↓
Fare Engine
       ↓
Vehicle-wise prices (Hatchback, Sedan, SUV, Innova Crysta)
       ↓
Booking (Real-time Confirmation & Fleet Dispatch)`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Live Places Autocomplete</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Uses Google Places API (New) with <strong>Session Tokens</strong> to group typing keystrokes into a single billing event. Pre-loaded with thousands of South India hotels, resorts, railway stations, airports, and tourist attractions across Karnataka, Tamil Nadu, and Kerala.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Place ID & GPS Geocoding</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Captures Google Place ID along with exact latitude and longitude. Includes browser GPS one-click "Use Current Location" reverse geocoded through Google Geocoding API.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Google Routes API</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Calls <code>/directions/v2:computeRoutes</code> using origin and destination Place IDs/coordinates with field masking. Calculates real driving road kilometers, highway corridor (e.g. NH 275 Expressway), and toll estimations.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Dynamic Fare Engine</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instantly feeds the verified road distance into our dynamic pricing model. Automatically computes per-km charges, driver allowances (bata), night surcharges, and multi-day round-trip rules (300 km/day minimum).
                  </p>
                </div>
              </div>

              {/* Regional Coverage List */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Supported Regions & Transit Hubs</h4>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {['Bengaluru', 'Mysuru / Mysore', 'Coorg (Madikeri, Kushalnagar)', 'Kabini / Nagarhole', 'Hassan (Belur, Halebidu)', 'Ooty / Nilgiris', 'Coimbatore', 'Wayanad (Kalpetta, Sultan Bathery)', 'Karnataka', 'Tamil Nadu', 'Kerala'].map((region) => (
                    <span key={region} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium border border-slate-200">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  PostgreSQL / Cloud SQL schema for places cache, routes cache, dynamic pricing rules, and confirmed bookings:
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(schemaSQL, 'schema')}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedSection === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'schema' ? 'Copied SQL' : 'Copy DDL'}</span>
                </button>
              </div>

              <div className="relative bg-slate-900 rounded-xl p-4 overflow-x-auto text-emerald-400 font-mono text-xs leading-relaxed max-h-96">
                <pre>{schemaSQL}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: MAPS SETUP & CODE */}
          {activeTab === 'maps_setup' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">Google Cloud Console Configuration</h4>
                <ol className="list-decimal list-inside text-xs text-sky-800 space-y-1 leading-relaxed">
                  <li>Enable <strong>Places API (New)</strong>, <strong>Routes API</strong>, and <strong>Geocoding API</strong> in your Google Cloud project.</li>
                  <li>Create an API Key and restrict it by HTTP referrers (e.g. <code>https://*.run.app/*</code>) or IP addresses.</li>
                  <li>Set environment variable: <code>GOOGLE_MAPS_API_KEY=your_key_here</code> in server secrets.</li>
                  <li>Apply Field Masking on every request to reduce API bill costs by up to 80%.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Exact Routes API Node.js / TypeScript Integration Code</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(routesAPICode, 'routes')}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedSection === 'routes' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'routes' ? 'Copied Code' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="relative bg-slate-900 rounded-xl p-4 overflow-x-auto text-sky-300 font-mono text-xs leading-relaxed max-h-80">
                  <pre>{routesAPICode}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FARE ENGINE */}
          {activeTab === 'fare_engine' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Vehicle Class</th>
                      <th className="p-3">One-Way Rate</th>
                      <th className="p-3">Round-Trip Rate</th>
                      <th className="p-3">Min Daily Km</th>
                      <th className="p-3">Driver Bata / Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Dzire / Etios Sedan</td>
                      <td className="p-3">₹13.50 / km</td>
                      <td className="p-3">₹12.00 / km</td>
                      <td className="p-3">300 km / day</td>
                      <td className="p-3">₹300</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Ertiga / Carens (6S)</td>
                      <td className="p-3">₹18.50 / km</td>
                      <td className="p-3">₹16.00 / km</td>
                      <td className="p-3">300 km / day</td>
                      <td className="p-3">₹400</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Innova Crysta VIP</td>
                      <td className="p-3">₹22.00 / km</td>
                      <td className="p-3">₹19.50 / km</td>
                      <td className="p-3">300 km / day</td>
                      <td className="p-3">₹500</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Tempo Traveller (12-16S)</td>
                      <td className="p-3">₹26.00 / km</td>
                      <td className="p-3">₹24.00 / km</td>
                      <td className="p-3">300 km / day</td>
                      <td className="p-3">₹600</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dynamic Pricing Formula</h4>
                <div className="font-mono text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                  Total Fare = (Distance × PerKmRate) + (DriverDays × DriverAllowance) + TollEstimate + GST(5%)
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  For round trips across Karnataka, Tamil Nadu, and Kerala, the system enforces the 300 km/day minimum rule automatically, ensuring clear transparency with no hidden driver bata or return charges.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Google AI Studio Build • Powered by Google Maps Platform</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};
