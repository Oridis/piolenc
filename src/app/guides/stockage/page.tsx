import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Home, Flame, Wind, ArrowRight } from 'lucide-react';

export default function StorageGuidePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Bonnes pratiques &amp; Utilisation
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Conseils de stockage sous abri &amp; allumage inversé
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Pour maintenir les performances thermiques de votre bois étuvé et obtenir une combustion sans fumée, appliquez les règles d&apos;aération et adoptez l&apos;allumage par le haut.
          </p>
        </div>

        {/* 4 Golden rules for storage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-8 h-8 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center font-poppins font-medium text-xs">
              01
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Surélever les palettes du sol</h3>
            <p className="text-secondaryText leading-relaxed">
              Ne posez jamais vos bûches à même la terre meuble ou l&apos;herbe humide. Conservez la palette de livraison pour créer une lame d&apos;air ventilante de 10 à 15 cm sous la pile.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-8 h-8 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center font-poppins font-medium text-xs">
              02
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Favoriser la ventilation latérale</h3>
            <p className="text-secondaryText leading-relaxed">
              Ne recouvrez pas les flancs d&apos;une bâche étanche fermée : cela emprisonne l&apos;humidité et favorise le développement de moisissures. Protégez uniquement le sommet contre les précipitations directes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-8 h-8 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center font-poppins font-medium text-xs">
              03
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Maintenir un espace avec les murs</h3>
            <p className="text-secondaryText leading-relaxed">
              Laissez un intervalle de 10 cm entre les rangées de bois et le mur de clôture ou d&apos;habitation pour faciliter la circulation naturelle des courants d&apos;air.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-8 h-8 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center font-poppins font-medium text-xs">
              04
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Rentrer son bois 24h avant consommation</h3>
            <p className="text-secondaryText leading-relaxed">
              Placez la provision de la journée à température ambiante (~20°C) à proximité de l&apos;appareil. Le bois tempéré s&apos;embrase beaucoup plus vite et limite l&apos;abaissement de température du foyer.
            </p>
          </div>
        </div>

        {/* Top-Down lighting tutorial */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-subtleBorder shadow-subtle space-y-5">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
              Technique certifiée
            </span>
            <h2 className="font-poppins font-semibold text-lg text-primaryText tracking-tight mt-0.5">
              L&apos;allumage par le haut (&ldquo;Top-Down&rdquo;) : moins de fumée, plus de chaleur
            </h2>
            <p className="text-xs text-secondaryText mt-1">
              Cette méthode moderne brûle les gaz par le dessus au fur et à mesure de leur dégagement et réduit les émissions d&apos;imbrûlés de 80% dès les premières minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-secondaryText">
            <div className="p-4 bg-ivory rounded-lg border border-subtleBorder space-y-1.5">
              <strong className="text-primaryText block font-medium">Étape 1 : Bûches épaisses à la base</strong>
              <p className="leading-relaxed">Disposez 2 ou 3 bûches fendues au fond du foyer, légèrement espacées sans les tasser.</p>
            </div>
            <div className="p-4 bg-ivory rounded-lg border border-subtleBorder space-y-1.5">
              <strong className="text-primaryText block font-medium">Étape 2 : Bois d&apos;allumage croisé</strong>
              <p className="leading-relaxed">Placez par-dessus quelques bûchettes de bois d&apos;allumage fin en les croisant perpendiculairement.</p>
            </div>
            <div className="p-4 bg-ivory rounded-lg border border-subtleBorder space-y-1.5">
              <strong className="text-primaryText block font-medium">Étape 3 : Allume-feu naturel au sommet</strong>
              <p className="leading-relaxed">Déposez un allume-feu en laine de bois au sommet et allumez-le. La flamme descendra progressivement.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
