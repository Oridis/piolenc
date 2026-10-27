/**
 * Aller-retour du catalogue au format CSV.
 *
 * Ce module est la source de vérité unique des colonnes exportées : l'import
 * relit exactement les mêmes en-têtes, ce qui garantit qu'un export réimporté
 * restitue les fiches à l'identique — références, slugs, textes, images, tarifs,
 * stocks et données SEO comprises.
 *
 * Aucune dépendance à Prisma ici : le format reste testable hors application.
 */

export const PRODUCT_CSV_DELIMITER = ';';

/** Format de cellule : pilote l'écriture comme la relecture d'une colonne. */
type CellFormat = 'text' | 'decimal' | 'integer' | 'boolean' | 'date' | 'list';

export interface ProductCsvRow {
  reference: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
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
  promoPrice: number | null;
  promoStartDate: Date | null;
  promoEndDate: Date | null;
  stock: number;
  reservedStock: number;
  weightKg: number;
  volumeM3: number;
  dimensions: string;
  packaging: string;
  isPreorderAllowed: boolean;
  allowedCountries: string[];
  leadTimeDays: number;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
}

interface Column {
  key: keyof ProductCsvRow;
  header: string;
  format: CellFormat;
  /** Autres intitulés acceptés à l'import (clés techniques, variantes). */
  aliases?: string[];
}

/** Ordre d'écriture des colonnes du fichier exporté. */
export const PRODUCT_CSV_COLUMNS: Column[] = [
  { key: 'reference', header: 'Référence', format: 'text', aliases: ['reference', 'ref'] },
  { key: 'slug', header: 'Identifiant URL (slug)', format: 'text', aliases: ['slug', 'identifiant url'] },
  { key: 'name', header: 'Nom', format: 'text', aliases: ['name', 'produit', 'designation'] },
  { key: 'categoryName', header: 'Catégorie', format: 'text', aliases: ['categoryname', 'categorie'] },
  {
    key: 'categorySlug',
    header: 'Catégorie (slug)',
    format: 'text',
    aliases: ['categoryslug', 'category', 'categorie slug', 'categorie (slug)'],
  },
  {
    key: 'shortDescription',
    header: 'Description courte',
    format: 'text',
    aliases: ['shortdescription', 'description courte', 'accroche'],
  },
  { key: 'description', header: 'Description', format: 'text', aliases: ['longdescription', 'texte'] },
  {
    key: 'images',
    header: 'Images (URLs séparées par |)',
    format: 'list',
    aliases: ['images', 'image', 'photos', 'images (urls separees par |)', 'images (urls)'],
  },
  { key: 'species', header: 'Essence', format: 'text', aliases: ['species', 'essences'] },
  { key: 'woodType', header: 'Type de bois', format: 'text', aliases: ['woodtype', 'type de bois'] },
  {
    key: 'humidityRate',
    header: "Taux d'humidité",
    format: 'text',
    aliases: ['humidityrate', 'humidite', "taux d'humidite", 'taux humidite'],
  },
  {
    key: 'calorificValue',
    header: 'Pouvoir calorifique',
    format: 'text',
    aliases: ['calorificvalue', 'pouvoir calorifique (kwh/kg)'],
  },
  {
    key: 'logLength',
    header: 'Longueur de bûche',
    format: 'text',
    aliases: ['loglength', 'longueur', 'longueur de buche'],
  },
  { key: 'unit', header: 'Unité de vente', format: 'text', aliases: ['unit', 'unite', 'conditionnement de vente'] },
  { key: 'priceHT', header: 'Prix HT', format: 'decimal', aliases: ['priceht', 'prix ht'] },
  { key: 'priceTTC', header: 'Prix TTC', format: 'decimal', aliases: ['pricettc', 'prix ttc'] },
  { key: 'vatRate', header: 'TVA (%)', format: 'decimal', aliases: ['vatrate', 'tva', 'tva (%)'] },
  { key: 'promoPrice', header: 'Prix promo', format: 'decimal', aliases: ['promoprice', 'prix promotionnel'] },
  { key: 'promoStartDate', header: 'Début promo', format: 'date', aliases: ['promostartdate', 'debut promo'] },
  { key: 'promoEndDate', header: 'Fin promo', format: 'date', aliases: ['promoenddate', 'fin promo'] },
  { key: 'stock', header: 'Stock', format: 'integer', aliases: ['stock', 'quantite'] },
  { key: 'reservedStock', header: 'Stock réservé', format: 'integer', aliases: ['reservedstock', 'stock reserve'] },
  { key: 'weightKg', header: 'Poids (kg)', format: 'decimal', aliases: ['weightkg', 'poids', 'poids (kg)'] },
  { key: 'volumeM3', header: 'Volume (m³)', format: 'decimal', aliases: ['volumem3', 'volume', 'volume (m3)'] },
  { key: 'dimensions', header: 'Dimensions', format: 'text', aliases: ['dimensions', 'dimension'] },
  { key: 'packaging', header: 'Conditionnement', format: 'text', aliases: ['packaging', 'emballage'] },
  {
    key: 'isPreorderAllowed',
    header: 'Précommande autorisée',
    format: 'boolean',
    aliases: ['ispreorderallowed', 'precommande', 'precommande autorisee'],
  },
  {
    key: 'allowedCountries',
    header: 'Pays autorisés',
    format: 'list',
    aliases: ['allowedcountries', 'pays', 'pays autorises'],
  },
  { key: 'leadTimeDays', header: 'Délai (jours)', format: 'integer', aliases: ['leadtimedays', 'delai', 'delai (jours)'] },
  { key: 'seoTitle', header: 'Titre SEO', format: 'text', aliases: ['seotitle', 'titre seo'] },
  {
    key: 'seoDescription',
    header: 'Description SEO',
    format: 'text',
    aliases: ['seodescription', 'description seo', 'meta description'],
  },
  { key: 'isActive', header: 'Actif', format: 'boolean', aliases: ['isactive', 'actif', 'en vente'] },
];

