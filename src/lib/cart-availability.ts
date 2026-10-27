/**
 * Disponibilité des articles du panier.
 *
 * Le panier est stocké dans le navigateur : rien ne garantit que le produit
 * existe encore, soit encore en vente, ou dispose du stock demandé. Ce module
 * interroge l'état réel du catalogue et formule les messages affichés au
 * client, pour que le refus n'arrive plus au moment du paiement.
 */

export type AvailabilityReason = 'NOT_FOUND' | 'INACTIVE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK';

export interface CartAvailabilityEntry {
  id: string;
  quantity: number;
  available: boolean;
  reason: AvailabilityReason | null;
  name?: string;
  availableStock?: number;
  priceTTC?: number;
}

/** Message à afficher pour une ligne en défaut, `null` si tout va bien. */
export function describeAvailabilityIssue(entry: CartAvailabilityEntry | undefined): string | null {
  if (!entry || entry.available) return null;

  switch (entry.reason) {
    case 'NOT_FOUND':
      return 'Cette fiche a été retirée du catalogue.';
    case 'INACTIVE':
      return 'Ce produit a été retiré de la boutique.';
    case 'OUT_OF_STOCK':
      return 'Rupture de stock : cet article ne peut pas être commandé pour le moment.';
    case 'INSUFFICIENT_STOCK': {
      const available = entry.availableStock ?? 0;
      return `Stock insuffisant : il ne reste que ${available} unité${available > 1 ? 's' : ''} (vous en avez ${entry.quantity}).`;
    }
    default:
      return 'Article indisponible.';
  }
}

/**
 * Interroge `/api/cart/availability`. En cas d'échec réseau, l'appel lève une
 * erreur : l'appelant laisse alors la vérification serveur du tunnel faire
 * office de garde-fou plutôt que de bloquer le client sur un faux positif.
 */
export async function fetchCartAvailability(
  items: { id: string; quantity: number }[],
  fetchImpl: typeof fetch = fetch
): Promise<Map<string, CartAvailabilityEntry>> {
  const response = await fetchImpl('/api/cart/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Vérification de disponibilité indisponible (HTTP ${response.status})`);
  }

  const data = await response.json();
  const entries: CartAvailabilityEntry[] = Array.isArray(data?.items) ? data.items : [];
  return new Map(entries.map((entry) => [entry.id, entry]));
}
