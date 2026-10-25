import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import { Filter, ArrowRight } from 'lucide-react';

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

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Editorial Introduction Banner */}
        <div className="bg-white rounded-xl border border-subtleBorder p-6 sm:p-10 shadow-subtle">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
              Catalogue officiel
            </span>
            <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText">
              Boutique de bois de chauffage &amp; biocombustibles
            </h1>
            <p className="text-xs sm:text-sm text-secondaryText leading-relaxed pt-1">
              Palettes de bois dur (chêne, charme, hêtre) séché en étuve biomasse NF H1 (&lt; 20% d&apos;humidité). Conditionnement rangé sur palette cerclée avec housse étanche, livré par camion avec hayon élévateur.
            </p>
          </div>
        </div>

        {/* Filters and Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-subtleBorder space-y-5 text-xs">
            <div className="flex items-center space-x-2 font-poppins font-medium text-primaryText border-b border-subtleBorder pb-3">
              <Filter className="w-4 h-4 text-forest" />
              <span>Filtrer les produits</span>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-medium text-primaryText mb-2">Catégories</h4>
              <div className="space-y-1">
                <Link
                  href="/boutique"
                  className={`block px-3 py-1.5 rounded-md transition-colors ${
                    !searchParams.categorie
                      ? 'bg-forest text-white font-medium'
                      : 'text-secondaryText hover:text-primaryText hover:bg-ivory'
                  }`}
                >
                  Tous les produits ({products.length})
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/boutique?categorie=${c.slug}`}
                    className={`block px-3 py-1.5 rounded-md transition-colors ${
                      searchParams.categorie === c.slug
                        ? 'bg-forest text-white font-medium'
                        : 'text-secondaryText hover:text-primaryText hover:bg-ivory'
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Longueur des bûches */}
            <div>
              <h4 className="font-medium text-primaryText mb-2">Longueur des bûches</h4>
              <div className="space-y-1">
                {['25 cm', '33 cm', '50 cm'].map((len) => (
                  <Link
                    key={len}
                    href={`/boutique?longueur=${len.split(' ')[0]}`}
                    className={`block px-3 py-1.5 rounded-md transition-colors ${
                      searchParams.longueur === len.split(' ')[0]
                        ? 'bg-forest text-white font-medium'
                        : 'text-secondaryText hover:text-primaryText hover:bg-ivory'
                    }`}
                  >
                    Bûches {len}
                  </Link>
                ))}
              </div>
            </div>

            {/* Reassurance reminder */}
            <div className="p-3 bg-ivory rounded-md border border-subtleBorder space-y-1">
              <span className="font-medium text-primaryText block">Livraison offerte dès 650 €</span>
              <p className="text-[11px] text-secondaryText leading-normal">
                Offre applicable en France métropolitaine et Belgique pour tout panachage de palettes.
              </p>
            </div>
          </div>

          {/* Right Products Grid */}
          <div className="lg:col-span-9">
            {products.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-subtleBorder text-center text-xs text-secondaryText">
                <p>Aucun produit ne correspond aux filtres sélectionnés.</p>
                <div className="mt-4">
                  <Link href="/boutique" className="btn-secondary text-xs">
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
                      className="bg-white rounded-xl border border-subtleBorder overflow-hidden flex flex-col justify-between hover:border-forest/80 transition-colors duration-150"
                    >
                      <div>
                        <div className="relative h-48 overflow-hidden bg-ivory">
                          <img
                            src={parsedImages[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 badge-neutral bg-white/90 backdrop-blur-sm text-[10px]">
                            {prod.humidityRate}
                          </div>
                          {prod.promoPrice && (
                            <div className="absolute top-2.5 right-2.5 badge-warning bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                              Offre spéciale
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-secondaryText">
                            {prod.species} · {prod.logLength}
                          </span>
                          <Link href={`/produit/${prod.slug}`}>
                            <h3 className="font-poppins font-medium text-sm text-primaryText hover:text-forest transition-colors line-clamp-2 leading-snug">
                              {prod.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-secondaryText line-clamp-2 leading-relaxed">
                            {prod.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-subtleBorder/60 mt-2 space-y-3">
                        <div className="flex justify-between items-baseline pt-3">
                          <div>
                            <span className="font-poppins font-semibold text-lg text-primaryText">
                              {prod.promoPrice ? formatPrice(prod.promoPrice) : formatPrice(prod.priceTTC)}
                            </span>
                            {prod.promoPrice && (
                              <span className="text-xs line-through text-secondaryText ml-1.5">
                                {formatPrice(prod.priceTTC)}
                              </span>
                            )}
                            <span className="text-[10px] text-secondaryText block">TTC / {prod.unit}</span>
                          </div>
                          <span className="badge-success text-[11px]">
                            {prod.stock > 0 ? `${prod.stock} disponibles` : 'Rupture'}
                          </span>
                        </div>

                        <Link
                          href={`/produit/${prod.slug}`}
                          className="btn-primary w-full text-xs text-center inline-flex items-center justify-center gap-1.5"
                        >
                          <span>Voir la fiche &amp; commander</span>
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
