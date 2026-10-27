import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

// Les zones privées (compte, commande, suivi, backoffice) sont fermées par code,
// pas seulement par ces directives : robots.txt ne fait qu'éviter aux robots de
// gaspiller des requêtes dessus. Il est déclaré dynamique pour que l'URL du plan
// de site soit celle du déploiement courant et non celle lue à la compilation.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin', // backoffice
          '/api/', // routes internes
          '/panier', // panier local au navigateur
          '/commande', // tunnel de commande et confirmations nominatives
          '/connexion',
          '/inscription',
          '/mon-compte',
          '/suivi', // suivi de commande par lien à jeton
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
