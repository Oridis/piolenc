import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { WOOD_SPECIES } from '@/lib/constants';
import { Flame, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WoodSpeciesGuidePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Guide Pédagogique &amp; Technique
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Guide Complet des Essences de Bois de Chauffage
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Toutes les essences d'arbres ne se valent pas pour alimenter un poêle, un insert ou une cheminée. En France et en Europe, les essences sont classées en 3 groupes selon leur masse volumique et leur pouvoir calorifique.
          </p>
        </div>

        {/* Group 1 Highlight */}
        <div className="bg-forest-50 p-6 rounded-3xl border border-forest-200 space-y-3">
          <div className="flex items-center space-x-2 text-forest-900 font-extrabold text-sm">
            <Flame className="w-5 h-5 text-forest-700" />
            <span>Pourquoi choisir exclusivement des bois durs de Groupe 1 (G1) ?</span>
          </div>
          <p className="text-xs text-forest-800 leading-relaxed">
            Les feuillus durs (Chêne, Hêtre, Charme, Frêne) possèdent une densité de 700 à 800 kg/m³. Ils dégagent jusqu'à <strong>2,5 fois plus d'énergie par stère</strong> que les résineux ou les bois tendres (bouleau, peuplier, saule), produisent un lit de braises durable et ne projettent pas d'étincelles dangereuses.
          </p>
        </div>

        {/* Detailed Species Cards */}
        <div className="space-y-8">
          {WOOD_SPECIES.map((sp) => (
            <div key={sp.id} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{sp.name}</h2>
                  <span className="text-xs italic text-gray-400 font-serif">{sp.latinName}</span>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-full">
                  {sp.calorificPower}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{sp.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Masse volumique</span>
                  <strong className="text-gray-900">{sp.density}</strong>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Tenue en braises</span>
                  <strong className="text-gray-900">{sp.emberRetention}</strong>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Combustion</span>
                  <strong className="text-gray-900">{sp.combustionSpeed}</strong>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Sécurité &amp; Écorce</span>
                  <strong className="text-gray-900">{sp.barkAndSparks}</strong>
                </div>
              </div>

              <div className="p-3 bg-wood-50 rounded-xl border border-wood-200 text-xs text-wood-900">
                <strong>Usage recommandé :</strong> {sp.usage}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-forest-900 to-forest-800 text-white rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-xl font-black">Besoin d'un conseil pour votre foyer ?</h3>
          <p className="text-xs text-forest-100 max-w-lg mx-auto">
            Nos spécialistes du bois de chauffage sont à votre écoute pour vous orienter vers la palette adaptée à votre appareil.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-forest-950 font-black px-6 py-3 rounded-xl text-xs transition shadow-lg"
          >
            <span>Commander des palettes de chêne &amp; hêtre étuvé</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
