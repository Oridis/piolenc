import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { dispatchTransactionalEmail, generateEmailTemplate } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Accès interdit : session administrateur requise' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'ALL'; // PENDING, VERIFIED, ALL

  try {
    const whereCondition: any = {};

    if (filter === 'PENDING') {
      whereCondition.paymentStatus = 'PENDING_TRANSFER';
    } else if (filter === 'VERIFIED') {
      whereCondition.paymentStatus = { in: ['TRANSFER_RECEIVED', 'PAYMENT_VERIFIED'] };
    }

    if (search) {
      whereCondition.OR = [
        { orderNumber: { contains: search } },
        { customerLastName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        paymentRecords: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Accès interdit : session administrateur requise' }, { status: 401 });
  }

  // Aucun repli anonyme : l'action est imputée au compte administrateur connecté.
  const effectiveUser = user;

  try {
    const body = await request.json();
    const {
      orderId,
      receivedAmount,
      bankReference,
      receiptDate,
      isVerified,
      proofDocumentUrl,
      notes,
    } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecords: true,
        deliveryShipment: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const numericReceived = parseFloat(receivedAmount);
    let newPaymentStatus = order.paymentStatus;

    if (isVerified) {
      if (numericReceived >= order.totalAmount) {
        newPaymentStatus = 'PAYMENT_VERIFIED';
      } else if (numericReceived > 0) {
        newPaymentStatus = 'PARTIALLY_PAID';
      }
    } else {
      newPaymentStatus = 'PENDING_TRANSFER';
    }

    // 1. Create or update payment record
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        orderId: order.id,
        expectedAmount: order.totalAmount,
        receivedAmount: numericReceived,
        bankReference: bankReference || null,
        receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
        isVerified: !!isVerified,
        verifiedByUserId: effectiveUser.id,
        verifiedAt: isVerified ? new Date() : null,
        proofDocumentUrl: proofDocumentUrl || null,
        notes: notes || null,
      },
    });

    // 2. Update order payment status
    const previousPaymentStatus = order.paymentStatus;
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newPaymentStatus,
      },
      include: {
        paymentRecords: true,
        deliveryShipment: true,
      },
    });

    // 3. Log Status change in history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: previousPaymentStatus,
        newStatus: newPaymentStatus,
        statusType: 'PAYMENT',
        changedBy: `${effectiveUser.firstName} ${effectiveUser.lastName} (${effectiveUser.role})`,
        reason: `Rapprochement bancaire : réf ${bankReference || 'N/A'}, montant ${numericReceived} ${order.currency}.`,
      },
    });

    // 4. Record audit log
    await prisma.auditLog.create({
      data: {
        userId: effectiveUser.id,
        action: 'PAYMENT_RECONCILIATION_CONFIRMED',
        resourceType: 'Order',
        resourceId: order.id,
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          expectedAmount: order.totalAmount,
          receivedAmount: numericReceived,
          bankReference,
          isVerified,
        }),
      },
    });

    // 5. If payment is verified, dispatch Email 3 (Confirmation de paiement)
    if (isVerified && newPaymentStatus === 'PAYMENT_VERIFIED') {
      const siteSettings = await getSiteSettings();
      const email3 = generateEmailTemplate(3, {
        siteSettings,
        order: updatedOrder,
      });

      await dispatchTransactionalEmail({
        templateId: 3,
        recipientEmail: order.customerEmail,
        orderId: order.id,
        subject: email3.subject,
        htmlContent: email3.htmlContent,
        textContent: email3.textContent,
        idempotencyKey: `email-3-${order.orderNumber}-${Date.now()}`,
      });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      paymentRecord,
    });
  } catch (error: any) {
    console.error('Reconciliation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
