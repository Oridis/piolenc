import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';
import { TreePine, Award, Truck, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12 w-full">
        <div className="text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Notre Histoire &amp; Nos Valeurs
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-primaryText tracking-tight">
            À Propos de {settings.siteName}
          </h1>
          <p className="text-sm text-secondaryText max-w-2xl mx-auto leading-relaxed">
            Spécialiste de la distribution de bois de chauffage haute performance issu de forêts européennes éco-gérées.
          </p>
        </div>

        {/* Narrative */}
        <div className="bg-white rounded-xl p-8 sm:p-10 border border-subtleBorder shadow-subtle space-y-6 text-xs text-secondaryText leading-relaxed">
          <p className="text-sm font-semibold text-primaryText">
            Fondée au cœur du massif vosgien, région emblématique de la filière sylvicole française, {settings.companyName} s'est donnée pour mission d'apporter aux foyers un bois de chauffage à la combustion irréprochable.
          </p>
          <p>
            Face aux difficultés récurrentes rencontrées par les particuliers (bois trop humide qui encrasse les conduits, approximations sur les volumes de stères livrés en vrac, déchargements non sécurisés), nous avons standardisé notre offre autour de 3 piliers intangibles :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-beige-50 rounded-xl border border-subtleBorder space-y-2">
              <TreePine className="w-5 h-5 text-forest-700" />
              <strong className="text-primaryText block font-semibold text-xs">Forêts durables</strong>
              <p className="text-[11px] text-secondaryText leading-relaxed">100% de notre bois provient de parcelles gérées durablement sous certifications PEFC et FSC.</p>
            </div>
            <div className="p-4 bg-beige-50 rounded-xl border border-subtleBorder space-y-2">
              <Award className="w-5 h-5 text-forest-700" />
              <strong className="text-primaryText block font-semibold text-xs">Étuvage haute précision</strong>
              <p className="text-[11px] text-secondaryText leading-relaxed">Séchage en séchoir biomasse garantissant moins de 18% d'humidité à cœur.</p>
            </div>
            <div className="p-4 bg-beige-50 rounded-xl border border-subtleBorder space-y-2">
              <Truck className="w-5 h-5 text-forest-700" />
              <strong className="text-primaryText block font-semibold text-xs">Livraison soignée</strong>
              <p className="text-[11px] text-secondaryText leading-relaxed">Palettes cerclées et filmées, déposées avec transpalette tout terrain devant votre lieu de stockage.</p>
            </div>
          </div>
        </div>

        {/* Fleet & Logistics */}
        <div className="bg-beige-50 rounded-xl p-8 border border-subtleBorder space-y-3 text-xs text-secondaryText">
          <h2 className="text-lg font-bold font-heading text-primaryText">Une logistique rodée en {settings.deliveryZonesText || 'France, Belgique, Allemagne et Suisse'}</h2>
          <p className="leading-relaxed">
            Grâce à nos partenariats avec les grands réseaux de fret européens (Geodis, Dachser, Schenker), nous assurons des livraisons régulières et ponctuelles, y compris en période de forte demande hivernale.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/boutique"
            className="btn-primary"
          >
            <span>Découvrir nos palettes de bois</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
