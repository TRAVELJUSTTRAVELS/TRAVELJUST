import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Car,
  MessageSquare,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';

export const OwnerCustomers: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    ownerService.getBookings().then((b) => {
      setBookings(b);
      setIsLoading(false);
    });
  }, []);

  // Aggregate unique customers from authoritative bookings buffer
  const customersMap = new Map<string, any>();
  bookings.forEach((b) => {
    const phone = b.mobile_number || 'Unknown';
    if (!customersMap.has(phone)) {
      customersMap.set(phone, {
        name: b.full_name || 'Valued Passenger',
        phone,
        email: b.email || 'None on file',
        firstBookingDate: b.created_at || b.travel_date,
        totalBookings: 1,
        totalSpend: Number(b.total_estimated_fare) || 0,
        trips: [b],
      });
    } else {
      const existing = customersMap.get(phone);
      existing.totalBookings += 1;
      existing.totalSpend += Number(b.total_estimated_fare) || 0;
      existing.trips.push(b);
    }
  });

  const customerList = Array.from(customersMap.values()).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated passenger profiles, contact credentials, lifetime booking value, and travel history.
          </p>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search passenger name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customerList.map((c) => (
          <div
            key={c.phone}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{c.phone}</span>
                  </div>
                  {c.email && c.email !== 'None on file' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Rides</span>
                  <span className="text-base font-black text-slate-800">{c.totalBookings} Trips</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Spend</span>
                  <span className="text-base font-black text-emerald-700">
                    ₹{c.totalSpend.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                <span>First Traveled:</span>
                <span className="font-semibold text-slate-700">
                  {c.firstBookingDate ? new Date(c.firstBookingDate).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <a
                href={`https://wa.me/91${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Namaskara ${c.name}, this is TRAVEL JUST Customer Support (+91 9740754400). How can we assist you with your upcoming journeys?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
