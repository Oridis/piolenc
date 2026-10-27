'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import { describeAvailabilityIssue, fetchCartAvailability, type CartAvailabilityEntry } from '@/lib/cart-availability';
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
  AlertTriangle,
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
  const [issues, setIssues] = useState<Map<string, CartAvailabilityEntry>>(new Map());

  // Le panier est conservé dans le navigateur : on redemande l'état réel du
  // catalogue dès qu'une ligne change, pour signaler un produit retiré ou un
  // stock épuisé avant l'étape de paiement.
  const cartSignature = items.map((item) => `${item.productId}:${item.quantity}`).join('|');

  useEffect(() => {
    if (items.length === 0) {
      setIssues(new Map());
      return;
    }
    let cancelled = false;
    fetchCartAvailability(items.map((item) => ({ id: item.productId, quantity: item.quantity })))
      .then((entries) => {
        if (!cancelled) setIssues(entries);
      })
      .catch(() => {
        // Vérification indisponible : on n'affiche pas de faux positif, le
        // tunnel de commande revalide tout côté serveur.
        if (!cancelled) setIssues(new Map());
      });
    return () => {
      cancelled = true;
    };
    // Le contenu du panier est résumé par `cartSignature`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);

  const blockedItems = items.filter((item) => describeAvailabilityIssue(issues.get(item.productId)) !== null);

  const removeUnavailable = () => {
    blockedItems.forEach((item) => removeFromCart(item.productId));
  };

  const freeShippingThreshold = 650;
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotalTTC);

  const handleApplyDiscount = () => {
    setDiscountError('');
    if (!discountInput.trim()) return;

    if (discountInput.toUpperCase() === 'BIENVENUE10') {
      if (subtotalTTC >= 300) {
        setAppliedDiscount({ code: 'BIENVENUE10', amount: 10 });
      } else {
        setDiscountError('Ce code requiert un montant minimum de 300 €');
      }
    } else if (discountInput.toUpperCase() === 'HIVER2026') {
      if (subtotalTTC >= 600) {
        setAppliedDiscount({ code: 'HIVER2026', amount: Number((subtotalTTC * 0.05).toFixed(2)) });
      } else {
        setDiscountError('Ce code requiert un montant minimum de 600 € (5% de remise)');
      }
    } else {
      setDiscountError('Code promotionnel invalide ou expiré');
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
              Votre panier de commande
            </h1>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Vérifiez vos quantités avant de renseigner votre adresse de livraison et les critères d&apos;accès camion.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-subtleBorder text-center space-y-4 shadow-subtle max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto rounded-full bg-ivory border border-subtleBorder flex items-center justify-center text-secondaryText">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="font-poppins font-medium text-base text-primaryText">Votre panier est actuellement vide</h2>
            <p className="text-xs text-secondaryText max-w-xs mx-auto leading-relaxed">
              Consultez notre sélection de palettes de bois sec étuvé NF H1 prêtes pour l&apos;allumage immédiat.
            </p>
            <div className="pt-2">
              <Link
                href="/boutique"
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <span>Accéder à la boutique</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
          {blockedItems.length > 0 && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-200 bg-red-50"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-statusError shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-statusError">
                    {blockedItems.length === 1
                      ? '1 article de votre panier n’est plus disponible'
                      : `${blockedItems.length} articles de votre panier ne sont plus disponibles`}
                  </p>
                  <p className="text-[11px] text-statusError mt-0.5">
                    Retirez-les pour poursuivre : la commande les refuserait.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeUnavailable}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white bg-statusError hover:bg-red-800 transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Retirer les articles indisponibles</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items List (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-subtleBorder">
                <span className="text-xs font-medium text-secondaryText uppercase tracking-wider">
                  Articles sélectionnés ({totalItemsCount})
                </span>
                <button
                  onClick={clearCart}
                  className="text-xs text-secondaryText hover:text-statusError transition-colors"
                >
                  Vider le panier
                </button>
              </div>

              <div className="divide-y divide-subtleBorder/60">
                {items.map((item) => {
                  const issue = describeAvailabilityIssue(issues.get(item.productId));
                  return (
                  <div
                    key={item.productId}
                    className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      issue ? '-mx-3 px-3 rounded-lg bg-red-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 min-w-[4rem] sm:min-w-[5rem] max-w-[5rem] rounded-md overflow-hidden border border-subtleBorder bg-ivory shrink-0">
                        <img
                          src={item.imageUrl || PLACEHOLDER_IMAGE}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-poppins font-medium text-sm text-primaryText truncate">{item.name}</h3>
                        {[item.logLength, item.packaging].filter(Boolean).length > 0 && (
                          <p className="text-xs text-secondaryText mt-0.5">
                            Format : {[item.logLength, item.packaging].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-forest mt-1">
                          {formatPrice(item.priceTTC)} TTC / unité
                        </p>
                        {issue && (
                          <div className="mt-1.5 space-y-1">
                            <p className="flex items-start gap-1.5 text-[11px] font-medium text-statusError leading-relaxed">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{issue}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-[11px] font-semibold text-statusError underline underline-offset-2 hover:text-red-800 transition-colors"
                            >
                              Retirer du panier
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-6">
                      {/* Quantity Controls */}
                      <div className="inline-flex items-center border border-subtleBorder rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-secondaryText hover:text-primaryText hover:bg-ivory"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-medium text-primaryText">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-secondaryText hover:text-primaryText hover:bg-ivory"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <span className="font-poppins font-semibold text-sm text-primaryText block">
                          {formatPrice(item.priceTTC * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-secondaryText hover:text-statusError p-1 transition-colors mt-0.5"
                          title="Supprimer cet article"
                          aria-label="Supprimer cet article"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Free delivery incentive bar */}
              <div className="mt-4 p-4 bg-forest-50 border border-forest-100 rounded-lg">
                <div className="flex items-center space-x-2 text-xs font-medium text-forest-dark mb-2">
                  <Truck className="w-4 h-4 text-forest shrink-0" />
                  <span>
                    {remainingForFree > 0
                      ? `Ajoutez ${formatPrice(remainingForFree)} pour bénéficier de la livraison offerte !`
                      : 'Votre commande bénéficie de la livraison offerte !'}
                  </span>
                </div>
                <div className="w-full bg-forest-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-forest h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotalTTC / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right Summary (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-subtleBorder shadow-subtle p-6 space-y-5">
              <h2 className="font-poppins font-medium text-xs text-secondaryText uppercase tracking-wider border-b border-subtleBorder pb-3">
                Récapitulatif de commande
              </h2>

              <div className="space-y-2.5 text-xs text-secondaryText">
                <div className="flex justify-between items-center">
                  <span>Sous-total articles HT</span>
                  <span className="font-medium text-primaryText">{formatPrice(subtotalHT)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>TVA applicable</span>
                  <span className="font-medium text-primaryText">{formatPrice(subtotalTTC - subtotalHT)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sous-total articles TTC</span>
                  <span className="font-medium text-primaryText">{formatPrice(subtotalTTC)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between items-center text-statusSuccess font-medium">
                    <span>Remise ({appliedDiscount.code})</span>
                    <span>- {formatPrice(appliedDiscount.amount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-forest">
                  <span>Frais de livraison</span>
                  <span className="text-[11px] text-secondaryText">Calculés à l&apos;étape suivante</span>
                </div>

                <div className="border-t border-subtleBorder pt-3 flex justify-between items-baseline">
                  <span className="font-poppins font-medium text-sm text-primaryText">Total estimé</span>
                  <span className="font-poppins font-semibold text-2xl text-primaryText">
                    {formatPrice(Math.max(0, subtotalTTC - (appliedDiscount?.amount || 0)))}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="space-y-1.5 pt-2 border-t border-subtleBorder text-xs">
                <label className="block font-medium text-primaryText">Code avantage :</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="Ex : BIENVENUE10"
                    className="input-field text-xs uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="btn-secondary text-xs px-3"
                  >
                    Appliquer
                  </button>
                </div>
                {discountError && <p className="text-statusError text-[11px]">{discountError}</p>}
                {appliedDiscount && <p className="text-statusSuccess text-[11px] font-medium">Code appliqué avec succès</p>}
              </div>

              {/* Proceed to checkout CTA — bloqué tant qu'un article est indisponible */}
              {blockedItems.length > 0 ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled
                    className="btn-primary w-full py-3 text-xs inline-flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <span>Valider le panier et continuer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[11px] text-statusError text-center">
                    Retirez les articles indisponibles pour poursuivre.
                  </p>
                </div>
              ) : (
                <Link
                  href="/commande"
                  className="btn-primary w-full py-3 text-xs inline-flex items-center justify-center gap-2"
                >
                  <span>Valider le panier et continuer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              <div className="text-[11px] text-secondaryText space-y-1 text-center pt-1">
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                  <span>Règlement sécurisé par virement bancaire direct</span>
                </p>
                <p>Dépose de votre palette devant votre abri</p>
              </div>
            </div>
          </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
