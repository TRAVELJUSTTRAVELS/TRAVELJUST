import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Clock,
  CheckCheck,
  Check,
  MapPin,
  Car,
  FileText,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  Bell,
  CreditCard,
  Settings,
  Layers,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  WhatsAppConversationThread,
  WhatsAppQueueItem,
  WhatsAppGatewaySettings,
  WhatsAppCategory,
} from '../../types/owner';
import { ownerService } from '../../services/ownerService';

export const OwnerWhatsAppCenter: React.FC = () => {
  // Tabs: 'chats' | 'queue' | 'templates' | 'gateway'
  const [activeSubTab, setActiveSubTab] = useState<'chats' | 'queue' | 'templates' | 'gateway'>('chats');
  const [threads, setThreads] = useState<WhatsAppConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Queue state
  const [queue, setQueue] = useState<WhatsAppQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Settings state
  const [gatewaySettings, setGatewaySettings] = useState<WhatsAppGatewaySettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState(false);

  // Test notification simulation
  const [testEventType, setTestEventType] = useState<'CUSTOMER_LOGIN' | 'BOOKING_CREATED' | 'DRIVER_ASSIGNED' | 'PAYMENT_RECORDED'>('CUSTOMER_LOGIN');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const loadThreads = async () => {
    setIsLoading(true);
    const data = await ownerService.getWhatsAppThreads();
    setThreads(data);
    if (data.length > 0 && !selectedThreadId) {
      setSelectedThreadId(data[0].id);
    }
    setIsLoading(false);
  };

  const loadQueue = async () => {
    setIsLoadingQueue(true);
    const qData = await ownerService.getWhatsAppQueue();
    setQueue(qData);
    setIsLoadingQueue(false);
  };

  const loadSettings = async () => {
    const s = await ownerService.getWhatsAppGatewaySettings();
    if (s) setGatewaySettings(s);
  };

  useEffect(() => {
    loadThreads();
    loadQueue();
    loadSettings();
  }, []);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = async (textToSend?: string, templateName?: string, category?: string) => {
    const text = textToSend || messageInput;
    if (!text.trim() || !selectedThread) return;

    setIsSending(true);
    await ownerService.sendWhatsAppMessage(selectedThread.id, text.trim(), templateName, 'owner', category);
    setMessageInput('');
    setIsSending(false);
    loadThreads();
    loadQueue();
  };

  const handleTemplateClick = (templateText: string, templateName: string, category: WhatsAppCategory) => {
    if (!selectedThread) return;
    const personalized = templateText
      .replace('{name}', selectedThread.customerName || 'Customer')
      .replace('{ref}', selectedThread.bookingId || 'Your Booking')
      .replace('{pickup}', selectedThread.pickupLocation || 'Pickup')
      .replace('{drop}', selectedThread.dropLocation || 'Destination');
    handleSendMessage(personalized, templateName, category);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewaySettings) return;
    setIsSavingSettings(true);
    const updated = await ownerService.updateWhatsAppGatewaySettings(gatewaySettings);
    if (updated) {
      setGatewaySettings(updated);
      setSettingsSuccessNotice(true);
      setTimeout(() => setSettingsSuccessNotice(false), 4000);
    }
    setIsSavingSettings(false);
  };

  const handleClearQueue = async () => {
    if (!window.confirm('Clear all items from WhatsApp dispatch queue?')) return;
    await ownerService.clearWhatsAppQueue();
    loadQueue();
  };

  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    setSimulationStatus(null);
    try {
      const mockBooking = {
        reference_id: `TJ-${Math.floor(10000 + Math.random() * 90000)}`,
        full_name: 'Dr. Arvind Rao',
        mobile_number: '9845012345',
        service_type: 'Outstation',
        pickup_location: 'Gokulam 3rd Stage, Mysuru',
        drop_location: 'Madikeri, Coorg',
        travel_date: '2026-10-18',
        pickup_time: '06:00 AM',
        total_estimated_fare: '4850',
      };

      const mockCustomer = {
        fullName: 'Dr. Arvind Rao',
        mobileNumber: '9845012345',
        isNewRegistration: true,
      };

      const mockDriver = {
        name: 'Ramesh Gowda',
        phone: '9845122340',
        plate: 'KA-09-EA-4401',
        model: 'Maruti Suzuki Dzire Prime',
      };

      const mockPayment = {
        bookingId: mockBooking.reference_id,
        customerName: mockBooking.full_name,
        customerPhone: mockBooking.mobile_number,
        paidAmount: 2000,
        balanceAmount: 2850,
        paymentMethod: 'ONLINE_UPI',
      };

      const success = await ownerService.triggerWhatsAppEvent({
        eventType: testEventType,
        bookingData: mockBooking,
        customerData: mockCustomer,
        driverData: mockDriver,
        paymentData: mockPayment,
      });

      if (success) {
        setSimulationStatus(`Dispatched ${testEventType} successfully! Check Queue and Live Chats.`);
        await loadQueue();
        await loadThreads();
      } else {
        setSimulationStatus(`Failed to trigger ${testEventType}. Check gateway settings.`);
      }
    } catch (err: any) {
      setSimulationStatus(`Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerPhone?.includes(searchQuery) ||
      t.bookingId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getDirectWhatsAppUrl = () => {
    if (!selectedThread?.customerPhone) return '#';
    const cleanDigits = selectedThread.customerPhone.replace(/\D/g, '');
    const phone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    return `https://wa.me/${phone}?text=${encodeURIComponent(
      `Hello ${selectedThread.customerName}, this is TRAVEL JUST Dispatch (+91 9740754400) regarding your booking #${selectedThread.bookingId || ''}.`
    )}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              CENTRALIZED BUSINESS WHATSAPP: +91 9740754400
            </span>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Unified Single Number Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            TRAVEL JUST WhatsApp Communication Center
          </h2>
          <p className="text-xs text-slate-500">
            Customer Login Alerts • Booking Confirmations • Fleet Manager Dispatches • Driver Duty Orders • Invoices
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('chats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'chats'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💬 Live Chats ({threads.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('queue');
                loadQueue();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📤 Dispatch Queue ({queue.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'templates'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 Templates Library
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('gateway')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'gateway'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ Gateway Settings
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              loadThreads();
              loadQueue();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            title="Refresh Threads and Notification Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: LIVE CHATS */}
      {activeSubTab === 'chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
          {/* Left Column: Thread List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by customer, phone, ride #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Filter by Category */}
              <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                {['ALL', 'CUSTOMER_LOGIN', 'BOOKING_LIFECYCLE', 'DRIVER_DISPATCH', 'PAYMENTS'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      categoryFilter === cat
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No conversations matching current filter.
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = t.id === selectedThread?.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedThreadId(t.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {t.customerName || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.lastMessageTimestamp
                            ? new Date(t.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span>{t.customerPhone}</span>
                        {t.bookingId && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-semibold text-[10px]">
                            #{t.bookingId}
                          </span>
                        )}
                        {t.category && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                            {t.category.split('_')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {t.lastMessageText || 'No messages yet'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center & Right Column: Chat Window & Booking Sidebar (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 px-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{selectedThread.customerName}</span>
                      {selectedThread.bookingId && (
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Ride #{selectedThread.bookingId}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{selectedThread.customerPhone}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{selectedThread.serviceType || 'Outstation'}</span>
                      {selectedThread.pickupLocation && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">From: {selectedThread.pickupLocation}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <a
                    href={getDirectWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-bold transition-colors shadow-xs"
                    title="Open official WhatsApp app with pre-filled message"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </a>
                </div>

                {/* Message List */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                  {selectedThread.messages?.map((msg) => {
                    const isFromOwner = msg.sender === 'owner' || msg.sender === 'system';
                    const isDriver = msg.sender === 'driver';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromOwner ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                          <span>{msg.senderName}</span>
                          {msg.templateName && (
                            <span className="bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-mono text-[9px]">
                              {msg.templateName}
                            </span>
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                            isFromOwner
                              ? 'bg-[#0a4d3c] text-white rounded-br-xs'
                              : isDriver
                              ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-bl-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                              isFromOwner ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <CheckCheck className="w-3 h-3 text-[#0ef10e]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Template Chips */}
                <div className="p-2.5 px-4 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-600">
                  <span className="font-bold text-slate-400 shrink-0 text-[10px] uppercase">Templates:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleTemplateClick(
                        'Namaskara {name}! Your TRAVEL JUST booking #{ref} has been received. Our Mysore dispatch team is reviewing your pickup.',
                        'booking_received',
                        'BOOKING_LIFECYCLE'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
                  >
                    Request Received
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTemplateClick(
                        'Booking Confirmed #{ref}! Chauffeur and clean air-conditioned cab are assigned. Driver will report 15 mins prior to pickup time.',
                        'booking_confirmed',
                        'BOOKING_LIFECYCLE'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
                  >
                    Booking Confirmed
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTemplateClick(
                        'Driver En Route: Your chauffeur has departed for pickup at {pickup}. Clean vehicle tracking and driver hotline are active.',
                        'driver_en_route',
                        'DRIVER_DISPATCH'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
                  >
                    Driver En Route
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTemplateClick(
                        'Trip Completed! Thank you for traveling with TRAVEL JUST. Download your official tax invoice here: https://www.traveljust.in',
                        'trip_completed',
                        'PAYMENTS'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
                  >
                    Trip Completed & Receipt
                  </button>
                </div>

                {/* Message Input Box */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a verified WhatsApp message to customer or dispatch desk..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !messageInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a conversation from the left to start messaging
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DISPATCH QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Centralized WhatsApp Dispatch Queue</span>
              </h3>
              <p className="text-xs text-slate-500">
                Audited outbound dispatch records for Customer logins, Booking status updates, Fleet notifications, and Receipts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadQueue}
                disabled={isLoadingQueue}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
                <span>Refresh Queue</span>
              </button>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Queue</span>
                </button>
              )}
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-60" />
              <p className="text-sm font-semibold text-slate-600">Dispatch Queue is Clear</p>
              <p className="text-xs text-slate-400">All outbound WhatsApp alerts have been processed and dispatched.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Recipient Role</th>
                    <th className="py-3 px-3">Recipient Phone</th>
                    <th className="py-3 px-3">Category / Template</th>
                    <th className="py-3 px-3">Message Content Preview</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.recipientRole === 'CUSTOMER'
                              ? 'bg-blue-100 text-blue-800'
                              : item.recipientRole === 'FLEET_MANAGER'
                              ? 'bg-purple-100 text-purple-800'
                              : item.recipientRole === 'DRIVER'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.recipientRole}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap font-bold text-slate-800">
                        {item.recipientPhone}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.templateName}</div>
                      </td>
                      <td className="py-3 px-3 max-w-[280px]">
                        <p className="line-clamp-2 text-slate-700 text-[11px] font-normal leading-relaxed">
                          {item.renderedText}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <a
                          href={item.directWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1ebd59] text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Send Now</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: TEMPLATES LIBRARY */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-base text-slate-900">Official WhatsApp Message Templates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly pre-approved communication formats for Customer, Driver, Fleet Manager, and Owner dispatch.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Template 1: Customer Login Alert */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    SECURITY / OWNER ALERT
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">customer_login_alert</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Customer Login & Registration Alert</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-700 text-[11px] leading-relaxed">
                  {`🔐 *TRAVEL JUST SECURITY ALERT: CUSTOMER LOGIN*
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* {{full_name}}
📱 *Mobile:* {{mobile_number}}
🕒 *Timestamp:* {{timestamp}}
📍 *Action:* Customer logged in to portal.
━━━━━━━━━━━━━━━━━━━━
Centralized Dispatch Desk: +91 9740754400`}
                </div>
              </div>

              {/* Template 2: Booking Confirmation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    CUSTOMER CONFIRMATION
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">booking_confirmation_customer</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Booking Confirmation & Details</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-700 text-[11px] leading-relaxed">
                  {`🚕 *TRAVEL JUST - BOOKING CONFIRMATION* 🔔
━━━━━━━━━━━━━━━━━━━━
✅ *Booking Request Received*
📌 *Ref ID:* #{{reference_id}}
🛣️ *Trip Mode:* {{service_type}}
📍 *Pickup:* {{pickup_location}}
🎯 *Drop:* {{drop_location}}
📅 *Date & Time:* {{travel_date}} at {{pickup_time}}
💰 *Estimated Fare:* ₹{{total_fare}}
━━━━━━━━━━━━━━━━━━━━
Your verified chauffeur & cab details will be sent shortly.`}
                </div>
              </div>

              {/* Template 3: Driver Duty Order */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    DRIVER DUTY ORDER
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">driver_duty_order</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Driver Duty Assignment Order</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-700 text-[11px] leading-relaxed">
                  {`🚕 *TRAVEL JUST - DRIVER DUTY ORDER #{{reference_id}}*
━━━━━━━━━━━━━━━━━━━━
Hello {{driver_name}}, you are assigned to ride #{{reference_id}}.
👤 *Passenger:* {{customer_name}} (+91 {{customer_phone}})
📍 *Pickup:* {{pickup_location}}
🎯 *Drop:* {{drop_location}}
⏰ *Time:* {{travel_date}} at {{pickup_time}}
🚘 *Your Vehicle:* {{cab_plate}}
Duty reminder: Report 15 mins prior. Keep AC active throughout.`}
                </div>
              </div>

              {/* Template 4: Payment Receipt */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    PAYMENT & INVOICE
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">payment_receipt_customer</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Payment Receipt & Invoice Summary</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-700 text-[11px] leading-relaxed">
                  {`💳 *PAYMENT RECEIPT - TRAVEL JUST #{{booking_id}}*
━━━━━━━━━━━━━━━━━━━━
Dear {{customer_name}},
We have received your payment of *₹{{paid_amount}}* via {{payment_method}}.
✅ Status: Fully Paid
Thank you for choosing TRAVEL JUST Mysuru!
🌐 Official Website: https://www.traveljust.in`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GATEWAY SETTINGS & SIMULATION TESTER */}
      {activeSubTab === 'gateway' && gatewaySettings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Gateway Settings Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Centralized WhatsApp Gateway Settings</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage official WhatsApp Business numbers, notification routing recipients, and automation switches.
              </p>
            </div>

            {settingsSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp Gateway configuration updated and synchronized successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Business WhatsApp
                  </label>
                  <input
                    type="text"
                    value={gatewaySettings.officialBusinessPhone}
                    onChange={(e) =>
                      setGatewaySettings({ ...gatewaySettings, officialBusinessPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400">Single authoritative business number.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Login Alert Recipient
                  </label>
                  <input
                    type="text"
                    value={gatewaySettings.defaultOwnerNotificationPhone}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        defaultOwnerNotificationPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Receives real-time customer login notifications.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fleet Manager Recipient
                  </label>
                  <input
                    type="text"
                    value={gatewaySettings.fleetManagerNotificationPhone}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        fleetManagerNotificationPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Receives new ride booking dispatch alerts.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gateway Dispatch Engine
                  </label>
                  <select
                    value={gatewaySettings.provider}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        provider: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="DIRECT_WHATSAPP_DEEPLINK">Direct WhatsApp Deep Link (wa.me)</option>
                    <option value="WHATSAPP_CLOUD_API">Meta WhatsApp Cloud API (WABA)</option>
                    <option value="MOCK_GATEWAY">Automated Simulation Gateway</option>
                  </select>
                  <span className="text-[10px] text-slate-400">High-reliability deep linking & API dispatch.</span>
                </div>
              </div>

              {/* Automation Switches */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Automated Trigger Switches
                </h4>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Customer Login Alerts</span>
                    <span className="text-[11px] text-slate-500">
                      Instantly notify Owner WhatsApp when a customer logs in or registers.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gatewaySettings.autoSendCustomerLoginAlerts}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        autoSendCustomerLoginAlerts: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Booking Lifecycle Alerts</span>
                    <span className="text-[11px] text-slate-500">
                      Notify customer & fleet manager when new booking is created or status changes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gatewaySettings.autoSendBookingLifecycleAlerts}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        autoSendBookingLifecycleAlerts: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Chauffeur & Vehicle Assignment</span>
                    <span className="text-[11px] text-slate-500">
                      Send driver details to customer and duty orders to driver.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gatewaySettings.autoSendDriverAssignmentAlerts}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        autoSendDriverAssignmentAlerts: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Payment Receipts</span>
                    <span className="text-[11px] text-slate-500">
                      Send verified receipt summary upon payment recording.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gatewaySettings.autoSendPaymentReceipts}
                    onChange={(e) =>
                      setGatewaySettings({
                        ...gatewaySettings,
                        autoSendPaymentReceipts: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Save Gateway Configuration</span>
              </button>
            </form>
          </div>

          {/* Right: Simulation Tester (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                <span>Live Event Trigger Simulator</span>
              </h3>
              <p className="text-xs text-slate-500">
                Simulate business events and verify instant multi-recipient dispatch into queue and threads.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Event To Test
                </label>
                <select
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="CUSTOMER_LOGIN">🔐 Customer Login / Registration Alert</option>
                  <option value="BOOKING_CREATED">🚕 New Booking Created (Customer + Manager)</option>
                  <option value="DRIVER_ASSIGNED">🚗 Driver Assigned (Customer + Driver Duty)</option>
                  <option value="PAYMENT_RECORDED">💳 Payment Received Receipt</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleTriggerSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Simulating...' : 'Dispatch Test Event'}</span>
              </button>

              {simulationStatus && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs font-medium">
                  {simulationStatus}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 space-y-1.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="font-bold text-emerald-800">✅ Architecture Guarantees:</div>
              <div>• Single unified sender: <strong>+91 9740754400</strong></div>
              <div>• Owner login alert recipient: <strong>+91 9740754400</strong></div>
              <div>• Auto-creates or links customer WhatsApp threads</div>
              <div>• Preserves all bookings, Google Maps, and fare engine calculations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
