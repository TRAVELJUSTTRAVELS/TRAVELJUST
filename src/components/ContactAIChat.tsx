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
  Loader2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Compass,
  Search,
  Globe,
  FileText,
  Download,
  Share2,
  Paperclip,
  X,
  Zap,
  BrainCircuit,
  FileDown,
  Printer,
  ChevronDown,
  ChevronUp,
  Film,
} from 'lucide-react';
import {
  GroundedPlace,
  GroundedSearchSource,
  BookingDraftPlan,
  AIModelTier,
  AIGroundingMode,
} from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isAiGenerated?: boolean;
  groundedPlaces?: GroundedPlace[];
  searchSources?: GroundedSearchSource[];
  searchQueries?: string[];
  searchGrounded?: boolean;
  mapsGrounded?: boolean;
  modelUsed?: string;
  thinkingLevel?: string;
  isComplexWork?: boolean;
  bookingDraft?: BookingDraftPlan | null;
  attachedFile?: { name: string; type: string };
}

const CATEGORY_PROMPTS = [
  {
    category: '✨ Complex Itineraries & Pro Work',
    prompts: [
      'Plan a 3-Day Mysuru, Coorg & Wayanad trip with vehicle & budget',
      'Corporate fleet calculation for 20 passengers with luggage to Bangalore',
      'Detailed route comparison: NH 275 Expressway vs Kanakapura Road',
      'Mysuru to Kempegowda Airport (BLR) transfer with terminal guide',
    ],
  },
  {
    category: '🌐 Real-Time Search Grounding',
    prompts: [
      'Bangalore-Mysore Expressway live toll rates 2026',
      'Kempegowda Airport Terminal 2 cab pickup rules & wait time',
      'Bandipur Tiger Reserve safari timings and road closure rules',
      'Mysuru weather and road condition today',
    ],
  },
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
];

interface ContactAIChatProps {
  onBookRideClick?: () => void;
  onApplyBookingPlan?: (plan: BookingDraftPlan) => void;
  onOpenTravelStudio?: (initialTab?: 'video' | 'create-image' | 'edit-image') => void;
}

