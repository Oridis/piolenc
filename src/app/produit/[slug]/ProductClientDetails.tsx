'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import {
  Flame,
  Truck,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Star,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

interface ProductClientDetailsProps {
  product: any;
  siteSettings: any;
}

export default function ProductClientDetails({
  product,
  siteSettings,
}: ProductClientDetailsProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(
    product.variants?.[0] || null
  );

  let images: string[] = [];
  try {
    images = JSON.parse(product.images);
  } catch {
    images = ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'];
  }
  const [activeImage, setActiveImage] = useState(images[0] || '');

  const effectivePriceTTC = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.priceTTC;
  const isOutOfStock = product.stock <= 0 && !product.isPreorderAllowed;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedVariant);
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center space-x-2">
        <Link href="/" className="hover:text-forest-800">Accueil</Link>
        <span>/</span>
        <Link href="/boutique" className="hover:text-forest-800">Boutique</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold truncate">{product.name}</span>
      </nav>

      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Images Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-gray-100 border border-gray-200 aspect-[4/3] shadow-sm">
            <img
              src={activeImage || images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-forest-900/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
              {product.humidityRate}
            </div>
            {product.promoPrice && (
              <div className="absolute top-4 right-4 bg-amber-500 text-gray-950 text-xs font-black px-3 py-1.5 rounded-lg shadow">
                OFFRE SPÉCIALE
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    activeImage === img ? 'border-forest-700 ring-2 ring-forest-700/20' : 'border-gray-200 opacity-70'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Logistics Box */}
          <div className="bg-wood-50 rounded-2xl p-5 border border-wood-200 text-xs space-y-3">
            <h4 className="font-extrabold text-wood-950 flex items-center space-x-2 text-sm">
              <Truck className="w-4 h-4 text-wood-800" />
              <span>Modalités de livraison pour cette palette</span>
            </h4>
            <div className="space-y-1.5 text-wood-900">
              <p>• Dépose au sol par camion porteur équipé d'un hayon élévateur et d'un transpalette tout-terrain.</p>
              <p>• Prise de rendez-vous téléphonique préalable sous 48h par le transporteur.</p>
              <p>• Poids total de la palette : ~{product.weightKg} kg (conditionnement sécurisé résistant aux intempéries).</p>
            </div>
          </div>
        </div>

        {/* Right: Purchasing & Details (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-wood-700">
              Réf : {product.reference} • {product.species}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              {product.name}
            </h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-black text-forest-900">
                  {formatPrice(effectivePriceTTC)}
                </span>
                {product.promoPrice && (
                  <span className="text-sm line-through text-gray-400">
                    {formatPrice(product.priceTTC)}
                  </span>
                )}
                <span className="text-xs text-gray-500 font-semibold">TTC</span>
              </div>
              <span className="text-xs text-gray-500 block mt-0.5">
                Dont TVA {product.vatRate}% ({formatPrice(product.priceHT)} HT) • Conditionnement : {product.unit}
              </span>
            </div>

            <div className="text-right">
              {isOutOfStock ? (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  Rupture temporaire
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  En stock ({product.stock} dispo)
                </span>
              )}
            </div>
          </div>

          {/* Variants Selector if present */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-2">
                Choisir une variante :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition ${
                      selectedVariant?.id === v.id
                        ? 'border-forest-700 bg-forest-50 text-forest-950 font-bold ring-2 ring-forest-700/20'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <p className="font-bold text-gray-900">{v.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{v.packaging} ({v.logLength})</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart Button */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-xl bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
                  aria-label="Diminuer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-extrabold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
                  aria-label="Augmenter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-forest-800 hover:bg-forest-700 disabled:bg-gray-300 text-white font-extrabold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isOutOfStock ? 'Victime de son succès' : 'Ajouter au panier'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-forest-50/70 border border-forest-200/60 rounded-xl text-xs text-forest-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
              <span>
                Règlement sécurisé par virement bancaire après validation de votre commande.
              </span>
            </div>
          </div>

          {/* Technical Specs Key Highlights */}
          <div className="border-t border-gray-200 pt-6 space-y-3 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm">Caractéristiques techniques</h3>
            <div className="grid grid-cols-2 gap-3 text-gray-700">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Essences</span>
                <strong className="text-gray-900">{product.species}</strong>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Humidité certifiée</span>
                <strong className="text-forest-800">{product.humidityRate}</strong>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Longueur des bûches</span>
                <strong className="text-gray-900">{product.logLength}</strong>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Pouvoir calorifique</span>
                <strong className="text-gray-900">{product.calorificValue}</strong>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Dimensions palette</span>
                <strong className="text-gray-900">{product.dimensions}</strong>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Délai estimé</span>
                <strong className="text-gray-900">{product.leadTimeDays} à {product.leadTimeDays + 2} jours ouvrés</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          Description détaillée du produit
        </h2>
        <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {product.description}
        </div>
      </div>

      {/* Verified Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Avis clients vérifiés ({product.reviews.length})
            </h2>
            <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>5 / 5 Note globale</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic">"{r.comment}"</p>
                <div className="text-[11px] font-bold text-gray-900">
                  {r.authorName} {r.authorCity ? `— ${r.authorCity}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
