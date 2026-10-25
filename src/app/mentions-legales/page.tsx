import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';

export default async function MentionsLegalesPage() {
  const settings = await getSiteSettings();
  const legalMentionsText = applySiteSettingsToText(settings.legalMentionsText, settings);

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 w-full">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Informations Légales &amp; Éditeur
          </span>
          <h1 className="text-3xl font-bold font-heading text-primaryText tracking-tight mt-1">
            Mentions Légales
          </h1>
        </div>

        <div className="bg-white p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs text-secondaryText leading-relaxed whitespace-pre-line">
          <p><strong className="text-primaryText font-semibold">Éditeur du site :</strong> {settings.companyName}</p>
          <p><strong className="text-primaryText font-semibold">Siège social :</strong> {settings.companyAddress}</p>
          <p><strong className="text-primaryText font-semibold">Numéro SIRET :</strong> {settings.companySiret}</p>
          <p><strong className="text-primaryText font-semibold">Numéro de TVA Intracommunautaire :</strong> {settings.companyVatNumber}</p>
          <p><strong className="text-primaryText font-semibold">Téléphone :</strong> {settings.companyPhone}</p>
          <p><strong className="text-primaryText font-semibold">Email :</strong> {settings.companyEmail}</p>
          <p><strong className="text-primaryText font-semibold">Directeur de la publication :</strong> La Direction Générale de {settings.companyName}</p>
          <div className="pt-4 border-t border-subtleBorder">
            {legalMentionsText}
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
