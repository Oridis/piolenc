import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductClientDetails from './ProductClientDetails';
import imageCreditsRegistry from '@/lib/product-image-credits.json';

export const dynamic = 'force-dynamic';

/**
 * Les photos produits proviennent de Wikimedia Commons sous licence CC0, domaine
 * public ou CC-BY : les licences CC-BY imposent une attribution visible, affichée
 * sous la galerie. Le registre est généré par scripts/fetch-product-images-commons.mjs.
 */
interface ImageCreditRow {
  file: string;
  title: string;
  creator: string;
  creatorUrl: string;
  license: string;
  licenseUrl: string;
}

function getImageCredits(slug: string, images: string[]): ImageCreditRow[] {
  const registry = imageCreditsRegistry as unknown as {
    products?: Array<{ slug: string; images: ImageCreditRow[] }>;
  };
  const entry = registry.products?.find((item) => item.slug === slug);
  if (!entry) return [];
  return images
    .map((file) => entry.images.find((image) => image.file === file))
    .filter((image): image is ImageCreditRow => Boolean(image));
}


export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getSiteSettings();
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: true,
      reviews: { where: { isApproved: true } },
    },
  });

  if (!product) {
    notFound();
  }

  let productImages: string[] = [];
  try {
    productImages = JSON.parse(product.images);
  } catch {
    productImages = [];
  }
  const imageCredits = getImageCredits(slug, productImages);

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      {/* `min-w-0` est nécessaire : la colonne flex parente donnerait sinon à ce
          bloc une largeur minimale égale à son contenu (noms de produits longs),
          ce qui provoquait un défilement horizontal sur mobile. */}
      <main className="flex-1 w-full min-w-0 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ProductClientDetails product={product} siteSettings={settings} imageCredits={imageCredits} />
      </main>

      <Footer settings={settings} />
    </>
  );
}
