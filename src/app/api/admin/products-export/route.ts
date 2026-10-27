import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { csvRowFromProduct, serialiseProductsToCsv } from '@/lib/product-csv';

export const dynamic = 'force-dynamic';

/**
 * Export du catalogue complet au format CSV : contenus, images, tarifs, stocks
 * et champs SEO. Le fichier est réimportable tel quel via
 * `POST /api/admin/products-import` (ou depuis le backoffice).
 *
 * Ouvert aux profils catalogue et aux profils comptables, qui font les
 * sauvegardes de données.
 */
export async function GET() {
  const user = await getCurrentUser();
  const allowed = user && (hasPermission(user.role, 'products:read') || hasPermission(user.role, 'exports:read'));
  if (!allowed) {
    return NextResponse.json({ error: 'Accès interdit : session administrateur requise' }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true, slug: true } } },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const csv = serialiseProductsToCsv(products.map((product) => csvRowFromProduct(product)));
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="catalogue-produits-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export impossible' }, { status: 500 });
  }
}
