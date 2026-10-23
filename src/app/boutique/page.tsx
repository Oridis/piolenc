import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrustBadges from '@/components/TrustBadges';
import { formatPrice } from '@/lib/pricing';
import { Flame, ArrowRight, CheckCircle2, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { categorie?: string; longueur?: string };
}) {
  const settings = await getSiteSettings();
  const categories = await prisma.category.findMany();

  const whereCondition: any = { isActive: true };
  if (searchParams.categorie) {
    whereCondition.category = { slug: searchParams.categorie };
  }
  if (searchParams.longueur) {
    whereCondition.logLength = { contains: searchParams.longueur };
  }

  const products = await prisma.product.findMany({
    where: whereCondition,
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-wood-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Palettes &amp; Bûches de Chauffage
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Boutique en Ligne de Bois de Chauffage Sec
            </h1>
            <p className="text-sm text-forest-100 leading-relaxed">
              Toutes nos palettes de bois dur (chêne, hêtre, charme) sont séchées en étuve certifiées &lt; 20% d'humidité. Livraison assurée avec hayon élévateur et transpalette.
            </p>
          </div>
        </div>

        {/* Filters and Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-6 text-xs">
            <div className="flex items-center space-x-2 font-black text-gray-900 border-b border-gray-100 pb-3">
              <Filter className="w-4 h-4 text-forest-700" />
              <span>Filtrer les produits</span>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2.5">Catégories</h4>
              <div className="space-y-1.5">
                <Link
                  href="/boutique"
                  className={`block px-3 py-1.5 rounded-lg transition ${
                    !searchParams.categorie
                      ? 'bg-forest-100 text-forest-900 font-bold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tous les produits ({products.length})
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/boutique?categorie=${c.slug}`}
                    className={`block px-3 py-1.5 rounded-lg transition ${
                      searchParams.categorie === c.slug
                        ? 'bg-forest-100 text-forest-900 font-bold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Longueur des bûches */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2.5">Longueur de bûches</h4>
              <div className="space-y-1.5">
                {['25 cm', '33 cm', '50 cm'].map((len) => (
                  <Link
                    key={len}
                    href={`/boutique?longueur=${len.split(' ')[0]}`}
                    className={`block px-3 py-1.5 rounded-lg transition ${
                      searchParams.longueur === len.split(' ')[0]
                        ? 'bg-forest-100 text-forest-900 font-bold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Bûches {len}
                  </Link>
                ))}
              </div>
            </div>

            {/* Fast reassurance reminder */}
            <div className="p-3 bg-wood-50 rounded-xl border border-wood-200 space-y-2">
              <span className="font-bold text-wood-900 block">Livraison offerte dès 650€</span>
              <p className="text-[11px] text-wood-700">
                Panachage possible sur toutes les palettes de bois et granulés.
              </p>
            </div>
          </div>

          {/* Right Products Grid */}
          <div className="lg:col-span-9">
            {products.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                Aucun produit ne correspond à ces critères.
                <div className="mt-4">
                  <Link href="/boutique" className="text-forest-700 font-bold underline">
                    Réinitialiser les filtres
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => {
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
                          <div className="absolute top-2.5 left-2.5 bg-forest-900/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                            {prod.humidityRate}
                          </div>
                          {prod.promoPrice && (
                            <div className="absolute top-2.5 right-2.5 bg-amber-500 text-gray-950 text-[10px] font-black px-2 py-1 rounded-md shadow">
                              PROMO
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
                            {prod.species} • {prod.logLength}
                          </span>
                          <h3 className="font-extrabold text-sm text-gray-900 line-clamp-2">
                            <Link href={`/produit/${prod.slug}`} className="hover:text-forest-800">
                              {prod.name}
                            </Link>
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {prod.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-gray-100 mt-2 space-y-3">
                        <div className="flex justify-between items-baseline pt-3">
                          <div>
                            <span className="text-lg font-black text-forest-900">
                              {prod.promoPrice ? formatPrice(prod.promoPrice) : formatPrice(prod.priceTTC)}
                            </span>
                            {prod.promoPrice && (
                              <span className="text-xs line-through text-gray-400 ml-1.5">
                                {formatPrice(prod.priceTTC)}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 block">TTC / {prod.unit}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {prod.stock > 0 ? `${prod.stock} en stock` : 'Rupture'}
                          </span>
                        </div>

                        <Link
                          href={`/produit/${prod.slug}`}
                          className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                        >
                          <span>Voir le produit &amp; commander</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
