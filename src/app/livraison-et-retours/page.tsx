import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';
import { Truck, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function DeliveryPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Charte Logistique &amp; Déchargement
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            Politique de Livraison et de Retour
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Conditions de transport pour palettes lourdes (&gt; 500 kg) en France, Belgique, Allemagne et Suisse.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {settings.deliveryPolicyText}
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
