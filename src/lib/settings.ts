import { prisma } from './prisma';

// Dernière copie lue des réglages : elle sert UNIQUEMENT de secours si la base
// est injoignable, jamais de source fraîche. Le cache à durée de vie (5 minutes)
// a été retiré : Turbopack exécute les routes API et le rendu des pages dans des
// processus distincts, donc vider un cache en mémoire après un enregistrement ne
// touchait pas le processus qui affiche le site. L'exploitant continuait de voir
// l'ancien nom, l'ancien logo ou l'ancien texte jusqu'à 5 minutes.
let siteSettingsFallback: SiteSettingsData | null = null;

export interface SiteSettingsData {
  id: string;
  siteName: string;
  slogan: string;
  logoUrl: string;
  /** Afficher le nom du site à côté du logo dans l'en-tête (quand un logo est défini). */
  showSiteName: boolean;
  /**
   * Même réglage, mais pour le pied de page : l'exploitant peut ne garder que
   * le logo image en haut et le texte seul en bas (ou l'inverse).
   */
  showSiteNameFooter: boolean;
  faviconUrl: string;
  emailLogoUrl: string;
  /** Contenu du hero de la page d'accueil, éditable depuis l'administration. */
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  heroImageUrl: string;
  heroImageCaption: string;
  heroImageCaptionSub: string;
  heroImageBadge: string;
  heroFact1Value: string;
  heroFact1Label: string;
  heroFact2Value: string;
  heroFact2Label: string;
  heroFact3Value: string;
  heroFact3Label: string;
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
  showSiteName: true,
  showSiteNameFooter: true,
  faviconUrl: '/favicon.ico',
  emailLogoUrl: '/email-logo.png',
  heroBadge: "Bois sec étuvé certifié NF H1 · Taux d'humidité inférieur à 20%",
  heroTitle: 'Bois de chauffage haute performance livré sur palette à domicile',
  heroSubtitle:
    'Approvisionnement direct en palettes de bois dur (chêne, charme, hêtre) séché en étuve biomasse. Allumage immédiat, haut pouvoir calorifique garanti et livraison par camion avec hayon et transpalette.',
  heroPrimaryLabel: 'Consulter le catalogue',
  heroPrimaryHref: '/boutique',
  heroSecondaryLabel: 'Calculer les frais de port',
  heroSecondaryHref: '/calculateurs/livraison',
  heroImageUrl: '/images/hero.webp',
  heroImageCaption: 'Palettes filmées & cerclées',
  heroImageCaptionSub: 'Bûches 25 cm, 33 cm et 50 cm disponibles',
  heroImageBadge: 'Stock disponible',
  heroFact1Value: '2 000 kWh',
  heroFact1Label: 'Énergie par stère',
  heroFact2Value: '< 20%',
  heroFact2Label: 'Humidité contrôlée',
  heroFact3Value: 'Hayon inclus',
  heroFact3Label: 'Dépose à votre abri',
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

  let result = text.replace(/\{\{\s*([\w]+)\s\}\}/g, (match, key: string) => {
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

/**
 * Les zones de livraison peuvent être saisies/libellisées soit en texte libre,
 * soit sous la forme d'une liste de pays (["FR","DE",...]) héritée des
 * enregistrements d'amorçage. On restitue toujours une phrase lisible: sans
 * cela, un tableau JSON brut s'affichait tel quel aux visiteurs du site.
 */
const COUNTRY_LABELS: Record<string, string> = {
  FR: 'France métropolitaine',
  BE: 'Belgique',
  DE: 'Allemagne',
  CH: 'Suisse',
  LU: 'Luxembourg',
  NL: 'Pays-Bas',
  IT: 'Italie',
  ES: 'Espagne',
};

export function formatDeliveryZones(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) return DEFAULT_SITE_SETTINGS.deliveryZonesText;
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const labels = parsed.map((code) => COUNTRY_LABELS[String(code).toUpperCase()] ?? String(code));
        return labels.join(', ');
      }
    } catch {
      // valeur texte qui commence par un crochet: on la garde telle quelle
    }
  }
  return raw;
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

/**
 * La configuration d'envoi d'e-mails peut être fournie par l'environnement
 * (.env). Elle est prioritaire sur la base, car les valeurs enregistrées ne
 * contiennent souvent que des exemples (smtp.example.com) : sans cela, un
 * réglage réel présent dans .env était ignoré et chaque envoi partait en
 * délai d'attente.
 */
