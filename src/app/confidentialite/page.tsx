import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Protection des Données Personnelles
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            Politique de Confidentialité (RGPD)
          </h1>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {settings.privacyPolicyText}
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
