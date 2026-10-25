import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const ASSET_DIR = join(__dirname, 'imported-images');
const DEFAULT_COUNTRY = 'FR';
const DEFAULT_VAT = 20;
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_STOCK = 50;
const DEFAULT_FREE_SHIPPING = true;
const DEFAULT_FREE_TRANSPORT = true;

function cleanString(value) {
  if (!value) return '';
  return value.toString().trim();
}

function parseDecimal(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : 0;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const parsed = parseInt(String(value).replace(/[^\d-]/g, ''), 10);
  return isFinite(parsed) ? parsed : 0;
}

function resolveCurrencySymbol(symbol) {
  if (!symbol) return DEFAULT_CURRENCY;
  const upper = symbol.trim().toUpperCase();
  if (upper === '€' || upper === 'EUR' || upper === '€EUR') return 'EUR';
  if (upper === '$' || upper === 'USD' || upper === 'USD$') return 'USD';
  if (upper === '£' || upper === 'GBP') return 'GBP';
  return DEFAULT_CURRENCY;
}

function resolveVatRate(text, priceTTC, priceHT) {
  if (text) {
    const cleaned = text.toString().trim().toUpperCase();
    if (cleaned.includes('20') || cleaned.includes('20%') || cleaned.includes('TVA 20')) return 20;
    if (cleaned.includes('10') || cleaned.includes('10%')) return 10;
    if (cleaned.includes('5.5') || cleaned.includes('5,5') || cleaned.includes('5.5%')) return 5.5;
    if (cleaned.includes('8') || cleaned.includes('8%')) return 8;
    if (cleaned.includes('13') || cleaned.includes('13%')) return 13;
  }
  if (priceTTC > 0 && priceHT > 0) {
    const implied = (priceTTC / priceHT - 1) * 100;
    if (implied > 0) {
      const nearest = [5.5, 8, 10, 13, 20].reduce((best, rate) =>
        Math.abs(rate - implied) < Math.abs(best - implied) ? rate : best
      );
      if (Math.abs(nearest - implied) < 1.5) return nearest;
    }
  }
  return DEFAULT_VAT;
}

function resolveUnit(text) {
  if (!text) return 'piece';
  const cleaned = text.toString().toLowerCase().trim();
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return 'piece';
  const map = {
    'pièce': 'piece', 'piece': 'piece', 'pce': 'piece', 'p.': 'piece',
    'unité': 'unit', 'unite': 'unit', 'unit': 'unit',
    'paquet': 'pack', 'paq': 'pack', 'pack': 'pack',
    'lot': 'lot',
    'boite': 'box', 'boîte': 'box', 'box': 'box',
    'sac': 'bag', 'sachet': 'bag', 'bag': 'bag',
    'kg': 'kg', 'kilogramme': 'kg', 'kilos': 'kg', 'kilo': 'kg',
    'gramme': 'g', 'grammes': 'g', 'g': 'g',
    'litre': 'l', 'litres': 'l', 'l': 'l', 'ml': 'ml',
    'm': 'm', 'm²': 'm2', 'm2': 'm2', 'm3': 'm3',
    'mètre': 'm', 'metre': 'm', 'mètres': 'm', 'metres': 'm',
    'feuilles': 'sheet', 'feuille': 'sheet', 'feuillet': 'sheet',
    'planches': 'board', 'planche': 'board', 'board': 'board',
    'rangle': 'log', 'rang': 'log', 'buche': 'log', 'bûche': 'log',
    'tronc': 'log', 'tronçon': 'log', 'troncon': 'log',
    'bille': 'log', 'billette': 'log',
    'chute': 'offcut', 'chutes': 'offcut',
    'déchiquetage': 'chip', 'dechiquetage': 'chip',
    'copeaux': 'chip', 'copeau': 'chip',
    'granule': 'granule', 'granules': 'granule',
    'pellets': 'pellet', 'pellet': 'pellet',
    'briquette': 'briquette', 'brique': 'briquette',
    'diffusable': 'diffusor', 'diffuseur': 'diffusor',
    'biquette': 'biquette',
    'tuyau': 'tube', 'tube': 'tube',
    'flex': 'hose', 'flextube': 'hose',
    'câble': 'cable', 'cable': 'cable',
    'serpentine': 'coil',
    'rouleau': 'roll', 'roul': 'roll', 'coil': 'coil',
    'spiral': 'coil', 'spirale': 'coil',
    'ruban': 'ribbon', 'bande': 'strip', 'band': 'strip',
    'tige': 'rod', 'tiges': 'rod',
    'barre': 'bar', 'barres': 'bar', 'bar': 'bar',
    'lame': 'blade', 'lames': 'blade',
    'cutter': 'blade', 'couteau': 'blade', 'knife': 'blade',
    'sciage': 'sawn', 'scié': 'sawn', 'scie': 'sawn', 'sawn': 'sawn',
    'brut': 'raw', 'non fini': 'raw', 'non-fini': 'raw',
    'usiné': 'milled', 'usine': 'milled', 'meulage': 'milled', 'meulé': 'milled',
    'placage': 'veneer', 'placé': 'veneer', 'plac': 'veneer',
    'papier': 'paper', 'carton': 'cardboard',
    'bc': 'board', 'bt': 'board',
    'contenance': 'volume', 'volume': 'volume', 'puissance': 'volume', 'puis': 'volume',
  };
  for (const key of Object.keys(map)) {
    if (cleaned.startsWith(key) || cleaned === key) return map[key];
  }
  return 'piece';
}

