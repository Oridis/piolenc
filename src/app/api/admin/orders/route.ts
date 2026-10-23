import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { dispatchTransactionalEmail, generateEmailTemplate } from '@/lib/email';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const fulfillmentStatus = searchParams.get('fulfillmentStatus') || '';

  try {
    const where: any = {};

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (fulfillmentStatus) {
      where.fulfillmentStatus = fulfillmentStatus;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerFirstName: { contains: search } },
        { customerLastName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        deliveryShipment: {
          include: { carrier: true },
        },
        paymentRecords: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, fulfillmentStatus, paymentStatus, internalNotes } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryShipment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const updateData: any = {};
    if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    const previousFulfillment = order.fulfillmentStatus;
    const previousPayment = order.paymentStatus;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: {
        items: true,
        deliveryShipment: true,
      },
    });

    // Record status history if changed
    if (fulfillmentStatus && fulfillmentStatus !== previousFulfillment) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: previousFulfillment,
          newStatus: fulfillmentStatus,
          statusType: 'FULFILLMENT',
          changedBy: `${user.firstName} ${user.lastName} (${user.role})`,
        },
      });

      const siteSettings = await getSiteSettings();

      // Email 4: Order Validated
      if (fulfillmentStatus === 'VALIDATED') {
        const email4 = generateEmailTemplate(4, { siteSettings, order: updated });
        await dispatchTransactionalEmail({
          templateId: 4,
          recipientEmail: order.customerEmail,
          orderId: order.id,
          subject: email4.subject,
          htmlContent: email4.htmlContent,
          textContent: email4.textContent,
          idempotencyKey: `email-4-${order.orderNumber}-${Date.now()}`,
        });
      }

      // Email 5: In Preparation
      if (fulfillmentStatus === 'IN_PREPARATION') {
        const email5 = generateEmailTemplate(5, { siteSettings, order: updated });
        await dispatchTransactionalEmail({
          templateId: 5,
          recipientEmail: order.customerEmail,
          orderId: order.id,
          subject: email5.subject,
          htmlContent: email5.htmlContent,
          textContent: email5.textContent,
          idempotencyKey: `email-5-${order.orderNumber}-${Date.now()}`,
        });
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
