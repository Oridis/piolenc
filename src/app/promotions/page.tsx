import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import { ArrowRight, Tag, Truck } from 'lucide-react';

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

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-xl border border-subtleBorder p-6 sm:p-10 shadow-subtle">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
              Tarifs avantageux &amp; Volume
            </span>
            <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
              Offres et remises sur le bois de chauffage
            </h1>
            <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
              Consultez nos remises directes sur les palettes de bois sec étuvé et granulés de bois, avec livraison offerte dès 650 € d&apos;achat en France et Belgique.
            </p>
          </div>
        </div>

        {/* Promo Codes Announcement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-secondaryText">
                Première commande
              </span>
              <h3 className="font-poppins font-medium text-base text-primaryText">10 € de remise immédiate</h3>
              <p className="text-xs text-secondaryText leading-normal">
                Indiquez le code avantage <strong className="font-mono bg-ivory px-2 py-0.5 rounded border border-subtleBorder text-primaryText">BIENVENUE10</strong> lors de votre commande dès 300 € d&apos;achat.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-secondaryText">
                Livraison spécialisée
              </span>
              <h3 className="font-poppins font-medium text-base text-primaryText">Transport offert dès 650 €</h3>
              <p className="text-xs text-secondaryText leading-normal">
                À partir de 2 palettes de bois ou granulés, bénéficiez de la livraison par camion porteur avec hayon sans frais additionnels.
              </p>
            </div>
          </div>
        </div>

        {/* Products on Sale */}
        <div className="space-y-6">
          <h2 className="font-poppins font-medium text-xl text-primaryText">
            Palettes actuellement en offre spéciale ({promoProducts.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoProducts.map((prod) => {
              let parsedImages: string[] = [];
              try {
                parsedImages = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
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
                        src={parsedImages[0] || undefined}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 badge-neutral bg-white/90 text-[10px]">
                        {prod.humidityRate}
                      </div>
                      <div className="absolute top-2.5 right-2.5 badge-warning bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                        Offre spéciale
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-secondaryText">
                        {prod.species} · {prod.logLength}
                      </span>
                      <h3 className="font-poppins font-medium text-sm text-primaryText">
                        <Link href={`/produit/${prod.slug}`} className="hover:text-forest transition-colors">
                          {prod.name}
                        </Link>
                      </h3>
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
                      <span>Voir le produit &amp; commander</span>
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
