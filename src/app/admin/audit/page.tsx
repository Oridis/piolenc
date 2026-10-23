import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import { FileText, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-100 text-gray-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Journal d'Audit &amp; Traçabilité des Opérations Sensibles
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Chaque modification de paramètres, validation de paiement ou changement de statut est immuablement tracé.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Opérateur</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Ressource</th>
                  <th className="py-3 px-4">Détails enregistrés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Aucune action enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px] whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {l.user ? `${l.user.firstName} ${l.user.lastName}` : 'Système'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-800">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {l.resourceType} {l.resourceId ? `#${l.resourceId.slice(0, 8)}...` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 max-w-md truncate">
                        {l.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
