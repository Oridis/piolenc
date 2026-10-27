import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  generateToken,
  getAdminUser,
  hashPassword,
  verifyPassword,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Compte de la personne connectée au backoffice.
 *
 * La route /api/admin/users ne laisse agir que les rôles disposant de
 * `users:write` (SUPER_ADMIN) : un membre de l'équipe ne pouvait donc pas
 * changer son propre mot de passe. Ici chaque administrateur actif gère
 * ses propres identifiants, sans pouvoir toucher au rôle ni au statut.
 *
 * Garde-fous :
 *   - session administrative obligatoire (un client n'a rien à faire ici) ;
 *   - le mot de passe actuel est exigé avant toute modification d'e-mail ou
 *     de mot de passe, pour qu'un simple cookie volé ne suffise pas ;
 *   - l'e-mail reste unique (contrainte en base) ;
 *   - le mot de passe n'est jamais journalisé, seulement son changement.
 */

const MIN_PASSWORD_LENGTH = 8;

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const PUBLIC_FIELDS = {
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

async function audit(actorId: string, action: string, details: Record<string, unknown>) {
  await prisma.auditLog
    .create({
      data: {
        userId: actorId,
        action,
        resourceType: 'User',
        resourceId: actorId,
        details: JSON.stringify(details),
      },
    })
    // Le journal ne doit jamais faire échouer la modification demandée.
    .catch(() => {});
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: PUBLIC_FIELDS,
  });
  if (!profile) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });

  return NextResponse.json({ user: profile });
}

export async function PUT(request: Request) {
  const session = await getAdminUser();
  if (!session) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

  try {
    const body = await request.json();
    const existing = await prisma.user.findUnique({ where: { id: session.id } });
    if (!existing) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const nextEmail =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : existing.email;
    const nextPassword = typeof body.password === 'string' ? body.password : '';

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Saisissez votre mot de passe actuel pour confirmer la modification.' },
        { status: 400 }
      );
    }

    const passwordOk = await verifyPassword(currentPassword, existing.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
    }

    if (!isEmail(nextEmail)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 });
    }

    if (nextPassword && nextPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` },
        { status: 400 }
      );
    }

    if (nextEmail === existing.email && !nextPassword) {
      return NextResponse.json({ user: existing, unchanged: true });
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const data: Record<string, unknown> = {};

    if (nextEmail !== existing.email) {
      data.email = nextEmail;
      changes.email = { from: existing.email, to: nextEmail };
    }

    if (nextPassword) {
      data.passwordHash = await hashPassword(nextPassword);
      changes.password = { from: '(secret)', to: '(modifié)' };
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data,
      select: PUBLIC_FIELDS,
    });

    await audit(session.id, 'USER_SELF_UPDATED', changes);

    const response = NextResponse.json({ success: true, user: updated, changes });

    // Le jeton porte l'e-mail : on le réémet pour que la session reflète la
    // nouvelle adresse sans forcer une reconnexion.
    if (changes.email) {
      const token = generateToken({
        userId: updated.id,
        email: updated.email,
        role: updated.role,
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      const cookieStore = await cookies();
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un compte utilise déjà cette adresse e-mail' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Modification impossible' },
      { status: 500 }
    );
  }
}
