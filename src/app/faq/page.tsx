'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FREQUENT_QUESTIONS } from '@/lib/constants';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 w-full">
        <div className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Foire Aux Questions
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-primaryText tracking-tight">
            Questions Fréquentes
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText max-w-2xl mx-auto">
            Retrouvez les réponses aux questions les plus fréquentes sur nos bois, nos tarifs, le transport et le virement bancaire.
          </p>
        </div>

        <div className="space-y-3">
          {FREQUENT_QUESTIONS.map((faq, idx) => {
            const isOpen = openIdx === idx;

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold font-heading text-primaryText hover:bg-beige-50/50 transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-secondaryText shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-forest-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-secondaryText leading-relaxed border-t border-subtleBorder bg-beige-50/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
