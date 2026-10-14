import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  IndianRupee,
  PieChart,
  Car,
  MapPin,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export const OwnerReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days'>('30days');

  return (
    <div className="space-y-6">
      {/* Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Analytics & Performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational metrics, route profitability, vehicle utilization and conversion funnels.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              dateRange === 'today' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateRange('yesterday')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              dateRange === 'yesterday' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setDateRange('7days')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              dateRange === '7days' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setDateRange('30days')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              dateRange === '30days' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">68.9%</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+4.2% vs previous period</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Trip Value</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">₹3,450</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Based on confirmed rides</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancellation Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">2.4%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Industry benchmark: &lt; 5%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Booking Volume</span>
          <p className="text-2xl sm:text-3xl font-black text-[#0a4d3c] mt-1">₹4,82,500</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Across all outstation lines</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Popularity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Service Popularity</span>
          </h3>
          <div className="space-y-3 text-xs pt-2">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Airport Transfers (KIAL)</span>
                <span className="font-bold text-slate-900">42%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>One Way Cabs</span>
                <span className="font-bold text-slate-900">28%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Round Trip Holidays</span>
                <span className="font-bold text-slate-900">20%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Local Mysore Tours</span>
                <span className="font-bold text-slate-900">10%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Destination Corridors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Top Corridors</span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Mysuru ⇄ BLR Airport KIAL</span>
              <span className="font-bold text-emerald-700">142 Trips</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Mysuru ⇄ Bengaluru City</span>
              <span className="font-bold text-emerald-700">96 Trips</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Mysuru ⇄ Madikeri, Coorg</span>
              <span className="font-bold text-emerald-700">68 Trips</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Mysuru ⇄ Ooty, Nilgiris</span>
              <span className="font-bold text-emerald-700">54 Trips</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Mysuru ⇄ Wayanad, Kerala</span>
              <span className="font-bold text-emerald-700">41 Trips</span>
            </div>
          </div>
        </div>

        {/* Fleet Demand */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-600" />
            <span>Fleet Demand</span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Sedan (Dzire 4+1)</span>
                <span className="text-[10px] text-slate-400">Solo travelers & couples</span>
              </div>
              <span className="font-black text-slate-800">45% Demand</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Innova Crysta</span>
                <span className="text-[10px] text-slate-400">Corporate & executive</span>
              </div>
              <span className="font-black text-slate-800">28% Demand</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">SUV (Ertiga 6+1)</span>
                <span className="text-[10px] text-slate-400">Families & hill stations</span>
              </div>
              <span className="font-black text-slate-800">18% Demand</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Tempo Traveller (12+1)</span>
                <span className="text-[10px] text-slate-400">Large group tours</span>
              </div>
              <span className="font-black text-slate-800">9% Demand</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
