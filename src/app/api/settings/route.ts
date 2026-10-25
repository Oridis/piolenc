import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSiteSettings,
  DEFAULT_SITE_SETTINGS,
  syncSettingsTextForUpdate,
} from '@/lib/settings';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // In strict production mode with user logged in, verify permissions
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const existing: any = await prisma.siteSetting.findUnique({
      where: { id: 'default-settings' },
    });

    const countriesStr = Array.isArray(body.supportedCountries)
      ? JSON.stringify(body.supportedCountries)
      : (typeof body.supportedCountries === 'string' ? body.supportedCountries : '["FR","DE","BE","CH"]');
    const currenciesStr = Array.isArray(body.supportedCurrencies)
      ? JSON.stringify(body.supportedCurrencies)
      : (typeof body.supportedCurrencies === 'string' ? body.supportedCurrencies : '["EUR","CHF"]');
    const languagesStr = Array.isArray(body.activeLanguages)
      ? JSON.stringify(body.activeLanguages)
      : (typeof body.activeLanguages === 'string' ? body.activeLanguages : '["fr","de","nl"]');
    const socialLinksStr = typeof body.socialLinks === 'object'
      ? JSON.stringify(body.socialLinks)
      : (typeof body.socialLinks === 'string' ? body.socialLinks : '{}');

    const updateData: Record<string, any> = {
      siteName: body.siteName ?? 'piolencboisdirect',
      slogan: body.slogan ?? '',
      logoUrl: body.logoUrl ?? '',
      faviconUrl: body.faviconUrl ?? '',
      emailLogoUrl: body.emailLogoUrl ?? '',
      primaryColor: body.primaryColor ?? '#14532d',
      secondaryColor: body.secondaryColor ?? '#7c4a2d',
      accentColor: body.accentColor ?? '#ea580c',
      companyName: body.companyName ?? '',
      companySiret: body.companySiret ?? '',
      companyVatNumber: body.companyVatNumber ?? '',
      companyAddress: body.companyAddress ?? '',
      companyPhone: body.companyPhone ?? '',
      companyEmail: body.companyEmail ?? '',
      supportHours: body.supportHours ?? '',
      deliveryZonesText: body.deliveryZonesText ?? DEFAULT_SITE_SETTINGS.deliveryZonesText,
      bankName: body.bankName ?? '',
      bankBeneficiary: body.bankBeneficiary ?? '',
      bankIban: body.bankIban ?? '',
      bankBic: body.bankBic ?? '',
      bankTransferDeadlineDays: Number(body.bankTransferDeadlineDays || 5),
      bankInstructions: body.bankInstructions ?? '',
      supportedCountries: countriesStr as any,
      supportedCurrencies: currenciesStr as any,
      activeLanguages: languagesStr as any,
      socialLinks: socialLinksStr as any,
      freeShippingThreshold: Number(body.freeShippingThreshold || 650),
      emailProvider: body.emailProvider || 'log',
      smtpHost: body.smtpHost ?? '',
      smtpPort: Number(body.smtpPort || 587),
      smtpUser: body.smtpUser ?? '',
      smtpPassword: body.smtpPassword ?? '',
      smtpFrom: body.smtpFrom ?? '',
      adminNotificationEmail: body.adminNotificationEmail ?? '',
      cgvText: syncSettingsTextForUpdate(
        body.cgvText ?? existing?.cgvText ?? DEFAULT_SITE_SETTINGS.cgvText,
        existing,
        body
      ),
      privacyPolicyText: syncSettingsTextForUpdate(
        body.privacyPolicyText ?? existing?.privacyPolicyText ?? DEFAULT_SITE_SETTINGS.privacyPolicyText,
        existing,
        body
      ),
      cookiePolicyText: syncSettingsTextForUpdate(
        body.cookiePolicyText ?? existing?.cookiePolicyText ?? DEFAULT_SITE_SETTINGS.cookiePolicyText,
        existing,
        body
      ),
      legalMentionsText: syncSettingsTextForUpdate(
        body.legalMentionsText ?? existing?.legalMentionsText ?? DEFAULT_SITE_SETTINGS.legalMentionsText,
        existing,
        body
      ),
      deliveryPolicyText: syncSettingsTextForUpdate(
        body.deliveryPolicyText ?? existing?.deliveryPolicyText ?? DEFAULT_SITE_SETTINGS.deliveryPolicyText,
        existing,
        body
      ),
      seoTitle: body.seoTitle ?? '',
      seoDescription: body.seoDescription ?? '',
      isPublished: true,
    };

    // Use update or create based on whether settings exist
    // Note: Prisma schema has supportedCountries as String (JSON), 
    // but SiteSettingsData expects string[]. We use as any to bypass type check.
    let updated: any;
    if (existing) {
      updated = await prisma.siteSetting.update({
        where: { id: 'default-settings' },
        data: updateData as any,
      });
    } else {
      updated = await prisma.siteSetting.create({
        data: {
          id: 'default-settings',
          ...updateData,
        } as any,
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        action: 'SITE_SETTINGS_UPDATED',
        resourceType: 'SiteSetting',
        resourceId: updated.id,
        details: JSON.stringify({ siteName: updated.siteName, logoUrl: updated.logoUrl ? 'custom' : 'none' }),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur' }, { status: 500 });
  }
}
