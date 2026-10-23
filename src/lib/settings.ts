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
  siteName: 'Allo Maison',
  slogan: 'Votre spécialiste du bois de chauffage de qualité supérieure',
  logoUrl: '/logo.svg',
  faviconUrl: '/favicon.ico',
  emailLogoUrl: '/email-logo.png',
  primaryColor: '#14532d',
  secondaryColor: '#7c4a2d',
  accentColor: '#ea580c',
  fontFamily: 'Inter, system-ui, sans-serif',
  companyName: 'Allo Maison Distribution SAS',
  companySiret: '892 341 982 00019',
  companyVatNumber: 'FR 34 892341982',
  companyAddress: '14 Rue des Scieries, 88200 Remiremont, France',
  companyPhone: '+33 (0)3 29 00 12 34',
  companyEmail: 'contact@allomaison-bois.fr',
  supportHours: 'Du Lundi au Vendredi de 8h00 à 19h00, Samedi de 8h30 à 13h00',
  bankName: 'BNP Paribas France',
  bankBeneficiary: 'ALLO MAISON DISTRIBUTION SAS',
  bankIban: 'FR76 3000 4012 3400 0123 4567 890',
  bankBic: 'BNPAFRPP',
  bankTransferDeadlineDays: 5,
  bankInstructions: 'Veuillez indiquer impérativement votre référence de commande dans le libellé de votre virement bancaire pour un traitement sous 24h ouvrées.',
  supportedCountries: ['FR', 'DE', 'BE', 'CH'],
  supportedCurrencies: ['EUR', 'CHF'],
  defaultCurrency: 'EUR',
  activeLanguages: ['fr', 'de', 'nl'],
  cgvText: 'Conditions Générales de Vente d\'Allo Maison - Spécialiste Bois de Chauffage...',
  privacyPolicyText: 'Politique de confidentialité conforme RGPD...',
  cookiePolicyText: 'Politique relative aux cookies...',
  legalMentionsText: 'Mentions Légales - Allo Maison Distribution SAS au capital de 50 000€...',
  deliveryPolicyText: 'Modalités de livraison : Livraison par camion porteur 19T ou 26T équipé d\'un hayon et transpalette tout terrain...',
  seoTitle: 'Allo Maison | Bois de chauffage sec, étuvé et certifié livré chez vous',
  seoDescription: 'Commandez en ligne votre bois de chauffage premium : chêne, hêtre, charme séché sous 20% d\'humidité. Livraison à domicile avec hayon.',
  socialLinks: {
    facebook: 'https://facebook.com/allomaison',
    instagram: 'https://instagram.com/allomaison',
  },
  freeShippingThreshold: 650.0,
  emailProvider: 'log',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'contact@allomaison-bois.fr',
  smtpFrom: 'Allo Maison Bois <contact@allomaison-bois.fr>',
  adminNotificationEmail: 'commandes@allomaison-bois.fr',
  isPublished: true,
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const raw = await prisma.siteSetting.findFirst();
    if (!raw) return DEFAULT_SITE_SETTINGS;

    return {
      ...raw,
      supportedCountries: JSON.parse(raw.supportedCountries || '["FR","DE","BE","CH"]'),
      supportedCurrencies: JSON.parse(raw.supportedCurrencies || '["EUR","CHF"]'),
      activeLanguages: JSON.parse(raw.activeLanguages || '["fr","de","nl"]'),
      socialLinks: JSON.parse(raw.socialLinks || '{}'),
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
