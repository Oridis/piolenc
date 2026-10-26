import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Gestion des comptes de l'équipe (backoffice) depuis /admin/utilisateurs.
 *
 * Périmètre : les comptes administratifs. Les comptes clients ne sont pas gérés
 * ici (ils appartiennent à /admin/clients), ce qui évite de supprimer par erreur
 * un client depuis la page « Équipe & Permissions ».
 *
 * Garde-fous appliqués côté serveur :
 *   - seul un rôle disposant de `users:write` (SUPER_ADMIN) peut agir ;
 *   - on ne peut ni se supprimer, ni se désactiver, ni retirer son propre rôle ;
 *   - le dernier SUPER_ADMIN actif ne peut être ni supprimé, ni désactivé,
 *     ni rétrogradé : le backoffice resterait sans administrateur ;
 *   - un compte rattaché à des commandes n'est pas supprimé (désactivation
 *     recommandée) pour ne pas perdre l'historique ;
 *   - chaque création / modification / suppression est tracée dans AuditLog
 *     (sans jamais y écrire de mot de passe).
 */

const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'COMMERCIAL_ADMIN',
  'ORDER_MANAGER',
  'LOGISTICS_MANAGER',
  'ACCOUNTANT',
  'CONTENT_MANAGER',
] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Direction',
  COMMERCIAL_ADMIN: 'Commercial',
  ORDER_MANAGER: 'Commandes',
  LOGISTICS_MANAGER: 'Logistique',
  ACCOUNTANT: 'Comptabilité',
  CONTENT_MANAGER: 'Contenu',
};

const MIN_PASSWORD_LENGTH = 8;

const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

/** Sélection publique : jamais de passwordHash dans une réponse. */
const USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'users:write')) return null;
  return user;
}

async function activeSuperAdmins(exceptId?: string) {
  return prisma.user.count({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
  });
}

async function audit(
  actorId: string | null,
  action: string,
  resourceId: string | null,
  details: Record<string, unknown>
) {
  await prisma.auditLog
    .create({
      data: {
        userId: actorId,
        action,
        resourceType: 'User',
        resourceId,
        details: JSON.stringify(details),
      },
    })
    // Le journal ne doit jamais faire échouer l'action métier demandée.
    .catch(() => {});
}

