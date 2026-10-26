/**
 * Images de la boutique: constantes partagées.
 *
 * Toutes les photos produits sont hébergées par la plateforme dans
 * `public/images/products/` (aucun appel aux serveurs des sites sources).
 * `PLACEHOLDER_IMAGE` évite un `src` vide (avertissement React) et une icône
 * cassée quand une fiche n'a pas encore d'illustration.
 */
export const PLACEHOLDER_IMAGE = '/images/placeholder-bois.svg';

/** Première image exploitable d'un produit, sinon l'illustration de repli. */
export function primaryImage(images: string[] | string | null | undefined): string {
  if (Array.isArray(images)) return images.length > 0 ? images[0] : PLACEHOLDER_IMAGE;
  if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {
      return images;
    }
  }
  return PLACEHOLDER_IMAGE;
}
