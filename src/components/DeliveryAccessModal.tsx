'use client';

import React from 'react';
import { Truck, AlertTriangle, X } from 'lucide-react';

interface DeliveryAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessibility: {
    heavyTruckAccessible: boolean;
    requiresTailgate: boolean;
    hasTurningArea: boolean;
    steepSlope: boolean;
    accessInstructions: string;
  };
  onChange: (updated: any) => void;
}

export default function DeliveryAccessModal({
  isOpen,
  onClose,
  accessibility,
  onChange,
}: DeliveryAccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div 
        className="absolute inset-0 bg-primaryText/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-hover border border-subtleBorder z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-subtleBorder">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-poppins font-medium text-primaryText text-base">
                Conditions d&apos;accès camion &amp; déchargement
              </h3>
              <p className="text-xs text-secondaryText">Vérification obligatoire pour les livraisons de palettes &gt; 500 kg</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-secondaryText hover:text-primaryText hover:bg-ivory rounded-md transition-colors"
            aria-label="Fermer la modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative notice */}
        <div className="my-4 p-3.5 bg-ivory border border-subtleBorder rounded-lg text-xs text-primaryText flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-statusWarning shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            La livraison s&apos;effectue par <strong>camion porteur 19 à 26 tonnes</strong> (largeur ~2,50 m, longueur ~10 m). Merci de valider ces critères d&apos;accès afin de garantir le bon déroulement du déchargement.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {/* Criterion 1 */}
          <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-subtleBorder hover:bg-ivory/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={accessibility.heavyTruckAccessible}
              onChange={(e) => onChange({ ...accessibility, heavyTruckAccessible: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-forest rounded border-subtleBorder focus:ring-forest"
            />
            <div>
              <span className="font-medium text-primaryText block">
                La voie d&apos;accès et le portail sont accessibles à un porteur 19T / 26T
              </span>
              <span className="text-secondaryText block mt-0.5 leading-normal">
                Aucune restriction de tonnage (&lt; 3.5T), pont bas ou passage trop étroit.
              </span>
            </div>
          </label>

          {/* Criterion 2 */}
          <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-subtleBorder hover:bg-ivory/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={accessibility.hasTurningArea}
              onChange={(e) => onChange({ ...accessibility, hasTurningArea: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-forest rounded border-subtleBorder focus:ring-forest"
            />
            <div>
              <span className="font-medium text-primaryText block">
                Aire de retournement ou sortie sans marche arrière dangereuse
              </span>
              <span className="text-secondaryText block mt-0.5 leading-normal">
                Possibilité pour le chauffeur de manœuvrer en toute sécurité.
              </span>
            </div>
          </label>

          {/* Criterion 3 */}
          <label className="flex items-start space-x-3 p-3.5 rounded-lg border border-subtleBorder hover:bg-ivory/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={!accessibility.steepSlope}
              onChange={(e) => onChange({ ...accessibility, steepSlope: !e.target.checked })}
              className="mt-0.5 w-4 h-4 text-forest rounded border-subtleBorder focus:ring-forest"
            />
            <div>
              <span className="font-medium text-primaryText block">
                Sol dur, roulant et plan (pente &lt; 8%)
              </span>
              <span className="text-secondaryText block mt-0.5 leading-normal">
                Le transpalette électrique ne peut circuler sur l&apos;herbe meuble ou les graviers épais.
              </span>
            </div>
          </label>

          {/* Special instructions */}
          <div className="pt-1">
            <label className="block font-medium text-primaryText mb-1.5">
              Précisions d&apos;accès ou code portail (facultatif) :
            </label>
            <textarea
              rows={2}
              value={accessibility.accessInstructions}
              onChange={(e) => onChange({ ...accessibility, accessInstructions: e.target.value })}
              placeholder="Ex : portail métallique gris au bout de l'allée, sonner au numéro 14..."
              className="input-field text-xs resize-none"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-subtleBorder flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary w-full sm:w-auto text-xs"
          >
            Valider les critères d&apos;accès
          </button>
        </div>
      </div>
    </div>
  );
}
