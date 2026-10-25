'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Truck,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  Send,
  RefreshCw,
  X,
} from 'lucide-react';

export default function AdminLogisticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Form states for adding logistics milestone
  const [status, setStatus] = useState('Prise en charge plateforme de distribution');
  const [location, setLocation] = useState('Hub Régional Est (54)');
  const [sourceType, setSourceType] = useState('WAREHOUSE_CONFIRMED');
  const [description, setDescription] = useState('Palette chargée sur semi-remorque en partance.');
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState('SHIPPED');
  const [newEstimatedDeliveryDate, setNewEstimatedDeliveryDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierName, setCarrierName] = useState('Geodis Calberson');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (selectedOrder) {
          const updated = data.orders.find((o: any) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEventModal = (order: any) => {
    setSelectedOrder(order);
    const shipment = order.deliveryShipment;
    setTrackingNumber(shipment?.trackingNumber || `EXP-${order.orderNumber}`);
    setCarrierName(shipment?.carrier?.name || 'Geodis Calberson');
    setNewFulfillmentStatus(order.fulfillmentStatus === 'ORDER_CREATED' ? 'SHIPPED' : order.fulfillmentStatus);
    if (shipment?.estimatedDeliveryDate) {
      setNewEstimatedDeliveryDate(new Date(shipment.estimatedDeliveryDate).toISOString().split('T')[0]);
    } else {
      const d = new Date(Date.now() + 4 * 86400000);
      setNewEstimatedDeliveryDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/tracking/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status,
          sourceType,
          location,
          description,
          newFulfillmentStatus,
          newEstimatedDeliveryDate,
          trackingNumber,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Événement logistique enregistré et notification envoyée au client.`);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
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
                <Truck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Gestion des Livraisons &amp; Suivi Transporteur
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Pilotez les expéditions palettes, ajoutez des jalons certifiés et notifiez les clients en direct.
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-subtleBorder rounded-lg text-xs font-semibold text-primaryText hover:bg-beige-50 transition shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-900 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Orders Shipments List */}
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-subtleBorder bg-beige-50 flex justify-between items-center text-xs font-semibold text-primaryText">
            <span>Expéditions actives</span>
            <span className="text-secondaryText">Total : {orders.length}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-secondaryText">Chargement des données logistiques...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-beige-50/70 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Client / Ville</th>
                    <th className="py-3 px-4">Transporteur</th>
                    <th className="py-3 px-4">N° Suivi</th>
                    <th className="py-3 px-4">Étape actuelle</th>
                    <th className="py-3 px-4">Estimation</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtleBorder">
                  {orders.map((order) => {
                    const shipment = order.deliveryShipment;
                    const shippingCity = JSON.parse(order.shippingAddress || '{}').city || 'France';

                    return (
                      <tr key={order.id} className="hover:bg-beige-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-primaryText">
                          {order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-primaryText">{order.customerFirstName} {order.customerLastName}</span>
                          <span className="block text-[10px] text-secondaryText">{shippingCity}</span>
                        </td>
                        <td className="py-3.5 px-4 text-primaryText font-medium">
                          {shipment?.carrier?.name || 'Geodis Calberson'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-secondaryText">
                          {shipment?.trackingNumber || 'En attente'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="badge-neutral">
                            {order.fulfillmentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-secondaryText">
                          {shipment?.estimatedDeliveryDate
                            ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('fr-FR')
                            : 'À déterminer'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openEventModal(order)}
                            className="btn-primary py-1.5 px-3 text-xs"
                          >
                            Mettre à jour
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for adding tracking milestone */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
            <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-elevated border border-subtleBorder z-10 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start pb-3 border-b border-subtleBorder">
                <div>
                  <h3 className="text-base font-bold font-heading text-primaryText">
                    Jalon de Livraison : {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-secondaryText">
                    Client : {selectedOrder.customerFirstName} {selectedOrder.customerLastName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg text-secondaryText hover:text-primaryText hover:bg-beige-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMilestone} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Transporteur :</label>
                    <input
                      type="text"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">N° de suivi colis :</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="input-field font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Nouveau statut global :</label>
                    <select
                      value={newFulfillmentStatus}
                      onChange={(e) => setNewFulfillmentStatus(e.target.value)}
                      className="input-field bg-white font-medium"
                    >
                      <option value="IN_PREPARATION">En préparation</option>
                      <option value="SHIPPED">Expédiée</option>
                      <option value="IN_TRANSIT">En cours d'acheminement</option>
                      <option value="OUT_FOR_DELIVERY">En cours de livraison (Chauffeur)</option>
                      <option value="DELIVERY_DELAYED">Livraison retardée</option>
                      <option value="DELIVERED">Livrée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Date estimée de livraison :</label>
                    <input
                      type="date"
                      value={newEstimatedDeliveryDate}
                      onChange={(e) => setNewEstimatedDeliveryDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Source de l'information :</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="input-field bg-white font-medium"
                  >
                    <option value="CARRIER_API">Position réelle communiquée par le transporteur (API)</option>
                    <option value="WAREHOUSE_CONFIRMED">Dernière étape logistique confirmée (Dépôt)</option>
                    <option value="CALCULATED_ESTIMATE">Estimation calculée automatiquement</option>
                    <option value="MANUAL_ADMIN">Information saisie manuellement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Intitulé du jalon :</label>
                  <input
                    type="text"
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Localisation de l'étape :</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Plateforme Hub Régional (69)"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Détails / Message client :</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Enregistrement...' : 'Enregistrer et notifier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
