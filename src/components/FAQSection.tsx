import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqsData } from '../data/faqs';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-slate-50/80 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Find quick details regarding booking procedures, vehicle selection, fares, and customer support.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqsData.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full text-left p-5 sm:p-6 font-bold text-slate-900 text-base sm:text-lg flex items-center justify-between gap-4 focus:outline-none focus:bg-slate-50"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-emerald-800 shrink-0" />
                    {faq.question}
                  </span>
                  <div
                    className={`p-1.5 rounded-full bg-slate-100 text-slate-700 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-emerald-100 text-emerald-900' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
