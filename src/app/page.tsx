import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrustBadges from '@/components/TrustBadges';
import QuantityCalculator from '@/components/QuantityCalculator';
import ShippingEstimator from '@/components/ShippingEstimator';
import { formatPrice } from '@/lib/pricing';
import {
  Flame,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronRight,
  Calculator,
  Award,
  Sparkles,
} from 'lucide-react';
import { WOOD_SPECIES, FREQUENT_QUESTIONS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getSiteSettings();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    take: 4,
    orderBy: { createdAt: 'asc' },
  });

  const reviews = await prisma.customerReview.findMany({
    where: { isApproved: true },
    take: 3,
  });

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-br from-forest-950 via-forest-900 to-wood-950 text-white overflow-hidden py-16 sm:py-24">
          {/* Subtle background overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#cca278_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-forest-800/80 border border-forest-700/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Bois sec étuvé certifié NF H1 (&lt; 20% humidité)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Votre bois de chauffage de qualité supérieure,{' '}
                <span className="text-amber-400 underline decoration-wood-600 decoration-wavy decoration-2">
                  livré chez vous
                </span>
              </h1>

              <p className="text-base sm:text-lg text-forest-100 max-w-xl leading-relaxed">
                Approvisionnement direct en palettes de bois dur (chêne, hêtre, charme) séché en étuve biomasse. Allumage rapide, zéro encrassement, haut pouvoir calorifique garanti.
              </p>

              {/* Delivery & Payment Badges */}
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-forest-200">
                <div className="flex items-center space-x-2 bg-forest-900/60 border border-forest-800 px-3 py-1.5 rounded-lg">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Livraison camion avec hayon &amp; transpalette</span>
                </div>
                <div className="flex items-center space-x-2 bg-forest-900/60 border border-forest-800 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Règlement sécurisé par virement bancaire</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/boutique"
                  className="bg-amber-500 hover:bg-amber-400 text-forest-950 font-black text-sm px-6 py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl shadow-amber-500/20"
                >
                  <span>Commander mon bois</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/calculateurs/quantite"
                  className="bg-forest-900/80 hover:bg-forest-800 text-white border border-forest-700 font-bold text-sm px-5 py-3.5 rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Calculer mon besoin (stères)</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-forest-800/80 group">
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&auto=format&fit=crop&q=80"
                  alt="Palette de bois de chauffage sec étuvé"
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-transparent to-transparent flex items-end p-6">
                  <div className="bg-white/95 backdrop-blur-sm text-gray-900 p-4 rounded-2xl w-full shadow-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider block">
                        Palette Bestseller
                      </span>
                      <h4 className="text-sm font-extrabold">Chêne &amp; Hêtre 33 cm (2 stères)</h4>
                      <p className="text-xs text-gray-500 mt-0.5">&lt; 18% humidité • Livrée rangée</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-forest-900">319,00 €</span>
                      <span className="text-[10px] text-gray-500 block">TTC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BADGES */}
        <TrustBadges />

        {/* POPULAR WOOD PALLETS SECTION */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                Qualité certifiée NF &amp; PEFC
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                Nos Meilleurs Bois de Chauffage en Palette
              </h2>
            </div>
            <Link
              href="/boutique"
              className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center space-x-1 hover:underline"
            >
              <span>Voir tout le catalogue</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        En stock ({prod.stock})
                      </span>
                    </div>

                    <Link
                      href={`/produit/${prod.slug}`}
                      className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                    >
                      <span>Voir la fiche &amp; commander</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INTERACTIVE CALCULATOR TEASER */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <QuantityCalculator />
        </section>

        {/* SHIPPING ESTIMATOR TEASER */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ShippingEstimator />
        </section>

        {/* WOOD SPECIES COMPARISON TABLE */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
              Expertise &amp; Conseil Technique
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              Guide Comparatif des Essences de Bois
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Le pouvoir calorifique et la tenue en braise varient grandement selon l'essence. Découvrez notre comparatif des bois durs certifiés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WOOD_SPECIES.map((sp) => (
              <div key={sp.id} className="bg-wood-50/70 p-5 rounded-2xl border border-wood-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-wood-200 text-wood-900 rounded-lg w-fit mb-2">
                    <Flame className="w-4 h-4 fill-wood-900" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm">{sp.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{sp.description}</p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-wood-200/60 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pouvoir calorifique :</span>
                    <strong className="text-forest-900 font-bold">{sp.calorificPower}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenue en braises :</span>
                    <strong className="text-gray-900">{sp.emberRetention.split(',')[0]}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/guides/essences"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-forest-800 hover:text-forest-950 underline"
            >
              <span>Consulter notre guide complet des essences de bois</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* VERIFIED CUSTOMER REVIEWS */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
              Avis Clients Certifiés
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              Ils se chauffent avec {settings.siteName}
            </h2>
            <div className="flex items-center justify-center space-x-1 mt-2 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-xs font-bold text-gray-800 ml-1.5">4.9 / 5 sur plus de 1 200 livraisons</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-700 italic leading-relaxed">
                  "{rev.comment}"
                </p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-900">{rev.authorName}</span>
                  <span className="text-gray-400">{rev.authorCity}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ACCORDION PREVIEW */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Questions Fréquentes sur la Commande &amp; la Livraison
            </h2>
          </div>

          <div className="space-y-4">
            {FREQUENT_QUESTIONS.map((faq, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-xs">
                <h3 className="font-extrabold text-gray-900 text-sm mb-1.5 flex items-start space-x-2">
                  <span className="text-forest-700 font-bold">Q.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-gray-600 leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
