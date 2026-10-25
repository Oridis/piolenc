'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('woodmachine_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('woodmachine_cookie_consent', 'accepted_all');
    setIsVisible(false);
  };

  const handleRefuseNonEssential = () => {
    localStorage.setItem('woodmachine_cookie_consent', 'refused_marketing');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-subtleBorder rounded-xl shadow-hover p-5 text-primaryText font-sans">
      <div className="flex items-start space-x-3.5">
        <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0 mt-0.5">
          <Cookie className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <h4 className="font-poppins font-medium text-primaryText text-sm mb-1">
            Gestion de la confidentialité
          </h4>
          <p className="text-secondaryText leading-relaxed">
            Nous utilisons des cookies strictement nécessaires au fonctionnement du panier et à la sécurisation des commandes, conformément à la réglementation européenne RGPD.
          </p>
          <div className="mt-2">
            <Link href="/cookies" className="text-forest hover:underline font-medium">
              Consulter la politique de cookies
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-2 pt-3 border-t border-subtleBorder">
        <button
          onClick={handleRefuseNonEssential}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          Refuser
        </button>
        <button
          onClick={handleAcceptAll}
          className="btn-primary text-xs py-1.5 px-3"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
