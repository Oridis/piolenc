import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import { Users, Mail, Phone, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      orders: true,
      addresses: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
              Gestion des Comptes Clients
            </h1>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Visualisez les clients enregistrés, l'historique de leurs commandes et le total dépensé.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Commandes</th>
                  <th className="py-3 px-4">Dépenses cumulées</th>
                  <th className="py-3 px-4">Date inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtleBorder">
                {customers.map((c) => {
                  const totalSpent = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <tr key={c.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-primaryText">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText font-medium">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText">
                        {c.phone || 'Non renseigné'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-primaryText">
                        {c.orders.length}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primaryText">
                        {formatPrice(totalSpent)}
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
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
