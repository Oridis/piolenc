import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';
import { Truck, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function DeliveryPolicyPage() {
  const settings = await getSiteSettings();
  const deliveryPolicyText = applySiteSettingsToText(settings.deliveryPolicyText, settings);
  const deliveryZones = settings.deliveryZonesText || 'France, Belgique, Allemagne et Suisse';

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 w-full">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Charte Logistique &amp; Déchargement
          </span>
          <h1 className="text-3xl font-bold font-heading text-primaryText tracking-tight mt-1">
            Politique de Livraison et de Retour
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Conditions de transport pour palettes lourdes (&gt; 500 kg) en {deliveryZones}.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-6 text-xs text-secondaryText leading-relaxed whitespace-pre-line">
          {deliveryPolicyText}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
