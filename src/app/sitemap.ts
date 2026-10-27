import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/site-url';

// Le plan de site lit la base à chaque appel : une fiche retirée du catalogue
// disparaît donc du plan dès le prochain passage du robot, sans attendre une
// reconstruction du site.
export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;

/**
 * Pages publiques et indexables, avec leur priorité relative. Cette liste est
 * volontairement explicite (et non déduite du système de fichiers) : les pages
 * de compte, de commande, de suivi, de connexion et tout le backoffice n'ont
 * rien à y faire, et une nouvelle page publique doit être ajoutée ici en
 * connaissance de cause.
 */
const PUBLIC_PAGES: Array<{ path: string; priority: number; changeFrequency: ChangeFrequency }> = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/boutique', priority: 0.9, changeFrequency: 'daily' },
  { path: '/promotions', priority: 0.8, changeFrequency: 'daily' },
  { path: '/catalogue', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/categories', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/calculateurs/quantite', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/calculateurs/livraison', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/guides/essences', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/guides/humidite', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/guides/stockage', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/a-propos', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/livraison-et-retours', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/virement-bancaire', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/cgv', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/mentions-legales', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/confidentialite', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // Seuls les produits actifs sont annoncés : une fiche désactivée renvoie une
  // page 404 (voir src/app/produit/[slug]/page.tsx) et n'a donc plus rien à
  // faire dans un plan de site, sous peine d'être signalée comme une erreur
  // d'exploration.
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  return [
    ...PUBLIC_PAGES.map((page) => ({
      url: `${siteUrl}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/produit/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.7,
    })),
  ];
}
