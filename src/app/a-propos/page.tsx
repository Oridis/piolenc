import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';
import { TreePine, Award, Truck, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Notre Histoire &amp; Nos Valeurs
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            À Propos de {settings.siteName}
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Spécialiste de la distribution de bois de chauffage haute performance issu de forêts européennes éco-gérées.
          </p>
        </div>

        {/* Narrative */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm space-y-6 text-xs text-gray-700 leading-relaxed">
          <p className="text-sm font-semibold text-forest-950">
            Fondée au cœur du massif vosgien, région emblématique de la filière sylvicole française, {settings.companyName} s'est donnée pour mission d'apporter aux foyers un bois de chauffage à la combustion irréprochable.
          </p>
          <p>
            Face aux difficultés récurrentes rencontrées par les particuliers (bois trop humide qui encrasse les conduits, approximations sur les volumes de stères livrés en vrac, déchargements sauvages sur le trottoir), nous avons standardisé notre offre autour de 3 piliers intangibles :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-forest-50 rounded-2xl border border-forest-200 space-y-2">
              <TreePine className="w-5 h-5 text-forest-700" />
              <strong className="text-gray-900 block font-bold text-xs">Forêts durables</strong>
              <p className="text-[11px] text-forest-900">100% de notre bois provient de parcelles gérées durablement sous certifications PEFC et FSC.</p>
            </div>
            <div className="p-4 bg-forest-50 rounded-2xl border border-forest-200 space-y-2">
              <Award className="w-5 h-5 text-forest-700" />
              <strong className="text-gray-900 block font-bold text-xs">Étuvage haute précision</strong>
              <p className="text-[11px] text-forest-900">Séchage en séchoir biomasse garantissant moins de 18% d'humidité à cœur.</p>
            </div>
            <div className="p-4 bg-forest-50 rounded-2xl border border-forest-200 space-y-2">
              <Truck className="w-5 h-5 text-forest-700" />
              <strong className="text-gray-900 block font-bold text-xs">Livraison soignée</strong>
              <p className="text-[11px] text-forest-900">Palettes cerclées et filmées, déposées avec transpalette tout terrain devant votre lieu de stockage.</p>
            </div>
          </div>
        </div>

        {/* Fleet & Logistics */}
        <div className="bg-wood-50 rounded-3xl p-8 border border-wood-200 space-y-4 text-xs text-wood-950">
          <h2 className="text-lg font-black text-gray-900">Une logistique rodée en France, Belgique, Allemagne et Suisse</h2>
          <p className="leading-relaxed">
            Grâce à nos partenariats exclusifs avec les plus grands réseaux de fret européens (Geodis, Dachser, Schenker), nous assurons des livraisons régulières et ponctuelles, y compris en période de forte demande hivernale.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 bg-forest-800 hover:bg-forest-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs shadow-md"
          >
            <span>Découvrir nos palettes de bois</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
