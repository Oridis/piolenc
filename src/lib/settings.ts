import { prisma } from './prisma';

// In-memory cache for site settings - reduces DB queries
// Settings are relatively static and change only via admin UI
let siteSettingsCache: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

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

export async function getSiteSettings(overwriteCache = false): Promise<SiteSettingsData> {
  // Check in-memory cache first (unless overwritten)
  const now = Date.now();
  if (!overwriteCache && siteSettingsCache && now - cacheTimestamp < CACHE_TTL && siteSettingsCache.id) {
    return siteSettingsCache;
  }

  try {
    // Use targeted Prisma select to only fetch needed fields
    const raw = await prisma.siteSetting.findFirst({
      select: {
        id: true,
        siteName: true,
        slogan: true,
        logoUrl: true,
        faviconUrl: true,
        emailLogoUrl: true,
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
      siteSettingsCache = DEFAULT_SITE_SETTINGS;
      cacheTimestamp = now;
      return siteSettingsCache;
    }

    const result = {
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
      smtpFrom: raw.smtpFrom ?? DEFAULT_SITE_SETTINGS.smtpFrom,
      adminNotificationEmail: raw.adminNotificationEmail ?? DEFAULT_SITE_SETTINGS.adminNotificationEmail,
      isPublished: raw.isPublished ?? DEFAULT_SITE_SETTINGS.isPublished,
    };

    // Update cache
    siteSettingsCache = result;
    cacheTimestamp = now;
    return result;
  } catch {
    // Return cached value if available, otherwise default
    if (siteSettingsCache && siteSettingsCache.id) return siteSettingsCache;
    return DEFAULT_SITE_SETTINGS;
  }
}

/** 
 * Clears the in-memory site settings cache. 
 * Should be called after admin UI updates to force a fresh DB fetch. 
 */
export function clearSiteSettingsCache() {
  siteSettingsCache = null;
  cacheTimestamp = 0;
}

/** 
 * Invalidates the site settings cache and forces a fresh DB fetch on next call. 
 * Also resets the cache to empty so the next getSiteSettings() call will query the DB. 
 */
export function invalidateSiteSettingsCache() {
  clearSiteSettingsCache();
  // Force refresh on next call by setting cache to empty object
  siteSettingsCache = {} as any;
  cacheTimestamp = 0;
}

// In-memory cache for products - reduces DB queries
// Products are relatively static and change only via admin UI
let productsCache: any = null;
let productsCacheTimestamp = 0;
const PRODUCTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

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

export async function getProducts(overwriteCache = false): Promise<ProductCacheData[]> {
  // Check in-memory cache first (unless overwritten)
  const now = Date.now();
  if (!overwriteCache && productsCache && now - productsCacheTimestamp < PRODUCTS_CACHE_TTL && productsCache.length > 0) {
    return productsCache;
  }

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

    // Update cache
    productsCache = transformed;
    productsCacheTimestamp = now;
    return transformed;
  } catch {
    // Return cached value if available, otherwise empty array
    if (productsCache && productsCache.length > 0) return productsCache;
    return [];
  }
}

/** 
 * Clears the products in-memory cache. 
 * Should be called after admin UI updates to force a fresh DB fetch. 
 */
export function clearProductsCache() {
  productsCache = null;
  productsCacheTimestamp = 0;
}

/** 
 * Invalidates the products cache and forces a fresh DB fetch on next call. 
 */
export function invalidateProductsCache() {
  clearProductsCache();
  productsCache = [] as any[];
  productsCacheTimestamp = 0;
}

// In-memory cache for categories - reduces DB queries
// Categories are relatively static and change only via admin UI
let categoriesCache: any = null;
let categoriesCacheTimestamp = 0;
const CATEGORIES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

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

export async function getCategories(overwriteCache = false): Promise<CategoryCacheData[]> {
  // Check in-memory cache first (unless overwritten)
  const now = Date.now();
  if (!overwriteCache && categoriesCache && now - categoriesCacheTimestamp < CATEGORIES_CACHE_TTL && categoriesCache.length > 0) {
    return categoriesCache;
  }

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

    // Update cache
    categoriesCache = raw as CategoryCacheData[];

    // Update cache
    categoriesCacheTimestamp = now;
    return raw;
  } catch {
    // Return cached value if available, otherwise empty array
    if (categoriesCache && categoriesCache.length > 0) return categoriesCache;
    return [];
  }
}

/** 
 * Clears the categories in-memory cache. 
 * Should be called after admin UI updates to force a fresh DB fetch. 
 */
export function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
}

/** 
 * Invalidates the categories cache and forces a fresh DB fetch on next call. 
 */
export function invalidateCategoriesCache() {
  clearCategoriesCache();
  categoriesCache = [] as any[];
  categoriesCacheTimestamp = 0;
}