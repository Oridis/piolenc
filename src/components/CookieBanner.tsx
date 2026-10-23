'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Check, X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('allo_maison_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('allo_maison_cookie_consent', 'accepted_all');
    setIsVisible(false);
  };

  const handleRefuseNonEssential = () => {
    localStorage.setItem('allo_maison_cookie_consent', 'refused_marketing');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 text-gray-800">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-wood-100 text-wood-800 rounded-xl shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs">
          <h4 className="font-bold text-gray-900 text-sm mb-1">
            Gestion de vos préférences cookies
          </h4>
          <p className="text-gray-600 leading-relaxed">
            Nous utilisons des cookies strictement nécessaires au fonctionnement du panier et à la sécurisation de vos commandes, ainsi que des mesures d'audience anonymes conformes au RGPD.
          </p>
          <div className="mt-2">
            <Link href="/cookies" className="text-forest-700 underline font-semibold hover:text-forest-900">
              En savoir plus sur notre politique de cookies
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
        <button
          onClick={handleRefuseNonEssential}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Continuer sans accepter
        </button>
        <button
          onClick={handleAcceptAll}
          className="px-4 py-1.5 rounded-lg bg-forest-800 text-white text-xs font-bold hover:bg-forest-700 shadow-sm"
        >
          Accepter tout
        </button>
      </div>
    </div>
  );
}
