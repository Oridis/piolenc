/* eslint-disable */
import { PrismaClient } from '@prisma/client';
import { ensureCategory, referenceFor, slugify, uploadLocalImageIfNeeded, pickPrimaryImage } from '../src/lib/import-helpers.js';
// import types kept only for documentation: import type { ImportedProduct } from '../src/lib/import-types.js';

const prisma = new PrismaClient();

function isProductList(v) {
  if (!v || typeof v !== 'object') return null;
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.products)) return v.products;
  return null;
}

export async function importProducts(input) {
  const products = isProductList(input);
  if (!products || !products.length) {
    throw new Error('Aucun produit fourni');
  }

  const results = [];

  for (const item of products) {
    try {
      const categorySlug = item.categorySlug ?? slugify(item.name).slice(0, 32);
      const category = await ensureCategory({
        slug: categorySlug,
        name: item.name.split(' - ')[0] || item.name,
        description: item.shortDescription,
        imageUrl: pickPrimaryImage(item.images) ?? null,
      });

      const reference = referenceFor(item.name, categorySlug, item.reference?.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'X');
      const images = item.images.length ? item.images.map(url => uploadLocalImageIfNeeded(url, '')) : [];

      await prisma.product.create({
        data: {
          reference,
          slug: slugify(item.slug || item.name).slice(0, 100),
          name: item.name,
          shortDescription: item.shortDescription,
          description: item.description,
          images: JSON.stringify(images),
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

      results.push({ ok: true, reference });
    } catch (err) {
      results.push({ ok: false, error: String(err) });
    }
  }

  return results;
}

if (process.argv[1]?.endsWith('import-real.mjs') && process.argv[2] === '--run') {
  const raw = process.argv[3] || '[]';
  const input = JSON.parse(raw);
  const products = isProductList(input);
  if (!products || !products.length) {
    console.error('Usage: node scripts/import-real.mjs --run \'[ {...}, {...} ]\' or \'{ "products": [...] }\'');
    prisma.$disconnect();
    process.exit(1);
  }
  importProducts(input)
    .then(results => {
      console.log(JSON.stringify({ imported: results.length, results }, null, 2));
      prisma.$disconnect();
    })
    .catch(e => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
