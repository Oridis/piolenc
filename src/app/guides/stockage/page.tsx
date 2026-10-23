import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Home, Flame, Wind, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function StorageGuidePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Bonnes Pratiques &amp; Utilisation
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Conseils de Stockage du Bois &amp; Allumage Inversé
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pour préserver les performances de votre bois sec étuvé et obtenir une combustion propre, suivez les règles d'empilement professionnel et adoptez la technique d'allumage par le haut.
          </p>
        </div>

        {/* 4 Golden rules for storage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="w-10 h-10 bg-forest-100 text-forest-800 rounded-xl flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Surélever les bûches du sol</h3>
            <p className="text-gray-600 leading-relaxed">
              Ne posez jamais votre bois directement sur l'herbe ou la terre humide. Utilisez les palettes d'expédition fournies pour créer un vide sanitaire d'au moins 10 à 15 cm permettant à l'air de circuler en sous-face.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="w-10 h-10 bg-forest-100 text-forest-800 rounded-xl flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Favoriser la ventilation latérale</h3>
            <p className="text-gray-600 leading-relaxed">
              Ne bâchez jamais hermétiquement les côtés de votre pile de bois avec du plastique étanche : cela provoquerait un effet de serre et ferait moisir le bois. Couvrez uniquement le dessus pour le protéger de la pluie directe.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="w-10 h-10 bg-forest-100 text-forest-800 rounded-xl flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Laisser un espace avec les murs</h3>
            <p className="text-gray-600 leading-relaxed">
              Laissez un espace de 10 cm entre votre mur et vos rangées de bûches pour éviter la condensation et accélérer la circulation des courants d'air naturels.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="w-10 h-10 bg-forest-100 text-forest-800 rounded-xl flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Rentrer son bois 24h avant</h3>
            <p className="text-gray-600 leading-relaxed">
              Stockez la consommation de la journée à proximité immédiate de votre poêle à l'intérieur. Le bois se réchauffe à température ambiante (~20°C), ce qui facilite grandement son inflammation.
            </p>
          </div>
        </div>

        {/* Top-Down lighting tutorial */}
        <div className="bg-wood-50 rounded-3xl p-6 sm:p-8 border border-wood-200 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-wood-700">
              Technique Recommandée par l'ADEME
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
              L'Allumage Inversé ("Top-Down") : Moins de fumée, plus de chaleur
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Oubliez le papier journal sous les grosses bûches. Allumer son feu par le haut réduit les émissions de particules fines de 80% dès les premières minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-700">
            <div className="bg-white p-4 rounded-2xl border border-wood-200 space-y-2">
              <strong className="text-forest-900 block font-bold">Étape 1 : Base lourde</strong>
              <p>Placez 2 ou 3 grosses bûches sèches au fond du foyer, légèrement espacées sans les serrer.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-wood-200 space-y-2">
              <strong className="text-forest-900 block font-bold">Étape 2 : Bois d'allumage croisé</strong>
              <p>Disposez par-dessus du petit bois sec (baguettes ou bûchettes de hêtre) en les croisant perpendiculairement.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-wood-200 space-y-2">
              <strong className="text-forest-900 block font-bold">Étape 3 : Allume-feu naturel au sommet</strong>
              <p>Placez un allume-feu en laine de bois au tout sommet et allumez-le. Le feu descendra lentement sans étouffement.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
