import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { slugify } from '@/lib/import-helpers';
import type { ImportedProduct } from '@/lib/import-types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'products:write')) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  let payload: ImportedProduct[];
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }
    if ('products' in body && Array.isArray(body.products)) {
      payload = body.products;
    } else if (Array.isArray(body)) {
      payload = body;
    } else {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  if (!payload.length) {
    return NextResponse.json({ error: 'Aucun produit fourni' }, { status: 400 });
  }

  const results: any[] = [];
  const ordered: { slug: string; name: string; description: string; imageUrl?: string | null }[] = [];

  for (const item of payload) {
    try {
      const categorySlug = item.categorySlug
        ? item.categorySlug.length > 32
          ? item.categorySlug.slice(0, 32)
          : item.categorySlug
        : (await slugify(item.name)).slice(0, 32);

      // Ensure category exists or create it
      let category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            slug: categorySlug,
            name: item.name.split(' - ')[0] || item.name,
            description: item.shortDescription,
          },
        });
      }

      // Generate reference from name and reference code
      const reference = item.reference?.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'X';
      const safeRef = reference ? `${item.name.split(' - ')[0][0]}${reference}` : item.name.slice(0, 8).toUpperCase();

      // Pick first image as primary, or null if no images
      const primaryImage = item.images && item.images.length > 0 ? item.images[0] : null;

      const created = await prisma.product.create({
        data: {
          reference: safeRef,
          slug: (await slugify(item.slug || item.name)).slice(0, 100),
          name: item.name,
          shortDescription: item.shortDescription,
          description: item.description,
          images: JSON.stringify(item.images || []),
          species: item.species,
          woodType: item.woodType,
          humidityRate: item.humidityRate,
          calorificValue: item.calorificValue,
          logLength: item.logLength,
          unit: item.unit,
          priceHT: item.priceHT,
          priceTTC: item.priceTTC,
          vatRate: item.vatRate ?? 5.5,
          promoPrice: item.promoPrice ?? null,
          promoStartDate: item.promoStartDate ?? null,
          promoEndDate: item.promoEndDate ?? null,
          stock: item.stock,
          reservedStock: item.reservedStock ?? 0,
          weightKg: item.weightKg,
          volumeM3: item.volumeM3,
          dimensions: item.dimensions,
          packaging: item.packaging,
          isPreorderAllowed: item.isPreorderAllowed ?? false,
          allowedCountries: JSON.stringify(item.allowedCountries ?? ['FR', 'DE', 'BE', 'CH']),
          leadTimeDays: item.leadTimeDays ?? 4,
          seoTitle: item.seoTitle ?? null,
          seoDescription: item.seoDescription ?? null,
          isActive: item.isActive ?? true,
          categoryId: category.id,
        },
      });

      results.push({ ok: true, reference: created.reference, slug: created.slug, categorySlug });
      ordered.push({
        slug: category.slug,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      });
    } catch (err: any) {
      results.push({ ok: false, error: err?.message || String(err) });
    }
  }

  return NextResponse.json({ imported: results.length, results, categories: ordered });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'products:read')) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { id: true, slug: true, name: true, imageUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 250,
  });

  return NextResponse.json({ products });
}
