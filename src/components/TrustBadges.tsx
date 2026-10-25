import React from 'react';
import { ShieldCheck, Truck, Flame, Award } from 'lucide-react';

export default function TrustBadges() {
  return (
    <div className="bg-ivory border-y border-subtleBorder py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-start space-x-3.5 bg-white p-5 rounded-lg border border-subtleBorder">
          <div className="w-10 h-10 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-poppins font-medium text-primaryText text-sm">Bois sec garanti &lt; 20%</h4>
            <p className="text-xs text-secondaryText mt-1 leading-relaxed">
              Séchage en étuve biomasse NF H1. Pouvoir calorifique immédiat et vitre propre garantis.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 bg-white p-5 rounded-lg border border-subtleBorder">
          <div className="w-10 h-10 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-poppins font-medium text-primaryText text-sm">Livraison hayon &amp; transpalette</h4>
            <p className="text-xs text-secondaryText mt-1 leading-relaxed">
              Dépose de la palette sur sol stabilisé au plus près de votre garage ou lieu de stockage.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 bg-white p-5 rounded-lg border border-subtleBorder">
          <div className="w-10 h-10 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-poppins font-medium text-primaryText text-sm">Virement bancaire direct</h4>
            <p className="text-xs text-secondaryText mt-1 leading-relaxed">
              Règlement sécurisé de banque à banque avec référence unique et validation comptable.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 bg-white p-5 rounded-lg border border-subtleBorder">
          <div className="w-10 h-10 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-poppins font-medium text-primaryText text-sm">Forêts durables PEFC / FSC</h4>
            <p className="text-xs text-secondaryText mt-1 leading-relaxed">
              100% feuillus durs (chêne, hêtre, charme) issus d&apos;exploitations forestières éco-gérées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
