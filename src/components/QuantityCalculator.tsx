'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, Home, AlertCircle, ArrowRight } from 'lucide-react';

export default function QuantityCalculator() {
  const [surfaceM2, setSurfaceM2] = useState<number>(100);
  const [heatingType, setHeatingType] = useState<'principal' | 'appoint' | 'agrement'>('principal');
  const [insulation, setInsulation] = useState<'rt2012' | 'moyenne' | 'ancienne'>('moyenne');
  const [appliance, setAppliance] = useState<'poele' | 'insert' | 'cheminee'>('poele');

  let baseConsumptionRatio = 0.08;
  if (heatingType === 'appoint') baseConsumptionRatio = 0.035;
  else if (heatingType === 'agrement') baseConsumptionRatio = 0.015;

  let insulationMultiplier = 1.0;
  if (insulation === 'rt2012') insulationMultiplier = 0.65;
  else if (insulation === 'ancienne') insulationMultiplier = 1.45;

  let applianceMultiplier = 1.0;
  if (appliance === 'poele') applianceMultiplier = 0.85;
  else if (appliance === 'cheminee') applianceMultiplier = 2.2;

  const rawSteres = surfaceM2 * baseConsumptionRatio * insulationMultiplier * applianceMultiplier;
  const recommendedSteres = Math.max(1, Math.round(rawSteres * 2) / 2);
  const recommendedPallets = Math.max(1, Math.ceil(recommendedSteres / 2));
  const estimatedKWh = Math.round(recommendedSteres * 2000);
  const estimatedWeightKg = Math.round(recommendedSteres * 450);

  return (
    <div className="bg-white rounded-xl shadow-card border border-subtleBorder overflow-hidden font-sans">
      <div className="bg-forest p-6 sm:p-7 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-forest-dark flex items-center justify-center text-beige">
            <Calculator className="w-5 h-5" />
          </div>
          <h2 className="font-poppins font-medium text-xl text-white">
            Calculateur de volume de bois nécessaire
          </h2>
        </div>
        <p className="text-ivory/80 text-xs max-w-2xl leading-relaxed">
          Estimez précisément le cubage en stères et le nombre de palettes nécessaires selon votre surface, votre isolation et votre équipement de chauffage.
        </p>
      </div>

      <div className="p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Surface */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-primaryText flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-forest" />
                <span>Surface chauffée au bois</span>
              </label>
              <span className="text-xs font-semibold font-poppins text-primaryText bg-ivory px-2.5 py-0.5 rounded border border-subtleBorder">
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
              className="w-full h-1.5 bg-beige-200 rounded-md appearance-none cursor-pointer accent-forest"
            />
            <div className="flex justify-between text-[11px] text-secondaryText mt-1">
              <span>30 m²</span>
              <span>100 m²</span>
              <span>200 m²</span>
              <span>300 m²</span>
            </div>
          </div>

          {/* Usage Type */}
          <div>
            <label className="block text-xs font-medium text-primaryText mb-1.5">
              Type d&apos;utilisation du bois
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'principal', title: 'Chauffage principal', desc: 'Chauffe l\'ensemble du logement' },
                { id: 'appoint', title: 'Chauffage d\'appoint', desc: 'Complément en soirée et week-end' },
                { id: 'agrement', title: 'Agrément', desc: 'Flambée occasionnelle de plaisir' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHeatingType(item.id as any)}
                  className={`text-left p-3 rounded-md border text-xs transition-colors duration-150 ${
                    heatingType === item.id
                      ? 'border-forest bg-forest-50/60 font-medium'
                      : 'border-subtleBorder bg-white hover:bg-ivory text-primaryText'
                  }`}
                >
                  <p className="font-poppins font-medium text-primaryText text-xs">{item.title}</p>
                  <p className="text-[11px] text-secondaryText mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Insulation Level */}
          <div>
            <label className="block text-xs font-medium text-primaryText mb-1.5">
              Niveau d&apos;isolation thermique
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'rt2012', title: 'Très performante', desc: 'RT2012 / RE2020 / BBC' },
                { id: 'moyenne', title: 'Standard', desc: 'Double vitrage, combles isolés' },
                { id: 'ancienne', title: 'Peu isolée', desc: 'Bâti ancien non rénové' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setInsulation(item.id as any)}
                  className={`text-left p-3 rounded-md border text-xs transition-colors duration-150 ${
                    insulation === item.id
                      ? 'border-forest bg-forest-50/60 font-medium'
                      : 'border-subtleBorder bg-white hover:bg-ivory text-primaryText'
                  }`}
                >
                  <p className="font-poppins font-medium text-primaryText text-xs">{item.title}</p>
                  <p className="text-[11px] text-secondaryText mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Heating Appliance */}
          <div>
            <label className="block text-xs font-medium text-primaryText mb-1.5">
              Appareil de combustion
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'poele', title: 'Poêle à bois moderne', desc: 'Rendement supérieur à 80%' },
                { id: 'insert', title: 'Foyer fermé / Insert', desc: 'Rendement ~70%' },
                { id: 'cheminee', title: 'Cheminée ouverte', desc: 'Rendement faible < 20%' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAppliance(item.id as any)}
                  className={`text-left p-3 rounded-md border text-xs transition-colors duration-150 ${
                    appliance === item.id
                      ? 'border-forest bg-forest-50/60 font-medium'
                      : 'border-subtleBorder bg-white hover:bg-ivory text-primaryText'
                  }`}
                >
                  <p className="font-poppins font-medium text-primaryText text-xs">{item.title}</p>
                  <p className="text-[11px] text-secondaryText mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Recommended Results */}
        <div className="lg:col-span-5 bg-ivory rounded-xl p-5 border border-subtleBorder flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-secondaryText block mb-1">
              Résultat personnalisé
            </span>
            <h3 className="font-poppins font-medium text-sm text-primaryText mb-3">
              Volume recommandé pour la saison d&apos;hiver :
            </h3>

            {/* Main Result Card */}
            <div className="bg-white p-5 rounded-lg border border-subtleBorder text-center mb-4">
              <span className="font-poppins font-semibold text-4xl text-primaryText">
                {recommendedSteres}
              </span>
              <span className="font-poppins font-medium text-lg text-secondaryText ml-1.5">stères</span>
              <p className="text-xs text-secondaryText mt-1">
                Équivalent à <strong className="text-primaryText font-medium">{recommendedPallets} palette{recommendedPallets > 1 ? 's' : ''}</strong> de 2 stères (1,40 m³)
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-2 text-xs text-secondaryText mb-4">
              <div className="flex justify-between items-center py-1 border-b border-subtleBorder/60">
                <span>Énergie calorifique estimée</span>
                <span className="font-medium text-primaryText">~{estimatedKWh.toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-subtleBorder/60">
                <span>Masse totale de bois sec</span>
                <span className="font-medium text-primaryText">~{estimatedWeightKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-subtleBorder/60">
                <span>Essences préconisées</span>
                <span className="font-medium text-primaryText">Chêne &amp; Hêtre étuvés</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Format de bûches adapté</span>
                <span className="font-medium text-primaryText">Bûches 33 cm ou 25 cm</span>
              </div>
            </div>

            {appliance === 'cheminee' && (
              <div className="p-3 bg-white border border-subtleBorder rounded-md text-[11px] text-secondaryText flex items-start gap-2 mb-3">
                <AlertCircle className="w-3.5 h-3.5 text-statusWarning shrink-0 mt-0.5" />
                <span>
                  Une cheminée ouverte présente une déperdition thermique importante. L&apos;installation d&apos;un insert permettrait d&apos;économiser jusqu&apos;à 60% de bois.
                </span>
              </div>
            )}
          </div>

          <Link
            href="/boutique"
            className="btn-primary w-full text-xs text-center inline-flex items-center justify-center gap-1.5"
          >
            <span>Consulter les palettes en boutique</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
