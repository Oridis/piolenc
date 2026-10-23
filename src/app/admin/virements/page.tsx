'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { formatPrice } from '@/lib/pricing';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Send,
  RefreshCw,
} from 'lucide-react';

export default function WireReconciliationPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('PENDING'); // PENDING, VERIFIED, ALL
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Form states for selected reconciliation modal
  const [receivedAmount, setReceivedAmount] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [isVerified, setIsVerified] = useState(true);
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reconciliation?filter=${filter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (selectedOrder) {
          const updated = data.orders.find((o: any) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filter, search]);

  const openReconciliationModal = (order: any) => {
    setSelectedOrder(order);
    const existingRec = order.paymentRecords?.[0];
    setReceivedAmount(existingRec?.receivedAmount > 0 ? existingRec.receivedAmount.toString() : order.totalAmount.toString());
    setBankReference(existingRec?.bankReference || `VIR-${order.orderNumber}`);
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setIsVerified(true);
    setInternalNotes(existingRec?.notes || '');
  };

  const handleSaveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSaving(true);
    setNotificationMsg('');
    try {
      const res = await fetch('/api/admin/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          receivedAmount: parseFloat(receivedAmount),
          bankReference,
          receiptDate,
          isVerified,
          notes: internalNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotificationMsg(`Virement validé avec succès pour ${selectedOrder.orderNumber} ! Email de confirmation envoyé au client.`);
        loadOrders();
      } else {
        alert(data.error || 'Erreur lors de la validation');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Rapprochement des Virements Bancaires
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vérifiez la réception effective des fonds avant de basculer la commande en préparation.
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Global Security Warning */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Règle de sécurité comptable Allo Maison :</strong>
            Un justificatif ou récépissé transmis par le client ne constitue pas une preuve de crédit définitive. Ne cochez "Virement vérifié" qu'après constatation du crédit effectif sur votre relevé bancaire professionnel.
          </div>
        </div>

        {notificationMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-900 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par n° de commande, nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            {[
              { id: 'PENDING', label: 'À rapprocher' },
              { id: 'VERIFIED', label: 'Règlements validés' },
              { id: 'ALL', label: 'Toutes les commandes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Chargement des opérations bancaires...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              Aucun virement ne correspond aux critères sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Montant attendu</th>
                    <th className="py-3 px-4">Montant reçu</th>
                    <th className="py-3 px-4">Réf virement</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const rec = order.paymentRecords?.[0];
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
                        <td className="py-3.5 px-4 font-black text-gray-900">
                          {formatPrice(order.totalAmount, order.currency)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-forest-800">
                          {rec && rec.receivedAmount > 0 ? formatPrice(rec.receivedAmount, order.currency) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                          {rec?.bankReference || 'Non renseigné'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              ● Virement Vérifié
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ● En attente crédit
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openReconciliationModal(order)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                          >
                            {isPaid ? 'Consulter' : 'Rapprocher'}
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

        {/* Modal for Reconciliation */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 z-10 space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Rapprochement Bancaire : {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Client : {selectedOrder.customerFirstName} {selectedOrder.customerLastName} ({selectedOrder.customerEmail})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveReconciliation} className="space-y-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Montant total attendu :</span>
                  <span className="text-base font-black text-forest-900">
                    {formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">
                      Montant réellement crédité ({selectedOrder.currency}) :
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-900 mb-1">
                      Date de crédit sur le compte :
                    </label>
                    <input
                      type="date"
                      required
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Référence de l'opération sur votre relevé bancaire :
                  </label>
                  <input
                    type="text"
                    required
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="Ex: VIR SEPA DUPONT JEAN 20261023..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Note interne comptable (facultatif) :
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Ex: Virement conforme reçu sur compte BNP Paribas. Commande débloquée."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-forest-700 rounded border-gray-300 focus:ring-forest-600"
                    />
                    <div>
                      <span className="font-extrabold text-forest-950 block">
                        Certifier la réception des fonds et valider le paiement
                      </span>
                      <span className="text-[11px] text-forest-800 block mt-0.5">
                        Déclenche immédiatement l'envoi de l'Email n°3 au client et transmet l'ordre en préparation logistique.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow transition flex items-center space-x-1.5"
                  >
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer le rapprochement'}</span>
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
