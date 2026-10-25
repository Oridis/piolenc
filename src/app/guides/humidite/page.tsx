import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HUMIDITY_LEVELS } from '@/lib/constants';
import { Droplet, ArrowRight } from 'lucide-react';

export default function HumidityGuidePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Norme NF &amp; Pouvoir calorifique
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Taux d&apos;humidité et rendement calorifique (PCI)
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            L&apos;humidité est le premier critère d&apos;efficacité du bois de chauffage. Découvrez pourquoi un bois séché en étuve NF H1 délivre le double d&apos;énergie utile qu&apos;un bois vert.
          </p>
        </div>

        {/* Physical Principle */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-subtleBorder shadow-subtle space-y-4 text-xs">
          <h2 className="font-poppins font-medium text-base text-primaryText flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-forest" />
            <span>L&apos;impact de l&apos;humidité sur la combustion et le conduit</span>
          </h2>
          <p className="text-secondaryText leading-relaxed">
            1 kg de bois vert contient jusqu&apos;à 500 g d&apos;eau. Lors de la combustion, une grande partie de l&apos;énergie est absorbée pour faire évaporer cette humidité plutôt que de chauffer votre habitation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-4 bg-ivory border border-subtleBorder rounded-lg text-primaryText">
              <strong className="block font-medium mb-1">Perte de 50% d&apos;énergie utile</strong>
              <p className="text-[11px] text-secondaryText leading-normal">Obligation de consommer deux fois plus de stères pour atteindre la même température.</p>
            </div>
            <div className="p-4 bg-ivory border border-subtleBorder rounded-lg text-primaryText">
              <strong className="block font-medium mb-1">Bistrage &amp; Encrassement</strong>
              <p className="text-[11px] text-secondaryText leading-normal">Les goudrons condensent dans le conduit et accroissent les risques d&apos;incendie.</p>
            </div>
            <div className="p-4 bg-ivory border border-subtleBorder rounded-lg text-primaryText">
              <strong className="block font-medium mb-1">Émissions &amp; Vitre noircie</strong>
              <p className="text-[11px] text-secondaryText leading-normal">Combustion incomplète provoquant fumées épaisses et noircissement rapide des vitres.</p>
            </div>
          </div>
        </div>

        {/* Humidity Norms Comparison */}
        <div className="space-y-4">
          <h2 className="font-poppins font-medium text-lg text-primaryText">
            Classification officielle des niveaux d&apos;humidité
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HUMIDITY_LEVELS.map((lvl, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="badge-neutral text-[10px] mb-2">
                    {lvl.category}
                  </span>
                  <div className="font-poppins font-semibold text-2xl text-primaryText mb-0.5">{lvl.rate}</div>
                  <span className="text-xs text-forest font-medium block">{lvl.pci}</span>
                  <p className="text-xs text-secondaryText mt-2 leading-relaxed">{lvl.yield}</p>
                </div>

                <div className="pt-3 border-t border-subtleBorder text-[11px] text-secondaryText space-y-1">
                  <p><strong className="text-primaryText font-medium">Encrassement :</strong> {lvl.sootRisk}</p>
                  <p><strong className="text-primaryText font-medium">Recommandation :</strong> {lvl.advice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kiln Drying Advantage */}
        <div className="bg-forest text-white rounded-xl p-8 space-y-3 text-center sm:text-left">
          <h3 className="font-poppins font-medium text-lg text-white">L&apos;assurance de l&apos;étuvage biomasse</h3>
          <p className="text-xs text-ivory/80 leading-relaxed max-w-2xl">
            Nos palettes sont séchées en étuve industrielle régulée pendant 48 heures. Ce procédé garantit une humidité à cœur inférieure à 20%, élimine tout parasite et garantit un allumage propre dès le déchargement.
          </p>
          <div className="pt-2">
            <Link
              href="/boutique"
              className="btn-primary bg-white text-forest hover:bg-ivory hover:text-forest-dark text-xs py-2.5 px-5 inline-flex items-center gap-1.5"
            >
              <span>Consulter le bois sec étuvé NF H1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
