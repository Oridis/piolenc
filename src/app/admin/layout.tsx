import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Roles allowed into the backoffice. `getCurrentUser()` only returns active
 * accounts, so an inactive admin is rejected as well.
 */
const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'COMMERCIAL_ADMIN',
  'ORDER_MANAGER',
  'LOGISTICS_MANAGER',
  'ACCOUNTANT',
  'CONTENT_MANAGER',
];

/**
 * Auth gate for the whole `/admin` segment. Several backoffice pages are client
 * components that read their data from the admin APIs, so the check has to live
 * in a server layout: it runs before any child page renders.
 */
export default async function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/connexion');
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    redirect('/mon-compte');
  }

  return <>{children}</>;
}
