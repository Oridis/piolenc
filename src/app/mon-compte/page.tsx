import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/pricing';
import {
  User,
  ShoppingBag,
  Truck,
  CreditCard,
  LogOut,
  MapPin,
  Calendar,
  ExternalLink,
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

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-forest-100 text-forest-800 rounded-2xl flex items-center justify-center font-black text-xl">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Bonjour, {user.firstName} {user.lastName}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{user.email} • Compte Client Particulier</p>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition flex items-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </form>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-forest-700" />
            <span>Historique de vos commandes de bois ({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3 text-xs text-gray-500 shadow-sm">
              <p>Vous n'avez pas encore passé de commande.</p>
              <Link href="/boutique" className="inline-block px-5 py-2.5 bg-forest-800 text-white rounded-xl font-bold">
                Découvrir nos palettes de bois
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = order.paymentStatus === 'PAYMENT_VERIFIED';

                return (
                  <div
                    key={order.id}
                    className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3 text-xs">
                      <div>
                        <span className="font-mono text-sm font-black text-gray-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-gray-400 ml-2">
                          Commandée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            Virement validé
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            En attente de virement
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-800">
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="text-xs space-y-1.5 text-gray-700">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="font-bold text-gray-900">{formatPrice(item.totalTTC, order.currency)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom actions */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pt-3 border-t border-gray-100 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Total TTC : </span>
                        <strong className="text-base font-black text-forest-900">
                          {formatPrice(order.totalAmount, order.currency)}
                        </strong>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/suivi/${order.secureToken}`}
                          className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Suivi de livraison en direct</span>
                        </Link>
                        <Link
                          href={`/commande/confirmation/${order.orderNumber}`}
                          className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold"
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
