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
  X,
  ExternalLink,
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
        setNotificationMsg(`Virement validé avec succès pour ${selectedOrder.orderNumber}. Email de confirmation automatique expédié.`);
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
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-wood-100 text-wood-700 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Rapprochement des Virements Bancaires
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Contrôlez et validez la réception effective des fonds bancaires avant mise en préparation.
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-subtleBorder text-xs font-semibold rounded-lg text-primaryText hover:bg-beige-50 transition shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Global Security Warning */}
        <div className="p-4 bg-wood-50 border border-wood-200 rounded-xl flex items-start space-x-3 text-xs text-wood-900">
          <ShieldCheck className="w-5 h-5 text-wood-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block text-wood-900">Règle de sécurité comptable Piolenc Bois Direct :</strong>
            Un avis de virement ou récépissé transmis par le client ne constitue pas une confirmation irrévocable. Ne validez le règlement qu'après constatation du crédit effectif sur le compte bancaire professionnel.
          </div>
        </div>

        {notificationMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-900 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl border border-subtleBorder shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-secondaryText absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par n° de commande, nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-subtleBorder rounded-lg text-xs text-primaryText focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex space-x-1.5 w-full sm:w-auto">
            {[
              { id: 'PENDING', label: 'À rapprocher' },
              { id: 'VERIFIED', label: 'Règlements validés' },
              { id: 'ALL', label: 'Toutes les commandes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === tab.id
                    ? 'bg-forest-700 text-white shadow-subtle'
                    : 'bg-beige-100 text-secondaryText hover:text-primaryText hover:bg-beige-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-secondaryText">Chargement des opérations bancaires...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-secondaryText">
              Aucun virement ne correspond aux critères sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
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
                <tbody className="divide-y divide-subtleBorder">
                  {orders.map((order) => {
                    const rec = order.paymentRecords?.[0];
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
                        <td className="py-3 px-4 font-bold text-primaryText">
                          {formatPrice(order.totalAmount, order.currency)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-forest-700">
                          {rec && rec.receivedAmount > 0 ? formatPrice(rec.receivedAmount, order.currency) : '—'}
                        </td>
                        <td className="py-3 px-4 text-secondaryText font-mono text-[11px]">
                          {rec?.bankReference || 'Non renseigné'}
                        </td>
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <span className="badge-success">
                              Virement validé
                            </span>
                          ) : (
                            <span className="badge-warning">
                              En attente crédit
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openReconciliationModal(order)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition shadow-subtle ${
                              isPaid
                                ? 'bg-beige-100 hover:bg-beige-200 text-primaryText border border-subtleBorder'
                                : 'bg-forest-700 hover:bg-forest-800 text-white'
                            }`}
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
            <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
            <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-elevated border border-subtleBorder z-10 space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-subtleBorder">
                <div>
                  <h3 className="text-base font-bold font-heading text-primaryText">
                    Rapprochement Bancaire : {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-secondaryText">
                    Client : {selectedOrder.customerFirstName} {selectedOrder.customerLastName} ({selectedOrder.customerEmail})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg text-secondaryText hover:text-primaryText hover:bg-beige-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReconciliation} className="space-y-4 text-xs">
                <div className="p-3 bg-beige-50 rounded-lg border border-subtleBorder flex justify-between items-center">
                  <span className="font-medium text-secondaryText">Montant total attendu :</span>
                  <span className="text-base font-bold text-primaryText">
                    {formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">
                      Montant réellement crédité ({selectedOrder.currency}) :
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="input-field font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primaryText mb-1">
                      Date de crédit sur le compte :
                    </label>
                    <input
                      type="date"
                      required
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">
                    Référence de l'opération sur votre relevé bancaire :
                  </label>
                  <input
                    type="text"
                    required
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="Ex: VIR SEPA DUPONT JEAN..."
                    className="input-field font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">
                    Note interne comptable (facultatif) :
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Ex: Virement conforme reçu sur compte professionnel. Commande débloquée."
                    className="input-field"
                  />
                </div>

                <div className="p-3 bg-forest-50 border border-forest-200 rounded-lg">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-forest-700 rounded border-subtleBorder focus:ring-forest-600"
                    />
                    <div>
                      <span className="font-semibold text-forest-900 block">
                        Certifier la réception des fonds et valider le paiement
                      </span>
                      <span className="text-[11px] text-forest-800 block mt-0.5">
                        Déclenche immédiatement l'envoi de l'email de confirmation au client et transmet l'ordre en préparation logistique.
                      </span>
                    </div>
                  </label>
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
                    disabled={saving}
                    className="btn-primary"
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