/** Minuscules sans accents, espaces réduits : clé de comparaison des en-têtes. */
function normaliseHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const HEADER_LOOKUP: Map<string, keyof ProductCsvRow> = (() => {
  const map = new Map<string, keyof ProductCsvRow>();
  for (const column of PRODUCT_CSV_COLUMNS) {
    map.set(normaliseHeader(column.header), column.key);
    for (const alias of column.aliases || []) map.set(normaliseHeader(alias), column.key);
  }
  return map;
})();

const COLUMN_BY_KEY = new Map<keyof ProductCsvRow, Column>(
  PRODUCT_CSV_COLUMNS.map((column) => [column.key, column])
);

/* ------------------------------------------------------------------ */
/* Écriture                                                            */
/* ------------------------------------------------------------------ */

/** Cellule conforme RFC 4180 : guillemets doublés dès qu'un séparateur gêne. */
function escapeCell(value: string): string {
  if (!/[;"\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/** 5.5 → « 5,5 » : Excel français relit le nombre, l'import le reconvertit. */
function formatDecimal(value: number): string {
  return String(value).replace('.', ',');
}

function formatDate(value: Date | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatCell(column: Column, row: Partial<ProductCsvRow>): string {
  const value = row[column.key] as unknown;
  switch (column.format) {
    case 'decimal':
      return value === null || value === undefined || value === '' ? '' : formatDecimal(Number(value));
    case 'integer':
      return value === null || value === undefined || value === '' ? '' : String(Math.trunc(Number(value)));
    case 'boolean':
      return value ? 'oui' : 'non';
    case 'date':
      return formatDate((value as Date) ?? null);
    case 'list':
      return Array.isArray(value) ? value.join(' | ') : value ? String(value) : '';
    default:
      return value === null || value === undefined ? '' : String(value);
  }
}

/**
 * Sérialise le catalogue complet. Le BOM initial permet à Excel d'afficher
 * correctement les accents des produits.
 */
export function serialiseProductsToCsv(rows: Partial<ProductCsvRow>[]): string {
  const header = PRODUCT_CSV_COLUMNS.map((column) => escapeCell(column.header)).join(PRODUCT_CSV_DELIMITER);
  const lines = rows.map((row) =>
    PRODUCT_CSV_COLUMNS.map((column) => escapeCell(formatCell(column, row))).join(PRODUCT_CSV_DELIMITER)
  );
  return `\uFEFF${[header, ...lines].join('\r\n')}\r\n`;
}

/** Produit en base (ou objet équivalent) → ligne CSV normalisée. */
export function csvRowFromProduct(product: Record<string, any>): Partial<ProductCsvRow> {
  const parseList = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    if (typeof raw !== 'string' || !raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* texte libre : on découpe sur les séparateurs usuels */
      return raw
        .split(/[\n|,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const numberOrNull = (value: unknown): number | null =>
    value === null || value === undefined || value === '' ? null : Number(value);

  return {
    reference: String(product.reference ?? ''),
    slug: String(product.slug ?? ''),
    name: String(product.name ?? ''),
    categoryName: String(product.category?.name ?? ''),
    categorySlug: String(product.category?.slug ?? ''),
    shortDescription: String(product.shortDescription ?? ''),
    description: String(product.description ?? ''),
    images: parseList(product.images),
    species: String(product.species ?? ''),
    woodType: String(product.woodType ?? ''),
    humidityRate: String(product.humidityRate ?? ''),
    calorificValue: String(product.calorificValue ?? ''),
    logLength: String(product.logLength ?? ''),
    unit: String(product.unit ?? ''),
    priceHT: Number(product.priceHT ?? 0),
    priceTTC: Number(product.priceTTC ?? 0),
    vatRate: Number(product.vatRate ?? 5.5),
    promoPrice: numberOrNull(product.promoPrice),
    promoStartDate: product.promoStartDate ? new Date(product.promoStartDate) : null,
    promoEndDate: product.promoEndDate ? new Date(product.promoEndDate) : null,
    stock: Number(product.stock ?? 0),
    reservedStock: Number(product.reservedStock ?? 0),
    weightKg: Number(product.weightKg ?? 0),
    volumeM3: Number(product.volumeM3 ?? 0),
    dimensions: String(product.dimensions ?? ''),
    packaging: String(product.packaging ?? ''),
    isPreorderAllowed: product.isPreorderAllowed === true,
    allowedCountries: parseList(product.allowedCountries),
    leadTimeDays: Number(product.leadTimeDays ?? 0),
    seoTitle: String(product.seoTitle ?? ''),
    seoDescription: String(product.seoDescription ?? ''),
    isActive: product.isActive !== false,
  };
}

/* ------------------------------------------------------------------ */
/* Lecture                                                             */
/* ------------------------------------------------------------------ */

/** Découpe un texte CSV (guillemets, retours à la ligne inclus dans les textes). */
export function parseCsvText(text: string, delimiter = PRODUCT_CSV_DELIMITER): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
      continue;
    }
    if (char === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }

  row.push(cell);
  rows.push(row);

  // Supprime les lignes vides de fin de fichier.
  return rows.filter((line) => line.some((value) => value.trim() !== ''));
}

/** Séparateur le plus probable : le point-virgule de nos exports, sinon la virgule. */
export function detectDelimiter(text: string): string {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] || '';
  let semicolons = 0;
  let commas = 0;
  let quoted = false;
  for (const char of firstLine) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === ';') semicolons += 1;
    else if (!quoted && char === ',') commas += 1;
  }
  return commas > semicolons ? ',' : ';';
}

function parseDecimalCell(value: string): number | undefined {
  const cleaned = value.replace(/\s|\u00A0|€/g, '').replace(',', '.');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIntegerCell(value: string): number | undefined {
  const parsed = parseDecimalCell(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
}

function parseBooleanCell(value: string): boolean | undefined {
  const cleaned = normaliseHeader(value);
  if (!cleaned) return undefined;
  if (['oui', 'o', 'yes', 'y', 'true', 'vrai', '1', 'actif'].includes(cleaned)) return true;
  if (['non', 'n', 'no', 'false', 'faux', '0', 'inactif'].includes(cleaned)) return false;
  return undefined;
}

function parseDateCell(value: string): Date | null | undefined {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseListCell(value: string): string[] {
  return value
    .split(/[|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface CsvParseResult {
  /** Objets ne portant que les colonnes réellement présentes dans le fichier. */
  products: (Partial<ProductCsvRow> & { name?: string })[];
  errors: { line: number; message: string }[];
}

/**
 * Convertit un fichier CSV en lignes exploitables par l'import.
 * Les colonnes inconnues sont ignorées ; seules les lignes sans nom échouent.
 */
export function csvToProducts(text: string): CsvParseResult {
  const grid = parseCsvText(text, detectDelimiter(text));
  if (grid.length === 0) {
    return { products: [], errors: [{ line: 0, message: 'Fichier CSV vide' }] };
  }

  const [headerRow, ...dataRows] = grid;
  const mapped = headerRow.map((header) => HEADER_LOOKUP.get(normaliseHeader(header)) ?? null);

  if (mapped.every((key) => key === null)) {
    return {
      products: [],
      errors: [
        {
          line: 1,
          message:
            'Aucune colonne reconnue. Utilisez un export du catalogue (ou les en-têtes : Nom, Référence, Identifiant URL (slug), Prix TTC…).',
        },
      ],
    };
  }

  const products: (Partial<ProductCsvRow> & { name?: string })[] = [];
  const errors: { line: number; message: string }[] = [];

  dataRows.forEach((cells, index) => {
    const line = index + 2;
    const item: Record<string, unknown> = {};

    mapped.forEach((key, columnIndex) => {
      if (!key) return;
      const raw = (cells[columnIndex] ?? '').trim();
      const column = COLUMN_BY_KEY.get(key)!;
      let value: unknown;
      switch (column.format) {
        case 'decimal':
          value = parseDecimalCell(raw);
          break;
        case 'integer':
          value = parseIntegerCell(raw);
          break;
        case 'boolean':
          value = parseBooleanCell(raw);
          break;
        case 'date':
          value = parseDateCell(raw);
          break;
        case 'list':
          value = parseListCell(raw);
          break;
        default:
          value = raw;
      }
      // Une cellule vide ne prend pas la main sur la fiche existante.
      if (value !== undefined) item[key] = value;
    });

    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) {
      errors.push({ line, message: 'Colonne « Nom » vide : ligne ignorée' });
      return;
    }
    item.name = name;
    products.push(item as Partial<ProductCsvRow> & { name: string });
  });

  return { products, errors };
}

/** Vrai si le texte ressemble à un CSV de catalogue plutôt qu'à du JSON. */
export function looksLikeCsv(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('{')) return false;
  const firstLine = trimmed.split(/\r?\n/, 1)[0] || '';
  const delimiter = detectDelimiter(trimmed);
  return firstLine.includes(delimiter) && /[a-zA-Z]/.test(firstLine) && firstLine.split(delimiter).length > 2;
}
