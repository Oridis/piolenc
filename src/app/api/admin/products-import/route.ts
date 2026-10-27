import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { invalidateProductsCache, invalidateCategoriesCache } from '@/lib/settings';
import { csvToProducts, looksLikeCsv } from '@/lib/product-csv';

export const dynamic = 'force-dynamic';

/**
 * Import du catalogue, en JSON ou en CSV.
 *
 * Le CSV accepté est celui produit par `GET /api/admin/products-export` : un
 * export réimporté met à jour les fiches existantes (appariement par référence,
 * puis par slug) au lieu de créer des doublons, ce qui rend l'aller-retour
 * export → modification → import fidèle. Une fiche absente est recréée à
 * l'identique, images et textes compris.
 */

const DEFAULT_VAT_RATE = 5.5;
const DEFAULT_COUNTRIES = ['FR', 'DE', 'BE', 'CH'];

type IncomingProduct = Record<string, any>;

const present = (item: IncomingProduct, key: string) => item[key] !== undefined && item[key] !== null;

const toText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
};

const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  const cleaned = toText(value).toLowerCase();
  if (['oui', 'o', 'yes', 'y', 'true', 'vrai', '1'].includes(cleaned)) return true;
  if (['non', 'n', 'no', 'false', 'faux', '0'].includes(cleaned)) return false;
  return undefined;
};

