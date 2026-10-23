import React from 'react';
import { ShieldCheck, Truck, Flame, Award } from 'lucide-react';

export default function TrustBadges() {
  return (
    <div className="bg-wood-50 border-y border-wood-200/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-start space-x-3.5 bg-white p-4 rounded-xl shadow-sm border border-wood-100">
          <div className="p-2.5 bg-forest-100 text-forest-800 rounded-lg shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Bois sec certifié &lt; 20%</h4>
            <p className="text-xs text-gray-600 mt-1">Séchage en étuve industrielle NF H1. Pouvoir calorifique immédiat garanti sans fumée.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 bg-white p-4 rounded-xl shadow-sm border border-wood-100">
          <div className="p-2.5 bg-wood-100 text-wood-800 rounded-lg shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Livraison hayon &amp; transpalette</h4>
            <p className="text-xs text-gray-600 mt-1">Dépose de votre palette au plus près de votre garage ou abri par transporteur spécialisé.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 bg-white p-4 rounded-xl shadow-sm border border-wood-100">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Paiement par virement sécurisé</h4>
            <p className="text-xs text-gray-600 mt-1">Règlement direct de banque à banque en toute transparence, sans risque de fraude.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 bg-white p-4 rounded-xl shadow-sm border border-wood-100">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Forêts durables PEFC / FSC</h4>
            <p className="text-xs text-gray-600 mt-1">100% feuillus durs (chêne, hêtre, charme) issus d'exploitations forestières éco-gérées.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
