'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Truck,
  Check,
  Clock,
  AlertTriangle,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function PublicTrackingPage({
  params,
}: {
  params: { token: string };
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/tracking/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Suivi introuvable');
        }
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.token]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 font-sans bg-ivory py-16 px-4 max-w-xl mx-auto text-center text-xs text-secondaryText">
          Chargement de votre suivi logistique sécurisé...
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <main className="flex-1 font-sans bg-ivory py-16 px-4 max-w-md mx-auto text-center space-y-4">
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-3">
            <div className="p-3 bg-red-50 text-statusError rounded-lg text-xs font-medium">
              {error || 'Lien de suivi invalide ou expiré.'}
            </div>
            <Link href="/" className="btn-primary text-xs">
              Retour à l&apos;accueil
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const shipment = data.shipment;
  const isPaid = data.paymentStatus === 'PAYMENT_VERIFIED';

  const MILESTONES = [
    { id: 'ORDER_CREATED', title: '1. Commande reçue', done: true },
    { id: 'PAYMENT_VERIFIED', title: '2. Virement vérifié', done: isPaid },
    { id: 'VALIDATED', title: '3. Commande validée', done: isPaid || ['VALIDATED', 'IN_PREPARATION', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.fulfillmentStatus) },
    { id: 'IN_PREPARATION', title: '4. Préparation palettes', done: ['IN_PREPARATION', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.fulfillmentStatus) },
    { id: 'SHIPPED', title: '5. Prise en charge camion', done: ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.fulfillmentStatus) },
    { id: 'IN_TRANSIT', title: '6. Acheminement en cours', done: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.fulfillmentStatus) },
    { id: 'OUT_FOR_DELIVERY', title: '7. En tournée de livraison', done: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.fulfillmentStatus) },
    { id: 'DELIVERED', title: '8. Palette livrée', done: data.fulfillmentStatus === 'DELIVERED' },
  ];

  return (
    <>
      <Navbar siteName={data.siteName} phone={data.supportPhone} />

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-subtleBorder shadow-subtle flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
              Espace de suivi sécurisé
            </span>
            <h1 className="font-poppins font-semibold text-2xl text-primaryText tracking-tight mt-0.5">
              Suivi de la commande {data.orderNumber}
            </h1>
            <p className="text-xs text-secondaryText mt-1">
              Destinataire : {data.customerFirstName} · Ville : {data.shippingCity}
            </p>
          </div>

          <div className="bg-ivory px-4 py-3 rounded-lg border border-subtleBorder text-left sm:text-right">
            <span className="text-[10px] text-secondaryText block uppercase font-medium">Délai estimé</span>
            <span className="font-poppins font-semibold text-sm text-primaryText block mt-0.5">
              {shipment?.remainingTimeText || 'Délai en cours de confirmation'}
            </span>
          </div>
        </div>

        {/* Delay Alert if any */}
        {shipment?.isDelayed && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-statusWarning shrink-0 mt-0.5" />
            <div>
              <strong className="font-medium block">Information d&apos;acheminement :</strong>
              Une légère adaptation du calendrier est constatée en raison des flux transporteur. Le chauffeur vous contactera préalablement pour convenir du créneau de passage.
            </div>
          </div>
        )}

        {/* 8-Step Timeline Horizontal Progression */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-subtleBorder shadow-subtle space-y-5">
          <h2 className="font-poppins font-medium text-xs text-secondaryText uppercase tracking-wider">
            Progression de l&apos;acheminement
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center text-[11px]">
            {MILESTONES.map((m, idx) => (
              <div
                key={m.id}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center space-y-1.5 transition-colors ${
                  m.done
                    ? 'bg-forest-50/70 border-forest-200 text-forest font-medium'
                    : 'bg-ivory/50 border-subtleBorder text-secondaryText opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium ${
                    m.done ? 'bg-forest text-white' : 'bg-beige-200 text-secondaryText'
                  }`}
                >
                  {m.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className="leading-tight">{m.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Information & Events Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Carrier Info */}
          <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-subtleBorder shadow-subtle space-y-4 text-xs">
            <h3 className="font-poppins font-medium text-sm text-primaryText border-b border-subtleBorder pb-3 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-forest" />
              <span>Détails de l&apos;expédition</span>
            </h3>

            <div className="space-y-3 text-secondaryText">
              <div>
                <span className="text-[10px] uppercase font-medium text-secondaryText block">Transporteur</span>
                <span className="font-medium text-primaryText text-xs">{shipment?.carrierName || 'Geodis Calberson'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-medium text-secondaryText block">Numéro d&apos;expédition</span>
                <span className="font-mono text-xs font-semibold text-primaryText block">{shipment?.trackingNumber || 'En cours d\'attribution'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-medium text-secondaryText block">Date indicative</span>
                <span className="font-medium text-primaryText text-xs">
                  {shipment?.estimatedDeliveryDate
                    ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('fr-FR')
                    : 'En cours de confirmation'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-medium text-secondaryText block">Matériel de dépose</span>
                <span className="text-primaryText">Camion porteur avec hayon élévateur et transpalette</span>
              </div>

              {shipment?.carrierTrackingUrl && (
                <div className="pt-2">
                  <a
                    href={shipment.carrierTrackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-forest hover:underline font-medium text-xs"
                  >
                    <span>Lien direct transporteur</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-ivory rounded-md border border-subtleBorder text-secondaryText text-[11px] space-y-1">
              <strong className="text-primaryText font-medium">Assistance logistique :</strong>
              <p>Notre équipe répond au <strong>{data.supportPhone}</strong> ou par email à <strong>{data.supportEmail}</strong>.</p>
            </div>
          </div>

          {/* Chronological Milestone Events */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 sm:p-7 border border-subtleBorder shadow-subtle space-y-5 text-xs">
            <h3 className="font-poppins font-medium text-sm text-primaryText border-b border-subtleBorder pb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-forest" />
              <span>Historique des jalons logistiques</span>
            </h3>

            {shipment?.events && shipment.events.length > 0 ? (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-subtleBorder">
                {shipment.events.map((ev: any) => {
                  let sourceBadge = 'Saisie interne';
                  let badgeStyle = 'badge-neutral';

                  if (ev.sourceType === 'CARRIER_API') {
                    sourceBadge = 'Position transporteur confirmée';
                    badgeStyle = 'badge-success';
                  } else if (ev.sourceType === 'WAREHOUSE_CONFIRMED') {
                    sourceBadge = 'Validation plateforme';
                    badgeStyle = 'badge-success';
                  } else if (ev.sourceType === 'CALCULATED_ESTIMATE') {
                    sourceBadge = 'Estimation prévisionnelle';
                    badgeStyle = 'badge-neutral';
                  }

                  return (
                    <div key={ev.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-forest border-2 border-white" />

                      <div className="bg-ivory/60 p-4 rounded-lg border border-subtleBorder space-y-1.5">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <h4 className="font-poppins font-medium text-primaryText text-xs">{ev.status}</h4>
                          <span className={`${badgeStyle} text-[10px]`}>
                            {sourceBadge}
                          </span>
                        </div>

                        {ev.location && (
                          <div className="flex items-center space-x-1.5 text-secondaryText text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-secondaryText" />
                            <span>{ev.location}</span>
                          </div>
                        )}

                        <p className="text-primaryText leading-relaxed pt-0.5">{ev.description}</p>

                        <span className="text-[10px] text-secondaryText block pt-1 font-mono">
                          {new Date(ev.occurredAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-secondaryText">
                La commande est en cours de validation par nos équipes. Les jalons de transport apparaîtront ici dès l&apos;expédition des palettes.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
