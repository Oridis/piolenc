/**
 * Importe les 20 produits de la gamme spécialisée dans la base Prisma.
 *
 * Source de données : `scripts/prepare-external-real-products.mjs`
 * (fiches bois de chauffage / granulés : prix, essences, conditionnements,
 *  humidité, pouvoir calorifique, stocks — reprises telles quelles).
 * Images : `scripts/product-images.json` produit par `fetch-product-images.mjs`,
 * toutes servies depuis /images/products/ (hébergement propre).
 *
 * Idempotent : les produits et catégories sont créés ou mis à jour par slug.
 *
 *   node scripts/import-20-products.mjs --dry   # simulation, aucune écriture
 *   node scripts/import-20-products.mjs         # import réel
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { externalRealProducts } from './prepare-external-real-products.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const prisma = new PrismaClient();

/** Catégories de la gamme importée (slug stable, nom affiché, description). */
const CATEGORIES = {
  'buche-densifiee': {
    name: 'Bûches densifiées & briquettes',
    description: 'Briquettes et bûches compressées de bois densifié, séchées en étuve.',
  },
  'bois-etuve-sec': {
    name: 'Bois étuvé extra-sec',
    description: 'Bûches séchées en étuve biomasse, humidité réduite, prêtes à brûler.',
  },
  'buches-traditionnelles': {
    name: 'Bûches traditionnelles',
    description: 'Mélanges de bois durs séchés naturellement, en palettes prêtes à ranger.',
  },
  'granules-pellets': {
    name: 'Granulés & pellets',
    description: 'Granulés de bois en sacs de 15 kg, pour poêles et chaudières automatiques.',
  },
};

/**
 * Slug + référence de chaque ligne du jeu de données, dans le même ordre que
 * `externalRealProducts`. Le slug est aussi la clé du mapping d'images.
 */
const IDENTIFIERS = [
  { slug: 'briquette-bois-compresse-100-hetre', reference: 'EXT-BRIQ-HETRE-1000KG' },
  { slug: 'bois-chauffage-25cm-2-steres', reference: 'EXT-BOIS-25-2ST' },
  { slug: 'bois-chauffage-sec-30cm-3-steres', reference: 'EXT-BOIS-30-3ST' },
  { slug: 'bois-chauffage-etuve-extra-sec-40cm', reference: 'EXT-BOIS-40ETUVE-27ST' },
  { slug: 'bois-chauffage-seche-naturel-40cm', reference: 'EXT-BOIS-40SECHE-27ST' },
  { slug: 'bois-chauffage-33cm-2-steres', reference: 'EXT-BOIS-33-2ST' },
  { slug: 'bois-chauffage-50cm-2-steres', reference: 'EXT-BOIS-50-2ST' },
  { slug: 'granules-bois-premium-66-sacs', reference: 'EXT-PELLETS-PREM-66' },
  { slug: 'granules-bois-premium-65-sacs', reference: 'EXT-PELLETS-PREM-65' },
  { slug: 'granules-bois-dinplus-66-sacs', reference: 'EXT-PELLETS-DINPLUS-66' },
  { slug: 'buches-compressees-25cm', reference: 'EXT-COMPR-25-96' },
  { slug: 'buches-compressees-33cm', reference: 'EXT-COMPR-33-80' },
  { slug: 'buches-compressees-40cm', reference: 'EXT-COMPR-40-60' },
  { slug: 'buches-compressees-50cm', reference: 'EXT-COMPR-50-48' },
  { slug: 'buches-chauffage-25cm-2-steres', reference: 'EXT-BUCHES-25-2ST' },
  { slug: 'buches-chauffage-30cm-3-steres', reference: 'EXT-BUCHES-30-3ST' },
  { slug: 'buches-chauffage-33cm-2-steres', reference: 'EXT-BUCHES-33-2ST' },
  { slug: 'buches-chauffage-40cm-25-steres', reference: 'EXT-BUCHES-40-25ST' },
  { slug: 'buches-chauffage-50cm-palette-2-steres', reference: 'EXT-BUCHES-50-2ST' },
  { slug: 'granules-bois-100-resineux-66-sacs', reference: 'EXT-PELLETS-RESINEUX-66' },
];

