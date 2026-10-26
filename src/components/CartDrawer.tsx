'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';

export default function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotalTTC,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    totalItemsCount,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  const freeShippingThreshold = 650;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalTTC);
  const progressPercent = Math.min(100, Math.round((subtotalTTC / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primaryText/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-subtleBorder shadow-hover flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-subtleBorder flex items-center justify-between bg-ivory">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-5 h-5 text-forest" />
              <h2 className="font-poppins font-semibold text-base text-primaryText">
                Votre panier ({totalItemsCount} {totalItemsCount > 1 ? 'articles' : 'article'})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-secondaryText hover:text-primaryText hover:bg-beige-200/50 rounded-md transition-colors"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Threshold Notice */}
          <div className="bg-forest-50 p-4 border-b border-forest-100">
            <div className="flex items-center space-x-2 text-xs font-medium text-forest-dark mb-2">
              <Truck className="w-4 h-4 text-forest shrink-0" />
              <span>
                {remainingForFreeShipping > 0
                  ? `Plus que ${formatPrice(remainingForFreeShipping)} pour la livraison offerte (France/Belgique)`
                  : 'Livraison offerte appliquée à votre commande'}
              </span>
            </div>
            <div className="w-full bg-forest-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-forest h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="text-center py-16 text-secondaryText">
                <div className="w-12 h-12 mx-auto rounded-full bg-ivory border border-subtleBorder flex items-center justify-center text-forest-secondary mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="font-poppins font-medium text-primaryText text-sm">Votre panier est actuellement vide</p>
                <p className="text-xs text-secondaryText mt-1 max-w-xs mx-auto">
                  Consultez nos palettes de bois sec étuvé NF H1 prêtes à brûler immédiatement.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-5 btn-primary text-xs"
                >
                  Découvrir le catalogue
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start space-x-3.5 p-3 rounded-lg border border-subtleBorder bg-white hover:bg-ivory/40 transition-colors"
                >
                  <div className="w-20 h-20 min-w-[5rem] max-w-[5rem] min-h-[5rem] max-h-[5rem] rounded-lg overflow-hidden border border-subtleBorder bg-ivory shrink-0">
                    <img
                      src={item.imageUrl || undefined}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins font-medium text-primaryText text-xs leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-secondaryText mt-0.5 truncate">
                      {item.logLength} · {item.packaging}
                    </p>
                    <div className="text-xs font-semibold text-forest mt-1">
                      {formatPrice(item.priceTTC)}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Selector */}
                      <div className="inline-flex items-center border border-subtleBorder rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-secondaryText hover:text-primaryText hover:bg-ivory"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-medium text-primaryText">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-secondaryText hover:text-primaryText hover:bg-ivory"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-secondaryText hover:text-statusError p-1 transition-colors"
                        title="Retirer cet article"
                        aria-label="Retirer cet article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Actions */}
          {items.length > 0 && (
            <div className="p-5 border-t border-subtleBorder bg-ivory space-y-3">
              <div className="flex justify-between items-center text-xs text-secondaryText">
                <span>Sous-total articles TTC</span>
                <span className="font-poppins font-semibold text-primaryText text-base">{formatPrice(subtotalTTC)}</span>
              </div>
              <p className="text-[11px] text-secondaryText leading-normal">
                Frais de livraison calculés à l&apos;étape suivante selon votre code postal et accessibilité camion.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/panier"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="btn-secondary text-xs text-center"
                >
                  Voir le panier
                </Link>
                <Link
                  href="/commande"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="btn-primary text-xs text-center inline-flex items-center justify-center gap-1.5"
                >
                  <span>Commander</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
