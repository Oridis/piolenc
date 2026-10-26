import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Jeton de suivi manquant' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { secureToken: token },
      include: {
        items: true,
        deliveryShipment: {
          include: {
            carrier: true,
            trackingEvents: {
              where: { isCustomerVisible: true },
              orderBy: { occurredAt: 'desc' },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable pour ce lien sécurisé' }, { status: 404 });
    }

    const siteSettings = await getSiteSettings();
    const shipment = order.deliveryShipment;

    // Calculate remaining delivery countdown
    let remainingTimeText = 'Délai en cours de confirmation';
    let isDelayed = order.fulfillmentStatus === 'DELIVERY_DELAYED';

    if (shipment?.estimatedDeliveryDate) {
      const diffMs = new Date(shipment.estimatedDeliveryDate).getTime() - Date.now();
      if (shipment.deliveredAt || order.fulfillmentStatus === 'DELIVERED') {
        remainingTimeText = 'Colis livré avec succès';
      } else if (diffMs > 0) {
        const remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const remainingHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        remainingTimeText = `${remainingDays} jour${remainingDays > 1 ? 's' : ''} et ${remainingHours}h restant(es)`;
      } else {
        remainingTimeText = 'Livraison imminente';
      }
    }

    // Never disclose sensitive payment or user secrets in tracking response
    return NextResponse.json({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerFirstName: order.customerFirstName,
      shippingCity: JSON.parse(order.shippingAddress || '{}').city || 'France',
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPriceTTC: i.unitPriceTTC,
      })),
      shipment: shipment
        ? {
            carrierName: shipment.carrier?.name || 'Geodis Calberson',
            trackingNumber: shipment.trackingNumber,
            carrierTrackingUrl: shipment.carrierTrackingUrl,
            shippedAt: shipment.shippedAt,
            estimatedDeliveryDate: shipment.estimatedDeliveryDate,
            deliveredAt: shipment.deliveredAt,
            currentStage: shipment.currentStage,
            remainingTimeText,
            isDelayed,
            events: shipment.trackingEvents,
          }
        : null,
      supportPhone: siteSettings.companyPhone,
      supportEmail: siteSettings.companyEmail,
      siteName: siteSettings.siteName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
