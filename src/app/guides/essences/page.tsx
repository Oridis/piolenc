import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { WOOD_SPECIES } from '@/lib/constants';
import { Flame, ArrowRight } from 'lucide-react';

export default function WoodSpeciesGuidePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Expertise &amp; Conseil thermique
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Guide comparatif des essences de bois de chauffage
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Toutes les essences d&apos;arbres ne délivrent pas le même rendement énergétique. Les feuillus durs sont classés en groupe 1 (G1) pour leur haute densité et leur lit de braises durable.
          </p>
        </div>

        {/* Group 1 Highlight Box */}
        <div className="bg-forest-50 p-6 rounded-xl border border-forest-100 space-y-2.5">
          <div className="flex items-center space-x-2 text-forest font-poppins font-medium text-sm">
            <Flame className="w-4 h-4 text-forest" />
            <span>Pourquoi choisir exclusivement des feuillus durs de Groupe 1 (G1) ?</span>
          </div>
          <p className="text-xs text-forest-dark leading-relaxed">
            Les feuillus durs (Chêne, Hêtre, Charme, Frêne) possèdent une masse volumique de 700 à 800 kg/m³. Ils délivrent jusqu&apos;à <strong>2,5 fois plus d&apos;énergie calorifique par stère</strong> que les bois tendres ou résineux, tout en maintenant des braises denses sans projection d&apos;étincelles.
          </p>
        </div>

        {/* Detailed Species Cards */}
        <div className="space-y-6">
          {WOOD_SPECIES.map((sp) => (
            <div key={sp.id} className="bg-white rounded-xl border border-subtleBorder p-6 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 border-b border-subtleBorder pb-3">
                <div>
                  <h2 className="font-poppins font-medium text-lg text-primaryText">{sp.name}</h2>
                  <span className="text-xs italic text-secondaryText font-serif">{sp.latinName}</span>
                </div>
                <span className="badge-neutral text-xs font-medium">
                  {sp.calorificPower}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">{sp.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-3 bg-ivory rounded-md border border-subtleBorder">
                  <span className="text-secondaryText block text-[10px] uppercase font-medium">Masse volumique</span>
                  <span className="font-medium text-primaryText">{sp.density}</span>
                </div>
                <div className="p-3 bg-ivory rounded-md border border-subtleBorder">
                  <span className="text-secondaryText block text-[10px] uppercase font-medium">Tenue en braises</span>
                  <span className="font-medium text-primaryText">{sp.emberRetention}</span>
                </div>
                <div className="p-3 bg-ivory rounded-md border border-subtleBorder">
                  <span className="text-secondaryText block text-[10px] uppercase font-medium">Vitesse de combustion</span>
                  <span className="font-medium text-primaryText">{sp.combustionSpeed}</span>
                </div>
                <div className="p-3 bg-ivory rounded-md border border-subtleBorder">
                  <span className="text-secondaryText block text-[10px] uppercase font-medium">Sécurité &amp; Écorce</span>
                  <span className="font-medium text-primaryText">{sp.barkAndSparks}</span>
                </div>
              </div>

              <div className="p-3 bg-ivory rounded-md border border-subtleBorder text-xs text-secondaryText">
                <strong className="text-primaryText font-medium">Usage recommandé :</strong> {sp.usage}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-forest text-white rounded-xl p-8 text-center space-y-3">
          <h3 className="font-poppins font-medium text-lg text-white">Besoin d&apos;un conseil pour votre foyer ?</h3>
          <p className="text-xs text-ivory/80 max-w-lg mx-auto leading-relaxed">
            Nos spécialistes sont à votre écoute pour vous orienter vers la palette de bois étuvé la plus adaptée à votre installation.
          </p>
          <div className="pt-2">
            <Link
              href="/boutique"
              className="btn-primary bg-white text-forest hover:bg-ivory hover:text-forest-dark text-xs py-2.5 px-5 inline-flex items-center gap-1.5"
            >
              <span>Consulter les palettes en boutique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
