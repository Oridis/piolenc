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
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Gestion des Comptes Clients
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visualisez les clients enregistrés, l'historique de leurs commandes et le total dépensé.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Commandes</th>
                  <th className="py-3 px-4">Dépenses cumulées</th>
                  <th className="py-3 px-4">Date inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const totalSpent = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {c.phone || 'Non renseigné'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {c.orders.length}
                      </td>
                      <td className="py-3.5 px-4 font-black text-forest-900">
                        {formatPrice(totalSpent)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
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
