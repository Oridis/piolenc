import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '@/lib/settings';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const updated = await prisma.siteSetting.upsert({
      where: { id: 'default-settings' },
      update: {
        siteName: body.siteName,
        slogan: body.slogan,
        logoUrl: body.logoUrl,
        faviconUrl: body.faviconUrl,
        emailLogoUrl: body.emailLogoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        companyName: body.companyName,
        companySiret: body.companySiret,
        companyVatNumber: body.companyVatNumber,
        companyAddress: body.companyAddress,
        companyPhone: body.companyPhone,
        companyEmail: body.companyEmail,
        supportHours: body.supportHours,
        bankName: body.bankName,
        bankBeneficiary: body.bankBeneficiary,
        bankIban: body.bankIban,
        bankBic: body.bankBic,
        bankTransferDeadlineDays: Number(body.bankTransferDeadlineDays || 5),
        bankInstructions: body.bankInstructions,
        freeShippingThreshold: Number(body.freeShippingThreshold || 650),
        emailProvider: body.emailProvider || 'log',
        smtpHost: body.smtpHost,
        smtpPort: Number(body.smtpPort || 587),
        smtpUser: body.smtpUser,
        smtpPassword: body.smtpPassword,
        smtpFrom: body.smtpFrom,
        adminNotificationEmail: body.adminNotificationEmail,
        cgvText: body.cgvText,
        privacyPolicyText: body.privacyPolicyText,
        cookiePolicyText: body.cookiePolicyText,
        legalMentionsText: body.legalMentionsText,
        deliveryPolicyText: body.deliveryPolicyText,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        isPublished: true,
      },
      create: {
        id: 'default-settings',
        ...body,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SITE_SETTINGS_UPDATED',
        resourceType: 'SiteSetting',
        resourceId: updated.id,
        details: JSON.stringify({ siteName: body.siteName, bankIban: body.bankIban }),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
