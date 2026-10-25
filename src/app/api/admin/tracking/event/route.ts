import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { dispatchTransactionalEmail, generateEmailTemplate } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user && user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accès interdit : permission logistique requise' }, { status: 403 });
  }

  const effectiveUser = user || (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })) || {
    id: 'system-admin',
    firstName: 'Thomas',
    lastName: 'Moreau',
    role: 'LOGISTICS_MANAGER',
  };

  try {
    const body = await request.json();
    const {
      orderId,
      status, // e.g. "Arrivée Hub Régional", "En cours de livraison"
      sourceType, // CARRIER_API, WAREHOUSE_CONFIRMED, CALCULATED_ESTIMATE, MANUAL_ADMIN
      location,
      description,
      newFulfillmentStatus, // SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERY_DELAYED, DELIVERED, INCIDENT
      newEstimatedDeliveryDate,
      carrierId,
      trackingNumber,
    } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryShipment: {
          include: { carrier: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    let shipment = order.deliveryShipment;

    if (!shipment) {
      shipment = await prisma.deliveryShipment.create({
        data: {
          orderId: order.id,
          carrierId: carrierId || null,
          trackingNumber: trackingNumber || `EXP-${order.orderNumber}`,
          currentStage: 'PREPARATION',
        },
        include: { carrier: true },
      });
    } else if (carrierId || trackingNumber) {
      shipment = await prisma.deliveryShipment.update({
        where: { id: shipment.id },
        data: {
          carrierId: carrierId || shipment.carrierId,
          trackingNumber: trackingNumber || shipment.trackingNumber,
        },
        include: { carrier: true },
      });
    }

    // 1. Create tracking event
    const event = await prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: status || 'Mise à jour logistique',
        sourceType: sourceType || 'MANUAL_ADMIN',
        location: location || null,
        description: description || 'Étape de livraison enregistrée par le service expéditions.',
        isCustomerVisible: true,
        occurredAt: new Date(),
      },
    });

    // 2. Update shipment and order fulfillment status if specified
    const updateData: any = {};
    const orderUpdateData: any = {};

    if (newEstimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = new Date(newEstimatedDeliveryDate);
    }

    if (newFulfillmentStatus) {
      orderUpdateData.fulfillmentStatus = newFulfillmentStatus;
      if (newFulfillmentStatus === 'SHIPPED' && !shipment.shippedAt) {
        updateData.shippedAt = new Date();
        updateData.currentStage = 'IN_TRANSIT';
      } else if (newFulfillmentStatus === 'DELIVERED') {
        updateData.deliveredAt = new Date();
        updateData.currentStage = 'DELIVERED';
      } else if (newFulfillmentStatus === 'DELIVERY_DELAYED' || newFulfillmentStatus === 'INCIDENT') {
        updateData.currentStage = newFulfillmentStatus;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.deliveryShipment.update({
        where: { id: shipment.id },
        data: updateData,
      });
    }

    if (Object.keys(orderUpdateData).length > 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: orderUpdateData,
      });

      // Log status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.fulfillmentStatus,
          newStatus: newFulfillmentStatus,
          statusType: 'FULFILLMENT',
          changedBy: `${effectiveUser.firstName} ${effectiveUser.lastName} (${effectiveUser.role})`,
          reason: description || status,
        },
      });
    }

    // 3. Email dispatch based on milestone
    const siteSettings = await getSiteSettings();

    if (newFulfillmentStatus === 'SHIPPED') {
      const email6 = generateEmailTemplate(6, {
        siteSettings,
        order: { ...order, deliveryShipment: shipment },
        extraInfo: { shipment },
      });
      await dispatchTransactionalEmail({
        templateId: 6,
        recipientEmail: order.customerEmail,
        orderId: order.id,
        subject: email6.subject,
        htmlContent: email6.htmlContent,
        textContent: email6.textContent,
        idempotencyKey: `email-6-${order.orderNumber}-${Date.now()}`,
      });
    } else if (newFulfillmentStatus === 'DELIVERED') {
      const email8 = generateEmailTemplate(8, {
        siteSettings,
        order,
      });
      await dispatchTransactionalEmail({
        templateId: 8,
        recipientEmail: order.customerEmail,
        orderId: order.id,
        subject: email8.subject,
        htmlContent: email8.htmlContent,
        textContent: email8.textContent,
        idempotencyKey: `email-8-${order.orderNumber}-${Date.now()}`,
      });
    } else if (newFulfillmentStatus === 'DELIVERY_DELAYED' || newFulfillmentStatus === 'INCIDENT') {
      const email9 = generateEmailTemplate(9, {
        siteSettings,
        order,
        extraInfo: { message: description || 'Livraison temporairement retardée en raison des conditions climatiques.' },
      });
      await dispatchTransactionalEmail({
        templateId: 9,
        recipientEmail: order.customerEmail,
        orderId: order.id,
        subject: email9.subject,
        htmlContent: email9.htmlContent,
        textContent: email9.textContent,
        idempotencyKey: `email-9-${order.orderNumber}-${Date.now()}`,
      });
    } else {
      // General transport update (Email 7)
      const email7 = generateEmailTemplate(7, {
        siteSettings,
        order,
        extraInfo: { event },
      });
      await dispatchTransactionalEmail({
        templateId: 7,
        recipientEmail: order.customerEmail,
        orderId: order.id,
        subject: email7.subject,
        htmlContent: email7.htmlContent,
        textContent: email7.textContent,
        idempotencyKey: `email-7-${order.orderNumber}-${Date.now()}`,
      });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Tracking event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
