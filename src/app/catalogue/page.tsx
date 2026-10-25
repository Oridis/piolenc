import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrustBadges from '@/components/TrustBadges';
import { formatPrice } from '@/lib/pricing';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const settings = await getSiteSettings();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Catalogue général &amp; Tarifs
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Gamme complète de bois de chauffage sec étuvé
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Feuillus durs certifiés NF H1 (&lt; 20% humidité), bûches traditionnelles et granulés de bois conditionnés en palettes houssées pour un allumage propre et immédiat.
          </p>
        </div>

        <TrustBadges />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="relative h-52 overflow-hidden bg-ivory">
                    <img
                      src={parsedImages[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 badge-neutral bg-white/90 backdrop-blur-sm text-[10px]">
                      {prod.humidityRate}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-secondaryText">
                      {prod.category?.name} · Bûches {prod.logLength}
                    </span>
                    <h3 className="font-poppins font-medium text-base text-primaryText">
                      <Link href={`/produit/${prod.slug}`} className="hover:text-forest transition-colors">
                        {prod.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-secondaryText line-clamp-2 leading-relaxed">
                      {prod.shortDescription}
                    </p>

                    <div className="pt-2 text-xs text-secondaryText space-y-1">
                      <p>Essences : <span className="font-medium text-primaryText">{prod.species}</span></p>
                      <p>Pouvoir calorifique : <span className="font-medium text-primaryText">{prod.calorificValue}</span></p>
                      <p>Conditionnement : <span className="font-medium text-primaryText">{prod.unit}</span></p>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-subtleBorder/60 mt-3 space-y-3">
                  <div className="flex justify-between items-baseline pt-3">
                    <div>
                      <span className="font-poppins font-semibold text-xl text-primaryText">
                        {prod.promoPrice ? formatPrice(prod.promoPrice) : formatPrice(prod.priceTTC)}
                      </span>
                      <span className="text-[11px] text-secondaryText block">TTC / palette</span>
                    </div>
                    <span className="badge-success text-[11px]">
                      {prod.stock} palettes disponibles
                    </span>
                  </div>

                  <Link
                    href={`/produit/${prod.slug}`}
                    className="btn-primary w-full text-xs text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Fiche détaillée &amp; commande</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
