'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/pricing';
import {
  Truck,
  ShieldCheck,
  Minus,
  Plus,
  ShoppingBag,
  Star,
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
    images = [];
  }
  const [activeImage, setActiveImage] = useState(images[0] || '');

  const effectivePriceTTC = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.priceTTC;
  const isOutOfStock = product.stock <= 0 && !product.isPreorderAllowed;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedVariant);
  };

  return (
    <div className="space-y-10 font-sans">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-secondaryText flex items-center space-x-2">
        <Link href="/" className="hover:text-forest transition-colors">Accueil</Link>
        <span>/</span>
        <Link href="/boutique" className="hover:text-forest transition-colors">Boutique</Link>
        <span>/</span>
        <span className="text-primaryText font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Product Info: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-ivory border border-subtleBorder aspect-[4/3]">
            <img
              src={activeImage || images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 badge-neutral bg-white/95 text-[11px] font-medium">
              {product.humidityRate}
            </div>
            {product.promoPrice && (
              <div className="absolute top-3 right-3 badge-warning bg-amber-100 text-amber-900 border-amber-300 text-[11px]">
                Offre spéciale
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex space-x-2.5 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-18 h-18 rounded-lg overflow-hidden border transition-colors shrink-0 bg-ivory ${
                    activeImage === img ? 'border-forest ring-1 ring-forest' : 'border-subtleBorder opacity-80'
                  }`}
                  aria-label={`Afficher la photo ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Delivery & Logistics Specification Box */}
          <div className="bg-ivory rounded-xl p-5 border border-subtleBorder text-xs space-y-2">
            <h4 className="font-poppins font-medium text-primaryText flex items-center gap-2 text-xs">
              <Truck className="w-4 h-4 text-forest" />
              <span>Modalités de livraison pour cette palette</span>
            </h4>
            <div className="space-y-1 text-secondaryText leading-relaxed">
              <p>· Dépose par camion porteur avec hayon élévateur et transpalette tout-terrain devant votre abri.</p>
              <p>· Prise de contact téléphonique préalable pour convenir du créneau de livraison.</p>
              <p>· Poids total de la palette : environ {product.weightKg} kg sous housse étanche de protection.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Buying Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-secondaryText">
              Réf : {product.reference} · {product.species}
            </span>
            <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight mt-1">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-secondaryText mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Pricing & Stock Card */}
          <div className="p-5 bg-white rounded-xl border border-subtleBorder flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-poppins font-semibold text-3xl text-primaryText">
                  {formatPrice(effectivePriceTTC)}
                </span>
                {product.promoPrice && (
                  <span className="text-sm line-through text-secondaryText">
                    {formatPrice(product.priceTTC)}
                  </span>
                )}
                <span className="text-xs text-secondaryText font-medium">TTC</span>
              </div>
              <span className="text-[11px] text-secondaryText block mt-0.5">
                Dont TVA {product.vatRate}% ({formatPrice(product.priceHT)} HT) · {product.unit}
              </span>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="badge-error">Rupture temporaire</span>
              ) : (
                <span className="badge-success">En stock ({product.stock} dispo)</span>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-primaryText mb-1.5">
                Sélectionnez votre longueur ou conditionnement :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-lg border text-xs text-left transition-colors duration-150 ${
                      selectedVariant?.id === v.id
                        ? 'border-forest bg-forest-50/60 font-medium'
                        : 'border-subtleBorder bg-white hover:bg-ivory text-primaryText'
                    }`}
                  >
                    <p className="font-medium text-primaryText">{v.title}</p>
                    <p className="text-[11px] text-secondaryText mt-0.5">{v.packaging} ({v.logLength})</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center border border-subtleBorder rounded-md bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 text-secondaryText hover:text-primaryText hover:bg-ivory"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3.5 text-xs font-semibold text-primaryText">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2.5 text-secondaryText hover:text-primaryText hover:bg-ivory"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="btn-primary flex-1 py-3 text-xs inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Victime de son succès' : 'Ajouter au panier'}</span>
              </button>
            </div>

            <div className="p-3 bg-ivory rounded-md border border-subtleBorder text-xs text-secondaryText flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
              <span>
                Paiement direct par virement bancaire après validation de votre commande.
              </span>
            </div>
          </div>

          {/* Technical Specs Summary */}
          <div className="border-t border-subtleBorder pt-5 space-y-3 text-xs">
            <h3 className="font-poppins font-medium text-primaryText text-sm">Caractéristiques certifiées</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-white border border-subtleBorder rounded-md">
                <span className="text-secondaryText block text-[10px] uppercase font-medium">Essences</span>
                <span className="font-medium text-primaryText">{product.species}</span>
              </div>
              <div className="p-2.5 bg-white border border-subtleBorder rounded-md">
                <span className="text-secondaryText block text-[10px] uppercase font-medium">Humidité étuvée</span>
                <span className="font-medium text-forest">{product.humidityRate}</span>
              </div>
              <div className="p-2.5 bg-white border border-subtleBorder rounded-md">
                <span className="text-secondaryText block text-[10px] uppercase font-medium">Longueur bûches</span>
                <span className="font-medium text-primaryText">{product.logLength}</span>
              </div>
              <div className="p-2.5 bg-white border border-subtleBorder rounded-md">
                <span className="text-secondaryText block text-[10px] uppercase font-medium">Pouvoir calorifique</span>
                <span className="font-medium text-primaryText">{product.calorificValue}</span>
              </div>
              <div className="p-2.5 bg-white border border-subtleBorder rounded-md">
                <span className="text-secondaryText block text-[10px] uppercase font-medium">Dimensions palette</span>
                <span className="font-medium text-primaryText">{product.dimensions}</span>
              </div>
              <div className="p-2.5 bg-white border border-subtleBorder rounded-md">
                <span className="text-secondaryText block text-[10px] uppercase font-medium">Délai indicatif</span>
                <span className="font-medium text-primaryText">{product.leadTimeDays} à {product.leadTimeDays + 2} jours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-subtleBorder space-y-3">
        <h2 className="font-poppins font-medium text-lg text-primaryText">
          Description et conseils d&apos;utilisation
        </h2>
        <div className="text-xs sm:text-sm text-secondaryText leading-relaxed whitespace-pre-line">
          {product.description}
        </div>
      </div>

      {/* Verified Reviews Section (if any) */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-subtleBorder space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-poppins font-medium text-lg text-primaryText">
              Retours d&apos;expérience clients ({product.reviews.length})
            </h2>
            <div className="flex items-center space-x-1 text-forest text-xs font-medium">
              <Star className="w-3.5 h-3.5 fill-forest" />
              <span>5 / 5 Note moyenne</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="p-4 bg-ivory rounded-lg border border-subtleBorder space-y-2 text-xs">
                <div className="flex items-center space-x-0.5 text-forest">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-forest" />
                  ))}
                </div>
                <p className="text-primaryText italic leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                <div className="text-[11px] font-medium text-secondaryText">
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
