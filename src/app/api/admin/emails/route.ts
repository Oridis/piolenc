import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { dispatchTransactionalEmail } from '@/lib/email';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  try {
    const whereCondition: any = {};
    if (status) {
      whereCondition.status = status;
    }
    if (search) {
      whereCondition.OR = [
        { recipientEmail: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    const emails = await prisma.emailLog.findMany({
      where: whereCondition,
      include: {
        order: {
          select: { orderNumber: true, customerFirstName: true, customerLastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const counts = {
      total: await prisma.emailLog.count(),
      sent: await prisma.emailLog.count({ where: { status: 'SENT' } }),
      failed: await prisma.emailLog.count({ where: { status: 'FAILED' } }),
      queued: await prisma.emailLog.count({ where: { status: 'QUEUED' } }),
    };

    return NextResponse.json({ emails, counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const { emailId } = await request.json();
    const emailLog = await prisma.emailLog.findUnique({
      where: { id: emailId },
    });

    if (!emailLog) {
      return NextResponse.json({ error: 'Journal email introuvable' }, { status: 404 });
    }

    // Retrigger sending with new timestamp to bypass old idempotency
    const result = await dispatchTransactionalEmail({
      templateId: emailLog.templateId,
      recipientEmail: emailLog.recipientEmail,
      orderId: emailLog.orderId || undefined,
      subject: emailLog.subject,
      htmlContent: emailLog.contentHtml || '',
      textContent: emailLog.contentText || '',
      idempotencyKey: `resend-${emailLog.id}-${Date.now()}`,
    });

    return NextResponse.json({ success: result.success, message: result.message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
