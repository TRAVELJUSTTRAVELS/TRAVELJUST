import React, { useState, useRef, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  ShieldCheck,
  Car,
  ChevronRight,
  HelpCircle,
  Clock,
  Loader2,
  CheckCircle,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { GroundedPlace } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isAiGenerated?: boolean;
  groundedPlaces?: GroundedPlace[];
  mapsGrounded?: boolean;
}

const CATEGORY_PROMPTS = [
  {
    category: 'Mysuru Layouts',
    prompts: [
      'Doorstep pickup in Rajiv Nagar 2nd Stage',
      'Cab pickup in Vijayanagar 4th Stage',
      'Gokulam Contour Road cab to Airport',
      'Kuvempunagar doorstep drop & timing',
      'Bogadi 2nd Stage doorstep cab',
    ],
  },
  {
    category: 'Mysuru Areas & Hubs',
    prompts: [
      'Hebbal Infosys Gate 1 doorstep pickup',
      'Hootagalli Industrial Area BEML cab',
      'Kadakola KIADB doorstep drop',
      'Mysuru Airport (MYQ) cab pickup',
    ],
  },
  {
    category: 'Mysuru Roads & Arteries',
    prompts: [
      'Outer Ring Road 10-15 min cab dispatch',
      'D. Devaraja Urs Road shopping pickup',
      'Sayyaji Rao Road pickup near Palace',
      'Kalidasa Road V.V. Mohalla dinner cab',
    ],
  },
  {
    category: 'Sightseeing & Policies',
    prompts: [
      'Mysore Palace & Chamundi Hill 8h tour',
      'Mysuru to Bangalore Airport (BLR) transfer',
      'What vehicles are available for 6-7 passengers?',
      'What is your free cancellation & toll policy?',
    ],
  },
];

export const ContactAIChat: React.FC<{ onBookRideClick?: () => void }> = ({ onBookRideClick }) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! 👋 I'm your **TRAVEL JUST AI Travel & Concierge Assistant** with real-time **Google Maps Grounding**.

🚕 **100% Doorstep Pickup & Drop Support across Mysuru / Mysore:**
- **Mysuru Layouts:** Vijayanagar, Gokulam, Kuvempunagar, Rajiv Nagar (1st & 2nd Stage), Jayalakshmipuram, Saraswathipuram, J.P. Nagar, Bogadi, Dattagalli, Ramakrishna Nagar, Bannimantap, Siddhartha Layout, Sathgalli, and more.
- **Mysuru Areas & Tech Hubs:** Hebbal Infosys Campus (Gates 1 & 2), Hootagalli (BEML, Wipro, Axles), Koorgalli (TVS), Kadakola KIADB, and Mysuru Airport.
- **Mysuru Roads & Corridors:** Outer Ring Road (ORR 42 km ring), D. Devaraja Urs Road, Sayyaji Rao Road, Kalidasa Road, and Contour Road.
- **Fast Dispatch:** Chauffeurs arrive at your residence, apartment gate, hotel, or hospital in **10–15 minutes**.

