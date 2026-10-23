import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';

export default async function CGVPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Cadre Contractuel
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            Conditions Générales de Vente (CGV)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Applicables aux commandes passées sur {settings.siteName} (France, Belgique, Allemagne, Suisse).
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {settings.cgvText}
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
