import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import { Sparkles, ArrowRight, Tag, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  const settings = await getSiteSettings();
  const promoProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      promoPrice: { not: null },
    },
    include: { category: true },
  });

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-wood-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 bg-amber-500/40 text-amber-100 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Bons Plans &amp; Tarifs Dégressifs Hiver 2026</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Promotions &amp; Remises Volume Bois de Chauffage
            </h1>
            <p className="text-sm text-amber-100 leading-relaxed">
              Profitez de réductions immédiates sur nos palettes de bois sec étuvé et granulés de bois, avec livraison offerte dès 650€ d'achat.
            </p>
          </div>
        </div>

        {/* Promo Codes Announcement Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-amber-300 shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Code Bienvenue Première Commande
              </span>
              <h3 className="text-lg font-black text-gray-900">10€ de remise immédiate</h3>
              <p className="text-xs text-gray-600">
                Utilisez le code <strong className="font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">BIENVENUE10</strong> dans votre panier dès 300€ d'achat.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-forest-300 shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-forest-100 text-forest-800 rounded-2xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800">
                Livraison Poids Lourd Offerte
              </span>
              <h3 className="text-lg font-black text-gray-900">Transport gratuit dès 650€</h3>
              <p className="text-xs text-gray-600">
                Pour 2 palettes ou plus (France métropolitaine et Belgique), bénéficiez de la livraison avec hayon offerte.
              </p>
            </div>
          </div>
        </div>

        {/* Products on Sale */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900">
            Palettes actuellement en promotion ({promoProducts.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoProducts.map((prod) => {
              let parsedImages: string[] = [];
              try {
                parsedImages = JSON.parse(prod.images);
              } catch {
                parsedImages = [];
              }

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={parsedImages[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-amber-500 text-gray-950 text-xs font-black px-2.5 py-1 rounded-md shadow">
                        PROMO
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
                        {prod.species} • {prod.logLength}
                      </span>
                      <h3 className="font-extrabold text-sm text-gray-900">
                        <Link href={`/produit/${prod.slug}`} className="hover:text-forest-800">
                          {prod.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {prod.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-gray-100 mt-2 space-y-3">
                    <div className="flex justify-between items-baseline pt-3">
                      <div>
                        <span className="text-2xl font-black text-forest-900">
                          {formatPrice(prod.promoPrice!)}
                        </span>
                        <span className="text-xs line-through text-gray-400 ml-2">
                          {formatPrice(prod.priceTTC)}
                        </span>
                        <span className="text-[10px] text-gray-500 block">TTC / {prod.unit}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        En stock
                      </span>
                    </div>

                    <Link
                      href={`/produit/${prod.slug}`}
                      className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow"
                    >
                      <span>Profiter de l'offre</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
