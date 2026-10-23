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
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 text-red-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Utilisateurs Administratifs &amp; Rôles (RBAC)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Contrôle d'accès strict par métier : Super Admin, Commercial, Logistique, Comptable, Gestionnaire de contenu.
          </p>
        </div>

        {/* Roles & Permissions Reference Table */}
        <div className="bg-wood-50 p-5 rounded-2xl border border-wood-200 text-xs">
          <h3 className="font-extrabold text-wood-950 uppercase tracking-wider mb-2">
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
              <div key={r.role} className="bg-white p-3 rounded-xl border border-wood-200">
                <span className="font-bold text-forest-900 block font-mono text-[11px]">{r.role}</span>
                <p className="text-[11px] text-gray-600 mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Rôle attribué</th>
                  <th className="py-3 px-4">Permissions effectives</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const permissions = ROLE_PERMISSIONS[u.role as keyof typeof ROLE_PERMISSIONS] || [];

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 font-mono">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="font-mono text-[11px]">
                          {u.role === 'SUPER_ADMIN' ? 'Toutes les permissions (*)' : permissions.join(', ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
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