Ask me about any pickup location, local road, Bangalore Airport transfer, or outstation package with live Google Maps place links!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: true,
      mapsGrounded: true,
      groundedPlaces: [
        {
          title: "Rajiv Nagar, Mysuru",
          uri: "https://www.google.com/maps/search/?api=1&query=Rajiv+Nagar+Mysuru+Karnataka",
          reviewSnippet: "Major eastern residential layout with 24/7 doorstep cab pickup and direct Ring Road access.",
          address: "Rajiv Nagar, Mysuru, Karnataka 570019",
        },
        {
          title: "Outer Ring Road - Mysuru (6-Lane Expressway Ring)",
          uri: "https://www.google.com/maps/search/?api=1&query=Outer+Ring+Road+Mysuru+Karnataka",
          reviewSnippet: "42 km bypass corridor connecting all 45+ Mysuru layouts for rapid 10-15 min dispatch.",
          address: "Outer Ring Rd, Mysuru, Karnataka 570017",
        },
        {
          title: "Mysore Palace (Amba Vilas)",
          uri: "https://www.google.com/maps/search/?api=1&query=Mysore+Palace+Sayyaji+Rao+Road+Mysuru",
          reviewSnippet: "Iconic royal palace with curbside chauffeur pickup at Varaha and Balarama gates.",
          address: "Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka 570001",
        },
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Attempt to acquire geolocation gracefully if allowed by frame
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          // Default to Mysuru center coordinates
          setUserLocation({ lat: 12.2958, lng: 76.6394 });
        },
        { timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build previous conversation history for context
      const historyContext = messages
        .filter((m) => m.id !== 'welcome-1')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content,
        }));

      const res = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: [...historyContext, { role: 'user', content: query }],
          userLocation: userLocation || { lat: 12.2958, lng: 76.6394 },
          enableMapsGrounding: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantReply =
        data.reply ||
        `I apologize, but I could not retrieve that information right now. Please contact our 24/7 helpline at ${siteConfig.contact.phone}.`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: data.aiGenerated !== false,
        groundedPlaces: Array.isArray(data.groundedPlaces) ? data.groundedPlaces : [],
        mapsGrounded: Boolean(data.mapsGrounded),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: `### 🛡️ TRAVEL JUST Quick Policy Overview\n\n- **Free Cancellation:** Up to 4 hours prior to scheduled pickup time.\n- **Fleet Availability:** 4+1 Sedans (Etios, Dzire), 6+1 MUVs (Ertiga), and 6/7+1 Premium SUVs (Innova, Innova Crysta) ready for 24/7 dispatch.\n- **Tolls & Inclusions:** Fuel and vehicle rental included. Tolls & parking billed as actuals via FASTag.\n- **Support:** Call our 24/7 support line at ${siteConfig.contact.phone} for immediate assistance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: false,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Hello! 👋 I'm your **TRAVEL JUST AI Travel & Concierge Assistant** with real-time **Google Maps Grounding**.

🚕 **100% Doorstep Pickup & Drop Support across Mysuru / Mysore:**
- **Mysuru Layouts:** Vijayanagar, Gokulam, Kuvempunagar, Rajiv Nagar (1st & 2nd Stage), Jayalakshmipuram, Saraswathipuram, J.P. Nagar, Bogadi, Dattagalli, Ramakrishna Nagar, Bannimantap, Siddhartha Layout, Sathgalli, and more.
- **Mysuru Areas & Tech Hubs:** Hebbal Infosys Campus (Gates 1 & 2), Hootagalli (BEML, Wipro, Axles), Koorgalli (TVS), Kadakola KIADB, and Mysuru Airport.
- **Mysuru Roads & Corridors:** Outer Ring Road (ORR 42 km ring), D. Devaraja Urs Road, Sayyaji Rao Road, Kalidasa Road, and Contour Road.
- **Fast Dispatch:** Chauffeurs arrive at your residence, apartment gate, hotel, or hospital in **10–15 minutes**.

Ask me about any pickup location, local road, Bangalore Airport transfer, or outstation package with live Google Maps place links!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: true,
        mapsGrounded: true,
        groundedPlaces: [
          {
            title: "Rajiv Nagar, Mysuru",
            uri: "https://www.google.com/maps/search/?api=1&query=Rajiv+Nagar+Mysuru+Karnataka",
            reviewSnippet: "Major eastern residential layout with 24/7 doorstep cab pickup and direct Ring Road access.",
            address: "Rajiv Nagar, Mysuru, Karnataka 570019",
          },
          {
            title: "Outer Ring Road - Mysuru (6-Lane Expressway Ring)",
            uri: "https://www.google.com/maps/search/?api=1&query=Outer+Ring+Road+Mysuru+Karnataka",
            reviewSnippet: "42 km bypass corridor connecting all 45+ Mysuru layouts for rapid 10-15 min dispatch.",
            address: "Outer Ring Rd, Mysuru, Karnataka 570017",
          },
          {
            title: "Mysore Palace (Amba Vilas)",
            uri: "https://www.google.com/maps/search/?api=1&query=Mysore+Palace+Sayyaji+Rao+Road+Mysuru",
            reviewSnippet: "Iconic royal palace with curbside chauffeur pickup at Varaha and Balarama gates.",
            address: "Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka 570001",
          },
        ],
      },
    ]);
  };

  // Helper function to render markdown-like content cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-extrabold text-sm sm:text-base text-slate-900 mt-2 mb-1">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-slate-800">
                <span className="font-bold text-emerald-800 shrink-0">{numMatch?.[1]}.</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatInlineMarkdown(numMatch?.[2] || trimmed),
                  }}
                />
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-slate-800"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
            />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');
  };

  return (
    <div className="flex flex-col h-[560px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm tracking-tight text-white">AI Travel & Doorstep Concierge</h3>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 font-semibold border border-emerald-700">
                <Compass className="w-2.5 h-2.5 text-emerald-300" /> Mysuru Doorstep Pickup · Maps Grounded
              </span>
            </div>
            <p className="text-[11px] text-emerald-200">Real-time Google Maps place links, Mysuru layouts & arterial road transit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBookRideClick && (
            <button
              type="button"
              onClick={onBookRideClick}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors shadow-2xs"
            >
              <Car className="w-3.5 h-3.5" /> Book Cab
            </button>
          )}

          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors text-xs flex items-center gap-1"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[95%] sm:max-w-[88%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-800 text-white shadow-2xs'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble Container */}
            <div className="group relative space-y-1 flex-1 min-w-0">
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                ) : (
                  <>
                    {renderFormattedContent(msg.content)}

                    {/* Google Maps Grounded Places Display */}
                    {msg.groundedPlaces && msg.groundedPlaces.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Google Maps Verified Places & Pitstops:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.groundedPlaces.map((place, pIdx) => (
                            <a
                              key={pIdx}
                              href={place.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition-all text-left flex flex-col justify-between group/place shadow-2xs"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-xs text-slate-900 group-hover/place:text-emerald-900 line-clamp-1">
                                    {place.title}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover/place:text-emerald-700 shrink-0 mt-0.5" />
                                </div>
                                {place.reviewSnippet && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                                    "{place.reviewSnippet}"
                                  </p>
                                )}
                                {place.address && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                    {place.address}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                                <span>Open in Google Maps</span>
                                <span className="text-slate-400 font-normal">Maps ↗</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Timestamp & Copy action */}
              <div
                className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-700 flex items-center gap-0.5"
                    title="Copy answer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>Analyzing TRAVEL JUST travel policies & fleet database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Category Tabs & Quick Prompt Chips */}
      <div className="bg-slate-100/90 border-t border-slate-200/80 px-3 py-2 space-y-1.5 shrink-0">
        {/* Category switcher pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <HelpCircle className="w-3 h-3 text-emerald-700" /> Categories:
          </span>
          {CATEGORY_PROMPTS.map((cat, cIdx) => (
            <button
              key={cIdx}
              type="button"
              onClick={() => setSelectedCategoryIndex(cIdx)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCategoryIndex === cIdx
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-emerald-900 border border-slate-200'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* Prompts list for selected category */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORY_PROMPTS[selectedCategoryIndex].prompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] font-medium text-slate-700 hover:text-emerald-900 whitespace-nowrap transition-colors shadow-2xs shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar Footer */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about Rajiv Nagar, Gokulam, Outer Ring Road, Devaraja Urs Road, Airport cab..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Official TRAVEL JUST verified policies
          </span>
          {onBookRideClick && (
            <button
              type="button"
              onClick={onBookRideClick}
              className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              Book ride
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
