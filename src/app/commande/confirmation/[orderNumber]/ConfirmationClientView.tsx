'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/pricing';
import {
  CheckCircle2,
  Copy,
  Printer,
  Truck,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ConfirmationClientViewProps {
  order: any;
  siteSettings: any;
}

export default function ConfirmationClientView({
  order,
  siteSettings,
}: ConfirmationClientViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const shippingAddress = JSON.parse(order.shippingAddress || '{}');
  const deadlineDays = siteSettings.bankTransferDeadlineDays || 5;
  const deadlineDate = new Date(new Date(order.createdAt).getTime() + deadlineDays * 86400000).toLocaleDateString('fr-FR');

  return (
    <div className="space-y-8">
      {/* Top Success Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Commande enregistrée avec succès
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Merci pour votre commande, {order.customerFirstName} !
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
          Votre référence de commande est <strong className="text-gray-900 font-mono">{order.orderNumber}</strong>. Un email récapitulatif vous a été envoyé à <strong>{order.customerEmail}</strong>.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={`/suivi/${order.secureToken}`}
            className="px-5 py-2.5 bg-forest-800 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>Accéder au suivi en direct</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer la facture pro forma</span>
          </button>
        </div>
      </div>

      {/* Main Bank Wire Instructions Box */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-amber-100" />
            <div>
              <h2 className="text-lg font-black tracking-tight">Coordonnées Bancaires pour votre Virement</h2>
              <p className="text-xs text-amber-100">Statut actuel : En attente de virement bancaire</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-700/60 px-3 py-1 rounded-full border border-amber-400">
            Délai : Avant le {deadlineDate}
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6 text-xs text-gray-700">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold text-amber-950 block text-sm">
                Libellé impératif à indiquer dans votre virement :
              </strong>
              <div className="mt-1 flex items-center space-x-2">
                <span className="font-mono text-base font-black bg-white px-3 py-1 rounded-lg border border-amber-300 text-forest-950">
                  {order.orderNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(order.orderNumber, 'ref')}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] transition flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedField === 'ref' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-900 mt-1">
                Ce libellé permet l'identification automatique et la mise en préparation immédiate de vos palettes.
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Montant exact à virer</span>
              <span className="text-2xl font-black text-forest-900 block">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Bénéficiaire</span>
              <span className="text-sm font-extrabold text-gray-900 block truncate">
                {siteSettings.bankBeneficiary}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 sm:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase text-[10px]">IBAN (Compte bancaire)</span>
                <button
                  onClick={() => copyToClipboard(siteSettings.bankIban.replace(/\s+/g, ''), 'iban')}
                  className="px-2.5 py-1 bg-forest-100 hover:bg-forest-200 text-forest-900 rounded-lg font-bold text-[11px] flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedField === 'iban' ? 'Copié !' : 'Copier l\'IBAN'}</span>
                </button>
              </div>
              <span className="font-mono text-sm sm:text-base font-extrabold text-gray-950 block tracking-wider bg-white p-2.5 rounded-xl border border-gray-300">
                {siteSettings.bankIban}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Banque</span>
              <span className="text-sm font-bold text-gray-900 block">{siteSettings.bankName}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-gray-400 font-bold uppercase text-[10px]">BIC / SWIFT</span>
              <span className="font-mono text-sm font-bold text-gray-900 block">{siteSettings.bankBic}</span>
            </div>
          </div>

          <p className="text-gray-600 text-xs leading-relaxed italic">
            {siteSettings.bankInstructions}
          </p>
        </div>
      </div>

      {/* Order Items & Logistics Recap */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 text-xs">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
          Récapitulatif de votre commande
        </h2>

        <div className="divide-y divide-gray-100">
          {order.items.map((item: any) => (
            <div key={item.id} className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-900 block text-sm">{item.productName}</span>
                <span className="text-gray-500 text-xs">
                  Quantité : {item.quantity} • Prix unitaire TTC : {formatPrice(item.unitPriceTTC, order.currency)}
                </span>
              </div>
              <span className="font-extrabold text-forest-900 text-sm">
                {formatPrice(item.totalTTC, order.currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2 text-right">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total articles :</span>
            <span className="font-semibold text-gray-900">{formatPrice(order.subtotalTTC, order.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Frais de livraison camion porteur :</span>
            <span className="font-semibold text-gray-900">{formatPrice(order.shippingFee, order.currency)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-forest-900 pt-2 border-t border-gray-100">
            <span>Total TTC à régler :</span>
            <span>{formatPrice(order.totalAmount, order.currency)}</span>
          </div>
        </div>

        {/* Address and Slot recap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <span className="font-bold text-gray-900 block mb-1">Adresse de livraison :</span>
            <p className="text-gray-600">
              {shippingAddress.street} {shippingAddress.additional && `(${shippingAddress.additional})`}<br />
              {shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}
            </p>
          </div>
          <div>
            <span className="font-bold text-gray-900 block mb-1">Créneau souhaité :</span>
            <p className="text-gray-600">{order.requestedDeliverySlot || 'À convenir avec le transporteur'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
