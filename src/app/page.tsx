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
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import {
  Truck,
  ShieldCheck,
  ArrowRight,
  Calculator,
  ChevronRight,
  Layers,
  Droplets,
  Warehouse,
  Check,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getSiteSettings();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    take: 4,
    orderBy: { createdAt: 'asc' },
  });

  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: 'asc' },
    take: 4,
  });

  // Chiffres clés du hero : chacun est masquable depuis l'administration.
  const heroFacts = [
    { value: settings.heroFact1Value, label: settings.heroFact1Label },
    { value: settings.heroFact2Value, label: settings.heroFact2Label },
    { value: settings.heroFact3Value, label: settings.heroFact3Label },
  ].filter((fact) => (fact.value || '').trim() || (fact.label || '').trim());

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus-outline">Skip to main content</a>

      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main id="main" className="flex-1 font-sans bg-ivory">
        {/* SECTION 1: HERO PRINCIPAL EDITORIAL */}
        <section className="bg-white border-b border-subtleBorder py-12 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Commercial message & CTAs */}
              <div className="lg:col-span-7 space-y-6">
                {settings.heroBadge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-forest-50 border border-forest-100 text-forest text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{settings.heroBadge}</span>
                  </div>
                )}

                <h1 className="font-poppins font-semibold text-3xl sm:text-4xl lg:text-5xl text-primaryText leading-tight">
                  {settings.heroTitle}
                </h1>

                {settings.heroSubtitle && (
                  <p className="text-secondaryText text-sm sm:text-base leading-relaxed max-w-xl">
                    {settings.heroSubtitle}
                  </p>
                )}

                {/* Primary & Secondary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {settings.heroPrimaryLabel && (
                    <Link
                      href={settings.heroPrimaryHref || '/boutique'}
                      className="btn-primary text-sm py-3 px-6 inline-flex items-center justify-center gap-2"
                    >
                      <span>{settings.heroPrimaryLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {settings.heroSecondaryLabel && (
                    <Link
                      href={settings.heroSecondaryHref || '/calculateurs/livraison'}
                      className="btn-secondary text-sm py-3 px-5 inline-flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4 text-forest" />
                      <span>{settings.heroSecondaryLabel}</span>
                    </Link>
                  )}
                </div>

                {/* Key Facts */}
                {heroFacts.length > 0 && (
                  <div className="pt-4 border-t border-subtleBorder grid grid-cols-3 gap-4 text-xs">
                    {heroFacts.map((fact, index) => (
                      <div key={index}>
                        {fact.value && (
                          <span className="font-poppins font-semibold text-primaryText block text-sm">
                            {fact.value}
                          </span>
                        )}
                        {fact.label && (
                          <span className="text-secondaryText text-[11px]">{fact.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Authentic Photography */}
              <div className="lg:col-span-5">
                <div className="relative rounded-xl overflow-hidden border border-subtleBorder bg-ivory shadow-subtle">
                  <img
                    src={settings.heroImageUrl}
                    alt={settings.heroImageCaption || 'Bois de chauffage livré sur palette'}
                    className="w-full h-80 sm:h-96 object-cover"
                    loading="eager"
                  />
                  {(settings.heroImageCaption || settings.heroImageCaptionSub || settings.heroImageBadge) && (
                    <div className="p-4 bg-white border-t border-subtleBorder flex items-center justify-between text-xs">
                      <div>
                        {settings.heroImageCaption && (
                          <p className="font-medium text-primaryText">{settings.heroImageCaption}</p>
                        )}
                        {settings.heroImageCaptionSub && (
                          <p className="text-[11px] text-secondaryText">{settings.heroImageCaptionSub}</p>
                        )}
                      </div>
                      {settings.heroImageBadge && (
                        <span className="badge-success">{settings.heroImageBadge}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: CATEGORIES PRINCIPALES */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-secondaryText block mb-1">
                Gamme biocombustibles
              </span>
              <h2 className="font-poppins font-semibold text-2xl text-primaryText">
                Nos catégories de produits
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs font-medium text-forest hover:text-forest-dark inline-flex items-center gap-1"
            >
              <span>Voir toutes les catégories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/boutique?categorie=${cat.slug}`}
                className="group bg-white rounded-xl border border-subtleBorder overflow-hidden hover:border-forest transition-colors duration-150 flex flex-col"
              >
                <div className="h-44 overflow-hidden bg-ivory">
                  <img
                    src={cat.imageUrl || PLACEHOLDER_IMAGE}
                    alt={`Catégorie : ${cat.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-poppins font-medium text-sm text-primaryText group-hover:text-forest transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-secondaryText mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <span className="mt-3 text-xs font-medium text-forest inline-flex items-center gap-1">
                    <span>Explorer la catégorie</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 3: PRODUITS POPULAIRES */}
        <section className="py-12 bg-white border-y border-subtleBorder">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-secondaryText block mb-1">
                  Sélection du moment
                </span>
                <h2 className="font-poppins font-semibold text-2xl text-primaryText">
                  Produits les plus commandés
                </h2>
              </div>
              <Link
                href="/boutique"
                className="text-xs font-medium text-forest hover:text-forest-dark inline-flex items-center gap-1"
              >
                <span>Accéder à toute la boutique</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4-column desktop / 2-column mobile grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((prod) => {
                let images: string[] = [];
                if (prod.images) {
                  try {
                    images = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                  } catch {
                    images = [];
                  }
                }
                const mainImg = images[0] || PLACEHOLDER_IMAGE;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-xl border border-subtleBorder overflow-hidden flex flex-col justify-between hover:border-forest/80 transition-colors duration-150"
                  >
                    <div>
                      {/* Product Image */}
                      <Link href={`/produit/${prod.slug}`} className="block relative h-48 bg-ivory overflow-hidden">
                        <img
                          src={mainImg}
                          alt={prod.species ? `Bûches de ${prod.species} - ${prod.name}` : prod.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        {prod.logLength ? (
                          <span className="absolute top-2.5 left-2.5 badge-neutral bg-white/90 backdrop-blur-sm text-[10px]">
                            {prod.logLength}
                          </span>
                        ) : null}
                      </Link>

                      {/* Product Content */}
                      <div className="p-4">
                        <p className="text-[11px] font-medium text-secondaryText uppercase tracking-wider">
                          {prod.category?.name || 'Bois de chauffage'}
                        </p>
                        <Link href={`/produit/${prod.slug}`}>
                          <h3 className="font-poppins font-medium text-sm text-primaryText hover:text-forest transition-colors mt-1 line-clamp-2 leading-snug">
                            {prod.name}
                          </h3>
                        </Link>

                        <div className="mt-3 space-y-1 text-xs text-secondaryText">
                          {prod.packaging ? (
                            <p>Conditionnement : <span className="text-primaryText font-medium">{prod.packaging}</span></p>
                          ) : null}
                          {prod.humidityRate ? (
                            <p>Humidité : <span className="text-forest font-medium">{prod.humidityRate}</span></p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Price and Action Button */}
                    <div className="p-4 pt-0 border-t border-subtleBorder/60 mt-3 flex items-center justify-between">
                      <div>
                        <span className="font-poppins font-semibold text-lg text-primaryText">
                          {formatPrice(prod.priceTTC)}
                        </span>
                        <span className="text-[10px] text-secondaryText block">TTC / palette</span>
                      </div>
                      <Link
                        href={`/produit/${prod.slug}`}
                        className="btn-primary text-xs py-2 px-3.5"
                      >
                        Commander
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: AVANTAGES COMMERCIAUX VERIFIES */}
        <TrustBadges />

        {/* SECTION 5: EXPLICATION DE LA LIVRAISON (4 ETAPES) */}
        <section className="py-14 sm:py-[72px] bg-white border-b border-subtleBorder">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-medium uppercase tracking-wider text-secondaryText block mb-1">
                Processus d&apos;achat
              </span>
              <h2 className="font-poppins font-semibold text-2xl text-primaryText">
                Comment se déroule votre commande
              </h2>
              <p className="text-xs sm:text-sm text-secondaryText mt-2">
                Un processus transparent, sécurisé et tracé de la validation du panier jusqu&apos;à la dépose devant votre abri.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Choisir le bois',
                  desc: 'Sélectionnez la longueur des bûches (25, 33 ou 50 cm) et le nombre de palettes selon votre consommation.',
                },
                {
                  step: '02',
                  title: 'Commander en ligne',
                  desc: 'Renseignez votre adresse, vérifiez les conditions d\'accès camion et validez le récapitulatif sans frais cachés.',
                },
                {
                  step: '03',
                  title: 'Effectuer le virement',
                  desc: 'Réglez par virement bancaire direct avec la référence structurée transmise par email et sur la confirmation.',
                },
                {
                  step: '04',
                  title: 'Suivre la livraison',
                  desc: 'Dès validation comptable, suivez l\'acheminement en direct via votre lien sécurisé et convenez du rendez-vous.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-5 rounded-xl border border-subtleBorder bg-ivory/60 flex flex-col justify-between"
                >
                  <div>
                    <span className="font-poppins font-semibold text-xs text-forest block mb-2">
                      Étape {item.step}
                    </span>
                    <h3 className="font-poppins font-medium text-base text-primaryText mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-secondaryText leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: CALCULATEURS & CONTENU EDITORIAL */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Calculators Tabs / Showcase */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="text-xs font-medium uppercase tracking-wider text-secondaryText block mb-1">
                Aide à la décision
              </span>
              <h2 className="font-poppins font-semibold text-2xl text-primaryText">
                Estimez vos besoins et vos frais
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <QuantityCalculator />
              <ShippingEstimator />
            </div>
          </div>

          {/* Editorial Wood Guides */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-secondaryText block mb-1">
                  Expertise technique
                </span>
                <h2 className="font-poppins font-semibold text-2xl text-primaryText">
                  Guides pratiques &amp; conseils de combustion
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/guides/essences"
                className="group bg-white rounded-xl border border-subtleBorder overflow-hidden p-5 flex flex-col justify-between hover:border-forest transition-colors duration-150"
              >
                <div>
                  <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest mb-3.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-poppins font-medium text-sm text-primaryText group-hover:text-forest transition-colors">
                    Comparatif des essences de bois dur
                  </h3>
                  <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">
                    Découvrez les densités, braises et pouvoirs calorifiques respectifs du chêne, du hêtre et du charme pour un feu durable.
                  </p>
                </div>
                <span className="mt-4 text-xs font-medium text-forest inline-flex items-center gap-1">
                  <span>Lire le guide</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/guides/humidite"
                className="group bg-white rounded-xl border border-subtleBorder overflow-hidden p-5 flex flex-col justify-between hover:border-forest transition-colors duration-150"
              >
                <div>
                  <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest mb-3.5">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <h3 className="font-poppins font-medium text-sm text-primaryText group-hover:text-forest transition-colors">
                    Taux d&apos;humidité NF et encrassement
                  </h3>
                  <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">
                    Comprendre pourquoi un bois étuvé à moins de 20% produit 2 fois plus de chaleur qu&apos;un bois vert et préserve votre conduit.
                  </p>
                </div>
                <span className="mt-4 text-xs font-medium text-forest inline-flex items-center gap-1">
                  <span>Lire le guide</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/guides/stockage"
                className="group bg-white rounded-xl border border-subtleBorder overflow-hidden p-5 flex flex-col justify-between hover:border-forest transition-colors duration-150"
              >
                <div>
                  <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest mb-3.5">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <h3 className="font-poppins font-medium text-sm text-primaryText group-hover:text-forest transition-colors">
                    Conseils de stockage sous abri
                  </h3>
                  <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">
                    Comment surélever vos palettes, ventiler les côtés et protéger le dessus pour conserver une hygrométrie optimale tout l&apos;hiver.
                  </p>
                </div>
                <span className="mt-4 text-xs font-medium text-forest inline-flex items-center gap-1">
                  <span>Lire le guide</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
