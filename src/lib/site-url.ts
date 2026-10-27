/**
 * URL publique canonique du site, utilisée par le plan de site et robots.txt.
 *
 * `NEXT_PUBLIC_APP_URL` est renseignée pour chaque déploiement (voir
 * `vercel.json`), et c'est déjà elle qui construit les liens des e-mails
 * transactionnels : les URLs annoncées aux moteurs de recherche doivent être
 * exactement celles que reçoivent les clients, sans domaine en dur ni en-tête
 * `Host` (falsifiable, et différent entre l'aperçu et la production).
 */
const FALLBACK_SITE_URL = 'https://piolencboisdirect.fr';

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || FALLBACK_SITE_URL;
  // Un suffixe `/` produirait des URLs en `//boutique` dans le plan de site.
  return raw.replace(/\/+$/, '');
}
