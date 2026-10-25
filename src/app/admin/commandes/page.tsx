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
  ExternalLink,
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

  const getFulfillmentLabel = (status: string) => {
    switch (status) {
      case 'ORDER_CREATED': return 'Commande reçue';
      case 'VALIDATED': return 'Validée';
      case 'IN_PREPARATION': return 'En préparation';
      case 'SHIPPED': return 'Expédiée';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Gestion des Commandes
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Pilotez l'ensemble des commandes, les statuts de validation et les flux logistiques.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/api/admin/export/orders"
              className="px-3 py-2 bg-white border border-subtleBorder text-primaryText hover:bg-beige-50 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle"
            >
              <Download className="w-4 h-4 text-secondaryText" />
              <span>Exporter CSV</span>
            </a>
            <button
              onClick={loadOrders}
              className="p-2 bg-white border border-subtleBorder rounded-lg hover:bg-beige-50 text-secondaryText hover:text-primaryText transition shadow-subtle"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle flex flex-wrap gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-secondaryText absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher réf, client, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-subtleBorder rounded-lg text-xs text-primaryText focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-subtleBorder rounded-lg bg-white text-xs font-medium text-primaryText focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              <option value="">Tous statuts paiement</option>
              <option value="PENDING_TRANSFER">En attente virement</option>
              <option value="PAYMENT_VERIFIED">Paiement vérifié</option>
              <option value="REFUNDED">Remboursé</option>
            </select>

            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="px-3 py-2 border border-subtleBorder rounded-lg bg-white text-xs font-medium text-primaryText focus:ring-2 focus:ring-forest-600 focus:outline-none"
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
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-secondaryText">Chargement des commandes...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-secondaryText">Aucune commande trouvée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
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
                <tbody className="divide-y divide-subtleBorder">
                  {orders.map((order) => {
                    const isPaid = order.paymentStatus === 'PAYMENT_VERIFIED';

                    return (
                      <tr key={order.id} className="hover:bg-beige-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-primaryText">
                          {order.orderNumber}
                          <span className="block text-[10px] text-secondaryText font-normal">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-primaryText">{order.customerFirstName} {order.customerLastName}</span>
                          <span className="block text-[10px] text-secondaryText">{order.customerEmail}</span>
                        </td>
                        <td className="py-3 px-4 text-secondaryText max-w-[200px] truncate">
                          {order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-bold text-primaryText">
                          {formatPrice(order.totalAmount, order.currency)}
                        </td>
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <span className="badge-success">
                              Virement vérifié
                            </span>
                          ) : (
                            <span className="badge-warning">
                              En attente virement
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge-neutral">
                            {getFulfillmentLabel(order.fulfillmentStatus)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {order.fulfillmentStatus === 'ORDER_CREATED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'VALIDATED')}
                              disabled={actionLoading === order.id}
                              className="px-2.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-semibold text-[11px] shadow-subtle transition"
                              title="Valider la commande"
                            >
                              Valider
                            </button>
                          )}
                          {order.fulfillmentStatus === 'VALIDATED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'IN_PREPARATION')}
                              disabled={actionLoading === order.id}
                              className="px-2.5 py-1 bg-forest-600 hover:bg-forest-700 text-white rounded-lg font-semibold text-[11px] shadow-subtle transition"
                              title="Mettre en préparation"
                            >
                              En préparation
                            </button>
                          )}
                          <Link
                            href={`/suivi/${order.secureToken}`}
                            target="_blank"
                            className="px-2.5 py-1 border border-subtleBorder hover:bg-beige-100 text-primaryText rounded-lg font-medium text-[11px] inline-flex items-center space-x-1 transition"
                            title="Consulter le suivi public client"
                          >
                            <span>Suivi</span>
                            <ExternalLink className="w-3 h-3 text-secondaryText" />
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
