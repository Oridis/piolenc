import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';

export default async function CGVPage() {
  const settings = await getSiteSettings();
  const cgvText = applySiteSettingsToText(settings.cgvText, settings);
  const deliveryZones = settings.deliveryZonesText || 'France métropolitaine, Belgique, Allemagne, Suisse';

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 w-full">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Cadre Contractuel
          </span>
          <h1 className="text-3xl font-bold font-heading text-primaryText tracking-tight mt-1">
            Conditions Générales de Vente (CGV)
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Applicables aux commandes passées sur {settings.siteName} ({deliveryZones}).
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-6 text-xs text-secondaryText leading-relaxed whitespace-pre-line">
          {cgvText}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
