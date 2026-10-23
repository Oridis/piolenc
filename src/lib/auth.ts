import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'allo_maison_production_secure_jwt_secret_firewood_2026_xyz';

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
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