function applyEmailEnvOverrides(settings: SiteSettingsData): SiteSettingsData {
  const pick = (fromEnv: string | undefined, fallback: string) => {
    const trimmed = fromEnv?.trim();
    return trimmed ? trimmed : fallback;
  };

  const envPort = Number(process.env.SMTP_PORT);

  return {
    ...settings,
    emailProvider: pick(process.env.EMAIL_PROVIDER, settings.emailProvider),
    smtpHost: pick(process.env.SMTP_HOST, settings.smtpHost),
    smtpPort: Number.isInteger(envPort) && envPort > 0 ? envPort : settings.smtpPort,
    smtpUser: pick(process.env.SMTP_USER, settings.smtpUser),
    smtpPassword: pick(process.env.SMTP_PASSWORD, settings.smtpPassword || ''),
    smtpFrom: pick(process.env.SMTP_FROM, settings.smtpFrom),
    adminNotificationEmail: pick(process.env.ADMIN_NOTIFICATION_EMAIL, settings.adminNotificationEmail),
  };
}

export async function getSiteSettings(_overwriteCache = false): Promise<SiteSettingsData> {
  // Relecture systématique : la table ne contient qu'une ligne et la recherche
  // se fait par clé primaire. Un enregistrement dans l'administration doit être
  // visible immédiatement sur le site.
  try {
    // Use targeted Prisma select to only fetch needed fields
    const raw = await prisma.siteSetting.findFirst({
      select: {
        id: true,
        siteName: true,
        slogan: true,
        logoUrl: true,
        showSiteName: true,
        showSiteNameFooter: true,
        faviconUrl: true,
        emailLogoUrl: true,
        heroBadge: true,
        heroTitle: true,
        heroSubtitle: true,
        heroPrimaryLabel: true,
        heroPrimaryHref: true,
        heroSecondaryLabel: true,
        heroSecondaryHref: true,
        heroImageUrl: true,
        heroImageCaption: true,
        heroImageCaptionSub: true,
        heroImageBadge: true,
        heroFact1Value: true,
        heroFact1Label: true,
        heroFact2Value: true,
        heroFact2Label: true,
        heroFact3Value: true,
        heroFact3Label: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
        companyName: true,
        companySiret: true,
        companyVatNumber: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        supportHours: true,
        deliveryZonesText: true,
        bankName: true,
        bankBeneficiary: true,
        bankIban: true,
        bankBic: true,
        bankTransferDeadlineDays: true,
        bankInstructions: true,
        supportedCountries: true,
        supportedCurrencies: true,
        defaultCurrency: true,
        activeLanguages: true,
        cgvText: true,
        privacyPolicyText: true,
        cookiePolicyText: true,
        legalMentionsText: true,
        deliveryPolicyText: true,
        seoTitle: true,
        seoDescription: true,
        socialLinks: true,
        freeShippingThreshold: true,
        emailProvider: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        smtpFrom: true,
        adminNotificationEmail: true,
        isPublished: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    if (!raw) {
      const defaults = applyEmailEnvOverrides(DEFAULT_SITE_SETTINGS);
      siteSettingsFallback = defaults;
      return defaults;
    }

    const result = {
      ...raw,
      siteName: raw.siteName ?? DEFAULT_SITE_SETTINGS.siteName,
      slogan: raw.slogan ?? DEFAULT_SITE_SETTINGS.slogan,
      logoUrl: raw.logoUrl ?? DEFAULT_SITE_SETTINGS.logoUrl,
      showSiteName: raw.showSiteName ?? DEFAULT_SITE_SETTINGS.showSiteName,
      showSiteNameFooter: raw.showSiteNameFooter ?? DEFAULT_SITE_SETTINGS.showSiteNameFooter,
      faviconUrl: raw.faviconUrl ?? DEFAULT_SITE_SETTINGS.faviconUrl,
      emailLogoUrl: raw.emailLogoUrl ?? DEFAULT_SITE_SETTINGS.emailLogoUrl,
      heroBadge: raw.heroBadge ?? DEFAULT_SITE_SETTINGS.heroBadge,
      heroTitle: raw.heroTitle ?? DEFAULT_SITE_SETTINGS.heroTitle,
      heroSubtitle: raw.heroSubtitle ?? DEFAULT_SITE_SETTINGS.heroSubtitle,
      heroPrimaryLabel: raw.heroPrimaryLabel ?? DEFAULT_SITE_SETTINGS.heroPrimaryLabel,
      heroPrimaryHref: raw.heroPrimaryHref ?? DEFAULT_SITE_SETTINGS.heroPrimaryHref,
      heroSecondaryLabel: raw.heroSecondaryLabel ?? DEFAULT_SITE_SETTINGS.heroSecondaryLabel,
      heroSecondaryHref: raw.heroSecondaryHref ?? DEFAULT_SITE_SETTINGS.heroSecondaryHref,
      heroImageUrl: raw.heroImageUrl ?? DEFAULT_SITE_SETTINGS.heroImageUrl,
      heroImageCaption: raw.heroImageCaption ?? DEFAULT_SITE_SETTINGS.heroImageCaption,
      heroImageCaptionSub: raw.heroImageCaptionSub ?? DEFAULT_SITE_SETTINGS.heroImageCaptionSub,
      heroImageBadge: raw.heroImageBadge ?? DEFAULT_SITE_SETTINGS.heroImageBadge,
      heroFact1Value: raw.heroFact1Value ?? DEFAULT_SITE_SETTINGS.heroFact1Value,
      heroFact1Label: raw.heroFact1Label ?? DEFAULT_SITE_SETTINGS.heroFact1Label,
      heroFact2Value: raw.heroFact2Value ?? DEFAULT_SITE_SETTINGS.heroFact2Value,
      heroFact2Label: raw.heroFact2Label ?? DEFAULT_SITE_SETTINGS.heroFact2Label,
      heroFact3Value: raw.heroFact3Value ?? DEFAULT_SITE_SETTINGS.heroFact3Value,
      heroFact3Label: raw.heroFact3Label ?? DEFAULT_SITE_SETTINGS.heroFact3Label,
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
      deliveryZonesText: formatDeliveryZones(raw.deliveryZonesText),
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
      smtpFrom: raw.smtpFrom ?? DEFAULT_SITE_SETTINGS.smtpFrom,
      adminNotificationEmail: raw.adminNotificationEmail ?? DEFAULT_SITE_SETTINGS.adminNotificationEmail,
      isPublished: raw.isPublished ?? DEFAULT_SITE_SETTINGS.isPublished,
    };

    const resolved = applyEmailEnvOverrides(result);
    // Conservé uniquement comme secours en cas de panne de la base.
    siteSettingsFallback = resolved;
    return resolved;
  } catch {
    // Base injoignable : mieux vaut la dernière copie connue que les valeurs par défaut.
    if (siteSettingsFallback && siteSettingsFallback.id) return siteSettingsFallback;
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Les réglages ne sont plus mis en cache : chaque lecture interroge la base.
 * Ces deux fonctions restent exposées (elles sont appelées après un
 * enregistrement depuis l'administration) et se contentent d'oublier la copie de
 * secours conservée pour le cas de panne.
 */
export function clearSiteSettingsCache() {
  siteSettingsFallback = null;
}

export function invalidateSiteSettingsCache() {
  clearSiteSettingsCache();
}

// Dernière copie lue des produits : secours si la base est injoignable.
// Aucune durée de vie : une modification faite dans l'administration (prix,
// stock, disponibilité) doit apparaître immédiatement sur la boutique.
let productsCache: any = null;

// Map Prisma Product fields to cache interface - using priceHT as the base price field
type ProductPrismaSelect = {
  id: string;
  reference: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  images: string;
  species: string;
  woodType: string;
  humidityRate: string;
  calorificValue: string;
  logLength: string;
  unit: string;
  priceHT: number;
  priceTTC: number;
  vatRate: number;
  promoPrice?: number | null;
  promoStartDate?: Date | null;
  promoEndDate?: Date | null;
  stock: number;
  reservedStock: number;
  weightKg: number;
  volumeM3: number;
  dimensions: string;
  packaging: string;
  isPreorderAllowed: boolean;
  allowedCountries: string;
  leadTimeDays: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Cache interface for products - used for rendering and text replacement
export interface ProductCacheData {
  id: string;
  reference: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string | null;
  images: string[];
  species: string;
  woodType: string;
  humidityRate: string;
  calorificValue: string;
  logLength: string;
  unit: string;
  priceHT: number;
  priceTTC: number;
  vatRate: number;
  promoPrice?: number | null;
  promoStartDate?: Date | null;
  promoEndDate?: Date | null;
  stock: number;
  reservedStock: number;
  weightKg: number;
  volumeM3: number;
  dimensions: string;
  packaging: string;
  isPreorderAllowed: boolean;
  allowedCountries: string;
  leadTimeDays: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PRODUCT_CACHE: ProductCacheData = {
  id: 'default-product',
  reference: '',
  slug: '',
  name: '',
  shortDescription: '',
  description: null,
  images: [],
  species: '',
  woodType: '',
  humidityRate: '',
  calorificValue: '',
  logLength: '',
  unit: '',
  priceHT: 0,
  priceTTC: 0,
  vatRate: 5.5,
  promoPrice: null,
  promoStartDate: null,
  promoEndDate: null,
  stock: 0,
  reservedStock: 0,
  weightKg: 900.0,
  volumeM3: 1.8,
  dimensions: '100 x 120 x 160 cm',
  packaging: '',
  isPreorderAllowed: false,
  allowedCountries: '[\"FR\",\"DE\",\"BE\",\"CH\"]',
  leadTimeDays: 4,
  seoTitle: null,
  seoDescription: null,
  isActive: false,
  categoryId: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PRODUCTS_TEXT_PLACEHOLDERS: Record<string, keyof ProductCacheData> = {
  name: 'name',
  slug: 'slug',
  price: 'priceHT',
};

export function applyProductTextToText(
  text: string | null | undefined,
  product: Partial<ProductCacheData>
): string {
  if (!text) return '';

  let result = text.replace(/\{\{\s*([\w]+)\s\}\}/g, (match, key: string) => {
    const productKey = PRODUCTS_TEXT_PLACEHOLDERS[key];
    const value = product[productKey];
    return typeof value === 'string' ? value : match;
  });

  return result;
}

// Extended select for getting full product data with relations
type ProductPrismaSelectFull = {
  id: true;
  reference: true;
  slug: true;
  name: true;
  shortDescription: true;
  description: true;
  images: true;
  species: true;
  woodType: true;
  humidityRate: true;
  calorificValue: true;
  logLength: true;
  unit: true;
  priceHT: true;
  priceTTC: true;
  vatRate: true;
  promoPrice: true;
  promoStartDate: true;
  promoEndDate: true;
  stock: true;
  reservedStock: true;
  weightKg: true;
  volumeM3: true;
  dimensions: true;
  packaging: true;
  isPreorderAllowed: true;
  allowedCountries: true;
  leadTimeDays: true;
  seoTitle: true;
  seoDescription: true;
  isActive: true;
  categoryId: true;
  createdAt: true;
  updatedAt: true;
};

export async function getProducts(_overwriteCache = false): Promise<ProductCacheData[]> {
  try {
    // Use targeted Prisma findMany to only fetch needed fields
    const raw = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        reference: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        images: true,
        species: true,
        woodType: true,
        humidityRate: true,
        calorificValue: true,
        logLength: true,
        unit: true,
        priceHT: true,
        priceTTC: true,
        vatRate: true,
        promoPrice: true,
        promoStartDate: true,
        promoEndDate: true,
        stock: true,
        reservedStock: true,
        weightKg: true,
        volumeM3: true,
        dimensions: true,
        packaging: true,
        isPreorderAllowed: true,
        allowedCountries: true,
        leadTimeDays: true,
        seoTitle: true,
        seoDescription: true,
        isActive: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform to cache format - convert images JSON string to array
    const transformed = raw.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    })) as ProductCacheData[];

    productsCache = transformed;
    return transformed;
  } catch {
    // Base injoignable : mieux vaut la dernière copie connue qu'un catalogue vide.
    if (productsCache && productsCache.length > 0) return productsCache;
    return [];
  }
}

/**
 * Les produits ne sont plus mis en cache : chaque lecture interroge la base.
 * Conservé pour les appels existants après un enregistrement dans l'administration.
 */
export function clearProductsCache() {
  productsCache = null;
}

export function invalidateProductsCache() {
  clearProductsCache();
}

// Dernière copie lue des catégories : secours si la base est injoignable.
// Aucune durée de vie, pour que les changements faits dans l'administration
// s'affichent immédiatement sur la boutique.
let categoriesCache: any = null;

// Map Prisma Category fields to cache interface
type CategoryPrismaSelect = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export interface CategoryCacheData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  lft?: number | null;
  rgt?: number | null;
}

export const DEFAULT_CATEGORY_CACHE: CategoryCacheData = {
  id: 'default-category',
  slug: '',
  name: '',
  description: null,
  isActive: false,
  lft: null,
  rgt: null,
};

export async function getCategories(_overwriteCache = false): Promise<CategoryCacheData[]> {
  try {
    // Use targeted Prisma findMany to only fetch needed fields
    const raw = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        isActive: true,
        displayOrder: true,
      },
    });

    // Conservé uniquement comme secours en cas de panne de la base.
    categoriesCache = raw as CategoryCacheData[];
    return raw;
  } catch {
    if (categoriesCache && categoriesCache.length > 0) return categoriesCache;
    return [];
  }
}

/**
 * Les catégories ne sont plus mises en cache : chaque lecture interroge la base.
 * Conservé pour les appels existants après un enregistrement dans l'administration.
 */
export function clearCategoriesCache() {
  categoriesCache = null;
}

export function invalidateCategoriesCache() {
  clearCategoriesCache();
}