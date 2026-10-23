import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';
import { ShieldCheck, CreditCard, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export default async function WireTransferInfoPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Guide de Paiement Sécurisé
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Tout Savoir sur le Règlement par Virement Bancaire
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pourquoi le virement bancaire est-il le moyen de paiement privilégié chez {settings.siteName} pour la commande de bois de chauffage ?
          </p>
        </div>

        {/* 3 Pillars of trust */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Zéro Fraude Bancaire</h3>
            <p className="text-gray-600 leading-relaxed">
              Le virement s'effectue directement de votre application bancaire personnelle vers notre compte professionnel officiel. Vous ne saisissez jamais votre numéro de carte sur Internet.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="p-3 bg-forest-100 text-forest-800 rounded-2xl w-fit">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Sans Commission Cachée</h3>
            <p className="text-gray-600 leading-relaxed">
              Les plateformes de carte bancaire prélèvent des commissions de 1.5% à 3% sur les gros volumes. En supprimant ces intermédiaires, nous pouvons vous garantir le meilleur prix au stère.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <div className="p-3 bg-wood-100 text-wood-800 rounded-2xl w-fit">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Traçabilité Totale</h3>
            <p className="text-gray-600 leading-relaxed">
              Chaque virement comporte votre numéro de commande unique dans son libellé. Notre service comptable valide la réception sous 24h ouvrées et débloque immédiatement votre expédition.
            </p>
          </div>
        </div>

        {/* Step by step procedure */}
        <div className="bg-wood-50 rounded-3xl p-8 border border-wood-200 space-y-6">
          <h2 className="text-xl font-black text-gray-900">
            Comment se déroule le règlement d'une commande ?
          </h2>

          <div className="space-y-4 text-xs text-gray-700">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 bg-forest-800 text-white font-black rounded-full flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <strong className="text-sm font-bold text-gray-900 block">Vous validez votre panier</strong>
                <p className="mt-0.5">Vous recevez immédiatement un numéro de commande (ex: AM-2026-1042) et notre RIB officiel avec l'IBAN et le BIC.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 bg-forest-800 text-white font-black rounded-full flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <strong className="text-sm font-bold text-gray-900 block">Vous effectuez le virement</strong>
                <p className="mt-0.5">Depuis votre banque (virement SEPA standard ou instantané), en indiquant bien le numéro de commande en libellé.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 bg-forest-800 text-white font-black rounded-full flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <strong className="text-sm font-bold text-gray-900 block">Validation et envoi</strong>
                <p className="mt-0.5">Dès constatation du crédit, vous recevez un email de confirmation de paiement et la palette part en préparation chez le transporteur.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 bg-forest-800 hover:bg-forest-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs shadow-md"
          >
            <span>Commander mon bois de chauffage</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer settings={settings} />
    </>
  );
}
