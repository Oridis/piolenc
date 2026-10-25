import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import {
  ShoppingBag,
  Truck,
  LogOut,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerAccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/connexion');
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: user.id },
        { customerEmail: user.email },
      ],
    },
    include: {
      items: true,
      deliveryShipment: { include: { carrier: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <Navbar />

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-7">
        {/* User Card */}
        <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-ivory border border-subtleBorder text-forest rounded-lg flex items-center justify-center font-poppins font-semibold text-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h1 className="font-poppins font-semibold text-xl text-primaryText tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-xs text-secondaryText">{user.email} · Espace Client</p>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          </form>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          <h2 className="font-poppins font-medium text-base text-primaryText flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-forest" />
            <span>Historique de vos commandes ({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-subtleBorder text-center space-y-3 text-xs text-secondaryText shadow-subtle">
              <p>Vous n&apos;avez pas encore passé de commande.</p>
              <Link href="/boutique" className="btn-primary text-xs">
                Découvrir nos palettes de bois
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {orders.map((order) => {
                const isPaid = order.paymentStatus === 'PAYMENT_VERIFIED';

                return (
                  <div
                    key={order.id}
                    className="bg-white p-5 sm:p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-subtleBorder pb-3 text-xs">
                      <div>
                        <span className="font-mono text-xs font-semibold text-primaryText">
                          {order.orderNumber}
                        </span>
                        <span className="text-secondaryText ml-2 text-[11px]">
                          Commandée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPaid ? (
                          <span className="badge-success text-[10px]">
                            Virement validé
                          </span>
                        ) : (
                          <span className="badge-warning text-[10px]">
                            En attente de virement
                          </span>
                        )}

                        <span className="badge-neutral text-[10px]">
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="text-xs space-y-1.5 text-secondaryText">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-primaryText">{item.quantity}x {item.productName}</span>
                          <span className="font-medium text-primaryText">{formatPrice(item.totalTTC, order.currency)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom actions */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pt-3 border-t border-subtleBorder gap-3 text-xs">
                      <div>
                        <span className="text-secondaryText">Total TTC : </span>
                        <strong className="font-poppins font-semibold text-base text-primaryText">
                          {formatPrice(order.totalAmount, order.currency)}
                        </strong>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/suivi/${order.secureToken}`}
                          className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Suivi de livraison</span>
                        </Link>
                        <Link
                          href={`/commande/confirmation/${order.orderNumber}`}
                          className="btn-secondary text-xs py-2 px-3"
                        >
                          RIB &amp; Facture
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