/**
 * Deux lignes du jeu de données portent le même intitulé « Bois de chauffage
 * sec 40 cm - 2 m3 - 2,7 stères » (deux fiches fournisseurs distinctes, stock et
 * poids différents). On les nomme selon leur conditionnement réel pour qu'aucun
 * produit du catalogue ne soit un doublon affiché.
 */
const NAME_OVERRIDES = {
  'bois-chauffage-etuve-extra-sec-40cm': 'Bois de chauffage étuvé extra-sec 40 cm - 2 m3 - 2,7 stères',
  'bois-chauffage-seche-naturel-40cm': 'Bois de chauffage séché naturellement 40 cm - 2 m3 - 2,7 stères',
};

function loadImageMapping() {
  const file = path.join(__dirname, 'product-images.json');
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

async function ensureCategory(slug) {
  const meta = CATEGORIES[slug];
  if (!meta) throw new Error(`Catégorie inconnue: ${slug}`);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    if (existing.name === meta.name && existing.description === meta.description && existing.isActive) {
      return { id: existing.id, created: false };
    }
    const updated = await prisma.category.update({
      where: { slug },
      data: { name: meta.name, description: meta.description, isActive: true },
    });
    return { id: updated.id, created: false };
  }
  const created = await prisma.category.create({
    data: { slug, name: meta.name, description: meta.description, isActive: true },
  });
  return { id: created.id, created: true };
}

async function main() {
  if (externalRealProducts.length !== IDENTIFIERS.length) {
    throw new Error(
      `Jeu de données (${externalRealProducts.length}) et identifiants (${IDENTIFIERS.length}) désynchronisés.`
    );
  }

  const images = loadImageMapping();
  const missingImages = [];

  // 1. Catégories
  const categoryIds = {};
  for (const slug of Object.keys(CATEGORIES)) {
    if (DRY) {
      console.log(`[dry] catégorie ${slug}`);
      categoryIds[slug] = 'dry';
      continue;
    }
    const { id, created } = await ensureCategory(slug);
    categoryIds[slug] = id;
    console.log(`${created ? '+' : '='} catégorie ${slug} (${id})`);
  }

  // 2. Produits
  let created = 0;
  let updated = 0;

  for (let i = 0; i < externalRealProducts.length; i++) {
    const item = externalRealProducts[i];
    const { slug, reference } = IDENTIFIERS[i];
    const name = NAME_OVERRIDES[slug] || item.name;
    const files = (images[slug] || []).filter(Boolean);

    if (files.length === 0) missingImages.push(slug);

    // Le prix HT est recalculé depuis le TTC et le taux de TVA déclaré pour que
    // la fiche produit, le panier et la commande affichent le même HT.
    const vatRate = typeof item.vatRate === 'number' ? item.vatRate : 5.5;
    const priceTTC = item.priceTTC;
    const priceHT = Number((priceTTC / (1 + vatRate / 100)).toFixed(2));

    const data = {
      reference,
      slug,
      name,
      shortDescription: item.shortDescription,
      description: item.description,
      images: JSON.stringify(files),
      species: item.species,
      woodType: item.woodType,
      humidityRate: item.humidityRate,
      calorificValue: item.calorificValue,
      logLength: item.logLength,
      unit: item.unit,
      priceHT,
      priceTTC,
      vatRate,
      stock: item.stock,
      reservedStock: 0,
      weightKg: item.weightKg,
      volumeM3: item.volumeM3,
      dimensions: item.dimensions,
      packaging: item.packaging,
      isPreorderAllowed: false,
      allowedCountries: JSON.stringify(item.allowedCountries || ['FR', 'DE', 'BE', 'CH']),
      leadTimeDays: item.leadTimeDays ?? 4,
      isActive: true,
      categoryId: categoryIds[item.categorySlug],
    };

    if (DRY) {
      console.log(`[dry] ${slug} | ${name} | ${priceTTC} € | ${files.length} image(s)`);
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({ where: { slug }, data });
      updated++;
      console.log(`= produit ${slug}`);
    } else {
      await prisma.product.create({ data });
      created++;
      console.log(`+ produit ${slug}`);
    }
  }

  console.log(`\n${created} créé(s), ${updated} mis à jour.`);
  if (missingImages.length) {
    console.log(`⚠ ${missingImages.length} produit(s) sans image téléchargée: ${missingImages.join(', ')}`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
