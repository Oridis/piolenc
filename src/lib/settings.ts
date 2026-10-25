import { prisma } from './prisma';

export interface SiteSettingsData {
  id: string;
  siteName: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  emailLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  companyName: string;
  companySiret: string;
  companyVatNumber: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  supportHours: string;
  deliveryZonesText: string;
  bankName: string;
  bankBeneficiary: string;
  bankIban: string;
  bankBic: string;
  bankTransferDeadlineDays: number;
  bankInstructions: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  defaultCurrency: string;
  activeLanguages: string[];
  cgvText: string;
  privacyPolicyText: string;
  cookiePolicyText: string;
  legalMentionsText: string;
  deliveryPolicyText: string;
  seoTitle: string;
  seoDescription: string;
  socialLinks: Record<string, string>;
  freeShippingThreshold: number;
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpFrom: string;
  adminNotificationEmail: string;
  isPublished: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  id: 'default-settings',
  siteName: 'piolencboisdirect',
  slogan: 'Votre spécialiste du bois de chauffage premium',
  logoUrl: '/logo.svg',
  faviconUrl: '/favicon.ico',
  emailLogoUrl: '/email-logo.png',
  primaryColor: '#14532d',
  secondaryColor: '#7c4a2d',
  accentColor: '#ea580c',
  fontFamily: 'Inter, system-ui, sans-serif',
  companyName: 'Piolenc Bois Direct SAS',
  companySiret: '892 341 982 00019',
  companyVatNumber: 'FR 34 892341982',
  companyAddress: '14 Rue des Scieries, 88200 Remiremont, France',
  companyPhone: '+33 (0)3 29 00 12 34',
  companyEmail: 'contact@woodmachine-bois.fr',
  supportHours: 'Du Lundi au Vendredi de 8h00 à 19h00, Samedi de 8h30 à 13h00',
  deliveryZonesText: 'France métropolitaine, Belgique, Allemagne, Suisse',
  bankName: 'BNP Paribas France',
  bankBeneficiary: 'Piolenc Bois Direct SAS',
  bankIban: 'FR76 3000 4012 3400 0123 4567 890',
  bankBic: 'BNPAFRPP',
  bankTransferDeadlineDays: 5,
  bankInstructions: 'Veuillez indiquer impérativement votre référence de commande dans le libellé de votre virement bancaire pour un traitement sous 24h ouvrées.',
  supportedCountries: ['FR', 'DE', 'BE', 'CH'],
  supportedCurrencies: ['EUR', 'CHF'],
  defaultCurrency: 'EUR',
  activeLanguages: ['fr', 'de', 'nl'],
  cgvText: 'Conditions Générales de Vente de {{siteName}} - Spécialiste Bois de Chauffage...',
  privacyPolicyText: 'Politique de confidentialité de {{siteName}} conforme RGPD...',
  cookiePolicyText: 'Politique relative aux cookies de {{siteName}}...',
  legalMentionsText: 'Mentions Légales - {{companyName}} - {{companyAddress}} - {{companyEmail}}...',
  deliveryPolicyText: 'Modalités de livraison : Livraison par camion porteur 19T ou 26T équipé d\'un hayon et transpalette tout terrain...',
  seoTitle: 'piolencboisdirect | Bois de chauffage sec, étuvé et certifié livré chez vous',
  seoDescription: 'Commandez en ligne votre bois de chauffage premium : chêne, hêtre, charme séché sous 20% d\'humidité. Livraison à domicile avec hayon.',
  socialLinks: {
    facebook: 'https://facebook.com/woodmachine',
    instagram: 'https://instagram.com/woodmachine',
  },
  freeShippingThreshold: 650.0,
  emailProvider: 'log',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'contact@woodmachine-bois.fr',
  smtpFrom: 'Piolenc Bois Direct <contact@woodmachine-bois.fr>',
  adminNotificationEmail: 'commandes@woodmachine.fr',
  isPublished: true,
};

