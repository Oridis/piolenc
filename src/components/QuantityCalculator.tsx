'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, Flame, Home, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function QuantityCalculator() {
  const [surfaceM2, setSurfaceM2] = useState<number>(100);
  const [heatingType, setHeatingType] = useState<'principal' | 'appoint' | 'agrement'>('principal');
  const [insulation, setInsulation] = useState<'rt2012' | 'moyenne' | 'ancienne'>('moyenne');
  const [appliance, setAppliance] = useState<'poele' | 'insert' | 'cheminee'>('poele');

  // Calculation algorithm:
  // Base consumption in stères per 100m²:
  // Principal: 6 to 10 stères depending on insulation
  // Appoint: 3 to 5 stères
  // Agrement: 1 to 2 stères
  let baseConsumptionRatio = 0.07; // stère per m2

  if (heatingType === 'principal') {
    baseConsumptionRatio = 0.08;
  } else if (heatingType === 'appoint') {
    baseConsumptionRatio = 0.035;
  } else {
    baseConsumptionRatio = 0.015;
  }

  // Insulation multiplier
  let insulationMultiplier = 1.0;
  if (insulation === 'rt2012') insulationMultiplier = 0.65;
  else if (insulation === 'moyenne') insulationMultiplier = 1.0;
  else if (insulation === 'ancienne') insulationMultiplier = 1.45;

  // Appliance efficiency multiplier
  let applianceMultiplier = 1.0;
  if (appliance === 'poele') applianceMultiplier = 0.85; // ~80-85% yield
  else if (appliance === 'insert') applianceMultiplier = 1.0; // ~70-75% yield
  else if (appliance === 'cheminee') applianceMultiplier = 2.2; // ~15-20% yield (open fireplace consumes heavily)

  const rawSteres = surfaceM2 * baseConsumptionRatio * insulationMultiplier * applianceMultiplier;
  const recommendedSteres = Math.max(1, Math.round(rawSteres * 2) / 2); // rounded to nearest 0.5 stère

  // Pallet equivalents (1 pallet of 2 stères)
  const recommendedPallets = Math.max(1, Math.ceil(recommendedSteres / 2));
  const estimatedKWh = Math.round(recommendedSteres * 2000);
  const estimatedWeightKg = Math.round(recommendedSteres * 450);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-forest-900 to-forest-800 p-6 sm:p-8 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-forest-700 text-amber-400 rounded-lg">
            <Calculator className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Calculateur de Quantité de Bois Recommandée
          </h2>
        </div>
        <p className="text-forest-200 text-sm max-w-2xl">
          Estimez précisément le nombre de stères et de palettes nécessaires pour chauffer votre logement tout au long de l'hiver selon vos caractéristiques réelles.
        </p>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Surface */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Home className="w-4 h-4 text-forest-700" />
                <span>Surface chauffée au bois</span>
              </label>
              <span className="text-base font-extrabold text-forest-900 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
                {surfaceM2} m²
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="5"
              value={surfaceM2}
              onChange={(e) => setSurfaceM2(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-forest-700"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>30 m²</span>
              <span>100 m²</span>
              <span>200 m²</span>
              <span>300 m²</span>
            </div>
          </div>

          {/* Usage Type */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Type d'utilisation du bois
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'principal', title: 'Chauffage Principal', desc: 'Chauffe toute la maison' },
                { id: 'appoint', title: 'Chauffage d\'Appoint', desc: 'Complément soirs & week-end' },
                { id: 'agrement', title: 'Plaisir & Agrément', desc: 'Flambée occasionnelle' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHeatingType(item.id as any)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    heatingType === item.id
                      ? 'border-forest-700 bg-forest-50/70 text-forest-950 font-bold ring-2 ring-forest-700/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Insulation Level */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Niveau d'isolation thermique
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'rt2012', title: 'Très bien isolé', desc: 'BBC, RT2012, RE2020' },
                { id: 'moyenne', title: 'Isolation standard', desc: 'Double vitrage, combles isolés' },
                { id: 'ancienne', title: 'Peu ou mal isolé', desc: 'Maison ancienne non rénovée' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setInsulation(item.id as any)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    insulation === item.id
                      ? 'border-forest-700 bg-forest-50/70 text-forest-950 font-bold ring-2 ring-forest-700/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Heating Appliance */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Appareil de chauffage
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'poele', title: 'Poêle scandinave / fonte', desc: 'Rendement &gt; 80%' },
                { id: 'insert', title: 'Foyer fermé / Insert', desc: 'Rendement ~70%' },
                { id: 'cheminee', title: 'Cheminée ouverte', desc: 'Rendement faible &lt; 20%' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAppliance(item.id as any)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    appliance === item.id
                      ? 'border-forest-700 bg-forest-50/70 text-forest-950 font-bold ring-2 ring-forest-700/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Recommended Results (5 cols) */}
        <div className="lg:col-span-5 bg-wood-50/80 rounded-2xl p-6 border border-wood-200/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-wood-700 block mb-1">
              Résultat personnalisé
            </span>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Volume recommandé pour l'hiver :</h3>

            {/* Main Result Card */}
            <div className="bg-white p-5 rounded-xl border border-wood-200 shadow-sm text-center mb-6">
              <span className="text-4xl sm:text-5xl font-black text-forest-900">
                {recommendedSteres}
              </span>
              <span className="text-lg font-bold text-forest-800 ml-2">stères</span>
              <p className="text-xs text-gray-500 mt-1">
                Soit l'équivalent de <strong className="text-gray-900">{recommendedPallets} palette{recommendedPallets > 1 ? 's' : ''}</strong> de 2 stères
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-3 text-xs text-gray-700 mb-6">
              <div className="flex justify-between items-center py-1.5 border-b border-wood-200/60">
                <span>Énergie calorifique estimée</span>
                <span className="font-bold text-gray-900">~{estimatedKWh.toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-wood-200/60">
                <span>Masse totale de bois sec</span>
                <span className="font-bold text-gray-900">~{estimatedWeightKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-wood-200/60">
                <span>Essence idéale conseillée</span>
                <span className="font-bold text-forest-900">Chêne &amp; Hêtre étuvé</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span>Format recommandé</span>
                <span className="font-bold text-gray-900">Bûches 33 cm ou 25 cm</span>
              </div>
            </div>

            {appliance === 'cheminee' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Une cheminée ouverte consomme 4 à 5 fois plus de bois qu'un foyer fermé moderne. L'installation d'un insert vous ferait économiser jusqu'à 60% de bois.
                </span>
              </div>
            )}
          </div>

          <Link
            href="/boutique"
            className="w-full bg-forest-800 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-forest-700 transition flex items-center justify-center space-x-2 shadow-md text-sm text-center"
          >
            <span>Voir les palettes correspondantes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
