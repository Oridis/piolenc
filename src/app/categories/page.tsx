import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const settings = await getSiteSettings();
  const categories = await prisma.category.findMany({
    include: { products: { where: { isActive: true } } },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Rayons spécialisés
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Catégories de bois de chauffage &amp; granulés
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Choisissez votre biocombustible selon votre appareil de chauffe : bûches sèches étuvées, bûches compressées de jour et nuit, ou pellets de résineux DINplus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-subtleBorder overflow-hidden flex flex-col sm:flex-row hover:border-forest/80 transition-colors duration-150"
            >
              <div className="sm:w-1/2 h-48 sm:h-auto relative overflow-hidden bg-ivory">
                <img
                  src={c.imageUrl || undefined}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="sm:w-1/2 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-secondaryText">
                    {c.products.length} référence{c.products.length > 1 ? 's' : ''} disponible{c.products.length > 1 ? 's' : ''}
                  </span>
                  <h3 className="font-poppins font-medium text-base text-primaryText mt-1">{c.name}</h3>
                  <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">{c.description}</p>
                </div>

                <Link
                  href={`/boutique?categorie=${c.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:text-forest-dark transition-colors"
                >
                  <span>Voir les produits du rayon</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