export const ContactAIChat: React.FC<ContactAIChatProps> = ({
  onBookRideClick,
  onApplyBookingPlan,
  onOpenTravelStudio,
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [modelTier, setModelTier] = useState<AIModelTier>('auto');
  const [groundingMode, setGroundingMode] = useState<AIGroundingMode>('auto');
  const [enableThinking, setEnableThinking] = useState(true);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Attached file state for Work Agent
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: string;
    size: number;
    textContent?: string;
    base64Data?: string;
  } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! 👋 I'm your **TRAVEL JUST AI Travel Concierge & Work Agent** powered by **Gemini Intelligence Pro** with **High Thinking (extended reasoning)**, **Real-Time Google Search Grounding**, and **Google Maps Grounding**.

🚕 **Advanced Capabilities Across Apps & Files:**
- **Act Across Apps:** Recommend custom tour routes or transfers and click **"Apply to Booking Form"** to automatically pre-fill your pickup, drop, vehicle, and schedule!
- **Act Across Files:** Download structured **Itinerary Documents (.txt)** or **Trip Drafts (.json)** for travel vouchers, expense accounting, and family sharing.
- **Upload Tickets / Documents:** Click the 📎 clip below to upload a flight ticket, hotel booking, or itinerary document for automated scheduling.
- **Real-Time Web Search:** Live Bangalore-Mysore expressway toll updates, airport terminal guidelines, and weather status.
- **100% Doorstep Pickup Across Mysuru:** Rajiv Nagar (1st & 2nd Stage), Vijayanagar, Gokulam, Kuvempunagar, Hebbal/Infosys, Hootagalli, Outer Ring Road (10–15 min dispatch).

How can I assist your travel across Mysuru and South India today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: true,
      mapsGrounded: true,
      searchGrounded: true,
      modelUsed: 'gemini-3.1-pro-preview',
      thinkingLevel: 'HIGH',
      isComplexWork: true,
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
      searchSources: [
        {
          title: "Bangalore Mysore Expressway (NH 275) Toll Rates & Traffic Guidelines",
          uri: "https://en.wikipedia.org/wiki/Bengaluru%E2%80%93Mysuru_Expressway",
        },
        {
          title: "Kempegowda International Airport Bengaluru (BLR) Official Terminal Guide",
          uri: "https://www.bengaluruairport.com/",
        },
      ],
      searchQueries: [
        "bangalore mysore expressway toll rates 2026",
        "mysuru cab doorstep pickup rajiv nagar",
      ],
      bookingDraft: {
        serviceType: 'airport',
        pickupLocation: 'Rajiv Nagar, Mysuru',
        dropLocation: 'Kempegowda International Airport (BLR)',
        vehicleType: 'sedan',
        durationHours: 4,
        passengers: 2,
        tripSummary: 'AIRPORT Cab · Rajiv Nagar, Mysuru ➔ Kempegowda International Airport (BLR)',
      },
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedDraftId, setAppliedDraftId] = useState<string | null>(null);
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
        () => {
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

  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json');

    if (isText) {
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          textContent: (reader.result as string) || '',
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64Data: (reader.result as string) || '',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if ((!query && !attachedFile) || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const fileForMsg = attachedFile
      ? { name: attachedFile.name, type: attachedFile.type }
      : undefined;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query || `Uploaded document for travel analysis: ${attachedFile?.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFile: fileForMsg,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    const currentAttachedFile = attachedFile;
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          enableMapsGrounding: groundingMode !== 'search',
          groundingMode,
          modelTier,
          enableThinking,
          attachedFile: currentAttachedFile
            ? {
                name: currentAttachedFile.name,
                type: currentAttachedFile.type,
                textContent: currentAttachedFile.textContent,
                base64Data: currentAttachedFile.base64Data,
              }
            : undefined,
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
        searchSources: Array.isArray(data.searchSources) ? data.searchSources : [],
        searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        searchGrounded: Boolean(data.searchGrounded),
        mapsGrounded: Boolean(data.mapsGrounded),
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        thinkingLevel: data.thinkingLevel || (enableThinking ? 'HIGH' : 'DEFAULT'),
        isComplexWork: Boolean(data.isComplexWork),
        bookingDraft: data.bookingDraft || null,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: `### 🛡️ TRAVEL JUST Verified Travel & Fleet Policies\n\n- **Doorstep Pickup:** 100% verified doorstep cab pickup & drop across Rajiv Nagar, Vijayanagar, Gokulam, Kuvempunagar, and all 45+ Mysuru layouts.\n- **Free Cancellation:** Up to 4 hours prior to scheduled pickup time with zero deduction.\n- **Fleet Availability:** 4+1 Sedans (Etios, Dzire), 6+1 MUVs (Ertiga), and 6/7+1 Premium SUVs (Innova, Innova Crysta) ready for 24/7 dispatch.\n- **Tolls & Inclusions:** Fuel and vehicle rental included. Tolls & parking billed as actuals via FASTag.\n- **Support:** Call our 24/7 support line at ${siteConfig.contact.phone} for immediate dispatch.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: false,
        modelUsed: 'gemini-3.8-flash',
        thinkingLevel: 'DEFAULT',
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

  // Work Agent: Act Across App - Apply to Booking Form
  const handleApplyToBookingForm = (msgId: string, draft: BookingDraftPlan) => {
    if (onApplyBookingPlan) {
      onApplyBookingPlan(draft);
    } else if (onBookRideClick) {
      onBookRideClick();
    }
    setAppliedDraftId(msgId);
    setTimeout(() => setAppliedDraftId(null), 3000);

    // Smooth scroll to booking search section
    const elem = document.getElementById('booking-search-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Work Agent: Act Across Files - Export Itinerary as TXT
  const handleExportItineraryTxt = (msg: ChatMessage) => {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    let txt = `=====================================================\n`;
    txt += `TRAVEL JUST - AI TRAVEL CONCIERGE & ITINERARY REPORT\n`;
    txt += `Mysuru / Mysore Doorstep Cab & Outstation Service\n`;
    txt += `Generated on: ${dateStr} at ${msg.timestamp}\n`;
    txt += `AI Model: ${msg.modelUsed || 'Gemini Pro'} | Thinking Level: ${msg.thinkingLevel || 'HIGH'}\n`;
    txt += `=====================================================\n\n`;

    if (msg.bookingDraft) {
      txt += `[PROPOSED TRIP SUMMARY]\n`;
      txt += `Service Type: ${msg.bookingDraft.serviceType?.toUpperCase() || 'CAB SERVICE'}\n`;
      txt += `Pickup Point: ${msg.bookingDraft.pickupLocation || 'Mysuru, Karnataka'}\n`;
      txt += `Drop Point:   ${msg.bookingDraft.dropLocation || 'Bengaluru / Outstation'}\n`;
      txt += `Vehicle Tier: ${msg.bookingDraft.vehicleType?.toUpperCase() || 'SEDAN / ERTIGA / CRYSTA'}\n`;
      txt += `Passengers:   ${msg.bookingDraft.passengers || 2} Pax\n`;
      txt += `Dispatch ETA: 10-15 Minutes to doorstep across Mysuru\n\n`;
    }

    txt += `[ITINERARY & LOGISTICS PLAN]\n`;
    txt += msg.content.replace(/###\s*/g, '\n').replace(/\*\*/g, '') + `\n\n`;

    if (msg.groundedPlaces && msg.groundedPlaces.length > 0) {
      txt += `[VERIFIED GOOGLE MAPS PITSTOPS & LOCATIONS]\n`;
      msg.groundedPlaces.forEach((p, idx) => {
        txt += `${idx + 1}. ${p.title}\n`;
        if (p.address) txt += `   Address: ${p.address}\n`;
        if (p.reviewSnippet) txt += `   Note: ${p.reviewSnippet}\n`;
        txt += `   Map Link: ${p.uri}\n`;
      });
      txt += `\n`;
    }

    if (msg.searchSources && msg.searchSources.length > 0) {
      txt += `[REAL-TIME GOOGLE SEARCH SOURCES]\n`;
      msg.searchSources.forEach((s, idx) => {
        txt += `${idx + 1}. ${s.title}: ${s.uri}\n`;
      });
      txt += `\n`;
    }

    txt += `=====================================================\n`;
    txt += `24/7 Helpline & Chauffeur Dispatch: ${siteConfig.contact.phone}\n`;
    txt += `Official Website: https://www.traveljust.in/\n`;
    txt += `Zero Surge Guarantee · 100% Doorstep Pickup Across Mysuru\n`;
    txt += `=====================================================\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TRAVEL_JUST_Itinerary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Work Agent: Act Across Files - Export Booking Draft JSON
  const handleExportDraftJson = (draft: BookingDraftPlan, msg: ChatMessage) => {
    const exportData = {
      app: 'TRAVEL JUST',
      version: '2026.1',
      generatedAt: new Date().toISOString(),
      bookingDraft: draft,
      itineraryDetails: msg.content,
      groundedPlaces: msg.groundedPlaces || [],
      searchSources: msg.searchSources || [],
      modelMetadata: {
        modelUsed: msg.modelUsed,
        thinkingLevel: msg.thinkingLevel,
        searchGrounded: msg.searchGrounded,
        mapsGrounded: msg.mapsGrounded,
      },
      contactHelpline: siteConfig.contact.phone,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TravelJust_Trip_Draft_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Work Agent: Act Across Apps - WhatsApp Dispatch
  const handleShareWhatsApp = (msg: ChatMessage) => {
    const summary = msg.bookingDraft?.tripSummary || 'Travel Just AI Itinerary Plan';
    const text = `*TRAVEL JUST AI Concierge Plan*\n\n${summary}\n\n${msg.content.substring(0, 600)}...\n\n_24/7 Helpline: ${siteConfig.contact.phone}_\nhttps://www.traveljust.in/`;
    const cleanNum = siteConfig.contact.whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanNum}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Hello! 👋 I'm your **TRAVEL JUST AI Travel Concierge & Work Agent** with **Gemini Intelligence Pro**, **High Thinking**, and **Google Search & Maps Grounding**.

🚕 **100% Doorstep Pickup & Drop Support across Mysuru:**
- **Mysuru Layouts:** Rajiv Nagar (1st & 2nd Stage), Vijayanagar, Gokulam, Kuvempunagar, Jayalakshmipuram, Saraswathipuram, J.P. Nagar, Bogadi, Dattagalli, Ramakrishna Nagar, Bannimantap, Alanahalli, Sathgalli.
- **Mysuru Tech & Industrial Hubs:** Hebbal Infosys Campus (Gates 1 & 2), Hootagalli (BEML, Wipro), Koorgalli (TVS Motor), Kadakola KIADB, Mysuru Airport.
- **Outer Ring Road (ORR 42 km corridor):** Rapid 10–15 min chauffeur dispatch.

Ask about any itinerary, real-time expressway toll rates, or upload a ticket for instant planning!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: true,
        mapsGrounded: true,
        searchGrounded: true,
        modelUsed: 'gemini-3.1-pro-preview',
        thinkingLevel: 'HIGH',
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
              <h4 key={idx} className="font-extrabold text-sm sm:text-base text-slate-900 mt-2.5 mb-1 text-emerald-950">
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
    <div className="flex flex-col h-[680px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Hidden file input for Work Agent */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.md,.json,.pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white border-b border-emerald-800/80 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm tracking-tight text-white truncate">
                  AI Travel Concierge & Work Agent
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/90 text-emerald-200 font-semibold border border-emerald-600/60">
                  <BrainCircuit className="w-2.5 h-2.5 text-emerald-300" />
                  Gemini Intelligence Pro
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-900/90 text-teal-200 font-semibold border border-teal-600/60">
                  <Zap className="w-2.5 h-2.5 text-teal-300" />
                  High Thinking
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 truncate">
                Real-Time Search Grounding · Google Maps Verified · Acts Across Apps & Files
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Travel Studio Button */}
            {onOpenTravelStudio && (
              <button
                type="button"
                onClick={() => onOpenTravelStudio('video')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-[#0ef10e] hover:bg-[#0cf00c] text-[#0a4d3c] shadow-2xs cursor-pointer select-none"
                title="Open Travel Studio: Generate Veo Videos and AI Destination Posters"
              >
                <Film className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowConfigDrawer((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border ${
                showConfigDrawer
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border-emerald-700/80'
              }`}
              title="Configure Model, Thinking Level, and Grounding"
            >
              <BrainCircuit className="w-3 h-3" />
              <span className="hidden sm:inline">Settings</span>
              {showConfigDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onBookRideClick && (
              <button
                type="button"
                onClick={onBookRideClick}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors shadow-2xs"
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

        {/* Intelligence Settings Toolbar (Expandable) */}
        {showConfigDrawer && (
          <div className="mt-2.5 pt-2.5 border-t border-emerald-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Model Selection */}
            <div className="bg-emerald-950/70 p-2 rounded-xl border border-emerald-800/60">
              <label className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                Gemini Model Tier
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setModelTier('auto')}
                  className={`py-1 px-1 rounded text-[9px] font-bold text-center transition-all ${
                    modelTier === 'auto'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                  title="Auto router selects the best model based on task complexity"
                >
                  ⚡ Auto
                </button>
                <button
                  type="button"
                  onClick={() => setModelTier('gemini-3.1-pro-preview')}
                  className={`py-1 px-1 rounded text-[9px] font-bold text-center transition-all ${
                    modelTier === 'gemini-3.1-pro-preview'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                  title="Gemini 3.1 Pro Preview: For complex itineraries and deep reasoning"
                >
                  🧠 3.1 Pro
                </button>
                <button
                  type="button"
                  onClick={() => setModelTier('gemini-3.5-flash')}
                  className={`py-1 px-1 rounded text-[9px] font-bold text-center transition-all ${
                    modelTier === 'gemini-3.5-flash'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                  title="Gemini 3.5 Flash: For general queries and search/maps grounding"
                >
                  ✨ 3.5 Flash
                </button>
                <button
                  type="button"
                  onClick={() => setModelTier('gemini-3.1-flash-lite')}
                  className={`py-1 px-1 rounded text-[9px] font-bold text-center transition-all ${
                    modelTier === 'gemini-3.1-flash-lite'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                  title="Gemini 3.1 Flash Lite: Ultra-fast responsive answers"
                >
                  ⚡ Lite
                </button>
              </div>
            </div>

            {/* Grounding Tool Selection */}
            <div className="bg-emerald-950/70 p-2 rounded-xl border border-emerald-800/60">
              <label className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                Real-Time Grounding
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setGroundingMode('auto')}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center transition-all ${
                    groundingMode === 'auto'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                >
                  ✨ Auto
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingMode('search')}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center transition-all ${
                    groundingMode === 'search'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                >
                  🌐 Search
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingMode('maps')}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center transition-all ${
                    groundingMode === 'maps'
                      ? 'bg-emerald-400 text-slate-950 shadow-2xs'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                >
                  🗺️ Maps
                </button>
              </div>
            </div>

            {/* High Thinking Toggle */}
            <div className="bg-emerald-950/70 p-2 rounded-xl border border-emerald-800/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-emerald-300">
                  High Thinking (Extended Reasoning)
                </label>
                <span className="text-[10px] text-emerald-200 font-semibold">
                  {enableThinking ? 'Active' : 'Off'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEnableThinking((v) => !v)}
                className={`mt-1 py-1 px-2 rounded text-[10px] font-bold transition-all text-center ${
                  enableThinking
                    ? 'bg-teal-400 text-slate-950 font-extrabold shadow-2xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {enableThinking ? '🧠 High Thinking Enabled' : 'Standard Reasoning'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[96%] sm:max-w-[88%] ${
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
            <div className="group relative space-y-1.5 flex-1 min-w-0">
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <div>
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                    {msg.attachedFile && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 text-xs border border-slate-700">
                        <Paperclip className="w-3 h-3" />
                        <span>Attached: {msg.attachedFile.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Metadata Badges Bar on Assistant Message */}
                    <div className="mb-2 pb-2 border-b border-slate-100 flex items-center gap-1.5 flex-wrap text-[10px]">
                      {msg.modelUsed && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                            msg.modelUsed.includes('pro')
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          <BrainCircuit className="w-2.5 h-2.5" />
                          {msg.modelUsed.includes('pro') ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'}
                        </span>
                      )}

                      {msg.thinkingLevel === 'HIGH' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 font-semibold border border-teal-200">
                          <Zap className="w-2.5 h-2.5 text-teal-700" />
                          High Thinking
                        </span>
                      )}

                      {msg.searchGrounded && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 font-semibold border border-sky-200">
                          <Globe className="w-2.5 h-2.5 text-sky-600" />
                          Google Search Grounded
                        </span>
                      )}

                      {msg.mapsGrounded && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200">
                          <Compass className="w-2.5 h-2.5 text-emerald-700" />
                          Maps Grounded
                        </span>
                      )}
                    </div>

                    {renderFormattedContent(msg.content)}

                    {/* Google Search Queries Performed */}
                    {msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-900 mb-1.5">
                          <Search className="w-3 h-3 text-sky-700" />
                          <span>Real-Time Google Search Grounding Queries:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {msg.searchQueries.map((q, qIdx) => (
                            <span
                              key={qIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50/80 text-sky-950 text-[10px] font-medium border border-sky-200/80"
                            >
                              <Search className="w-2.5 h-2.5 text-sky-600" />
                              "{q}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Search Web Sources Citations */}
                    {msg.searchSources && msg.searchSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                          <Globe className="w-3 h-3 text-sky-700 shrink-0" />
                          <span>Live Web Grounding Citations:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {msg.searchSources.map((source, sIdx) => {
                            let hostname = '';
                            try {
                              hostname = new URL(source.uri).hostname.replace('www.', '');
                            } catch {
                              hostname = 'source';
                            }
                            return (
                              <a
                                key={sIdx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-slate-50/90 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 transition-all flex items-center justify-between gap-2 text-left group/src"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-slate-900 group-hover/src:text-sky-900 truncate">
                                    {source.title}
                                  </p>
                                  <span className="text-[10px] text-slate-500">{hostname}</span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover/src:text-sky-700 shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

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

                    {/* WORK AGENT ACTION TRAY: Act Across Apps and Files */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50/80 p-2.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Work Agent Actions:</span>
                        </span>
                        {msg.bookingDraft && (
                          <span className="text-[10px] text-emerald-800 font-bold px-1.5 py-0.5 bg-emerald-100 rounded">
                            Trip Draft Ready
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Act Across Apps: Apply to Booking Form */}
                        {msg.bookingDraft && (
                          <button
                            type="button"
                            onClick={() => handleApplyToBookingForm(msg.id, msg.bookingDraft!)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-all active:scale-95"
                          >
                            <Car className="w-3.5 h-3.5" />
                            <span>
                              {appliedDraftId === msg.id ? 'Applied to Form ✓' : 'Apply to Booking Form'}
                            </span>
                          </button>
                        )}

                        {/* 2. Act Across Files: Export Itinerary TXT */}
                        <button
                          type="button"
                          onClick={() => handleExportItineraryTxt(msg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-2xs"
                          title="Download structured Itinerary text file"
                        >
                          <FileText className="w-3 h-3 text-emerald-700" />
                          <span>Export Itinerary (.txt)</span>
                        </button>

                        {/* 3. Act Across Files: Export Draft JSON */}
                        {msg.bookingDraft && (
                          <button
                            type="button"
                            onClick={() => handleExportDraftJson(msg.bookingDraft!, msg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-2xs"
                            title="Download machine-readable trip draft JSON"
                          >
                            <FileDown className="w-3 h-3 text-sky-700" />
                            <span>Draft (.json)</span>
                          </button>
                        )}

                        {/* 4. Act Across Apps: WhatsApp Dispatch */}
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(msg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs transition-colors"
                          title="Send to WhatsApp Dispatch"
                        >
                          <Share2 className="w-3 h-3 text-emerald-700" />
                          <span>WhatsApp Dispatch</span>
                        </button>
                      </div>
                    </div>
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
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs shadow-2xs flex flex-col gap-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                <span className="font-semibold text-slate-800">
                  {modelTier === 'gemini-3.1-pro-preview' || modelTier === 'auto'
                    ? 'Gemini 3.1 Pro analyzing reasoning chain & grounding sources...'
                    : 'Gemini 3.8 Flash executing rapid travel query...'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5">
                Extended reasoning with High Thinking level & Google Search / Maps grounding
              </p>
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
        {/* File attachment preview badge if present */}
        {attachedFile && (
          <div className="mb-2 flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            <div className="flex items-center gap-1.5 truncate">
              <Paperclip className="w-3 h-3 text-emerald-700 shrink-0" />
              <span className="font-semibold truncate">File ready for agent: {attachedFile.name}</span>
              <span className="text-[10px] text-emerald-600 shrink-0">
                ({(attachedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAttachedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              title="Remove file"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Work Agent Attach File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-900 transition-colors shrink-0 shadow-2xs"
            title="Attach flight ticket, itinerary, or trip notes for Work Agent analysis"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about Rajiv Nagar pickup, 3-day Coorg itinerary, or live expressway tolls..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Doorstep cab dispatch across 45+ Mysuru layouts · Verified FASTag billing
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
