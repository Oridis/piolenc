import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminLayout from '@/components/AdminLayout';
import { formatPrice } from '@/lib/pricing';
import {
  CreditCard,
  ShoppingBag,
  Truck,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const totalOrdersCount = await prisma.order.count();
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
      <div className="space-y-8">
        {/* Page Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tableau de bord de pilotage</h1>
            <p className="text-xs text-gray-500 mt-1">
              Vue d'ensemble de l'activité commerciale, financière et logistique de votre négoce de bois.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/virements"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Rapprocher les virements ({pendingTransfers.length})</span>
            </Link>
            <Link
              href="/admin/personnalisation"
              className="bg-forest-800 hover:bg-forest-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>Personnaliser le site</span>
            </Link>
          </div>
        </div>

        {/* Top KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chiffre d'affaires encaissé</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900">{formatPrice(totalRevenue)}</span>
              <span className="text-xs text-emerald-600 block mt-1 font-semibold">
                Sur virements vérifiés
              </span>
            </div>
          </div>

          {/* Pending Transfers */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Virements à vérifier</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-900">{pendingTransfers.length}</span>
              <span className="text-xs text-gray-500 block mt-1">
                Attente de rapprochement bancaire
              </span>
            </div>
          </div>

          {/* Orders to prepare */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Commandes à préparer</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900">{ordersToPrepare.length}</span>
              <span className="text-xs text-gray-500 block mt-1">
                En attente d'expédition transporteur
              </span>
            </div>
          </div>

          {/* Low Stock or Email Alert */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Santé du système</span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900">
                {failedEmailsCount === 0 ? '100%' : `${failedEmailsCount} échec(s)`}
              </span>
              <span className="text-xs text-gray-500 block mt-1">
                {failedEmailsCount === 0 ? 'Toutes notifications délivrées' : 'Emails nécessitant une relance'}
              </span>
            </div>
          </div>
        </div>

        {/* Two Columns: Recent Orders & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Dernières commandes enregistrées</h2>
              <Link href="/admin/commandes" className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center space-x-1">
                <span>Voir toutes les commandes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Paiement</th>
                    <th className="py-3 px-4">Logistique</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {order.orderNumber}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{order.customerFirstName} {order.customerLastName}</span>
                        <span className="block text-[10px] text-gray-400">{order.customerEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-forest-900">
                        {formatPrice(order.totalAmount, order.currency)}
                      </td>
                      <td className="py-3 px-4">
                        {order.paymentStatus === 'PAYMENT_VERIFIED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            Virement validé
                          </span>
                        ) : order.paymentStatus === 'TRANSFER_RECEIVED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Reçu à vérifier
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            En attente virement
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-100 font-medium text-gray-700">
                          {order.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/virements`}
                          className="text-forest-700 hover:text-forest-900 font-bold hover:underline"
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
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3>Surveillance des stocks</h3>
              </div>

              <div className="space-y-3">
                {lowStockProducts.map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                    <span className="font-medium text-gray-800 truncate mr-2">{prod.name}</span>
                    <span className="font-extrabold text-amber-700 shrink-0 bg-amber-50 px-2 py-0.5 rounded">
                      {prod.stock} restants
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-wood-50 p-5 rounded-2xl border border-wood-200/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-wood-800 mb-3">
                Raccourcis indispensables
              </h3>
              <div className="space-y-2 text-xs">
                <Link
                  href="/admin/virements"
                  className="block p-2.5 bg-white rounded-xl border border-wood-200 font-semibold text-gray-800 hover:text-forest-800 hover:border-forest-600 transition"
                >
                  💳 Rapprocher et valider un virement
                </Link>
                <Link
                  href="/admin/livraisons"
                  className="block p-2.5 bg-white rounded-xl border border-wood-200 font-semibold text-gray-800 hover:text-forest-800 hover:border-forest-600 transition"
                >
                  🚚 Ajouter un événement de suivi camion
                </Link>
                <Link
                  href="/admin/personnalisation"
                  className="block p-2.5 bg-white rounded-xl border border-wood-200 font-semibold text-gray-800 hover:text-forest-800 hover:border-forest-600 transition"
                >
                  🎨 Modifier le nom ou les coordonnées bancaires
                </Link>
                <Link
                  href="/api/admin/export/orders"
                  className="block p-2.5 bg-white rounded-xl border border-wood-200 font-semibold text-gray-800 hover:text-forest-800 hover:border-forest-600 transition"
                >
                  📊 Exporter les commandes en CSV
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
