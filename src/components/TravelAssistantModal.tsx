import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Car,
  MapPin,
  Calendar,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  Phone,
  ShieldCheck,
  Bot,
  User,
} from 'lucide-react';
import {
  askTravelAssistant,
  ChatMessage,
} from '../services/geminiAssistantService';
import { CustomerUser } from '../types';

interface TravelAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerUser | null;
  onBookRideClick?: () => void;
  onOpenTrackBooking?: (referenceId: string) => void;
  onOpenFleet?: () => void;
}

const INITIAL_PROMPT_CHIPS = [
  '🔍 Track booking status',
  '✈️ What is the cab fare to BLR Airport?',
  '🏔️ Suggest a 2-day Coorg trip itinerary',
  '🚖 Which vehicle is best for 6 passengers?',
  '⏱️ What are local Mysore hourly packages?',
];

export const TravelAssistantModal: React.FC<TravelAssistantModalProps> = ({
  isOpen,
  onClose,
  customer,
  onBookRideClick,
  onOpenTrackBooking,
  onOpenFleet,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: `Hello ${customer ? customer.fullName : 'Traveler'}! I am the **TRAVEL JUST Intelligent Concierge**.\n\nI can help you plan your journey, explain transparent fares, recommend scenic itineraries across South India, or track your live booking status.\n\nWhat can I assist you with today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const assistantMsg = await askTravelAssistant(
        trimmed,
        messages,
        customer?.mobileNumber
      );
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Error from travel assistant:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an error retrieving data. You can always reach our 24/7 human dispatch helpline at **+91 97407 54400**.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleChipClick = (chipText: string) => {
    // Strip leading emoji for cleaner input if desired
    const clean = chipText.replace(/^[^\w\s]+\s*/, '');
    handleSendMessage(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[640px] max-h-[92vh] text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  TRAVEL JUST AI Concierge
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Grounded travel planning, live booking status, and fare guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History Messages */}
        <div
          ref={chatScrollRef}
          className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50 dark:bg-slate-950/40 text-xs sm:text-sm"
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-2xs ${
                    isMe
                      ? 'bg-emerald-800 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs'
                  }`}
                >
                  {/* Message Body with clean markdown linebreaks */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Grounded Verified Booking Card if available */}
                  {msg.bookingCard && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-200 text-xs space-y-2 mt-2">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                          #{msg.bookingCard.referenceId}
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] uppercase">
                          {msg.bookingCard.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div>
                          <strong>Route:</strong> {msg.bookingCard.pickupLocation} →{' '}
                          {msg.bookingCard.dropLocation || 'Local Package'}
                        </div>
                        <div>
                          <strong>Date:</strong> {msg.bookingCard.travelDate} at{' '}
                          {msg.bookingCard.pickupTime}
                        </div>
                        <div>
                          <strong>Vehicle:</strong> {msg.bookingCard.vehicleName} (₹
                          {msg.bookingCard.fare.toLocaleString('en-IN')})
                        </div>
                        {msg.bookingCard.driverName && (
                          <div className="text-emerald-800 dark:text-emerald-400 font-semibold">
                            Chauffeur: {msg.bookingCard.driverName} (
                            {msg.bookingCard.driverPlate || 'Yellow Board'})
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interactive Quick Action Button if present */}
                  {msg.suggestedAction && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (msg.suggestedAction?.type === 'track_ride') {
                            onClose();
                            onOpenTrackBooking?.(msg.suggestedAction.data);
                          } else if (msg.suggestedAction?.type === 'book_ride') {
                            onClose();
                            onBookRideClick?.();
                          } else if (msg.suggestedAction?.type === 'view_fleet') {
                            onClose();
                            onOpenFleet?.();
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer ${
                          isMe
                            ? 'bg-white text-emerald-900 hover:bg-emerald-50'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        }`}
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] text-right ${
                      isMe ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {isMe && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 rounded-tl-xs flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span className="text-xs">Consulting TRAVEL JUST operations knowledge...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar shrink-0">
          {INITIAL_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isTyping}
              onClick={() => handleChipClick(chip)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              placeholder="Ask anything about destinations, fares, or enter TJ-12345 to track..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="p-2.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