const SETTINGS_TEXT_PLACEHOLDERS: Record<string, keyof SiteSettingsData> = {
  siteName: 'siteName',
  companyName: 'companyName',
  companyAddress: 'companyAddress',
  companyPhone: 'companyPhone',
  companyEmail: 'companyEmail',
  companySiret: 'companySiret',
  companyVatNumber: 'companyVatNumber',
  supportHours: 'supportHours',
  deliveryZones: 'deliveryZonesText',
  deliveryZonesText: 'deliveryZonesText',
};

export function applySiteSettingsToText(
  text: string | null | undefined,
  settings: Partial<SiteSettingsData>
): string {
  if (!text) return '';

  let result = text.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key: string) => {
    const settingKey = SETTINGS_TEXT_PLACEHOLDERS[key];
    const value = settingKey ? settings[settingKey] : undefined;
    return typeof value === 'string' ? value : match;
  });

  // Preserve the company legal name while replacing the shorter brand name.
  const companyNameToken = '\u0000COMPANY_NAME\u0000';
  result = result.split(DEFAULT_SITE_SETTINGS.companyName).join(companyNameToken);

  const legacyReplacements: Array<[string, string | undefined]> = [
    [DEFAULT_SITE_SETTINGS.siteName, settings.siteName],
    [DEFAULT_SITE_SETTINGS.companyAddress, settings.companyAddress],
    [DEFAULT_SITE_SETTINGS.companyEmail, settings.companyEmail],
    [DEFAULT_SITE_SETTINGS.companyPhone, settings.companyPhone],
    [DEFAULT_SITE_SETTINGS.companySiret, settings.companySiret],
    [DEFAULT_SITE_SETTINGS.companyVatNumber, settings.companyVatNumber],
    [DEFAULT_SITE_SETTINGS.deliveryZonesText, settings.deliveryZonesText ?? ''],
  ];

  for (const [legacyValue, currentValue] of legacyReplacements) {
    if (legacyValue && currentValue !== undefined && legacyValue !== currentValue) {
      result = result.split(legacyValue).join(currentValue || '');
    }
  }

  return result
    .split(companyNameToken)
    .join(settings.companyName || DEFAULT_SITE_SETTINGS.companyName);
}

