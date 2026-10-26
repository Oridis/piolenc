import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSiteSettings,
  DEFAULT_SITE_SETTINGS,
  syncSettingsTextForUpdate,
  clearSiteSettingsCache,
} from '@/lib/settings';
import { getAdminUser } from '@/lib/auth';

/**
 * Champs strictement serveur : ils ne doivent jamais sortir dans une réponse
 * publique. Cette route est lue par des composants clients (barre de
 * navigation, pages légales) et renvoyait auparavant tout l'enregistrement,
 * y compris le mot de passe SMTP.
 */
const PRIVATE_SETTINGS_FIELDS = ['smtpPassword', 'smtpUser', 'smtpHost', 'smtpPort'] as const;

function toPublicSettings(settings: Record<string, any>) {
  const publicSettings: Record<string, any> = { ...settings };
  for (const field of PRIVATE_SETTINGS_FIELDS) {
    delete publicSettings[field];
  }
  return publicSettings;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(toPublicSettings(settings));
}

export async function PUT(request: Request) {
  try {
    // Test inversé corrigé : un visiteur anonyme (user === null) passait
    // auparavant les contrôles et pouvait réécrire tout le paramétrage du site,
    // y compris l'IBAN de règlement et les identifiants SMTP.
    const user = await getAdminUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'CONTENT_MANAGER')) {
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
      // Quand le formulaire ne transmet pas encore le champ (client plus
      // ancien), on conserve la valeur enregistrée plutôt que de la réinitialiser.
      // « showSiteName » ne concerne que l'en-tête ; le pied de page a son
      // propre réglage pour pouvoir garder le logo seul en haut et le texte en bas.
      showSiteName: body.showSiteName ?? existing?.showSiteName ?? true,
      showSiteNameFooter: body.showSiteNameFooter ?? existing?.showSiteNameFooter ?? true,
      faviconUrl: body.faviconUrl ?? '',
      emailLogoUrl: body.emailLogoUrl ?? '',
      // Hero de la page d'accueil. Un champ laissé vide masque l'élément
      // correspondant ; le titre et le visuel, eux, retombent sur la valeur par
      // défaut pour ne jamais laisser un hero sans accroche ni image.
      heroBadge: body.heroBadge ?? existing?.heroBadge ?? DEFAULT_SITE_SETTINGS.heroBadge,
      heroTitle:
        (typeof body.heroTitle === 'string' && body.heroTitle.trim()) ||
        existing?.heroTitle ||
        DEFAULT_SITE_SETTINGS.heroTitle,
      heroSubtitle: body.heroSubtitle ?? existing?.heroSubtitle ?? DEFAULT_SITE_SETTINGS.heroSubtitle,
      heroPrimaryLabel:
        body.heroPrimaryLabel ?? existing?.heroPrimaryLabel ?? DEFAULT_SITE_SETTINGS.heroPrimaryLabel,
      heroPrimaryHref: body.heroPrimaryHref ?? existing?.heroPrimaryHref ?? DEFAULT_SITE_SETTINGS.heroPrimaryHref,
      heroSecondaryLabel:
        body.heroSecondaryLabel ?? existing?.heroSecondaryLabel ?? DEFAULT_SITE_SETTINGS.heroSecondaryLabel,
      heroSecondaryHref:
        body.heroSecondaryHref ?? existing?.heroSecondaryHref ?? DEFAULT_SITE_SETTINGS.heroSecondaryHref,
      heroImageUrl:
        (typeof body.heroImageUrl === 'string' && body.heroImageUrl.trim()) ||
        existing?.heroImageUrl ||
        DEFAULT_SITE_SETTINGS.heroImageUrl,
      heroImageCaption:
        body.heroImageCaption ?? existing?.heroImageCaption ?? DEFAULT_SITE_SETTINGS.heroImageCaption,
      heroImageCaptionSub:
        body.heroImageCaptionSub ?? existing?.heroImageCaptionSub ?? DEFAULT_SITE_SETTINGS.heroImageCaptionSub,
      heroImageBadge: body.heroImageBadge ?? existing?.heroImageBadge ?? DEFAULT_SITE_SETTINGS.heroImageBadge,
      heroFact1Value: body.heroFact1Value ?? existing?.heroFact1Value ?? DEFAULT_SITE_SETTINGS.heroFact1Value,
      heroFact1Label: body.heroFact1Label ?? existing?.heroFact1Label ?? DEFAULT_SITE_SETTINGS.heroFact1Label,
      heroFact2Value: body.heroFact2Value ?? existing?.heroFact2Value ?? DEFAULT_SITE_SETTINGS.heroFact2Value,
      heroFact2Label: body.heroFact2Label ?? existing?.heroFact2Label ?? DEFAULT_SITE_SETTINGS.heroFact2Label,
      heroFact3Value: body.heroFact3Value ?? existing?.heroFact3Value ?? DEFAULT_SITE_SETTINGS.heroFact3Value,
      heroFact3Label: body.heroFact3Label ?? existing?.heroFact3Label ?? DEFAULT_SITE_SETTINGS.heroFact3Label,
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

    // Les identifiants du serveur d'envoi ne sont jamais renvoyés au navigateur
    // (voir PRIVATE_SETTINGS_FIELDS) : on ne les remplace que si le formulaire
    // les fournit réellement. Auparavant, un simple enregistrement de la page
    // de personnalisation effaçait l'hôte, l'utilisateur et le mot de passe
    // SMTP déjà configurés.
    for (const field of ['smtpHost', 'smtpUser', 'smtpPassword'] as const) {
      const submitted = body[field];
      if (typeof submitted === 'string' && submitted !== '') {
        updateData[field] = submitted;
      } else {
        updateData[field] = typeof existing?.[field] === 'string' ? existing[field] : '';
      }
    }
    updateData.smtpPort =
      Number(body.smtpPort) > 0 ? Number(body.smtpPort) : (existing?.smtpPort ?? 587);

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

    // Le paramétrage est mis en cache 5 minutes en mémoire : sans cette
    // invalidation, le site continuait d'afficher l'ancien nom, l'ancien logo
    // ou l'ancien réglage juste après l'enregistrement par l'exploitant.
    clearSiteSettingsCache();

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        action: 'SITE_SETTINGS_UPDATED',
        resourceType: 'SiteSetting',
        resourceId: updated.id,
        details: JSON.stringify({
          siteName: updated.siteName,
          logoUrl: updated.logoUrl ? 'custom' : 'none',
          showSiteNameHeader: updated.showSiteName !== false,
          showSiteNameFooter: updated.showSiteNameFooter !== false,
        }),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur' }, { status: 500 });
  }
}