/** Tableaux (images, pays) : accepte un tableau ou une liste texte. */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => toText(entry)).filter(Boolean);
  const raw = toText(value);
  if (!raw) return [];
  return raw
    .split(/[|\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = toText(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function slugifyText(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || 'produit';
}

function referenceFromName(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return base || 'PRODUIT';
}

/** Slug libre, en ignorant la fiche en cours de mise à jour. */
async function freeSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base.slice(0, 80);
  for (let i = 2; i <= 50; i += 1) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base.slice(0, 74)}-${i}`;
  }
  return `${base.slice(0, 68)}-${Date.now().toString(36)}`;
}

/** Référence libre, en ignorant la fiche en cours de mise à jour. */
async function freeReference(base: string, excludeId?: string): Promise<string> {
  let candidate = base.slice(0, 40);
  for (let i = 2; i <= 50; i += 1) {
    const existing = await prisma.product.findUnique({ where: { reference: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base.slice(0, 36)}-${i}`;
  }
  return `${base.slice(0, 28)}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Construit le corps Prisma de la fiche.
 *
 * En mise à jour, seules les colonnes réellement présentes dans le fichier sont
 * écrites : un import partiel ne peut pas effacer le reste de la fiche. En
 * création, les valeurs par défaut du catalogue complètent les colonnes vides.
 */
function buildData(
  item: IncomingProduct,
  options: { create: boolean; existing?: Record<string, any> }
): Record<string, any> {
  const { create, existing } = options;
  const data: Record<string, any> = {};

  const textFields = [
    'shortDescription',
    'description',
    'species',
    'woodType',
    'humidityRate',
    'calorificValue',
    'logLength',
    'unit',
    'dimensions',
    'packaging',
  ];
  for (const field of textFields) {
    if (present(item, field) || create) data[field] = toText(item[field]);
  }

  for (const field of ['seoTitle', 'seoDescription']) {
    if (present(item, field) || create) data[field] = toText(item[field]) || null;
  }

  if (present(item, 'images') || create) {
    data.images = JSON.stringify(present(item, 'images') ? toList(item.images) : []);
  }

  if (present(item, 'allowedCountries') || create) {
    const countries = present(item, 'allowedCountries') ? toList(item.allowedCountries) : [];
    data.allowedCountries = JSON.stringify(
      (countries.length > 0 ? countries : DEFAULT_COUNTRIES).map((country) => country.toUpperCase())
    );
  }

  if (present(item, 'isPreorderAllowed') || create) {
    data.isPreorderAllowed = present(item, 'isPreorderAllowed')
      ? toBoolean(item.isPreorderAllowed) === true
      : false;
  }

  if (present(item, 'isActive') || create) {
    data.isActive = present(item, 'isActive') ? toBoolean(item.isActive) !== false : true;
  }

  for (const field of ['priceHT', 'priceTTC', 'weightKg', 'volumeM3']) {
    if (present(item, field) || create) {
      const parsed = toNumber(item[field]);
      data[field] = parsed === undefined ? 0 : round2(parsed);
    }
  }

  if (present(item, 'vatRate') || create) {
    const parsed = toNumber(item.vatRate);
    data.vatRate = parsed === undefined ? DEFAULT_VAT_RATE : round2(parsed);
  }

  if (present(item, 'promoPrice')) {
    const parsed = toNumber(item.promoPrice);
    data.promoPrice = parsed === undefined ? null : round2(parsed);
  } else if (create) {
    data.promoPrice = null;
  }

  for (const field of ['promoStartDate', 'promoEndDate']) {
    if (present(item, field) || create) data[field] = present(item, field) ? toDate(item[field]) : null;
  }

  for (const field of ['stock', 'reservedStock', 'leadTimeDays']) {
    if (present(item, field) || create) {
      const parsed = toNumber(item[field]);
      data[field] = parsed === undefined ? 0 : Math.max(0, Math.trunc(parsed));
    }
  }

  // Prix : un montant seul recalcule l'autre pour rester cohérent HT / TTC.
  const vatRate = data.vatRate ?? existing?.vatRate ?? DEFAULT_VAT_RATE;
  if (data.priceHT !== undefined && data.priceTTC === undefined) {
    data.priceTTC = round2(data.priceHT * (1 + vatRate / 100));
  } else if (data.priceTTC !== undefined && data.priceHT === undefined) {
    data.priceHT = round2(data.priceTTC / (1 + vatRate / 100));
  }

  if (create) {
    data.shortDescription = data.shortDescription || toText(item.name);
    data.description = data.description || data.shortDescription;
    data.unit = data.unit || 'Unité';
    data.stock = data.stock ?? 0;
    data.reservedStock = data.reservedStock ?? 0;
    data.leadTimeDays = data.leadTimeDays ?? 4;
  }

  return data;
}

/**
 * Extrait la liste de fiches du corps de la requête : CSV (texte ou fichier) ou
 * JSON (`{ products: [...] }` ou tableau nu, comportement historique).
 */
function readPayload(contentType: string, rawBody: string): { items: IncomingProduct[] } | { error: string } {
  const trimmed = rawBody.trim();
  if (!trimmed) return { error: 'Corps de requête vide' };

  if (contentType.includes('text/csv') || looksLikeCsv(trimmed)) {
    const { products, errors } = csvToProducts(trimmed);
    if (products.length === 0) {
      return { error: errors[0]?.message || 'Aucune ligne exploitable dans le CSV' };
    }
    return { items: products as IncomingProduct[] };
  }

  let body: any;
  try {
    body = JSON.parse(trimmed);
  } catch {
    return { error: 'Contenu illisible : fournissez un JSON ou un CSV du catalogue' };
  }

  if (typeof body === 'string') return readPayload('', body);
  if (body && typeof body.csv === 'string') return readPayload('text/csv', body.csv);
  if (body && Array.isArray(body.products)) return { items: body.products };
  if (Array.isArray(body)) return { items: body };
  if (body && typeof body === 'object') return { items: [body] };
  return { error: 'Payload invalide' };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'products:write')) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Corps de requête illisible' }, { status: 400 });
  }

  const parsed = readPayload(request.headers.get('content-type') || '', rawBody);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const payload = parsed.items;
  if (payload.length === 0) {
    return NextResponse.json({ error: 'Aucun produit fourni' }, { status: 400 });
  }
  if (payload.length > 1000) {
    return NextResponse.json({ error: 'Import limité à 1000 fiches par envoi' }, { status: 400 });
  }

  const results: any[] = [];
  const categoriesCreated: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [index, item] of payload.entries()) {
    const line = index + 2;
    const name = toText(item.name);
    if (!name) {
      results.push({ ok: false, line, error: 'Nom manquant' });
      continue;
    }

    const warnings: string[] = [];

    try {
      const referenceInput = toText(item.reference).toUpperCase();
      const slugInput = toText(item.slug);

      // Catégorie : celle du fichier, sinon créée à partir du nom fourni.
      const categoryNameInput = toText(item.categoryName);
      const categorySlugInput = toText(item.categorySlug);
      const categorySlugBase = categorySlugInput
        ? slugifyText(categorySlugInput)
        : slugifyText(categoryNameInput || name.split(' - ')[0] || name);

      let category = await prisma.category.findUnique({ where: { slug: categorySlugBase } });
      if (!category) {
        category = await prisma.category.create({
          data: {
            slug: categorySlugBase,
            name: categoryNameInput || name.split(' - ')[0] || name,
            description: toText(item.shortDescription),
          },
        });
        categoriesCreated.push(category.slug);
      }

      // Appariement : référence d'abord, puis slug. Un export réimporté
      // retrouve donc ses fiches au lieu d'en créer des copies.
      let existing: Record<string, any> | null = null;
      if (referenceInput) {
        existing = await prisma.product.findUnique({ where: { reference: referenceInput } });
      }
      if (!existing && slugInput) {
        existing = await prisma.product.findUnique({ where: { slug: slugInput } });
      }

      if (existing) {
        const data = buildData(item, { create: false, existing });

        if (slugInput && slugInput !== existing.slug) {
          const slug = await freeSlug(slugInput, existing.id);
          if (slug === slugInput) data.slug = slug;
          else warnings.push(`Identifiant d’URL « ${slugInput} » déjà pris : « ${existing.slug} » conservé`);
        }

        if (referenceInput && referenceInput !== existing.reference) {
          const reference = await freeReference(referenceInput, existing.id);
          if (reference === referenceInput) data.reference = reference;
          else warnings.push(`Référence « ${referenceInput} » déjà utilisée : « ${existing.reference} » conservée`);
        }

        data.categoryId = category.id;

        const saved = await prisma.product.update({ where: { id: existing.id }, data });
        updated += 1;
        results.push({
          ok: true,
          line,
          status: 'updated',
          name: saved.name,
          reference: saved.reference,
          slug: saved.slug,
          warnings,
        });
        continue;
      }

      const slug = await freeSlug(slugInput || slugifyText(name));
      const reference = await freeReference(referenceInput || referenceFromName(name));
      if (slugInput && slug !== slugInput) warnings.push(`Identifiant d’URL « ${slugInput} » déjà pris : « ${slug} » utilisé`);
      if (referenceInput && reference !== referenceInput) {
        warnings.push(`Référence « ${referenceInput} » déjà utilisée : « ${reference} » utilisée`);
      }

      // `buildData` garantit les colonnes obligatoires en création ; le type de
      // création généré par Prisma ne sait pas suivre une construction dynamique.
      const createData = {
        ...buildData(item, { create: true }),
        reference,
        slug,
        name,
        categoryId: category.id,
      } as Prisma.ProductUncheckedCreateInput;
      if (toNumber(item.priceTTC) === undefined && toNumber(item.priceHT) === undefined) {
        warnings.push('Aucun prix dans le fichier : fiche importée à 0 €');
      }

      const saved = await prisma.product.create({ data: createData });
      created += 1;
      results.push({
        ok: true,
        line,
        status: 'created',
        name: saved.name,
        reference: saved.reference,
        slug: saved.slug,
        warnings,
      });
    } catch (error: any) {
      results.push({ ok: false, line, error: error?.message || String(error) });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  if (created > 0 || updated > 0) {
    invalidateProductsCache();
    invalidateCategoriesCache();
  }

  return NextResponse.json({
    success: true,
    imported: created + updated,
    created,
    updated,
    failed,
    results,
    categories: categoriesCreated,
  });
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
