import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Disponibilité des articles d'un panier.
 *
 * Le panier vit dans le navigateur : il conserve l'identifiant, le nom et le
 * prix du produit au moment de l'ajout. Cette route redonne l'état réel du
 * catalogue pour prévenir le client avant le paiement (fiche retirée, stock
 * épuisé), sans rien écrire.
 *
 * Les règles reproduisent exactement celles du tunnel de commande
 * (`/api/checkout`) : stock disponible = stock − réservé, et la précommande
 * autorisée lève la contrainte de stock.
 */

const MAX_ITEMS = 100;

type RequestedItem = { id: string; quantity: number };

export async function POST(request: Request) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête illisible' }, { status: 400 });
  }

  const rawItems = Array.isArray(payload?.items) ? payload.items : null;
  if (!rawItems) {
    return NextResponse.json({ error: 'Format attendu : { items: [{ id, quantity }] }' }, { status: 400 });
  }
  if (rawItems.length > MAX_ITEMS) {
    return NextResponse.json({ error: `Vérification limitée à ${MAX_ITEMS} articles` }, { status: 400 });
  }

  const items: RequestedItem[] = [];
  for (const entry of rawItems) {
    const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
    if (!id) continue;
    const quantity = Number(entry?.quantity);
    items.push({ id, quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1 });
  }

  if (items.length === 0) {
    return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(items.map((item) => item.id))] } },
    select: {
      id: true,
      name: true,
      isActive: true,
      stock: true,
      reservedStock: true,
      isPreorderAllowed: true,
      priceTTC: true,
      promoPrice: true,
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const results = items.map(({ id, quantity }) => {
    const product = byId.get(id);
    if (!product) {
      return { id, quantity, available: false, reason: 'NOT_FOUND' as const };
    }

    const availableStock = Math.max(0, product.stock - product.reservedStock);
    const priceTTC =
      product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.priceTTC;
    const base = { id, quantity, name: product.name, availableStock, priceTTC };

    if (!product.isActive) {
      return { ...base, available: false, reason: 'INACTIVE' as const };
    }
    if (!product.isPreorderAllowed && availableStock < quantity) {
      return {
        ...base,
        available: false,
        reason: availableStock <= 0 ? ('OUT_OF_STOCK' as const) : ('INSUFFICIENT_STOCK' as const),
      };
    }
    return { ...base, available: true, reason: null };
  });

  return NextResponse.json({ items: results }, { headers: { 'Cache-Control': 'no-store' } });
}
