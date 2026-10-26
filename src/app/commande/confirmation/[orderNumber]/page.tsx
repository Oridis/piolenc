import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import ConfirmationClientView from './ConfirmationClientView';

export const dynamic = 'force-dynamic';


export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  // Le segment d'URL porte le jeton non devinable de la commande (`secureToken`),
  // pas le numéro de commande : celui-ci est court et énumérable, et cette page
  // affiche le nom, l'email et l'adresse du client. Le nom du dossier est
  // historique, le paramètre qu'il reçoit est bien le jeton.
  const { orderNumber: secureToken } = await params;
  const settings = await getSiteSettings();
  const order = await prisma.order.findUnique({
    where: { secureToken },
    include: {
      items: true,
      deliveryShipment: { include: { carrier: true } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <>
      <Navbar siteName={settings.siteName} phone={settings.companyPhone} slogan={settings.slogan} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <ConfirmationClientView order={order} siteSettings={settings} />
      </main>

      <Footer settings={settings} />
    </>
  );
}
