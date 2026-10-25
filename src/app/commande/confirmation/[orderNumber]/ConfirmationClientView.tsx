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
  AlertTriangle,
  ArrowRight,
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
    <div className="space-y-8 font-sans">
      {/* Top Success Banner */}
      <div className="bg-white border border-subtleBorder rounded-xl p-6 sm:p-8 text-center space-y-3 shadow-subtle">
        <div className="w-12 h-12 bg-ivory border border-subtleBorder text-forest rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <span className="badge-success text-xs">
          Commande enregistrée avec succès
        </span>
        <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
          Merci pour votre commande, {order.customerFirstName}
        </h1>
        <p className="text-xs sm:text-sm text-secondaryText max-w-lg mx-auto leading-relaxed">
          Votre numéro de commande est <strong className="text-primaryText font-mono font-medium">{order.orderNumber}</strong>. Un email récapitulatif détaillé vous a été transmis à l&apos;adresse <strong>{order.customerEmail}</strong>.
        </p>

        <div className="pt-3 flex flex-wrap justify-center gap-2.5">
          <Link
            href={`/suivi/${order.secureToken}`}
            className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>Accéder au suivi en direct</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le récapitulatif</span>
          </button>
        </div>
      </div>

      {/* Main Bank Wire Instructions Box */}
      <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
        <div className="bg-forest p-5 sm:p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-beige" />
            <div>
              <h2 className="font-poppins font-medium text-base text-white">Coordonnées bancaires pour le règlement</h2>
              <p className="text-xs text-ivory/80">Statut : En attente de virement bancaire direct</p>
            </div>
          </div>
          <span className="text-xs font-medium bg-forest-dark px-3 py-1 rounded-md border border-forest-secondary text-beige">
            À effectuer avant le {deadlineDate}
          </span>
        </div>

        <div className="p-6 sm:p-7 space-y-5 text-xs text-secondaryText">
          <div className="p-4 bg-ivory border border-subtleBorder rounded-lg flex items-start space-x-3 text-primaryText">
            <AlertTriangle className="w-4 h-4 text-statusWarning shrink-0 mt-0.5" />
            <div>
              <strong className="font-medium text-xs block">
                Libellé obligatoire à indiquer dans votre virement :
              </strong>
              <div className="mt-1.5 flex items-center space-x-2">
                <span className="font-mono text-sm font-semibold bg-white px-2.5 py-1 rounded border border-subtleBorder text-primaryText">
                  {order.orderNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(order.orderNumber, 'ref')}
                  className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedField === 'ref' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-secondaryText mt-1">
                Cette référence structurée permet l&apos;affectation automatique du paiement et le déclenchement immédiat de la préparation de vos palettes.
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 bg-ivory rounded-lg border border-subtleBorder space-y-0.5">
              <span className="text-secondaryText uppercase text-[10px] font-medium">Montant exact à virer</span>
              <span className="font-poppins font-semibold text-xl text-primaryText block">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>

            <div className="p-3.5 bg-ivory rounded-lg border border-subtleBorder space-y-0.5">
              <span className="text-secondaryText uppercase text-[10px] font-medium">Bénéficiaire</span>
              <span className="text-xs font-medium text-primaryText block truncate">
                {siteSettings.bankBeneficiary}
              </span>
            </div>

            <div className="p-3.5 bg-ivory rounded-lg border border-subtleBorder space-y-1 sm:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-secondaryText uppercase text-[10px] font-medium">IBAN (Compte bancaire)</span>
                <button
                  onClick={() => copyToClipboard(siteSettings.bankIban.replace(/\s+/g, ''), 'iban')}
                  className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedField === 'iban' ? 'Copié' : 'Copier l\'IBAN'}</span>
                </button>
              </div>
              <span className="font-mono text-xs sm:text-sm font-semibold text-primaryText block tracking-wider bg-white p-2 rounded border border-subtleBorder">
                {siteSettings.bankIban}
              </span>
            </div>

            <div className="p-3.5 bg-ivory rounded-lg border border-subtleBorder space-y-0.5">
              <span className="text-secondaryText uppercase text-[10px] font-medium">Établissement bancaire</span>
              <span className="text-xs font-medium text-primaryText block">{siteSettings.bankName}</span>
            </div>

            <div className="p-3.5 bg-ivory rounded-lg border border-subtleBorder space-y-0.5">
              <span className="text-secondaryText uppercase text-[10px] font-medium">Code BIC / SWIFT</span>
              <span className="font-mono text-xs font-medium text-primaryText block">{siteSettings.bankBic}</span>
            </div>
          </div>

          <p className="text-secondaryText text-xs leading-relaxed italic pt-1">
            {siteSettings.bankInstructions}
          </p>
        </div>
      </div>

      {/* Order Items & Logistics Recap */}
      <div className="bg-white rounded-xl border border-subtleBorder p-6 sm:p-7 space-y-5 text-xs">
        <h2 className="font-poppins font-medium text-xs text-secondaryText uppercase tracking-wider border-b border-subtleBorder pb-3">
          Récapitulatif des articles commandés
        </h2>

        <div className="divide-y divide-subtleBorder/60">
          {order.items.map((item: any) => (
            <div key={item.id} className="py-3 flex justify-between items-center">
              <div>
                <span className="font-medium text-primaryText block text-xs">{item.productName}</span>
                <span className="text-secondaryText text-[11px]">
                  Quantité : {item.quantity} · Prix unitaire TTC : {formatPrice(item.unitPriceTTC, order.currency)}
                </span>
              </div>
              <span className="font-poppins font-medium text-primaryText text-xs">
                {formatPrice(item.totalTTC, order.currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-subtleBorder pt-3 space-y-1.5 text-right">
          <div className="flex justify-between text-secondaryText">
            <span>Sous-total articles :</span>
            <span className="font-medium text-primaryText">{formatPrice(order.subtotalTTC, order.currency)}</span>
          </div>
          <div className="flex justify-between text-secondaryText">
            <span>Livraison par camion porteur :</span>
            <span className="font-medium text-primaryText">{formatPrice(order.shippingFee, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-primaryText pt-2 border-t border-subtleBorder">
            <span>Total TTC à régler :</span>
            <span className="font-poppins font-semibold text-lg text-primaryText">{formatPrice(order.totalAmount, order.currency)}</span>
          </div>
        </div>

        {/* Address and Slot recap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-subtleBorder">
          <div>
            <span className="font-medium text-primaryText block mb-1">Adresse de livraison :</span>
            <p className="text-secondaryText leading-relaxed">
              {shippingAddress.street} {shippingAddress.additional && `(${shippingAddress.additional})`}<br />
              {shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}
            </p>
          </div>
          <div>
            <span className="font-medium text-primaryText block mb-1">Créneau souhaité :</span>
            <p className="text-secondaryText">{order.requestedDeliverySlot || 'À convenir avec le transporteur'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
