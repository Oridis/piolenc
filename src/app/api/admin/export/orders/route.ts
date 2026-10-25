import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (user && user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        deliveryShipment: { include: { carrier: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Numéro de commande',
      'Date de création',
      'Client Nom',
      'Client Prénom',
      'Email',
      'Téléphone',
      'Adresse Livraison',
      'Code Postal',
      'Ville',
      'Pays',
      'Total Articles HT',
      'TVA',
      'Frais de Port',
      'Total TTC',
      'Devise',
      'Statut Paiement',
      'Statut Expédition',
      'Transporteur',
      'Numéro Suivi',
    ];

    const rows = orders.map((o) => {
      const shipping = JSON.parse(o.shippingAddress || '{}');
      return [
        o.orderNumber,
        new Date(o.createdAt).toISOString().split('T')[0],
        `"${o.customerLastName}"`,
        `"${o.customerFirstName}"`,
        o.customerEmail,
        `"${o.customerPhone}"`,
        `"${shipping.street || ''}"`,
        `"${shipping.postalCode || ''}"`,
        `"${shipping.city || ''}"`,
        shipping.country || 'FR',
        o.subtotalHT.toFixed(2),
        o.vatTotal.toFixed(2),
        o.shippingFee.toFixed(2),
        o.totalAmount.toFixed(2),
        o.currency,
        o.paymentStatus,
        o.fulfillmentStatus,
        o.deliveryShipment?.carrier?.name || 'N/A',
        o.deliveryShipment?.trackingNumber || 'N/A',
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="commandes-woodmachine-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
