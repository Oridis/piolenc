import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import { ShieldCheck, UserCheck, Key, Lock } from 'lucide-react';
import { ROLE_PERMISSIONS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: { not: 'CUSTOMER' } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
              Utilisateurs Administratifs &amp; Rôles (RBAC)
            </h1>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Contrôle d'accès strict par métier : Direction, Commercial, Logistique, Comptable, Gestionnaire de contenu.
          </p>
        </div>

        {/* Roles & Permissions Reference Table */}
        <div className="bg-beige-50 p-5 rounded-xl border border-subtleBorder text-xs">
          <h3 className="font-semibold text-primaryText uppercase tracking-wider mb-2">
            Matrice des Droits et Périmètres d'Action
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { role: 'SUPER_ADMIN', desc: 'Accès absolu à tous les modules, secrets, paramètres de marque et comptes.' },
              { role: 'COMMERCIAL_ADMIN', desc: 'Catalogue produits, prix, codes promo, fiches clients, consultation commandes.' },
              { role: 'ORDER_MANAGER', desc: 'Gestion du cycle de vie des commandes, validation et passage en préparation.' },
              { role: 'LOGISTICS_MANAGER', desc: 'Gestion des transporteurs, numéros de suivi colis, jalons et gestion des retards.' },
              { role: 'ACCOUNTANT', desc: 'Rapprochement des virements bancaires, certification du crédit, factures pro forma.' },
              { role: 'CONTENT_MANAGER', desc: 'Pages CMS, guides techniques, avis clients et fiches produits.' },
            ].map((r) => (
              <div key={r.role} className="bg-white p-3 rounded-lg border border-subtleBorder shadow-subtle">
                <span className="font-semibold text-forest-800 block font-mono text-[11px]">{r.role}</span>
                <p className="text-[11px] text-secondaryText mt-1 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Users Table */}
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                <tr>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Rôle attribué</th>
                  <th className="py-3 px-4">Permissions effectives</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtleBorder">
                {users.map((u) => {
                  const permissions = ROLE_PERMISSIONS[u.role as keyof typeof ROLE_PERMISSIONS] || [];

                  return (
                    <tr key={u.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-primaryText">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText font-mono">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="badge-warning font-mono">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText">
                        <span className="font-mono text-[11px]">
                          {u.role === 'SUPER_ADMIN' ? 'Toutes les permissions (*)' : permissions.join(', ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="badge-success">
                          Actif
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
