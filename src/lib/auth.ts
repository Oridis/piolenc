import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

/**
 * Signing secret. The development fallback is only usable outside production:
 * verifying or signing with a well-known default would let anyone mint an admin
 * token, so a production deployment without NEXTAUTH_SECRET fails closed.
 */
const DEV_FALLBACK_SECRET = 'dev-only-insecure-jwt-secret';
const configuredSecret = process.env.NEXTAUTH_SECRET;

function resolveSecret(): string | null {
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[auth] NEXTAUTH_SECRET is not set; refusing to sign or verify session tokens.'
    );
    return null;
  }
  return DEV_FALLBACK_SECRET;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function generateToken(payload: TokenPayload): string {
  const secret = resolveSecret();
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required to issue session tokens');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = resolveSecret();
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Session strictement administrative.
 *
 * Les routes /api/admin utilisaient auparavant le test inversé
 * `if (user && user.role === 'CUSTOMER')`, qui laissait passer les requêtes
 * anonymes (user === null) : n'importe quel visiteur pouvait lire les
 * commandes, exporter les données clients ou modifier les statuts. Ce test
 * exige désormais une session et refuse le rôle CUSTOMER.
 */
export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user || user.role === 'CUSTOMER') return null;
  return user;
}

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'COMMERCIAL_ADMIN'
  | 'ORDER_MANAGER'
  | 'LOGISTICS_MANAGER'
  | 'ACCOUNTANT'
  | 'CONTENT_MANAGER';

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ['*'], // Full access to all modules, settings, bank info, secrets, user accounts
  COMMERCIAL_ADMIN: ['orders:read', 'orders:write', 'products:read', 'products:write', 'customers:read', 'discounts:write'],
  ORDER_MANAGER: ['orders:read', 'orders:status', 'customers:read'],
  LOGISTICS_MANAGER: ['shipments:read', 'shipments:write', 'carriers:read', 'carriers:write', 'orders:read'],
  ACCOUNTANT: ['reconciliation:read', 'reconciliation:write', 'orders:read', 'invoices:read', 'exports:read'],
  CONTENT_MANAGER: ['pages:read', 'pages:write', 'products:read', 'products:write', 'reviews:read', 'reviews:write'],
};

export function hasPermission(role: string, requiredPermission: string): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[role as AdminRole] || [];
  return permissions.includes(requiredPermission) || permissions.includes('*');
}
