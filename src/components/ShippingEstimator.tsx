'use client';

import React, { useState } from 'react';
import { Truck, MapPin, Clock, ShieldCheck, Check, Info } from 'lucide-react';
import { calculateShippingFee, formatPrice } from '@/lib/pricing';

export default function ShippingEstimator() {
  const [country, setCountry] = useState<string>('FR');
  const [postalCode, setPostalCode] = useState<string>('75008');
  const [palletsCount, setPalletsCount] = useState<number>(1);
  const [difficultAccess, setDifficultAccess] = useState<boolean>(false);

  const estimatedWeight = palletsCount * 900;
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
    <div className="bg-white rounded-xl shadow-card border border-subtleBorder overflow-hidden font-sans">
      <div className="bg-forest p-6 sm:p-7 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-forest-dark flex items-center justify-center text-beige">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="font-poppins font-medium text-xl text-white">
            Estimation des frais et délais de livraison
          </h2>
        </div>
        <p className="text-ivory/80 text-xs max-w-2xl leading-relaxed">
          Calculez les frais de transport par camion porteur avec hayon élévateur et transpalette en fonction de votre zone géographique.
        </p>
      </div>

      <div className="p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Country Selection */}
          <div>
            <label className="block text-xs font-medium text-primaryText mb-1.5">
              Pays de livraison
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'FR', label: 'France' },
                { code: 'BE', label: 'Belgique' },
                { code: 'DE', label: 'Allemagne' },
                { code: 'CH', label: 'Suisse' },
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
                  className={`py-2 px-3 rounded-md border text-xs font-medium text-center transition-colors duration-150 ${
                    country === c.code
                      ? 'border-forest bg-forest text-white'
                      : 'border-subtleBorder bg-white hover:bg-ivory text-primaryText'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Postal Code & Pallets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-primaryText mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-forest" />
                <span>Code postal</span>
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Ex : 69002, 1000..."
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-primaryText mb-1.5">
                Nombre de palettes (2 stères / palette)
              </label>
              <select
                value={palletsCount}
                onChange={(e) => setPalletsCount(Number(e.target.value))}
                className="input-field text-xs bg-white"
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
          <div className="p-3.5 bg-ivory rounded-lg border border-subtleBorder">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={difficultAccess}
                onChange={(e) => setDifficultAccess(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-forest rounded border-subtleBorder focus:ring-forest"
              />
              <div className="text-xs">
                <span className="font-medium text-primaryText block">
                  Accès restreint ou difficile (+35 €)
                </span>
                <span className="text-secondaryText block mt-0.5 leading-normal text-[11px]">
                  Voie étroite, absence d&apos;aire de retournement pour camion porteur 19T, ou forte déclivité nécessitant un matériel adapté.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5 bg-ivory rounded-xl p-5 border border-subtleBorder flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-secondaryText block mb-1">
              Tarif estimé pour votre zone
            </span>
            <h3 className="font-poppins font-medium text-sm text-primaryText mb-3">
              Destination : {country} ({postalCode})
            </h3>

            {/* Price display */}
            <div className="bg-white p-4 rounded-lg border border-subtleBorder text-center mb-4">
              {result.isEligibleForFreeShipping && !difficultAccess ? (
                <div>
                  <span className="font-poppins font-semibold text-xl text-statusSuccess">LIVRAISON OFFERTE</span>
                  <p className="text-[11px] text-secondaryText mt-1">
                    Offre applicable dès 650 € d&apos;achat en France et Belgique.
                  </p>
                </div>
              ) : (
                <div>
                  <span className="font-poppins font-semibold text-3xl text-primaryText">
                    {formatPrice(result.shippingFeeTTC, country === 'CH' ? 'CHF' : 'EUR')}
                  </span>
                  <span className="text-[11px] text-secondaryText block mt-0.5">
                    TTC (dont TVA {result.vatRate}%)
                  </span>
                </div>
              )}
            </div>

            {/* Logistics details */}
            <div className="space-y-2 text-xs text-secondaryText">
              <div className="flex items-center justify-between py-1 border-b border-subtleBorder/60">
                <span className="flex items-center gap-1.5 text-primaryText">
                  <Clock className="w-3.5 h-3.5 text-forest" />
                  <span>Délai d&apos;acheminement</span>
                </span>
                <span className="font-medium text-primaryText">{result.estimatedLeadDays} à {result.estimatedLeadDays + 2} jours ouvrés</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-subtleBorder/60">
                <span className="flex items-center gap-1.5 text-primaryText">
                  <Truck className="w-3.5 h-3.5 text-forest" />
                  <span>Transporteur</span>
                </span>
                <span className="font-medium text-primaryText">{result.carrierName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-subtleBorder/60">
                <span className="flex items-center gap-1.5 text-primaryText">
                  <Check className="w-3.5 h-3.5 text-statusSuccess" />
                  <span>Équipement inclus</span>
                </span>
                <span className="font-medium text-primaryText">Hayon &amp; transpalette</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-primaryText">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                  <span>Prise de rendez-vous</span>
                </span>
                <span className="font-medium text-primaryText">Appel préalable</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-md bg-white border border-subtleBorder flex items-start gap-2 text-[11px] text-secondaryText">
            <Info className="w-3.5 h-3.5 text-secondaryText shrink-0 mt-0.5" />
            <span>Dépose sur sol stabilisé et carrossable devant la propriété ou à l&apos;entrée de votre abri.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
