import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import { formatPrice } from '@/lib/pricing';
import {
  CreditCard,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Mail,
  Truck,
  Paintbrush,
  FileSpreadsheet,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const pendingTransfers = await prisma.order.findMany({
    where: { paymentStatus: 'PENDING_TRANSFER' },
    orderBy: { createdAt: 'desc' },
  });
  const ordersToPrepare = await prisma.order.findMany({
    where: { fulfillmentStatus: { in: ['VALIDATED', 'IN_PREPARATION'] } },
    orderBy: { createdAt: 'desc' },
  });
  const completedOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAYMENT_VERIFIED' },
  });
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lte: 30 } },
    take: 5,
  });

  const recentOrders = await prisma.order.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: { items: true, deliveryShipment: true },
  });

  const failedEmailsCount = await prisma.emailLog.count({
    where: { status: 'FAILED' },
  });

  return (
    <AdminLayout>
      <div className="space-y-7 font-sans">
        {/* Page Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-poppins font-semibold text-2xl text-primaryText tracking-tight">Tableau de bord de gestion</h1>
            <p className="text-xs text-secondaryText mt-0.5">
              Vue synthétique de l&apos;activité commerciale, des virements à valider et des expéditions de palettes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/virements"
              className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Rapprocher les virements ({pendingTransfers.length})</span>
            </Link>
            <Link
              href="/admin/personnalisation"
              className="btn-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
            >
              <Paintbrush className="w-3.5 h-3.5 text-forest" />
              <span>Personnaliser le site</span>
            </Link>
          </div>
        </div>

        {/* Top KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-secondaryText uppercase tracking-wider">Chiffre d&apos;affaires encaissé</span>
              <div className="w-8 h-8 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-poppins font-semibold text-2xl text-primaryText">{formatPrice(totalRevenue)}</span>
              <span className="text-[11px] text-statusSuccess block mt-0.5 font-medium">
                Sur virements vérifiés
              </span>
            </div>
          </div>

          {/* Pending Transfers */}
          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-secondaryText uppercase tracking-wider">Virements à vérifier</span>
              <div className="w-8 h-8 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-statusWarning">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-poppins font-semibold text-2xl text-primaryText">{pendingTransfers.length}</span>
              <span className="text-[11px] text-secondaryText block mt-0.5">
                En attente de rapprochement bancaire
              </span>
            </div>
          </div>

          {/* Orders to prepare */}
          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-secondaryText uppercase tracking-wider">Commandes à préparer</span>
              <div className="w-8 h-8 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-poppins font-semibold text-2xl text-primaryText">{ordersToPrepare.length}</span>
              <span className="text-[11px] text-secondaryText block mt-0.5">
                En attente d&apos;expédition transporteur
              </span>
            </div>
          </div>

          {/* Low Stock or Email Alert */}
          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-secondaryText uppercase tracking-wider">File d&apos;emails</span>
              <div className="w-8 h-8 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-secondaryText">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-poppins font-semibold text-2xl text-primaryText">
                {failedEmailsCount === 0 ? 'Opérationnel' : `${failedEmailsCount} échec(s)`}
              </span>
              <span className="text-[11px] text-secondaryText block mt-0.5">
                {failedEmailsCount === 0 ? 'Toutes notifications délivrées' : 'Emails nécessitant une relance'}
              </span>
            </div>
          </div>
        </div>

        {/* Two Columns: Recent Orders & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Recent Orders (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-subtleBorder flex items-center justify-between">
              <h2 className="font-poppins font-medium text-sm text-primaryText">Dernières commandes enregistrées</h2>
              <Link href="/admin/commandes" className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1">
                <span>Voir toutes les commandes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory text-secondaryText uppercase tracking-wider text-[10px] font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Commande</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Montant</th>
                    <th className="py-2.5 px-4">Paiement</th>
                    <th className="py-2.5 px-4">Statut</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtleBorder text-primaryText">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-ivory/50 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        {order.orderNumber}
                        <span className="block text-[10px] text-secondaryText font-normal">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-primaryText">{order.customerFirstName} {order.customerLastName}</span>
                        <span className="block text-[10px] text-secondaryText">{order.customerEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-primaryText">
                        {formatPrice(order.totalAmount, order.currency)}
                      </td>
                      <td className="py-3 px-4">
                        {order.paymentStatus === 'PAYMENT_VERIFIED' ? (
                          <span className="badge-success text-[10px]">
                            Virement validé
                          </span>
                        ) : order.paymentStatus === 'TRANSFER_RECEIVED' ? (
                          <span className="badge-warning text-[10px]">
                            Reçu à vérifier
                          </span>
                        ) : (
                          <span className="badge-neutral text-[10px]">
                            En attente virement
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge-neutral text-[10px]">
                          {order.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/virements`}
                          className="text-forest hover:underline font-medium"
                        >
                          Gérer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Low stocks & Action shortcuts (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Low Stocks Alert */}
            <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle space-y-3">
              <div className="flex items-center space-x-2 text-sm font-medium font-poppins text-primaryText">
                <AlertTriangle className="w-4 h-4 text-statusWarning" />
                <h3>Surveillance des stocks</h3>
              </div>

              <div className="space-y-2.5">
                {lowStockProducts.map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center text-xs pb-2 border-b border-subtleBorder last:border-b-0 last:pb-0">
                    <span className="text-primaryText truncate mr-2">{prod.name}</span>
                    <span className="badge-warning text-[10px] shrink-0">
                      {prod.stock} restants
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle space-y-3">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-secondaryText">
                Actions rapides
              </h3>
              <div className="space-y-2 text-xs">
                <Link
                  href="/admin/virements"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-subtleBorder hover:bg-ivory text-primaryText transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-forest" />
                  <span>Rapprocher et valider un virement</span>
                </Link>
                <Link
                  href="/admin/livraisons"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-subtleBorder hover:bg-ivory text-primaryText transition-colors"
                >
                  <Truck className="w-4 h-4 text-forest" />
                  <span>Ajouter un événement logistique</span>
                </Link>
                <Link
                  href="/admin/personnalisation"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-subtleBorder hover:bg-ivory text-primaryText transition-colors"
                >
                  <Paintbrush className="w-4 h-4 text-forest" />
                  <span>Modifier le nom ou coordonnées bancaires</span>
                </Link>
                <Link
                  href="/api/admin/export/orders"
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-subtleBorder hover:bg-ivory text-primaryText transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-forest" />
                  <span>Exporter les commandes en CSV</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
