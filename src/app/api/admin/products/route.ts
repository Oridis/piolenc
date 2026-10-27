import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { invalidateProductsCache, invalidateCategoriesCache } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * Gestion du catalogue depuis le backoffice : création, modification et
 * suppression d'un produit. Les règles métier du catalogue sont appliquées ici
 * (référence et slug uniques, cohérence HT / TTC, suppression prudente).
 */

const DEFAULT_VAT_RATE = 5.5;
const DEFAULT_COUNTRIES = ['FR', 'DE', 'BE', 'CH'];

const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Image URL liste : tableau JSON ou une URL par ligne. */
function normaliseImages(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((v) => String(v).trim()).filter(Boolean));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed.map((v) => String(v).trim()).filter(Boolean));
      } catch {
        /* texte libre : on retombe sur le découpage par ligne */
      }
    }
    return JSON.stringify(
      trimmed
        .split(/[\n,]/)
        .map((v) => v.trim())
        .filter(Boolean)
    );
  }
  return '[]';
}

function normaliseCountries(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((v) => String(v).trim().toUpperCase()).filter(Boolean));
  }
  if (typeof value === 'string' && value.trim()) {
    return JSON.stringify(
      value
        .split(/[\s,]+/)
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean)
    );
  }
  return JSON.stringify(DEFAULT_COUNTRIES);
}

function slugifyName(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
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

/** Trouve un slug libre, en ignorant le produit en cours de modification. */
async function freeSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 50; i += 1) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base.slice(0, 54)}-${i}`;
  }
  return `${base.slice(0, 48)}-${Date.now().toString(36)}`;
}

/** Trouve une référence libre, en ignorant le produit en cours de modification. */
async function freeReference(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 50; i += 1) {
    const existing = await prisma.product.findUnique({ where: { reference: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base.slice(0, 20)}-${i}`;
  }
  return `${base.slice(0, 16)}-${Date.now().toString(36).toUpperCase()}`;
}

async function requireStaff(permission: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, permission)) return null;
  return user;
}

