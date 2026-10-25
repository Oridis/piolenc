import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/settings';
import { ShieldCheck, CreditCard, Lock, ArrowRight } from 'lucide-react';

export default async function WireTransferInfoPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} />

      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Modalités de paiement sécurisé
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Le règlement direct par virement bancaire
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Pourquoi le virement bancaire constitue la solution la plus sûre, économique et transparente pour l&apos;achat de biocombustibles chez {settings.siteName}.
          </p>
        </div>

        {/* 3 Pillars of trust */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-10 h-10 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Sécurité de compte à compte</h3>
            <p className="text-secondaryText leading-relaxed">
              Le virement est émis directement depuis votre espace bancaire habituel vers notre compte professionnel. Aucune donnée de carte bancaire ne transite sur Internet.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-10 h-10 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Absence de commissions tierces</h3>
            <p className="text-secondaryText leading-relaxed">
              En supprimant les commissions des intermédiaires financiers, nous répercutons cette économie directement sur le prix au stère de nos palettes de bois.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle space-y-2.5 text-xs">
            <div className="w-10 h-10 bg-ivory border border-subtleBorder text-forest rounded-md flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-poppins font-medium text-sm text-primaryText">Traçabilité &amp; Référence</h3>
            <p className="text-secondaryText leading-relaxed">
              Chaque transaction est associée à un numéro de commande unique. Notre service comptable valide la réception sous 24h ouvrées et débloque l&apos;expédition.
            </p>
          </div>
        </div>

        {/* Step by step procedure */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-subtleBorder shadow-subtle space-y-5">
          <h2 className="font-poppins font-medium text-base text-primaryText">
            Déroulement d&apos;une commande par virement
          </h2>

          <div className="space-y-4 text-xs text-secondaryText">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-forest text-white font-poppins font-medium text-xs rounded-full flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <strong className="text-primaryText block font-medium">Validation du panier en ligne</strong>
                <p className="mt-0.5 leading-normal">Vous recevez un numéro de commande unique ainsi que notre relevé d&apos;identité bancaire (IBAN / BIC).</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-forest text-white font-poppins font-medium text-xs rounded-full flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <strong className="text-primaryText block font-medium">Émission du virement</strong>
                <p className="mt-0.5 leading-normal">Depuis votre application bancaire (SEPA standard ou instantané), en indiquant bien le numéro de commande en libellé.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-forest text-white font-poppins font-medium text-xs rounded-full flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <strong className="text-primaryText block font-medium">Validation comptable et expédition</strong>
                <p className="mt-0.5 leading-normal">Dès réception des fonds, un email de confirmation vous est adressé et vos palettes sont mises en tournée transporteur.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/boutique"
            className="btn-primary text-xs py-3 px-6 inline-flex items-center gap-1.5"
          >
            <span>Découvrir nos palettes de bois en boutique</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