export function syncSettingsTextForUpdate(
  text: string | null | undefined,
  previousSettings: Partial<SiteSettingsData> | null | undefined,
  nextSettings: Partial<SiteSettingsData>
): string {
  let result = applySiteSettingsToText(text, nextSettings);

  const fields: Array<keyof SiteSettingsData> = [
    'companyName',
    'siteName',
    'companyAddress',
    'companyEmail',
    'companyPhone',
    'companySiret',
    'companyVatNumber',
    'deliveryZonesText',
  ];

  for (const field of fields) {
    const previousValue = previousSettings?.[field];
    const nextValue = nextSettings[field];

    if (
      typeof previousValue === 'string' &&
      typeof nextValue === 'string' &&
      previousValue.trim() &&
      previousValue !== nextValue
    ) {
      result = result.split(previousValue).join(nextValue);
    }
  }

  return result;
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const raw = await prisma.siteSetting.findFirst();
    if (!raw) return DEFAULT_SITE_SETTINGS;

    return {
      ...raw,
      siteName: raw.siteName ?? DEFAULT_SITE_SETTINGS.siteName,
      slogan: raw.slogan ?? DEFAULT_SITE_SETTINGS.slogan,
      logoUrl: raw.logoUrl ?? DEFAULT_SITE_SETTINGS.logoUrl,
      faviconUrl: raw.faviconUrl ?? DEFAULT_SITE_SETTINGS.faviconUrl,
      emailLogoUrl: raw.emailLogoUrl ?? DEFAULT_SITE_SETTINGS.emailLogoUrl,
      primaryColor: raw.primaryColor ?? DEFAULT_SITE_SETTINGS.primaryColor,
      secondaryColor: raw.secondaryColor ?? DEFAULT_SITE_SETTINGS.secondaryColor,
      accentColor: raw.accentColor ?? DEFAULT_SITE_SETTINGS.accentColor,
      fontFamily: raw.fontFamily ?? DEFAULT_SITE_SETTINGS.fontFamily,
      companyName: raw.companyName ?? DEFAULT_SITE_SETTINGS.companyName,
      companySiret: raw.companySiret ?? DEFAULT_SITE_SETTINGS.companySiret,
      companyVatNumber: raw.companyVatNumber ?? DEFAULT_SITE_SETTINGS.companyVatNumber,
      companyAddress: raw.companyAddress ?? DEFAULT_SITE_SETTINGS.companyAddress,
      companyPhone: raw.companyPhone ?? DEFAULT_SITE_SETTINGS.companyPhone,
      companyEmail: raw.companyEmail ?? DEFAULT_SITE_SETTINGS.companyEmail,
      supportHours: raw.supportHours ?? DEFAULT_SITE_SETTINGS.supportHours,
      deliveryZonesText: raw.deliveryZonesText ?? DEFAULT_SITE_SETTINGS.deliveryZonesText,
      bankName: raw.bankName ?? DEFAULT_SITE_SETTINGS.bankName,
      bankBeneficiary: raw.bankBeneficiary ?? DEFAULT_SITE_SETTINGS.bankBeneficiary,
      bankIban: raw.bankIban ?? DEFAULT_SITE_SETTINGS.bankIban,
      bankBic: raw.bankBic ?? DEFAULT_SITE_SETTINGS.bankBic,
      bankTransferDeadlineDays: raw.bankTransferDeadlineDays ?? DEFAULT_SITE_SETTINGS.bankTransferDeadlineDays,
      bankInstructions: raw.bankInstructions ?? DEFAULT_SITE_SETTINGS.bankInstructions,
      supportedCountries: JSON.parse(raw.supportedCountries || '["FR","DE","BE","CH"]'),
      supportedCurrencies: JSON.parse(raw.supportedCurrencies || '["EUR","CHF"]'),
      defaultCurrency: raw.defaultCurrency ?? DEFAULT_SITE_SETTINGS.defaultCurrency,
      activeLanguages: JSON.parse(raw.activeLanguages || '["fr","de","nl"]'),
      cgvText: raw.cgvText ?? DEFAULT_SITE_SETTINGS.cgvText,
      privacyPolicyText: raw.privacyPolicyText ?? DEFAULT_SITE_SETTINGS.privacyPolicyText,
      cookiePolicyText: raw.cookiePolicyText ?? DEFAULT_SITE_SETTINGS.cookiePolicyText,
      legalMentionsText: raw.legalMentionsText ?? DEFAULT_SITE_SETTINGS.legalMentionsText,
      deliveryPolicyText: raw.deliveryPolicyText ?? DEFAULT_SITE_SETTINGS.deliveryPolicyText,
      seoTitle: raw.seoTitle ?? DEFAULT_SITE_SETTINGS.seoTitle,
      seoDescription: raw.seoDescription ?? DEFAULT_SITE_SETTINGS.seoDescription,
      socialLinks: JSON.parse(raw.socialLinks || '{}'),
      freeShippingThreshold: raw.freeShippingThreshold ?? DEFAULT_SITE_SETTINGS.freeShippingThreshold,
      emailProvider: raw.emailProvider ?? DEFAULT_SITE_SETTINGS.emailProvider,
      smtpHost: raw.smtpHost ?? DEFAULT_SITE_SETTINGS.smtpHost,
      smtpPort: raw.smtpPort ?? DEFAULT_SITE_SETTINGS.smtpPort,
      smtpUser: raw.smtpUser ?? DEFAULT_SITE_SETTINGS.smtpUser,
      smtpPassword: raw.smtpPassword ?? DEFAULT_SITE_SETTINGS.smtpPassword,
      adminNotificationEmail: raw.adminNotificationEmail ?? DEFAULT_SITE_SETTINGS.adminNotificationEmail,
      isPublished: raw.isPublished ?? DEFAULT_SITE_SETTINGS.isPublished,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
