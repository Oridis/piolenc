'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  Package,
  ArrowRight,
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
        <main className="flex-1 py-16 px-4 max-w-xl mx-auto text-center text-xs text-gray-500">
          Chargement de votre suivi de livraison sécurisé...
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <main className="flex-1 py-16 px-4 max-w-xl mx-auto text-center space-y-4">
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-bold">
            {error || 'Lien de suivi invalide ou expiré.'}
          </div>
          <Link href="/" className="inline-block px-5 py-2.5 bg-forest-800 text-white rounded-xl text-xs font-bold">
            Retour à l'accueil
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const shipment = data.shipment;
  const isPaid = data.paymentStatus === 'PAYMENT_VERIFIED';

  // 8 Chronological milestones mapping
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

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-forest-950 via-forest-900 to-wood-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Espace de Suivi Sécurisé
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              Commande {data.orderNumber}
            </h1>
            <p className="text-xs text-forest-200 mt-1">
              Client : {data.customerFirstName} • Destination : {data.shippingCity}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] text-forest-200 block uppercase font-bold">Compte à rebours livraison</span>
            <span className="text-base font-black text-amber-400 block mt-0.5">
              {shipment?.remainingTimeText || 'Délai en cours de confirmation'}
            </span>
          </div>
        </div>

        {/* Delay Alert if any */}
        {shipment?.isDelayed && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Information retard logistique :</strong>
              Une légère variation de délai est constatée en raison des conditions d'acheminement routier. Le chauffeur vous contactera préalablement par téléphone pour fixer l'horaire précis.
            </div>
          </div>
        )}

        {/* 8-Step Timeline Horizontal Progression */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Chronologie de votre commande
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[11px]">
            {MILESTONES.map((m, idx) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                  m.done
                    ? 'bg-forest-50 border-forest-300 text-forest-950 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    m.done ? 'bg-forest-700 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {m.done ? '✓' : idx + 1}
                </div>
                <span className="leading-tight">{m.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Information & Events Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Detailed Carrier Info (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-forest-700" />
              <span>Détails de l'Expédition</span>
            </h3>

            <div className="space-y-3 text-gray-700">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Transporteur</span>
                <strong className="text-gray-900 text-sm">{shipment?.carrierName || 'Geodis Calberson'}</strong>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Numéro d'expédition</span>
                <span className="font-mono text-sm font-bold text-gray-900 block">{shipment?.trackingNumber || 'En cours d\'attribution'}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Date estimée de livraison</span>
                <strong className="text-forest-900 text-sm">
                  {shipment?.estimatedDeliveryDate
                    ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('fr-FR')
                    : 'En cours de confirmation'}
                </strong>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Équipement dédié</span>
                <span>Camion porteur avec hayon élévateur + transpalette</span>
              </div>

              {shipment?.carrierTrackingUrl && (
                <div className="pt-2">
                  <a
                    href={shipment.carrierTrackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-forest-800 font-bold hover:underline"
                  >
                    <span>Suivi sur le site du transporteur</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-wood-50 rounded-xl border border-wood-200 text-wood-900 text-[11px] space-y-1">
              <strong>Besoin d'aide ?</strong>
              <p>Notre service client est à votre disposition au <strong>{data.supportPhone}</strong> ou par email à <strong>{data.supportEmail}</strong>.</p>
            </div>
          </div>

          {/* Chronological Events Timeline (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-forest-700" />
              <span>Historique Chronologique des Événements</span>
            </h3>

            {shipment?.events && shipment.events.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-forest-200">
                {shipment.events.map((ev: any) => {
                  let sourceBadge = 'Info saisie';
                  let badgeStyle = 'bg-gray-100 text-gray-700';

                  if (ev.sourceType === 'CARRIER_API') {
                    sourceBadge = 'Position réelle transporteur (Scan)';
                    badgeStyle = 'bg-blue-100 text-blue-800';
                  } else if (ev.sourceType === 'WAREHOUSE_CONFIRMED') {
                    sourceBadge = 'Étape entrepôt confirmée';
                    badgeStyle = 'bg-green-100 text-green-800';
                  } else if (ev.sourceType === 'CALCULATED_ESTIMATE') {
                    sourceBadge = 'Estimation calculée';
                    badgeStyle = 'bg-purple-100 text-purple-800';
                  }

                  return (
                    <div key={ev.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-forest-700 border-4 border-white shadow-sm" />

                      <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <h4 className="font-black text-gray-900 text-sm">{ev.status}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                            {sourceBadge}
                          </span>
                        </div>

                        {ev.location && (
                          <div className="flex items-center space-x-1 text-gray-500 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{ev.location}</span>
                          </div>
                        )}

                        <p className="text-gray-700 leading-relaxed pt-1">{ev.description}</p>

                        <span className="text-[10px] text-gray-400 block pt-1 font-mono">
                          {new Date(ev.occurredAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                La commande est en cours de validation par nos équipes. Les événements de transport apparaîtront ici dès l'expédition.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
