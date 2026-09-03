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
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isAiGenerated?: boolean;
}

const DEFAULT_PROMPTS = [
  'What is your cancellation & refund policy?',
  'What vehicles are available for 6-7 passengers?',
  'Are tolls, parking, and driver bata included?',
  'How do Bangalore Airport (BLR) pickups work?',
  'Can I bring pets in the cab?',
  'What are the luggage limits for Sedans vs Innova?',
];

export const ContactAIChat: React.FC<{ onBookRideClick?: () => void }> = ({ onBookRideClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! 👋 I'm your **TRAVEL JUST AI Travel & Policy Assistant** powered by Gemini.

Ask me anything about our **travel policies, vehicle fleet availability, cancellation rules, tolls, luggage limits, or outstation tours**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: true,
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantReply =
        data.reply ||
        `I apologize, but I could not retrieve that policy right now. Please contact our 24/7 helpline at ${siteConfig.contact.phone}.`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: data.aiGenerated !== false,
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
        content: `Hello! 👋 I'm your **TRAVEL JUST AI Travel & Policy Assistant** powered by Gemini.

Ask me anything about our **travel policies, vehicle fleet availability, cancellation rules, tolls, luggage limits, or outstation tours**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: true,
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
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm tracking-tight text-white">AI Policy & Fleet Assistant</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 font-semibold border border-emerald-700">
                Gemini
              </span>
            </div>
            <p className="text-[11px] text-emerald-200">Instant answers on vehicle availability & policies</p>
          </div>
        </div>

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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${
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
            <div className="group relative space-y-1">
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
                  renderFormattedContent(msg.content)
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

      {/* Suggested Quick Prompt Chips */}
      <div className="px-3.5 py-2 bg-slate-100/80 border-t border-slate-200/80 overflow-x-auto shrink-0 scrollbar-none flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-emerald-700" /> Suggestions:
        </span>
        {DEFAULT_PROMPTS.map((prompt, idx) => (
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
            placeholder="Ask about car models, baggage rules, tolls, cancellations..."
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
