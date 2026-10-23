'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { formatPrice } from '@/lib/pricing';
import {
  ShoppingBag,
  Search,
  Download,
  Filter,
  CheckCircle,
  Truck,
  Eye,
  RefreshCw,
  Clock,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (paymentFilter) query.set('paymentStatus', paymentFilter);
      if (fulfillmentFilter) query.set('fulfillmentStatus', fulfillmentFilter);

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search, paymentFilter, fulfillmentFilter]);

  const handleUpdateStatus = async (orderId: string, newFulfillment: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, fulfillmentStatus: newFulfillment }),
      });
      if (res.ok) {
        loadOrders();
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur mise à jour');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Gestion des Commandes
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pilotez l'ensemble des commandes, les statuts de validation et les flux logistiques.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/api/admin/export/orders"
              className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </a>
            <button
              onClick={loadOrders}
              className="p-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher réf, client, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none"
            >
              <option value="">Tous statuts paiement</option>
              <option value="PENDING_TRANSFER">En attente virement</option>
              <option value="PAYMENT_VERIFIED">Paiement vérifié</option>
              <option value="REFUNDED">Remboursé</option>
            </select>

            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none"
            >
              <option value="">Tous statuts expédition</option>
              <option value="ORDER_CREATED">Commande reçue</option>
              <option value="VALIDATED">Validée</option>
              <option value="IN_PREPARATION">En préparation</option>
              <option value="SHIPPED">Expédiée</option>
              <option value="DELIVERED">Livrée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Chargement des commandes...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">Aucune commande trouvée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Articles</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Paiement</th>
                    <th className="py-3 px-4">Logistique</th>
                    <th className="py-3 px-4 text-right">Actions rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const isPaid = order.paymentStatus === 'PAYMENT_VERIFIED';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {order.orderNumber}
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-900">{order.customerFirstName} {order.customerLastName}</span>
                          <span className="block text-[10px] text-gray-400">{order.customerEmail}</span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 max-w-[200px] truncate">
                          {order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </td>
                        <td className="py-3.5 px-4 font-black text-forest-900">
                          {formatPrice(order.totalAmount, order.currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              Virement vérifié
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              En attente virement
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-800">
                            {order.fulfillmentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {order.fulfillmentStatus === 'ORDER_CREATED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'VALIDATED')}
                              disabled={actionLoading === order.id}
                              className="px-2.5 py-1 bg-forest-800 hover:bg-forest-700 text-white rounded-lg font-bold text-[11px] shadow-sm"
                              title="Valider la commande et envoyer l'Email 4"
                            >
                              Valider
                            </button>
                          )}
                          {order.fulfillmentStatus === 'VALIDATED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'IN_PREPARATION')}
                              disabled={actionLoading === order.id}
                              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-bold text-[11px] shadow-sm"
                              title="Mettre en préparation et envoyer l'Email 5"
                            >
                              En préparation
                            </button>
                          )}
                          <Link
                            href={`/suivi/${order.secureToken}`}
                            target="_blank"
                            className="px-2.5 py-1 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold text-[11px]"
                            title="Voir le suivi public client"
                          >
                            Suivi
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
