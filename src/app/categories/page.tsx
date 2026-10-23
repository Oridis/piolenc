import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Flame } from 'lucide-react';

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

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Rayons Spécialisés
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Catégories de Bois de Chauffage &amp; Granulés
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Choisissez votre type de combustible selon votre appareil : bûches sèches étuvées, bûches compressées, granulés de bois ou bois dur traditionnel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col sm:flex-row group"
            >
              <div className="sm:w-1/2 h-56 sm:h-auto relative overflow-hidden bg-gray-100">
                <img
                  src={c.imageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              <div className="sm:w-1/2 p-6 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
                    {c.products.length} référence{c.products.length > 1 ? 's' : ''} disponible{c.products.length > 1 ? 's' : ''}
                  </span>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{c.name}</h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{c.description}</p>
                </div>

                <Link
                  href={`/boutique?categorie=${c.slug}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-forest-800 hover:text-forest-950 group-hover:translate-x-1 transition"
                >
                  <span>Découvrir les produits</span>
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
