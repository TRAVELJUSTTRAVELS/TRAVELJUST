import React, { useState, useRef } from 'react';
import { Sparkles, X, Send, Bot, Car, Users, ArrowRight, MessageSquare, CheckCircle2, Phone, GripVertical } from 'lucide-react';
import { AnimatedHumanAvatar } from './AnimatedHumanAvatar';
import { BookingSearchState } from '../types';
import { vehiclesData } from '../data/vehicles';
import { siteConfig } from '../config/siteConfig';

interface AIQuoteFloatingWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onApplyToSearch: (state: BookingSearchState) => void;
}

interface AIQuoteResult {
  reply: string;
  estimatedFareMin?: number;
  estimatedFareMax?: number;
  recommendedVehicle?: string;
  distanceKm?: number;
  travelTimeHours?: number;
  tips?: string[];
  aiGenerated?: boolean;
}

export const AIQuoteFloatingWidget: React.FC<AIQuoteFloatingWidgetProps> = ({
  isOpen,
  onClose,
  onOpen,
  onApplyToSearch,
}) => {
  const [pickup, setPickup] = useState('Mysuru');
  const [drop, setDrop] = useState('Bangalore Airport');
  const [passengers, setPassengers] = useState<number>(2);
  const [vehicleType, setVehicleType] = useState('all');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<AIQuoteResult | null>(null);

  // Moveable floating button state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  }>({ startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false });

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
      moved: false,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.startX === 0 && dragRef.current.startY === 0) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }
    setPos({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (!dragRef.current.moved) {
      onOpen();
    }
    dragRef.current.startX = 0;
    dragRef.current.startY = 0;
    setTimeout(() => setIsDragging(false), 50);
  };

  const quickPresets = [
    { label: 'Mysuru ➔ Bangalore Airport', pickup: 'Mysuru City', drop: 'Kempegowda Int. Airport Bangalore', pax: 2 },
    { label: 'Mysuru ➔ Coorg (Madikeri)', pickup: 'Mysuru', drop: 'Madikeri Coorg', pax: 4 },
    { label: 'Mysuru ➔ Ooty Hill Station', pickup: 'Mysuru', drop: 'Ooty Tamil Nadu', pax: 4 },
    { label: 'Mysuru Full Day Local (8h/80km)', pickup: 'Mysuru Hotel', drop: 'Mysuru Sightseeing', pax: 3 },
  ];

  const handleFetchQuote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setQuoteResult(null);

    try {
      const response = await fetch('/api/ai-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          pickup: pickup.trim(),
          drop: drop.trim(),
          passengers,
          vehicleType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setQuoteResult(data);
      } else {
        setQuoteResult({
          reply: `Here is your estimated cab fare for ${pickup} to ${drop}: ₹${passengers > 4 ? '3,200 - ₹3,800' : '2,200 - ₹2,700'}. Includes vehicle, fuel & driver allowance.`,
          estimatedFareMin: passengers > 4 ? 3200 : 2200,
          estimatedFareMax: passengers > 4 ? 3800 : 2700,
          recommendedVehicle: passengers > 4 ? 'ERTIGA (6+1)' : 'SWIFT DESIRE (4+1)',
          distanceKm: 145,
          travelTimeHours: 3.5,
          tips: ['Clean AC cab guaranteed', 'Doorstep pickup in Mysuru'],
        });
      }
    } catch (err) {
      console.error('Quote fetch error:', err);
      // Friendly fallback quote
      const rec = passengers > 4 ? 'ERTIGA (6+1)' : 'SWIFT DESIRE (4+1)';
      setQuoteResult({
        reply: `Instant Quote for ${pickup} to ${drop}:\n• Estimated Price: ₹${passengers > 4 ? '3,200 - ₹3,800' : '2,200 - ₹2,700'}\n• Recommended Cab: ${rec}\n• Includes AC vehicle, driver allowance & fuel.`,
        estimatedFareMin: passengers > 4 ? 3200 : 2200,
        estimatedFareMax: passengers > 4 ? 3800 : 2700,
        recommendedVehicle: rec,
        distanceKm: 145,
        travelTimeHours: 3.5,
        tips: ['Free 30-minute waiting time for airport drops', '24/7 customer support via +91 9740754400'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyQuoteToForm = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split('T')[0];

    // Find vehicle id matching recommended string
    let matchedId = 'all';
    if (quoteResult?.recommendedVehicle) {
      const match = vehiclesData.find((v) =>
        quoteResult.recommendedVehicle?.toLowerCase().includes(v.id.toLowerCase()) ||
        v.name.toLowerCase().includes(quoteResult.recommendedVehicle?.toLowerCase() || '')
      );
      if (match) matchedId = match.id;
    }

    onApplyToSearch({
      serviceType: drop.toLowerCase().includes('airport') ? 'airport' : 'oneway',
      pickupLocation: pickup,
      dropLocation: drop,
      travelDate: tomorrowStr,
      pickupDate: tomorrowStr,
      pickupTime: '09:00',
      dropDate: tomorrowStr,
      durationHours: 8,
      airportTransferType: drop.toLowerCase().includes('airport') ? 'drop' : 'pickup',
      passengers,
      vehicleType: matchedId,
    });

    onClose();
  };

  const handleWhatsAppBooking = () => {
    const msg = `Hello Travel Just Mysuru! I would like to book a cab:\n📍 Route: ${pickup} to ${drop}\n👥 Passengers: ${passengers}\n🚗 Vehicle: ${quoteResult?.recommendedVehicle || 'Cab'}\n💰 Estimated Fare: ₹${quoteResult?.estimatedFareMin || 2200} - ₹${quoteResult?.estimatedFareMax || 2800}`;
    const url = `https://wa.me/919740754400?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating Action Button (Always Visible when Widget Drawer is Closed) */}
      {!isOpen && (
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            touchAction: 'none',
          }}
          className={`fixed bottom-5 right-5 z-50 group flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white py-1.5 px-3 rounded-full shadow-md hover:shadow-emerald-900/40 ring-1.5 ring-emerald-500/20 focus:outline-none cursor-grab active:cursor-grabbing select-none transition-all ${
            isDragging ? 'scale-105 shadow-emerald-900/60 opacity-95' : 'hover:scale-105 active:scale-95'
          }`}
          title="Drag to move anywhere or click to open AI Travel Expert"
        >
          <AnimatedHumanAvatar size="sm" isSpeaking={false} />
          <div className="text-left pr-1">
            <span className="text-[9px] font-semibold leading-tight block text-emerald-200 tracking-wide uppercase">
              Say Hello To
            </span>
            <span className="font-black text-[11px] sm:text-xs leading-tight block text-white tracking-tight whitespace-nowrap">
              TRAVEL EXPERT
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        </button>
      )}

      {/* Drawer Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-emerald-800/40">
              <div className="flex items-center gap-3">
                <AnimatedHumanAvatar size="md" isSpeaking={loading} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Details
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 text-sm">
              {/* Interactive Input Form */}
              <form onSubmit={handleFetchQuote} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="e.g. Mysuru Palace / Gokulam"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Drop Destination
                    </label>
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="e.g. Bangalore Airport / Ooty"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Passengers
                    </label>
                    <select
                      value={passengers}
                      onChange={(e) => setPassengers(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Vehicle Preference
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="all">Any Suitable Cab</option>
                      {vehiclesData.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Special Query or Route Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Traveling with 4 big suitcases, need clean AC cab"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>T J AI is Calculating Quote...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Get Instant Fare Quote</span>
                    </>
                  )}
                </button>
              </form>

              {/* AI Quote Result Section */}
              {quoteResult && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <AnimatedHumanAvatar size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-900">
                          T J Fare Analysis
                        </span>
                        {quoteResult.aiGenerated && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Gemini AI • Maps Grounded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed font-medium">
                        {quoteResult.reply}
                      </p>
                    </div>
                  </div>

                  {/* Highlight Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60">
                    {quoteResult.estimatedFareMin && (
                      <div className="bg-white p-2 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Est. Price</span>
                        <span className="font-extrabold text-sm text-emerald-900">
                          ₹{Number(quoteResult.estimatedFareMin ?? 0).toLocaleString('en-IN')} - ₹{Number(quoteResult.estimatedFareMax ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {quoteResult.recommendedVehicle && (
                      <div className="bg-white p-2 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Recommended Cab</span>
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {quoteResult.recommendedVehicle}
                        </span>
                      </div>
                    )}

                    {quoteResult.travelTimeHours && (
                      <div className="bg-white p-2 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Est. Time</span>
                        <span className="font-bold text-xs text-slate-900">
                          ~{quoteResult.travelTimeHours} Hours
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Travel Tips */}
                  {quoteResult.tips && quoteResult.tips.length > 0 && (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        💡 Key Tips & Inclusions
                      </span>
                      {quoteResult.tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={handleApplyQuoteToForm}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.99]"
                    >
                      <span>Apply to Search Form</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleWhatsAppBooking}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Book via WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-500">
                24/7 Support: <a href="tel:+919740754400" className="font-bold text-emerald-800 hover:underline">+91 9740754400</a> • Travel Just Mysuru
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
