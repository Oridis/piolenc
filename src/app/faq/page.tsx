import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FREQUENT_QUESTIONS } from '@/lib/constants';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Foire Aux Questions
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Questions Fréquentes
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Retrouvez les réponses aux questions les plus fréquentes sur nos bois, nos tarifs, le transport et le virement bancaire.
          </p>
        </div>

        <div className="space-y-4">
          {FREQUENT_QUESTIONS.map((faq, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2 text-xs">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-start space-x-2">
                <span className="text-forest-700 font-bold">Q.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-gray-600 leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
