import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const privacyPolicyText = applySiteSettingsToText(settings.privacyPolicyText, settings);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 w-full">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Protection des Données Personnelles
          </span>
          <h1 className="text-3xl font-bold font-heading text-primaryText tracking-tight mt-1">
            Politique de Confidentialité (RGPD)
          </h1>
        </div>

        <div className="bg-white p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs text-secondaryText leading-relaxed whitespace-pre-line">
          {privacyPolicyText}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