export async function GET(request: Request) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const role = toText(searchParams.get('role'));
    const search = toText(searchParams.get('search'));

    const where: Record<string, unknown> = { role: { not: 'CUSTOMER' } };
    if (role && role !== 'ALL') where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: where as any,
      select: { ...USER_FIELDS, _count: { select: { orders: true } } },
      orderBy: [{ createdAt: 'asc' }],
    });

    return NextResponse.json({
      users: users.map((u) => ({ ...u, roleLabel: ROLE_LABELS[u.role] || u.role })),
      roles: ADMIN_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] || r })),
      currentUserId: actor.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const body = await request.json();
    const email = toText(body.email).toLowerCase();
    const firstName = toText(body.firstName);
    const lastName = toText(body.lastName);
    const phone = toText(body.phone);
    const role = toText(body.role, 'CONTENT_MANAGER');
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Le prénom et le nom sont obligatoires' }, { status: 400 });
    }
    if (!ADMIN_ROLES.includes(role as any)) {
      return NextResponse.json({ error: 'Rôle inconnu' }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` },
        { status: 400 }
      );
    }

    const created = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: phone || null,
        role,
        isActive: body.isActive !== false,
        passwordHash: await hashPassword(password),
      },
      select: USER_FIELDS,
    });

    await audit(actor.id, 'USER_CREATED', created.id, {
      email: created.email,
      role: created.role,
      isActive: created.isActive,
    });

    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte utilise déjà cette adresse e-mail' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Création impossible' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const body = await request.json();
    const id = toText(body.id);
    if (!id) return NextResponse.json({ error: 'Compte non précisé' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    if (existing.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Ce point d’entrée gère les comptes de l’équipe : les comptes clients se modifient depuis la page Clients.' },
        { status: 409 }
      );
    }

    const data: Record<string, any> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    const track = (field: string, from: unknown, to: unknown) => {
      if (from !== to) changes[field] = { from, to };
    };

    if ('email' in body) {
      const email = toText(body.email).toLowerCase();
      if (!isEmail(email)) return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 });
      if (email !== existing.email) {
        data.email = email;
        track('email', existing.email, email);
      }
    }

    if ('firstName' in body) {
      const firstName = toText(body.firstName);
      if (!firstName) return NextResponse.json({ error: 'Le prénom est obligatoire' }, { status: 400 });
      data.firstName = firstName;
      track('firstName', existing.firstName, firstName);
    }

    if ('lastName' in body) {
      const lastName = toText(body.lastName);
      if (!lastName) return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
      data.lastName = lastName;
      track('lastName', existing.lastName, lastName);
    }

    if ('phone' in body) {
      const phone = toText(body.phone);
      data.phone = phone || null;
      track('phone', existing.phone, phone || null);
    }

    const nextRole = 'role' in body ? toText(body.role) : existing.role;
    if (nextRole !== existing.role) {
      if (!ADMIN_ROLES.includes(nextRole as any)) {
        return NextResponse.json({ error: 'Rôle inconnu' }, { status: 400 });
      }
      // Retirer le dernier accès de direction rendrait le backoffice ingérable.
      if (existing.role === 'SUPER_ADMIN' && (await activeSuperAdmins(existing.id)) === 0) {
        return NextResponse.json(
          { error: 'Ce compte est le dernier accès de direction actif : attribuez d’abord ce rôle à un autre compte.' },
          { status: 409 }
        );
      }
      if (id === actor.id && existing.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas retirer votre propre rôle de direction.' },
          { status: 409 }
        );
      }
      data.role = nextRole;
      track('role', existing.role, nextRole);
    }

    if ('isActive' in body) {
      const isActive = body.isActive !== false;
      if (isActive !== existing.isActive) {
        if (id === actor.id && isActive === false) {
          return NextResponse.json(
            { error: 'Vous ne pouvez pas désactiver votre propre compte.' },
            { status: 409 }
          );
        }
        if (
          existing.role === 'SUPER_ADMIN' &&
          isActive === false &&
          (await activeSuperAdmins(existing.id)) === 0
        ) {
          return NextResponse.json(
            { error: 'Dernier accès de direction actif : activez d’abord un autre compte de direction.' },
            { status: 409 }
          );
        }
        data.isActive = isActive;
        track('isActive', existing.isActive, isActive);
      }
    }

    if ('password' in body && typeof body.password === 'string' && body.password !== '') {
      if (body.password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` },
          { status: 400 }
        );
      }
      data.passwordHash = await hashPassword(body.password);
      changes.password = { from: '(secret)', to: '(modifié)' };
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: true, user: existing, unchanged: true });
    }

    const updated = await prisma.user.update({ where: { id }, data, select: USER_FIELDS });

    await audit(actor.id, 'USER_UPDATED', id, changes);

    return NextResponse.json({ success: true, user: updated, changes });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte utilise déjà cette adresse e-mail' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Modification impossible' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || toText((await request.json().catch(() => ({}))).id);
    if (!id) return NextResponse.json({ error: 'Compte non précisé' }, { status: 400 });

    if (id === actor.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte.' },
        { status: 409 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!existing) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });

    if (existing.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Ce point d’entrée gère les comptes de l’équipe : les comptes clients se suppriment depuis la page Clients.' },
        { status: 409 }
      );
    }

    if (existing.role === 'SUPER_ADMIN' && (await activeSuperAdmins(existing.id)) === 0) {
      return NextResponse.json(
        { error: 'Dernier accès de direction actif : ce compte ne peut pas être supprimé.' },
        { status: 409 }
      );
    }

    const orderCount = await prisma.order.count({ where: { userId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error:
            `${existing.email} est rattaché à ${orderCount} commande(s) : supprimez-le effacerait le lien ` +
            'avec cet historique. Désactivez le compte à la place.',
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id } });
    await audit(actor.id, 'USER_DELETED', id, { email: existing.email, role: existing.role });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Suppression impossible' }, { status: 500 });
  }
}
