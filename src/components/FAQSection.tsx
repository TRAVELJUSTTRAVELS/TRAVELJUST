import React, { useState, useMemo } from 'react';
import { ChevronRight, HelpCircle, Search, X } from 'lucide-react';
import { faqsData } from '../data/faqs';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return faqsData;
    return faqsData.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // When search changes, auto-open the first matching FAQ for rapid discovery
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      const q = val.trim().toLowerCase();
      const firstMatch = faqsData.find(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q)
      );
      if (firstMatch) {
        setOpenId(firstMatch.id);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setOpenId(null);
  };

  return (
    <section
      id="faq"
      className="py-16 md:py-24 bg-[#F7F9FC] dark:bg-slate-950/80 border-t border-[#DCE2E8] dark:border-slate-800 transition-colors scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#176B5B] dark:text-[#38bfa3] bg-[#D7F8E9] dark:bg-[#176B5B]/20 px-3.5 py-1 rounded-full border border-[#b2edd3] dark:border-[#176B5B]/40">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-[34px] lg:text-[36px] font-extrabold text-[#111827] dark:text-slate-100 tracking-tight mt-3 leading-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-[15px] sm:text-base text-[#4B5563] dark:text-slate-400 mt-2.5 max-w-xl mx-auto leading-relaxed">
            Find quick details regarding booking procedures, vehicle selection, fares, and customer support.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-[#DCE2E8] dark:border-slate-800 shadow-2xs focus-within:border-[#176B5B] dark:focus-within:border-[#176B5B] focus-within:ring-2 focus-within:ring-[#176B5B]/20 transition-all">
            <div className="pl-4 pr-2 text-[#87919F] dark:text-slate-500 pointer-events-none">
              <Search className="w-5 h-5 text-[#176B5B] dark:text-[#38bfa3]" />
            </div>
            <input
              id="faq-search-input"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search questions (e.g., airport, child seat, pet, tolls, payment)..."
              className="w-full py-3.5 pr-10 text-[14px] text-[#182131] dark:text-slate-100 placeholder:text-[#87919F] dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
              aria-label="Search FAQs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {searchQuery.trim()
                ? `Showing ${filteredFaqs.length} of ${faqsData.length} FAQs`
                : `${faqsData.length} frequent answers available`}
            </span>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-[#176B5B] dark:text-[#38bfa3] hover:underline font-medium cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>

        {/* Empty state when no FAQs match search */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#DCE2E8] dark:border-slate-800">
            <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              No matching questions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
              We couldn't find any questions matching "{searchQuery}". Try another keyword or message our 24/7 support.
            </p>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-[#176B5B] hover:bg-[#125548] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Accordion List */
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              const buttonId = `faq-btn-${faq.id}`;
              const panelId = `faq-panel-${faq.id}`;

              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-[#DCE2E8] dark:border-slate-800 overflow-hidden shadow-2xs transition-all hover:border-[#cbced4] dark:hover:border-slate-700"
                >
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full text-left p-4 sm:p-5 font-bold text-[#182131] dark:text-slate-100 text-[16px] sm:text-[17px] flex items-center justify-between gap-4 focus:outline-none focus:bg-slate-50/50 dark:focus:bg-slate-800/60 transition-colors cursor-pointer group"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[#D7F8E9] dark:bg-[#176B5B]/25 text-[#176B5B] dark:text-[#38bfa3] flex items-center justify-center shrink-0 border border-[#b2edd3] dark:border-[#176B5B]/40">
                        <HelpCircle className="w-4 h-4 text-[#176B5B] dark:text-[#38bfa3]" />
                      </span>
                      <span className="text-[16px] sm:text-[17.5px] text-[#182131] dark:text-slate-100 font-semibold group-hover:text-[#176B5B] dark:group-hover:text-[#38bfa3] transition-colors leading-snug">
                        {faq.question}
                      </span>
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full bg-[#F0F3F7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors duration-200 shrink-0 ${
                        isOpen ? 'bg-[#D7F8E9] dark:bg-[#176B5B]/30 text-[#176B5B] dark:text-[#38bfa3]' : ''
                      }`}
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 pb-5 pt-1 text-xs sm:text-[14px] text-[#4B5563] dark:text-slate-300 leading-relaxed border-t border-[#F0F3F7] dark:border-slate-800/80 animate-in fade-in duration-150"
                    >
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
