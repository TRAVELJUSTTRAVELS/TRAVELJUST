import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Car,
  X,
  Send,
  Phone,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  FileCheck,
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { openWhatsAppChat } from '../utils/whatsapp';
import { BookingSearchState } from '../types';

interface WhatsAppChatButtonProps {
  searchState?: BookingSearchState | null;
}

export const WhatsAppChatButton: React.FC<WhatsAppChatButtonProps> = ({ searchState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'booking' | 'chat'>('booking');

  // Booking Confirmation Form State
  const [bookingRef, setBookingRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [pickupLoc, setPickupLoc] = useState(searchState?.pickupLocation || 'Mysuru');
  const [dropLoc, setDropLoc] = useState(searchState?.dropLocation || 'Bangalore Airport');
  const [travelDate, setTravelDate] = useState(searchState?.travelDate || '');
  const [travelTime, setTravelTime] = useState(searchState?.pickupTime || '06:00');
  const [serviceType, setServiceType] = useState(searchState?.serviceType || 'oneway');

  // Customer Direct Message State
  const [directMessage, setDirectMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Position & Drag state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startButtonPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Sync with incoming searchState
  useEffect(() => {
    if (searchState?.pickupLocation) setPickupLoc(searchState.pickupLocation);
    if (searchState?.dropLocation) setDropLoc(searchState.dropLocation);
    if (searchState?.travelDate) setTravelDate(searchState.travelDate);
    if (searchState?.pickupTime) setTravelTime(searchState.pickupTime);
    if (searchState?.serviceType) setServiceType(searchState.serviceType);
  }, [searchState]);

  // Initialize position on mount (bottom-left with 24px margin)
  useEffect(() => {
    const initX = 24;
    const initY = Math.max(80, window.innerHeight - 90);
    setPosition({ x: initX, y: initY });

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return { x: 24, y: Math.max(80, window.innerHeight - 90) };
        const maxX = window.innerWidth - 76;
        const maxY = window.innerHeight - 76;
        return {
          x: Math.min(Math.max(12, prev.x), Math.max(12, maxX)),
          y: Math.min(Math.max(12, prev.y), Math.max(12, maxY)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer Down (Mouse / Touch / Pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!position) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    startButtonPosRef.current = { x: position.x, y: position.y };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const deltaX = clientX - dragStartPosRef.current.x;
      const deltaY = clientY - dragStartPosRef.current.y;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }

      const rawNewX = startButtonPosRef.current.x + deltaX;
      const rawNewY = startButtonPosRef.current.y + deltaY;

      const maxX = window.innerWidth - 68;
      const maxY = window.innerHeight - 68;

      const clampedX = Math.min(Math.max(12, rawNewX), Math.max(12, maxX));
      const clampedY = Math.min(Math.max(12, rawNewY), Math.max(12, maxY));

      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isDragging) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // fallback
      }
      setIsDragging(false);
      if (!hasMovedRef.current) {
        setIsOpen((prev) => !prev);
      }
    },
    [isDragging]
  );

  // Global pointer listeners during drag
  useEffect(() => {
    if (!isDragging) return;

    const onWindowPointerMove = (e: PointerEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onWindowPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
    };
  }, [isDragging, handlePointerMove]);

  // Send Booking Confirmation to WhatsApp
  const handleSendBookingConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = bookingRef.trim() || `TJ-${Date.now().toString().slice(-6)}`;
    const cleanName = customerName.trim() || 'Valued Customer';
    const cleanDate = travelDate || 'Today / Scheduled';
    const cleanTime = travelTime || 'As scheduled';

    const message = `*🚕 TRAVEL JUST - BOOKING CONFIRMATION REQUEST*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *Booking Ref:* ${cleanRef}
👤 *Passenger:* ${cleanName}
📍 *Pickup:* ${pickupLoc}
🏁 *Drop:* ${dropLoc}
📅 *Date:* ${cleanDate}
⏰ *Time:* ${cleanTime}
🔄 *Service:* ${serviceType.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Please confirm my booking and dispatch chauffeur / vehicle details to this WhatsApp number. Thank you!`;

    openWhatsAppChat(message, siteConfig.contact.whatsapp);
    setIsOpen(false);
  };

  // Quick Communication Template Handler
  const handleQuickTemplate = (type: string) => {
    let msg = '';
    const cleanRef = bookingRef.trim() ? ` (Ref: ${bookingRef.trim()})` : '';

    switch (type) {
      case 'confirm_booking':
        msg = `*🚕 TRAVEL JUST - BOOKING CONFIRMATION*${cleanRef}
Hello Dispatch Team, please confirm my cab booking and share the assigned driver details.
• Pickup: ${pickupLoc}
• Drop: ${dropLoc}
• Date/Time: ${travelDate || 'Today'} at ${travelTime || '06:00'}`;
        break;

      case 'driver_details':
        msg = `*🚗 DRIVER ALLOCATION & STATUS CHECK*${cleanRef}
Namaskara TRAVEL JUST, please provide the chauffeur's name, contact number, and car registration number for my upcoming trip.`;
        break;

      case 'airport_flight':
        msg = `*✈️ AIRPORT PICKUP / FLIGHT COORDINATION*
Hello TRAVEL JUST Desk, I need to coordinate an airport transfer:
• Route: ${pickupLoc} ➔ ${dropLoc}
• Pickup Date & Time: ${travelDate || 'Today'} at ${travelTime || '06:00'}
Please advise driver meet point and confirm dispatch.`;
        break;

      case 'invoice':
        msg = `*📄 TAX INVOICE / BILL REQUEST*${cleanRef}
Namaskara, please send the official GST bill / trip receipt for my recent travel with TRAVEL JUST to my WhatsApp number.`;
        break;

      default:
        msg = `*🚕 TRAVEL JUST - CUSTOMER INQUIRY*
Hello TRAVEL JUST Support, I would like to inquire about cab availability and booking for route: ${pickupLoc} to ${dropLoc}.`;
    }

    openWhatsAppChat(msg, siteConfig.contact.whatsapp);
    setIsOpen(false);
  };

  // Send Direct Custom Message
  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMessage.trim()) return;

    const formattedMessage = `*💬 TRAVEL JUST - CUSTOMER COMMUNICATION*
${directMessage.trim()}

📍 Current Route Interest: ${pickupLoc} ➔ ${dropLoc}
📞 Contact: Via WhatsApp`;

    openWhatsAppChat(formattedMessage, siteConfig.contact.whatsapp);
    setDirectMessage('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Draggable Round Button with Car Logo */}
      <div
        ref={buttonRef}
        style={{
          position: 'fixed',
          left: position ? `${position.x}px` : '24px',
          top: position ? `${position.y}px` : 'auto',
          bottom: position ? 'auto' : '24px',
          zIndex: 49,
          touchAction: 'none',
        }}
        className="select-none"
      >
        <div className="relative group">
          {/* Pulsing Aura */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 blur-xs animate-ping pointer-events-none" />

          {/* Hover / Drag Tooltip */}
          {showTooltip && !isOpen && !isDragging && (
            <div className="mb-2 -translate-y-1 bg-slate-950/95 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in duration-150 flex items-center gap-2 whitespace-nowrap pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
              <span>WhatsApp Booking Desk & Customer Communication • Drag anywhere</span>
            </div>
          )}

          {/* Draggable Circle Button */}
          <button
            id="whatsapp-floating-car-btn"
            type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Open WhatsApp Booking Confirmations & Customer Communication. Drag to move anywhere."
            className={`relative w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-[#25D366]/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white ring-3 ring-[#25D366]/30 focus:outline-none ${
              isDragging ? 'cursor-grabbing ring-4 ring-[#25D366]/70 shadow-2xl scale-105' : 'cursor-grab'
            }`}
          >
            {/* White Car Logo */}
            <div className="flex items-center justify-center pointer-events-none relative">
              <Car className="w-7 h-7 stroke-[2.3] text-white drop-shadow-xs" />
            </div>
          </button>
        </div>
      </div>

      {/* WhatsApp Booking Confirmation & Customer Communication Window */}
      {isOpen && (
        <div
          className="fixed inset-0 sm:inset-auto z-50 flex items-end sm:items-start justify-center sm:justify-start animate-in fade-in duration-200 p-3 sm:p-0"
          style={
            position && window.innerWidth >= 640
              ? {
                  left: `${Math.min(Math.max(16, position.x), window.innerWidth - 410)}px`,
                  top: `${Math.max(16, Math.min(position.y - 530, window.innerHeight - 560))}px`,
                }
              : {}
          }
        >
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-sm sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[580px] z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-[#128C7E] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shadow-inner">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    <span>TRAVEL JUST WhatsApp Desk</span>
                  </h4>
                  <span className="text-[11px] text-emerald-100 font-medium block">
                    Online 24/7 • Booking Confirmations & Support
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Close WhatsApp Desk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('booking')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'booking'
                    ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Booking Confirmation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Customer Chat</span>
              </button>
            </div>

            {/* Tab 1: Booking Confirmation & Status */}
            {activeTab === 'booking' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-950 text-xs">Official WhatsApp Booking Desk</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Instant booking confirmation, driver tracking, and electronic receipts directly via WhatsApp.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendBookingConfirmation} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Passenger Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Pickup City / Area
                      </label>
                      <input
                        type="text"
                        value={pickupLoc}
                        onChange={(e) => setPickupLoc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Drop Destination
                      </label>
                      <input
                        type="text"
                        value={dropLoc}
                        onChange={(e) => setDropLoc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Travel Date
                      </label>
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={travelTime}
                        onChange={(e) => setTravelTime(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Booking Reference ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TJ-849201"
                      value={bookingRef}
                      onChange={(e) => setBookingRef(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Booking Confirmation to WhatsApp</span>
                  </button>
                </form>

                {/* Quick Action Chips */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Quick Booking Inquiries
                  </p>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickTemplate('driver_details')}
                      className="text-left p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
                    >
                      <p className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Driver Details
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Check cab & chauffeur</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickTemplate('airport_flight')}
                      className="text-left p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
                    >
                      <p className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> Airport Transfer
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Coordinate BLR pickup</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Direct Customer Communication */}
            {activeTab === 'chat' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <p className="font-bold text-slate-900 text-xs mb-1">Direct Chauffeur & Dispatch Helpline</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Have custom travel requirements or special luggage requests? Type your message below to start a direct chat with our Mysuru dispatch team.
                  </p>
                </div>

                <form onSubmit={handleSendDirectMessage} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Message / Inquiry
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Need Innova Crysta for 4-day Coorg & Ooty tour with pickup from Vijayanagar Mysuru..."
                      value={directMessage}
                      onChange={(e) => setDirectMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!directMessage.trim()}
                    className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open WhatsApp Chat</span>
                  </button>
                </form>

                {/* Common Customer Communication Topics */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Instant Topics
                  </p>

                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('confirm_booking')}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 text-[11px]">Check Today's Booking Status</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('invoice')}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 text-[11px]">Request Tax Invoice / GST Bill</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Footer with Direct Call hotline */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-600">
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call: {siteConfig.contact.phone}</span>
              </a>

              <a
                href={`https://wa.me/${siteConfig.contact.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>Direct WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
