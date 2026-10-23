'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Tag,
} from 'lucide-react';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotalTTC,
    subtotalHT,
    totalItemsCount,
  } = useCart();

  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');

  const freeShippingThreshold = 650;
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotalTTC);

  const handleApplyDiscount = () => {
    setDiscountError('');
    if (!discountInput.trim()) return;

    if (discountInput.toUpperCase() === 'BIENVENUE10') {
      if (subtotalTTC >= 300) {
        setAppliedDiscount({ code: 'BIENVENUE10', amount: 10 });
      } else {
        setDiscountError('Ce code requiert un minimum de 300€ de commande');
      }
    } else if (discountInput.toUpperCase() === 'HIVER2026') {
      if (subtotalTTC >= 600) {
        setAppliedDiscount({ code: 'HIVER2026', amount: Number((subtotalTTC * 0.05).toFixed(2)) });
      } else {
        setDiscountError('Ce code requiert un minimum de 600€ de commande (5% de remise)');
      }
    } else {
      setDiscountError('Code promotionnel invalide ou expiré');
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Votre Panier de Bois de Chauffage
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Vérifiez vos quantités avant de passer à l'étape des coordonnées et des contraintes d'accès camion.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center space-y-4 shadow-sm max-w-xl mx-auto">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900">Votre panier est actuellement vide</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Retrouvez nos sélections de palettes de bois sec étuvé en bûches de 25 cm, 33 cm ou 50 cm.
            </p>
            <Link
              href="/boutique"
              className="inline-flex items-center space-x-2 bg-forest-800 hover:bg-forest-700 text-white font-bold py-3 px-6 rounded-xl text-xs transition shadow-md"
            >
              <span>Découvrir la boutique de bois</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items List (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Articles ({totalItemsCount})
                </span>
                <button
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-600 transition"
                >
                  Vider le panier
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.productId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-gray-900 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Format : {item.logLength} • {item.packaging}
                        </p>
                        <p className="text-xs font-bold text-forest-800 mt-1">
                          {formatPrice(item.priceTTC)} TTC / unité
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-xl bg-white p-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 rounded-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <span className="font-black text-sm text-gray-900 block">
                          {formatPrice(item.priceTTC * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Free delivery incentive bar */}
              <div className="mt-4 p-4 bg-forest-50 border border-forest-200/80 rounded-2xl">
                <div className="flex items-center space-x-2 text-xs font-bold text-forest-900 mb-1.5">
                  <Truck className="w-4 h-4 text-forest-700 shrink-0" />
                  <span>
                    {remainingForFree > 0
                      ? `Ajoutez ${formatPrice(remainingForFree)} de bois pour bénéficier de la livraison offerte !`
                      : 'Félicitations, vous êtes éligible à la livraison offerte !'}
                  </span>
                </div>
                <div className="w-full bg-forest-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-forest-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotalTTC / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right Summary (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Récapitulatif de votre commande
              </h2>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex justify-between items-center">
                  <span>Sous-total articles HT</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotalHT)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>TVA applicable (5.5% / 20%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotalTTC - subtotalHT)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sous-total articles TTC</span>
                  <span className="font-bold text-gray-900">{formatPrice(subtotalTTC)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Remise ({appliedDiscount.code})</span>
                    <span>- {formatPrice(appliedDiscount.amount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-forest-800">
                  <span>Frais de livraison spécialisée</span>
                  <span className="italic">Calculés à l'étape suivante</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-gray-900">Total estimé</span>
                  <span className="text-2xl font-black text-forest-900">
                    {formatPrice(Math.max(0, subtotalTTC - (appliedDiscount?.amount || 0)))}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <label className="block font-bold text-gray-900">Code promo / remise :</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="Ex: BIENVENUE10"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition"
                  >
                    Appliquer
                  </button>
                </div>
                {discountError && <p className="text-red-600 text-[11px]">{discountError}</p>}
                {appliedDiscount && <p className="text-emerald-700 text-[11px] font-bold">Code appliqué avec succès !</p>}
              </div>

              {/* Proceed to checkout CTA */}
              <Link
                href="/commande"
                className="w-full bg-forest-800 hover:bg-forest-700 text-white font-black py-4 px-4 rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm"
              >
                <span>Passer la commande</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="text-[11px] text-gray-500 space-y-1.5 text-center">
                <p>🔒 Paiement 100% sécurisé par virement bancaire.</p>
                <p>Dépose de votre palette au plus près de votre garage.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
