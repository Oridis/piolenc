import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';

export default async function CookiePolicyPage() {
  const settings = await getSiteSettings();
  const cookiePolicyText = applySiteSettingsToText(settings.cookiePolicyText, settings);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 w-full">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Traçabilité &amp; Consentement
          </span>
          <h1 className="text-3xl font-bold font-heading text-primaryText tracking-tight mt-1">
            Politique d'Utilisation des Cookies
          </h1>
        </div>

        <div className="bg-white p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs text-secondaryText leading-relaxed whitespace-pre-line">
          {cookiePolicyText}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
