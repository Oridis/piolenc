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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity backdrop-blur-sm"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-wood-50">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-forest-800" />
              <h2 className="text-lg font-bold text-gray-900">
                Votre panier ({totalItemsCount} {totalItemsCount > 1 ? 'articles' : 'article'})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Alert Bar */}
          <div className="bg-forest-50 p-4 border-b border-forest-100">
            <div className="flex items-center space-x-2 text-xs font-semibold text-forest-900 mb-1.5">
              <Truck className="w-4 h-4 text-forest-700 shrink-0" />
              <span>
                {remainingForFreeShipping > 0
                  ? `Plus que ${formatPrice(remainingForFreeShipping)} pour la livraison offerte (France/Belgique)`
                  : 'Félicitations ! Vous bénéficiez de la livraison offerte !'}
              </span>
            </div>
            <div className="w-full bg-forest-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-forest-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-gray-800">Votre panier est vide</p>
                <p className="text-sm text-gray-500 mt-1">Découvrez nos palettes de bois sec étuvé prêtes à l'emploi.</p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-6 inline-block bg-forest-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-forest-700"
                >
                  Découvrir la boutique
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex space-x-3.5 border border-gray-100 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg shrink-0 border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.logLength} • {item.packaging}
                    </p>
                    <div className="text-sm font-bold text-forest-800 mt-1.5">
                      {formatPrice(item.priceTTC)}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-200 bg-wood-50 space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Sous-total articles TTC</span>
                <span className="font-bold text-gray-900 text-base">{formatPrice(subtotalTTC)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Frais de livraison calculés à l'étape suivante selon votre code postal et accessibilité camion.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/panier"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-full text-center py-2.5 px-3 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-white"
                >
                  Voir le panier
                </Link>
                <Link
                  href="/commande"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-full text-center py-2.5 px-3 bg-forest-800 text-white rounded-xl font-bold text-sm hover:bg-forest-700 flex items-center justify-center space-x-1.5 shadow"
                >
                  <span>Commander</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
