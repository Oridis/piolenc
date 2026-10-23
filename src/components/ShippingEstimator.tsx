'use client';

import React, { useState } from 'react';
import { Truck, MapPin, AlertCircle, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { calculateShippingFee, formatPrice } from '@/lib/pricing';

export default function ShippingEstimator() {
  const [country, setCountry] = useState<string>('FR');
  const [postalCode, setPostalCode] = useState<string>('75008');
  const [palletsCount, setPalletsCount] = useState<number>(1);
  const [difficultAccess, setDifficultAccess] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(true);

  const estimatedWeight = palletsCount * 900;
  // Estimate a sample order subtotal to test free shipping threshold
  const sampleSubtotalTTC = palletsCount * 339;

  const result = calculateShippingFee(
    {
      countryCode: country,
      postalCode,
      itemsCount: palletsCount,
      totalWeightKg: estimatedWeight,
      difficultAccess,
    },
    sampleSubtotalTTC
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-wood-800 to-wood-950 p-6 sm:p-8 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-wood-700 text-amber-400 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Calculateur de Frais et Délais de Livraison
          </h2>
        </div>
        <p className="text-wood-200 text-sm max-w-2xl">
          Consultez instantanément les tarifs de transport et les délais d'acheminement par camion avec hayon selon votre pays et code postal.
        </p>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Country Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Pays de destination
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'FR', label: 'France 🇫🇷' },
                { code: 'BE', label: 'Belgique 🇧🇪' },
                { code: 'DE', label: 'Allemagne 🇩🇪' },
                { code: 'CH', label: 'Suisse 🇨🇭' },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCountry(c.code);
                    if (c.code === 'BE') setPostalCode('1000');
                    else if (c.code === 'DE') setPostalCode('79098');
                    else if (c.code === 'CH') setPostalCode('1201');
                    else setPostalCode('75008');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition ${
                    country === c.code
                      ? 'border-forest-700 bg-forest-50 text-forest-900 ring-2 ring-forest-700/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Postal Code & Pallets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5 flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-wood-700" />
                <span>Code Postal</span>
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="ex: 69002, 1000, 79098..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Nombre de palettes (2 stères / pal)
              </label>
              <select
                value={palletsCount}
                onChange={(e) => setPalletsCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} palette{num > 1 ? 's' : ''} ({num * 2} stères / ~{num * 900} kg)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficult access checkbox */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={difficultAccess}
                onChange={(e) => setDifficultAccess(e.target.checked)}
                className="mt-1 w-4 h-4 text-forest-700 rounded border-gray-300 focus:ring-forest-600"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">
                  Accès restreint ou difficile (+35€)
                </span>
                <span className="text-gray-600 block mt-0.5">
                  Cochez si votre voie est étroite, sans aire de retournement pour porteur 19T, ou en forte pente de montagne nécessitant un petit camion ou transpalette motorisé spécifique.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5 bg-forest-50/70 rounded-2xl p-6 border border-forest-200/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 block mb-1">
              Devis transport en direct
            </span>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Livraison vers {country} ({postalCode}) :
            </h3>

            {/* Price display */}
            <div className="bg-white p-5 rounded-xl border border-forest-200 shadow-sm mb-5 text-center">
              {result.isEligibleForFreeShipping && !difficultAccess ? (
                <div>
                  <span className="text-3xl font-black text-forest-700">LIVRAISON OFFERTE</span>
                  <p className="text-xs text-forest-600 mt-1 font-semibold">
                    Offre applicable dès 650€ d'achat en France &amp; Belgique !
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-4xl font-black text-forest-900">
                    {formatPrice(result.shippingFeeTTC, country === 'CH' ? 'CHF' : 'EUR')}
                  </span>
                  <span className="text-xs text-gray-500 block mt-1">
                    TTC (dont TVA {result.vatRate}%)
                  </span>
                </div>
              )}
            </div>

            {/* Logistics features */}
            <div className="space-y-3 text-xs text-gray-700">
              <div className="flex items-center space-x-2 py-1.5 border-b border-forest-200/60">
                <Clock className="w-4 h-4 text-forest-700 shrink-0" />
                <span>Délai estimé : <strong>{result.estimatedLeadDays} à {result.estimatedLeadDays + 2} jours ouvrés</strong></span>
              </div>
              <div className="flex items-center space-x-2 py-1.5 border-b border-forest-200/60">
                <Truck className="w-4 h-4 text-forest-700 shrink-0" />
                <span>Transporteur : <strong>{result.carrierName}</strong></span>
              </div>
              <div className="flex items-center space-x-2 py-1.5 border-b border-forest-200/60">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Équipement inclus : <strong>Hayon élévateur + transpalette</strong></span>
              </div>
              <div className="flex items-center space-x-2 py-1.5">
                <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                <span>Prise de rendez-vous : <strong>Contact téléphonique préalable</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-[11px] text-gray-500 bg-white p-3 rounded-lg border border-forest-100">
            ℹ️ Le déchargement est garanti devant votre propriété ou dans votre cour si le sol est plat, dur et carrossable.
          </div>
        </div>
      </div>
    </div>
  );
}