export async function GET() {
  const user = await requireStaff('products:read');
  if (!user) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, slug: true, isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);
    return NextResponse.json({ products, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireStaff('products:write');
  if (!user) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const body = await request.json();
    const name = toText(body.name);
    if (!name) return NextResponse.json({ error: 'Le nom du produit est obligatoire' }, { status: 400 });

    const categoryId = toText(body.categoryId);
    if (!categoryId) return NextResponse.json({ error: 'Choisissez une catégorie' }, { status: 400 });
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 400 });

    const vatRate = toNumber(body.vatRate, DEFAULT_VAT_RATE);
    // Le catalogue s'affiche TTC : les deux montants restent cohérents quel que
    // soit celui saisi par l'exploitant.
    let priceHT = toNumber(body.priceHT, NaN);
    let priceTTC = toNumber(body.priceTTC, NaN);
    if (!Number.isFinite(priceHT) && !Number.isFinite(priceTTC)) {
      return NextResponse.json({ error: 'Renseignez un prix HT ou TTC' }, { status: 400 });
    }
    if (!Number.isFinite(priceHT)) priceHT = round2(priceTTC / (1 + vatRate / 100));
    if (!Number.isFinite(priceTTC)) priceTTC = round2(priceHT * (1 + vatRate / 100));

    const slug = await freeSlug(toText(body.slug) ? slugifyName(toText(body.slug)) : slugifyName(name));
    const reference = await freeReference(
      toText(body.reference) ? toText(body.reference).toUpperCase() : referenceFromName(name)
    );

    const created = await prisma.product.create({
      data: {
        reference,
        slug,
        name,
        shortDescription: toText(body.shortDescription, name),
        description: toText(body.description, toText(body.shortDescription, name)),
        images: normaliseImages(body.images),
        species: toText(body.species),
        woodType: toText(body.woodType),
        humidityRate: toText(body.humidityRate),
        calorificValue: toText(body.calorificValue),
        logLength: toText(body.logLength),
        unit: toText(body.unit, 'Unité'),
        priceHT: round2(priceHT),
        priceTTC: round2(priceTTC),
        vatRate,
        promoPrice: body.promoPrice === '' || body.promoPrice === null || body.promoPrice === undefined
          ? null
          : round2(toNumber(body.promoPrice, 0)),
        stock: Math.max(0, Math.trunc(toNumber(body.stock, 0))),
        weightKg: toNumber(body.weightKg, 0),
        volumeM3: toNumber(body.volumeM3, 0),
        dimensions: toText(body.dimensions),
        packaging: toText(body.packaging),
        isPreorderAllowed: body.isPreorderAllowed === true,
        allowedCountries: normaliseCountries(body.allowedCountries),
        leadTimeDays: Math.max(0, Math.trunc(toNumber(body.leadTimeDays, 4))),
        seoTitle: toText(body.seoTitle) || null,
        seoDescription: toText(body.seoDescription) || null,
        isActive: body.isActive !== false,
        categoryId: category.id,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    invalidateProductsCache();
    invalidateCategoriesCache();
    return NextResponse.json({ success: true, product: created }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Une référence ou un identifiant d’URL identique existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Création impossible' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await requireStaff('products:write');
  if (!user) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const body = await request.json();
    const id = toText(body.id);
    if (!id) return NextResponse.json({ error: 'Produit non précisé' }, { status: 400 });

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });

    // Mise à jour partielle : seuls les champs transmis sont modifiés.
    const data: Record<string, any> = {};

    if ('name' in body) {
      const name = toText(body.name);
      if (!name) return NextResponse.json({ error: 'Le nom du produit est obligatoire' }, { status: 400 });
      data.name = name;
    }
    if ('categoryId' in body) {
      const categoryId = toText(body.categoryId);
      const category = categoryId
        ? await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
        : null;
      if (!category) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 400 });
      data.categoryId = category.id;
    }
    if ('slug' in body) {
      const requested = toText(body.slug);
      data.slug = requested ? await freeSlug(slugifyName(requested), id) : existing.slug;
    }
    if ('reference' in body && toText(body.reference)) {
      data.reference = await freeReference(toText(body.reference).toUpperCase(), id);
    }
    if ('shortDescription' in body) data.shortDescription = toText(body.shortDescription);
    if ('description' in body) data.description = toText(body.description);
    if ('images' in body) data.images = normaliseImages(body.images);
    if ('species' in body) data.species = toText(body.species);
    if ('woodType' in body) data.woodType = toText(body.woodType);
    if ('humidityRate' in body) data.humidityRate = toText(body.humidityRate);
    if ('calorificValue' in body) data.calorificValue = toText(body.calorificValue);
    if ('logLength' in body) data.logLength = toText(body.logLength);
    if ('unit' in body) data.unit = toText(body.unit);
    if ('packaging' in body) data.packaging = toText(body.packaging);
    if ('dimensions' in body) data.dimensions = toText(body.dimensions);
    if ('seoTitle' in body) data.seoTitle = toText(body.seoTitle) || null;
    if ('seoDescription' in body) data.seoDescription = toText(body.seoDescription) || null;
    if ('isActive' in body) data.isActive = body.isActive !== false;
    if ('isPreorderAllowed' in body) data.isPreorderAllowed = body.isPreorderAllowed === true;
    if ('allowedCountries' in body) data.allowedCountries = normaliseCountries(body.allowedCountries);
    if ('stock' in body) data.stock = Math.max(0, Math.trunc(toNumber(body.stock, existing.stock)));
    if ('reservedStock' in body) data.reservedStock = Math.max(0, Math.trunc(toNumber(body.reservedStock, existing.reservedStock)));
    if ('weightKg' in body) data.weightKg = toNumber(body.weightKg, existing.weightKg);
    if ('volumeM3' in body) data.volumeM3 = toNumber(body.volumeM3, existing.volumeM3);
    if ('leadTimeDays' in body) data.leadTimeDays = Math.max(0, Math.trunc(toNumber(body.leadTimeDays, existing.leadTimeDays)));
    if ('vatRate' in body) data.vatRate = toNumber(body.vatRate, existing.vatRate);
    if ('promoPrice' in body) {
      data.promoPrice =
        body.promoPrice === '' || body.promoPrice === null || body.promoPrice === undefined
          ? null
          : round2(toNumber(body.promoPrice, 0));
    }

    // Prix : un montant saisi recalcule l'autre pour rester cohérent.
    const vatRate = data.vatRate ?? existing.vatRate;
    if ('priceHT' in body || 'priceTTC' in body) {
      let priceHT = 'priceHT' in body ? toNumber(body.priceHT, NaN) : NaN;
      let priceTTC = 'priceTTC' in body ? toNumber(body.priceTTC, NaN) : NaN;
      if (!Number.isFinite(priceHT) && Number.isFinite(priceTTC)) priceHT = round2(priceTTC / (1 + vatRate / 100));
      if (!Number.isFinite(priceTTC) && Number.isFinite(priceHT)) priceTTC = round2(priceHT * (1 + vatRate / 100));
      if (Number.isFinite(priceHT)) data.priceHT = round2(priceHT);
      if (Number.isFinite(priceTTC)) data.priceTTC = round2(priceTTC);
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    invalidateProductsCache();
    invalidateCategoriesCache();
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Une référence ou un identifiant d’URL identique existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Modification impossible' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireStaff('products:write');
  if (!user) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Un produit (`id`) ou une sélection (`ids`), en paramètre d'URL ou dans le
    // corps JSON : la suppression groupée sert au nettoyage du catalogue.
    const requested = [
      searchParams.get('id') || '',
      ...(searchParams.get('ids') || '').split(','),
      ...(body?.id ? [body.id] : []),
      ...(Array.isArray(body?.ids) ? body.ids : []),
    ]
      .map((value) => toText(value))
      .filter(Boolean);

    const ids = [...new Set(requested)];
    if (ids.length === 0) return NextResponse.json({ error: 'Produit non précisé' }, { status: 400 });
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Suppression limitée à 500 produits par envoi' }, { status: 400 });
    }

    const known = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, reference: true },
    });

    const skipped: { id: string; name?: string; reason: string }[] = ids
      .filter((id) => !known.some((product) => product.id === id))
      .map((id) => ({ id, reason: 'Produit introuvable' }));

    // Un produit déjà commandé doit rester dans l'historique comptable : il est
    // écarté de la suppression, l'exploitant le désactive pour le retirer de la
    // boutique sans casser les commandes passées.
    const linked = known.length
      ? await prisma.orderItem.groupBy({
          by: ['productId'],
          where: { productId: { in: known.map((product) => product.id) } },
          _count: { _all: true },
        })
      : [];
    const linkedCount = new Map(linked.map((entry) => [entry.productId, entry._count._all]));

    const deletable: { id: string; name: string; reference: string }[] = [];
    for (const product of known) {
      const orderLines = linkedCount.get(product.id) || 0;
      if (orderLines > 0) {
        skipped.push({
          id: product.id,
          name: product.name,
          reason:
            `« ${product.name} » apparaît dans ${orderLines} ligne(s) de commande : ` +
            'désactivez-le (Désactivé) pour le retirer de la boutique sans casser l’historique.',
        });
      } else {
        deletable.push({ id: product.id, name: product.name, reference: product.reference });
      }
    }

    if (deletable.length === 0) {
      if (skipped.length > 0) {
        return NextResponse.json(
          { error: skipped.map((item) => item.reason).join('\n'), skipped },
          { status: skipped.some((item) => item.reason.startsWith('«')) ? 409 : 404 }
        );
      }
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    }

    await prisma.product.deleteMany({ where: { id: { in: deletable.map((product) => product.id) } } });
    invalidateProductsCache();
    invalidateCategoriesCache();

    return NextResponse.json({
      success: true,
      deleted: deletable,
      deletedIds: deletable.map((product) => product.id),
      deletedId: deletable.length === 1 ? deletable[0].id : undefined,
      skipped,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Suppression impossible' }, { status: 500 });
  }
}
