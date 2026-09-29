import React, { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle, Search, X } from 'lucide-react';
import { faqsData } from '../data/faqs';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
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
    setOpenId('faq-1');
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-3">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
            Find quick details regarding booking procedures, vehicle selection, fares, and customer support.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs focus-within:border-emerald-600 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
            <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Search className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
            </div>
            <input
              id="faq-search-input"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search questions (e.g., airport, child seat, pet, tolls, payment)..."
              className="w-full py-3.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
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
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>

        {/* Empty state when no FAQs match search */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
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
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Accordion List */
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full text-left p-5 sm:p-6 font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center justify-between gap-4 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-800/60 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-emerald-800 dark:text-emerald-400 shrink-0" />
                      {faq.question}
                    </span>
                    <div
                      className={`p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
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
