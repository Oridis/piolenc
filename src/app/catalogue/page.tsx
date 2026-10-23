import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrustBadges from '@/components/TrustBadges';
import { formatPrice } from '@/lib/pricing';
import { Flame, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

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

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Catalogue Officiel &amp; Tarifs
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Notre Gamme Complète de Bois de Chauffage
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Découvrez nos essences de bois dur certifiées NF H1 (&lt; 20% humidité), nos bûches traditionnelles et nos granulés de bois conditionnés en palettes houssées.
          </p>
        </div>

        <TrustBadges />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={parsedImages[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-forest-900/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                      {prod.humidityRate}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
                      {prod.category?.name} • Bûches {prod.logLength}
                    </span>
                    <h3 className="font-black text-base text-gray-900">
                      <Link href={`/produit/${prod.slug}`} className="hover:text-forest-800">
                        {prod.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {prod.shortDescription}
                    </p>

                    <div className="pt-2 text-xs text-gray-700 space-y-1">
                      <p>• Essences : <strong>{prod.species}</strong></p>
                      <p>• Pouvoir calorifique : <strong>{prod.calorificValue}</strong></p>
                      <p>• Conditionnement : <strong>{prod.unit}</strong></p>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-100 mt-4 space-y-4">
                  <div className="flex justify-between items-baseline pt-4">
                    <div>
                      <span className="text-2xl font-black text-forest-900">
                        {prod.promoPrice ? formatPrice(prod.promoPrice) : formatPrice(prod.priceTTC)}
                      </span>
                      <span className="text-[11px] text-gray-500 block">TTC / palette</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {prod.stock} palettes en stock
                    </span>
                  </div>

                  <Link
                    href={`/produit/${prod.slug}`}
                    className="w-full bg-forest-800 hover:bg-forest-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md"
                  >
                    <span>Consulter la fiche détaillée</span>
                    <ArrowRight className="w-4 h-4" />
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
