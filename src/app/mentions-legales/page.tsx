import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';

export default async function MentionsLegalesPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Informations Légales &amp; Éditeur
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            Mentions Légales
          </h1>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          <p><strong>Éditeur du site :</strong> {settings.companyName}</p>
          <p><strong>Siège social :</strong> {settings.companyAddress}</p>
          <p><strong>Numéro SIRET :</strong> {settings.companySiret}</p>
          <p><strong>Numéro de TVA Intracommunautaire :</strong> {settings.companyVatNumber}</p>
          <p><strong>Téléphone :</strong> {settings.companyPhone}</p>
          <p><strong>Email :</strong> {settings.companyEmail}</p>
          <p><strong>Directeur de la publication :</strong> La Direction Générale de {settings.companyName}</p>
          <div className="pt-4 border-t border-gray-100">
            {settings.legalMentionsText}
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
