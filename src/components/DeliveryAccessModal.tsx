'use client';

import React from 'react';
import { Truck, CheckCircle2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-wood-100 text-wood-900 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">
                Conditions d'accès camion &amp; déchargement
              </h3>
              <p className="text-xs text-gray-500">Obligatoire pour les livraisons de palettes &gt; 500 kg</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning notification */}
        <div className="my-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            La livraison de bois en palette s'effectue par <strong>camion porteur 19 à 26 tonnes</strong> (largeur ~2,50m, longueur ~10m). Merci de valider ces critères pour garantir une livraison fluide sans frais de relivraison.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Check 1 */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={accessibility.heavyTruckAccessible}
              onChange={(e) => onChange({ ...accessibility, heavyTruckAccessible: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-forest-700 rounded border-gray-300 focus:ring-forest-600"
            />
            <div>
              <span className="font-bold text-gray-900 block">
                Ma rue et mon entrée sont accessibles à un porteur 19T/26T
              </span>
              <span className="text-gray-600 block mt-0.5">
                Absence d'interdiction de tonnage (&lt; 3.5T), de passage trop étroit ou de pont limité.
              </span>
            </div>
          </label>

          {/* Check 2 */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={accessibility.hasTurningArea}
              onChange={(e) => onChange({ ...accessibility, hasTurningArea: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-forest-700 rounded border-gray-300 focus:ring-forest-600"
            />
            <div>
              <span className="font-bold text-gray-900 block">
                Aire de retournement ou sortie sans marche arrière dangereuse
              </span>
              <span className="text-gray-600 block mt-0.5">
                Le camion peut manœuvrer ou faire demi-tour en toute sécurité.
              </span>
            </div>
          </label>

          {/* Check 3 */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={!accessibility.steepSlope}
              onChange={(e) => onChange({ ...accessibility, steepSlope: !e.target.checked })}
              className="mt-0.5 w-4 h-4 text-forest-700 rounded border-gray-300 focus:ring-forest-600"
            />
            <div>
              <span className="font-bold text-gray-900 block">
                Sol dur, roulant et plat (pente &lt; 8%)
              </span>
              <span className="text-gray-600 block mt-0.5">
                Le transpalette électrique ne peut pas rouler sur de l'herbe, de la terre boueuse ou du gravier profond.
              </span>
            </div>
          </label>

          {/* Custom instructions */}
          <div>
            <label className="block font-bold text-gray-900 mb-1">
              Instructions spécifiques ou digicode chauffeur (facultatif) :
            </label>
            <textarea
              rows={2}
              value={accessibility.accessInstructions}
              onChange={(e) => onChange({ ...accessibility, accessInstructions: e.target.value })}
              placeholder="Ex: portail blanc au fond de l'impasse, sonner au numéro 14..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-forest-800 text-white rounded-xl font-bold text-xs hover:bg-forest-700 shadow"
          >
            Valider mes conditions d'accès
          </button>
        </div>
      </div>
    </div>
  );
}
