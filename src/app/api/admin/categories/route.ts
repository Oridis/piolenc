import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { invalidateCategoriesCache } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * Gestion des catégories du catalogue depuis le backoffice.
 * Une catégorie encore utilisée par des produits ne peut pas être supprimée :
 * la relation produit → catégorie est obligatoire en base.
 */

const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const toOrder = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

function slugifyName(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return base || 'categorie';
}

async function freeSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 50; i += 1) {
    const existing = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base.slice(0, 54)}-${i}`;
  }
  return `${base.slice(0, 48)}-${Date.now().toString(36)}`;
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
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ categories });
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
    if (!name) return NextResponse.json({ error: 'Le nom de la catégorie est obligatoire' }, { status: 400 });

    const slug = await freeSlug(toText(body.slug) ? slugifyName(toText(body.slug)) : slugifyName(name));

    const created = await prisma.category.create({
      data: {
        name,
        slug,
        description: toText(body.description),
        imageUrl: toText(body.imageUrl) || null,
        displayOrder: toOrder(body.displayOrder, 0),
        isActive: body.isActive !== false,
      },
      include: { _count: { select: { products: true } } },
    });

    invalidateCategoriesCache();
    return NextResponse.json({ success: true, category: created }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Une catégorie porte déjà cet identifiant d’URL' }, { status: 409 });
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
    if (!id) return NextResponse.json({ error: 'Catégorie non précisée' }, { status: 400 });

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });

    const data: Record<string, any> = {};
    if ('name' in body) {
      const name = toText(body.name);
      if (!name) return NextResponse.json({ error: 'Le nom de la catégorie est obligatoire' }, { status: 400 });
      data.name = name;
    }
    if ('slug' in body && toText(body.slug)) data.slug = await freeSlug(slugifyName(toText(body.slug)), id);
    if ('description' in body) data.description = toText(body.description);
    if ('imageUrl' in body) data.imageUrl = toText(body.imageUrl) || null;
    if ('displayOrder' in body) data.displayOrder = toOrder(body.displayOrder, existing.displayOrder);
    if ('isActive' in body) data.isActive = body.isActive !== false;

    const updated = await prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });

    invalidateCategoriesCache();
    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Une catégorie porte déjà cet identifiant d’URL' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Modification impossible' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireStaff('products:write');
  if (!user) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || toText((await request.json().catch(() => ({}))).id);
    if (!id) return NextResponse.json({ error: 'Catégorie non précisée' }, { status: 400 });

    const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        {
          error:
            `« ${existing.name} » regroupe encore ${productCount} produit(s) : ` +
            'déplacez-les vers une autre catégorie (ou supprimez-les) avant de supprimer celle-ci.',
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });
    invalidateCategoriesCache();
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Suppression impossible' }, { status: 500 });
  }
}