function normalizeDimensionText(text) {
  if (!text) return '';
  const cleaned = text
    .toString()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return '';
  return cleaned;
}

function extractNumericDimension(text) {
  const cleaned = text.toLowerCase().replace(/[^\d.,/\-cm()]/g, '').trim();
  if (!cleaned) return null;
  const match = cleaned.match(/([\d.,]+)\s*[xX]\s*([\d.,]+)\s*(cm|mm|m|ft|"|\'|inches|in)?/);
  if (!match) return null;
  const first = parseFloat(match[1].replace(',', '.'));
  const second = parseFloat(match[2].replace(',', '.'));
  const unit = match[3] ? match[3].toLowerCase().replace(/['"]/g, '') : 'cm';
  if (!isFinite(first) || !isFinite(second)) return null;
  return { value: first * second > 0 ? first * second : first, unit };
}

function resolveDimensions(product) {
  const existing = product.dimensions;
  if (existing && typeof existing === 'string' && existing.trim()) return existing.trim();
  const text = normalizeDimensionText(product.dimensions ?? null) || '';
  if (!text) return '';
  const raw = extractNumericDimension(text);
  if (!raw) return text;
  const value = raw.value;
  const unit = raw.unit;
  if (value > 0 && unit) return `${value} ${unit}`;
  return text;
}

function resolveWeight(product) {
  const existing = product.weightKg;
  if (existing !== null && existing !== undefined && typeof existing === 'number' && isFinite(existing)) {
    return existing > 0 ? existing : 0;
  }
  const raw = product.weightKg;
  if (raw !== null && raw !== undefined) {
    const num = toNumber(raw);
    if (num > 0) return num;
  }
  const w = cleanString(product.weightKg ?? null);
  if (!w) return 0;
  const weightGramsMatch = w.match(/([\d.,]+)\s*[Gg]\s*(?:ramme|rammes)?/);
  if (weightGramsMatch) {
    const grams = parseFloat(weightGramsMatch[1].replace(',', '.'));
    if (isFinite(grams) && grams > 0) return grams / 1000;
  }
  const weightKgMatch = w.match(/([\d.,]+)\s*[Kk]\s*(?:g|ilo|ilogramme|ilogrammes)?/);
  if (weightKgMatch) {
    const kg = parseFloat(weightKgMatch[1].replace(',', '.'));
    if (isFinite(kg) && kg > 0) return kg;
  }
  return 0;
}

function resolveVolume(product) {
  const existing = product.volumeM3;
  if (existing !== null && existing !== undefined && typeof existing === 'number' && isFinite(existing)) {
    return existing > 0 ? existing : null;
  }
  const raw = product.volumeM3;
  if (raw !== null && raw !== undefined) {
    const num = parseFloat(String(raw).replace(/[^\d.-]/g, ''));
    if (isFinite(num) && num > 0) return num;
  }
  const v = cleanString(product.volumeM3 ?? null) || '';
  const cubicMatch = v.match(/([\d.,]+)\s*(m³|m3|m\^3|cubic\s*mètre?)/i);
  if (cubicMatch) {
    const m3 = parseFloat(cubicMatch[1].replace(',', '.'));
    if (isFinite(m3) && m3 > 0) return m3;
  }
  return null;
}

function resolvePackaging(product) {
  const raw = product.packaging ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return cleaned;
}

function resolveStock(product) {
  const raw = product.stock ?? null;
  if (raw !== null && raw !== undefined) {
    const num = toNumber(raw);
    if (num > 0) return num;
  }
  return DEFAULT_STOCK;
}

function resolvePrice(values, preferTTC = true) {
  const vatRate = resolveVatRate(
    values.vatRate !== null && values.vatRate !== undefined ? (typeof values.vatRate === 'number' ? values.vatRate.toString() : values.vatRate ?? '') : null,
    values.priceTTC ?? 0,
    values.priceHT ?? 0,
  );
  const priceFrom = preferTTC ? (values.priceTTC ?? 0) : (values.priceHT ?? 0);
  const sourcePrice = priceFrom > 0 ? priceFrom : 0;
  let finalHT = 0;
  let finalTTC = 0;
  if (sourcePrice > 0) {
    if (preferTTC) {
      finalTTC = sourcePrice;
      finalHT = finalTTC / (1 + vatRate / 100);
    } else {
      finalHT = sourcePrice;
      finalTTC = finalHT * (1 + vatRate / 100);
    }
  }
  return {
    priceHT: Math.max(0, Math.round(finalHT * 100) / 100),
    priceTTC: Math.max(0, Math.round(finalTTC * 100) / 100),
    vatRate,
  };
}

function resolvePromotion(product) {
  const promoPrice = product.promoPrice;
  if (promoPrice === null || promoPrice === undefined || typeof promoPrice !== 'number' || !isFinite(promoPrice) || promoPrice <= 0) {
    return {};
  }
  const start = product.promoStartDate;
  const end = product.promoEndDate;
  return {
    promoPrice: Math.max(0, Math.round(promoPrice * 100) / 100),
    promoStartDate: start instanceof Date && !isNaN(start.getTime()) ? start : undefined,
    promoEndDate: end instanceof Date && !isNaN(end.getTime()) ? end : undefined,
  };
}

function slugFromName(name) {
  if (!name) return '';
  return name
    .toString()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveReference(product) {
  const raw = product.reference ?? null;
  if (raw) {
    const cleaned = cleanString(raw);
    if (cleaned && cleaned !== '-' && cleaned !== 'n/a') {
      const s = slugFromName(cleaned);
      if (s.length > 0) return s;
    }
  }
  // Generate reference from name with unique suffix
  const name = extractName(product);
  const baseRef = slugFromName(name);
  if (baseRef) {
    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${baseRef}-${suffix}`;
  }
  return 'REF-' + Date.now();
}

function resolveAllowedCountries(product) {
  const raw = product.allowedCountries ?? null;
  if (!raw) return DEFAULT_COUNTRY === 'FR' ? null : [DEFAULT_COUNTRY];
  if (Array.isArray(raw) && raw.length) {
    const cleaned = raw.map((c) => String(c).trim().toUpperCase()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }
  const cleaned = cleanString(raw).split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
  return cleaned.length ? cleaned : null;
}

function resolvePromoWindow(product) {
  const start = product.promoStartDate;
  const end = product.promoEndDate;
  return {
    promoStartDate: start instanceof Date && !isNaN(start.getTime()) ? start : undefined,
    promoEndDate: end instanceof Date && !isNaN(end.getTime()) ? end : undefined,
  };
}

function resolveProductImageUrl(product) {
  const images = product.images;
  if (!Array.isArray(images)) return null;
  const candidates = images
    .map((img) => (typeof img === 'string' ? img : null))
    .filter((img) => img != null && img.trim().length > 0);
  for (const url of candidates) {
    const resolved = url.trim();
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
  }
  return null;
}

function resolveImages(product) {
  const raw = product.images;
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const s = item.trim();
      if (s) out.push(s);
    } else if (item && typeof item === 'object') {
      const url = item.url ?? item.src ?? item.image ?? item.image_url ?? null;
      if (typeof url === 'string' && url.trim()) out.push(url.trim());
    }
  }
  return out.filter(Boolean);
}

function extractName(product) {
  const raw = product.name;
  if (!raw) return 'Produit sans nom';
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return 'Produit sans nom';
  return cleaned;
}

function extractShortDescription(product) {
  return cleanString(product.shortDescription ?? product.description ?? null);
}

function extractDescription(product) {
  return cleanString(product.description ?? product.shortDescription ?? null);
}

function extractSpecies(product) {
  const raw = product.species ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return cleaned;
}

function extractWoodType(product) {
  const raw = product.woodType ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return cleaned;
}

function extractHumidityRate(product) {
  const raw = product.humidityRate ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return cleaned;
}

function extractCalorificValue(product) {
  const raw = product.calorificValue ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return cleaned;
}

function extractLogLength(product) {
  const raw = product.logLength ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return cleaned;
}

function extractCategorySlug(product) {
  const raw = product.categorySlug ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  const s = slugFromName(cleaned);
  return s.length > 0 ? s : cleaned;
}

function resolveApiUrl(productUrl) {
  if (!productUrl) return null;
  const normalized = productUrl.trim();
  if (!normalized) return null;
  if (normalized.startsWith('http')) return normalized;
  if (normalized.startsWith('/')) return `https://example.com${normalized}`;
  return `https://${normalized}`;
}

function resolveProductPageUrl(product) {
  const raw = product.slug ?? null;
  if (!raw) return null;
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned === '-' || cleaned === 'n/a') return null;
  return resolveApiUrl(cleaned);
}

async function resolveImageBlobUrl(product, baseUrl, providedUrl) {
  const candidates = [
    providedUrl,
    product.images?.[0],
    product.image,
    product.image_url,
  ].filter((v) => typeof v === 'string' && v.trim().length > 0);

  for (const candidate of candidates) {
    const url = candidate.trim();
    if (!url.startsWith('http')) continue;
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
        return url;
      }
    } catch {
      // try next candidate
    }
  }

  if (baseUrl) {
    try {
      const res = await fetch(baseUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
        return baseUrl;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

async function resolveProductImageBlob(product, productUrl) {
  const baseUrl = productUrl ? resolveApiUrl(productUrl) : null;
  if (!baseUrl) return null;
  try {
    const resolved = await resolveImageBlobUrl(product, baseUrl);
    if (resolved) return resolved;
  } catch {
    // try next candidate
  }
  return null;
}

function sha256Hex(text) {
  const crypto = globalThis.crypto;
  if (!crypto || !crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
  return new Promise((resolve) => {
    const encoder = new TextEncoder();
    crypto.subtle.digest('SHA-256', encoder.encode(text)).then((hash) => {
      const hex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      resolve(hex);
    }).catch(() => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      resolve(Math.abs(hash).toString(16).padStart(8, '0'));
    });
  });
}

async function mapProductCategory(product) {
  const categorySlug = extractCategorySlug(product);
  if (!categorySlug) return null;

  const existing = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (existing && existing.name) {
    return { category: { slug: existing.slug, name: existing.name } };
  }

  const suggested = slugFromName(categorySlug) || categorySlug;
  const name = cleanString(categorySlug);
  if (!name) return null;

  try {
    const created = await prisma.category.create({
      data: {
        slug: suggested || name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        name,
        description: 'Catégorie importée',
        imageUrl: null,
        isActive: true,
      },
    });
    return { category: { slug: created.slug, name: created.name } };
  } catch (err) {
    if (err.code === 'P2002') {
      const existingConflict = await prisma.category.findFirst({
        where: { slug: suggested || name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') },
      });
      if (existingConflict) {
        return { category: { slug: existingConflict.slug, name: existingConflict.name } };
      }
    }
    return null;
  }
}

async function getOrCreateCategoryForProduct(product) {
  const categorySlug = extractCategorySlug(product);
  // If no categorySlug provided, try to find or create a 'general' category
  if (!categorySlug) {
    const existing = await prisma.category.findUnique({ where: { slug: 'general' } });
    if (existing) return existing.slug;
    try {
      const created = await prisma.category.create({
        data: {
          slug: 'general',
          name: 'Général',
          description: 'Catégorie par défaut',
          isActive: true,
        },
      });
      return created.slug;
    } catch {
      return 'general';
    }
  }
  const category = await mapProductCategory(product);
  return category?.category.slug ?? null;
}

async function createProductRecord(product) {
  const {
    priceHT,
    priceTTC,
    vatRate,
  } = resolvePrice({
    priceHT: product.priceHT,
    priceTTC: product.priceTTC,
    vatRate: product.vatRate,
  });

  const {
    promoPrice,
    promoStartDate,
    promoEndDate,
  } = resolvePromotion(product);

  const stock = resolveStock(product);
  const weightKg = resolveWeight(product);
  const volumeM3 = resolveVolume(product) ?? 1.8;
  const packaging = resolvePackaging(product);
  const dimensions = resolveDimensions(product);
  const allowedCountries = resolveAllowedCountries(product);

  const categorySlug = await getOrCreateCategoryForProduct(product);
  const categoryId = categorySlug ?? 'general';

  const productData = {
    reference: resolveReference(product) ?? null,
    name: extractName(product),
    shortDescription: extractShortDescription(product),
    description: extractDescription(product),
    images: JSON.stringify(resolveImages(product)),
    species: extractSpecies(product) ?? '',
    woodType: extractWoodType(product) ?? '',
    humidityRate: extractHumidityRate(product) ?? '',
    calorificValue: extractCalorificValue(product) ?? '',
    logLength: extractLogLength(product) ?? '',
    unit: resolveUnit(product.unit ?? null),
    vatRate,
    priceHT,
    priceTTC,
    promoPrice: promoPrice ?? null,
    promoStartDate: promoStartDate ?? null,
    promoEndDate: promoEndDate ?? null,
    stock,
    weightKg,
    volumeM3,
    dimensions: dimensions || '100 x 120 x 160 cm',
    packaging: packaging ?? '',
    isPreorderAllowed: product.isPreorderAllowed ?? true,
    allowedCountries: JSON.stringify(allowedCountries ?? [DEFAULT_COUNTRY]),
    leadTimeDays: toNumber(product.leadTimeDays ?? null),
    seoTitle: product.seoTitle ? product.seoTitle.toString().trim() : null,
    seoDescription: product.seoDescription ? product.seoDescription.toString().trim() : null,
    category: { connect: { slug: categoryId } },
    isActive: product.isActive !== false,
  };

  const candidateSlug = slugFromName(product.name) || extractName(product).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const baseSlug = candidateSlug.length > 60 ? candidateSlug.slice(0, 60).replace(/-$/, '') : candidateSlug;
  const todayToken = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let slug = `${baseSlug}-${todayToken}`;
  if (slug.length > 90) slug = `${baseSlug.slice(0, 50)}-${todayToken}`;

  let finalSlug = slug;
  for (let i = 2; i <= 20; i++) {
    const existing = await prisma.product.findUnique({ where: { slug: finalSlug } }).catch(() => null);
    if (!existing) break;
    finalSlug = `${slug.slice(0, 80)}-${i}`;
  }

  if (!finalSlug) {
    throw new Error(`Unable to generate unique slug for product ${(product).name}`);
  }

  const created = await prisma.product.create({
    data: {
      ...productData,
      slug: finalSlug,
    },
  });



  try {
    // Determine country code from allowed countries, default to 'FR'
    const allowedCountries = resolveAllowedCountries(product);
    const countryCode = allowedCountries && allowedCountries.length > 0 ? allowedCountries[0] : 'FR';
    await prisma.shippingRate.create({
      data: {
        countryCode: countryCode,
        postalCodePrefix: '*',
        minWeightKg: 0.0,
        maxWeightKg: 10000.0,
        baseRate: 49.0,
        perUnitRate: 15.0,
        difficultAccessSurcharge: 30.0,
        estimatedDays: 4,
      },
    });
  } catch (shipErr) {
    console.warn(`Warning: could not create ShippingRate for product ${finalSlug}: ${shipErr.message}`);
  }

  return {
    slug: created.slug,
    name: created.name,
    priceTTC: created.priceTTC,
  };
}

export async function importExternalProducts(products) {
  const results = [];

  for (const raw of products) {
    try {
      const record = await createProductRecord(raw);
      results.push({ ok: true, product: record });
    } catch (error) {
      results.push({
        ok: false,
        product: raw,
        error: error.message || 'Unknown import error',
      });
    }
  }

  return results;
}

export async function persistImportedImages(product, productSlug, imageUrls) {
  if (!existsSync(ASSET_DIR)) {
    mkdirSync(ASSET_DIR, { recursive: true });
  }

  const saved = [];
  const seen = new Set();

  for (const url of imageUrls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      if (!res.ok) continue;

      const ct = res.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) continue;

      const ext = ct.split('/')[1] === 'svg+xml' ? 'svg' : ct.split('/')[1] || 'jpg';
      const fileName = `${productSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = join(ASSET_DIR, fileName);

      const buffer = Buffer.from(await res.arrayBuffer());
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, buffer);
      saved.push(`/imported-images/${fileName}`);
    } catch (err) {
      console.warn(`Warning: could not download image ${url}: ${err.message}`);
    }
  }

  return saved;
}

export async function importProductsFromExternalSource(products) {
  const results = await importExternalProducts(products);
  const withImages = [];

  for (const result of results) {
    if (result.ok && result.product) {
      const productSlug = typeof result.product === 'object' ? result.product.slug : '';
      const imageUrls = typeof result.product === 'object' ? result.product.images : [];
      if (Array.isArray(imageUrls) && imageUrls.length) {
        const saved = await persistImportedImages(
          result.product,
          productSlug,
          imageUrls,
        );
        if (saved.length) {
          await prisma.product.update({
            where: { slug: productSlug },
            data: { images: saved },
          });
        }
      }
    }
    withImages.push(result);
  }

  await prisma.$disconnect();
  return withImages;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const payload = JSON.parse(process.argv[2] || '[]');
  if (!payload.length) {
    console.error('Usage: node scripts/external-prepare.mjs \'[ { "name": "...", ... }, ... ]\'');
    process.exit(0);
  }

  importProductsFromExternalSource(payload)
    .then((results) => {
      console.log(JSON.stringify({ imported: results.length, results }, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
