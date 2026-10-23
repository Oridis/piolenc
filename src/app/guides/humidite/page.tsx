import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HUMIDITY_LEVELS } from '@/lib/constants';
import { Droplet, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function HumidityGuidePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Norme NF Bois de Chauffage &amp; Rendement Énergétique
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Taux d'Humidité et Pouvoir Calorifique (PCI)
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            L'humidité est le facteur n°1 qui détermine si votre bois chauffe votre maison ou si l'énergie est gaspillée à évaporer de l'eau.
          </p>
        </div>

        {/* Physical Principle */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4 text-xs">
          <h2 className="text-lg font-black text-gray-900 flex items-center space-x-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            <span>Pourquoi brûler du bois humide (&gt; 25%) est une catastrophe économique et écologique ?</span>
          </h2>
          <p className="text-gray-700 leading-relaxed">
            1 kg de bois vert contient jusqu'à 500 grammes d'eau. Lorsque vous allumez du bois humide, la chaleur générée par la combustion ne sert pas à réchauffer votre pièce : elle est absorbée par l'évaporation de l'eau présente dans les fibres ligneuses.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900">
              <strong className="block font-bold">Perte de 50% de chaleur</strong>
              <p className="text-[11px] mt-1">Vous devez brûler 2 fois plus de stères pour obtenir la même température.</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900">
              <strong className="block font-bold">Bistre &amp; Danger d'incendie</strong>
              <p className="text-[11px] mt-1">Les goudrons liquides et imbrûlés se condensent dans le conduit et provoquent des feux de cheminée.</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900">
              <strong className="block font-bold">Pollution &amp; Vitre noire</strong>
              <p className="text-[11px] mt-1">Émission massive de particules fines (PM 2.5) et vitre noircie en moins de 30 minutes.</p>
            </div>
          </div>
        </div>

        {/* Humidity Norms Comparison */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">
            Classification officielle de l'humidité du bois de chauffage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HUMIDITY_LEVELS.map((lvl, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-3 ${lvl.badgeColor}`}>
                    {lvl.category}
                  </span>
                  <div className="text-3xl font-black text-gray-900 mb-1">{lvl.rate}</div>
                  <span className="text-xs text-forest-800 font-bold block">{lvl.pci}</span>
                  <p className="text-xs text-gray-600 mt-3">{lvl.yield}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                  <p><strong>Impact encrassement :</strong> {lvl.sootRisk}</p>
                  <p><strong>Recommandation :</strong> {lvl.advice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Kiln-Drying Advantage */}
        <div className="bg-forest-900 text-white rounded-3xl p-8 space-y-4">
          <h3 className="text-xl font-black">La garantie de l'étuvage industriel Allo Maison</h3>
          <p className="text-xs text-forest-100 leading-relaxed max-w-3xl">
            Plutôt que d'attendre 2 ans de séchage naturel aléatoire sous la pluie ou dans des hangars humides, notre bois fendu est disposé en séchoirs biomasse à flux d'air chaud continu pendant 48 heures.
            Ce procédé garantit une hygrométrie à cœur inférieure à 18-20%, assainit le bois en détruisant larves, insectes et moisissures, et vous permet d'allumer votre feu dès la livraison.
          </p>
          <div className="pt-2">
            <Link
              href="/boutique"
              className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-forest-950 font-black px-6 py-3 rounded-xl text-xs transition shadow-lg"
            >
              <span>Commander du bois sec étuvé NF H1</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
