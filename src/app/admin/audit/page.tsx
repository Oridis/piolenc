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
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
              Journal d'Audit &amp; Traçabilité des Opérations Sensibles
            </h1>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Chaque modification de paramètres, validation de paiement ou changement de statut est immuablement tracé.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Opérateur</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Ressource</th>
                  <th className="py-3 px-4">Détails enregistrés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtleBorder">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-secondaryText">
                      Aucune action enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-3.5 px-4 font-mono text-secondaryText text-[11px] whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-primaryText">
                        {l.user ? `${l.user.firstName} ${l.user.lastName}` : 'Système'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="badge-neutral font-mono text-[10px]">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-primaryText">
                        {l.resourceType} {l.resourceId ? `#${l.resourceId.slice(0, 8)}...` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-secondaryText max-w-md truncate">
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
