import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  RefreshCw,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { AuditLogEntry } from '../../types/owner';
import { ownerService } from '../../services/ownerService';

export const OwnerAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await ownerService.getAuditLogs();
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== 'ALL' && log.entity !== entityFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorEmail.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.bookingId && log.bookingId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit & Compliance Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable administrative action trail across fares, bookings, fleet assignments and customer interactions.
          </p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action, actor, Booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold cursor-pointer"
        >
          <option value="ALL">All Entity Types</option>
          <option value="BOOKING">BOOKING</option>
          <option value="FARE">FARE & PRICING</option>
          <option value="FLEET">FLEET & VEHICLES</option>
          <option value="CHAUFFEUR">CHAUFFEURS</option>
          <option value="PAYMENT">PAYMENTS</option>
          <option value="DISCOUNT">DISCOUNTS</option>
          <option value="SEO">SEO & SITE</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Booking / Target</th>
                <th className="p-3.5 pr-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{l.actorEmail}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{l.actorRole}</span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-mono font-bold text-emerald-800">
                    {l.action}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {l.entity}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                    {l.bookingId ? `#${l.bookingId}` : l.entityId || 'N/A'}
                  </td>
                  <td className="p-3.5 pr-5 text-slate-600 max-w-md">
                    {l.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
