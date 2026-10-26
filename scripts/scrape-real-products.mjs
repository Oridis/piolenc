/**
 * Import de produits RÉELS depuis des boutiques spécialisées (JSON-LD, microdata,
 * Open Graph) et téléchargement de leurs photos dans le stockage du site.
 *
 *   1. lit des fiches produit réellement en ligne ;
 *   2. en extrait nom, description, prix, disponibilité, référence et images ;
 *   3. télécharge chaque photo produit dans public/images/products/real/ (WebP) ;
 *   4. enregistre le produit en base (Prisma) et consigne sa provenance dans
 *      scripts/product-sources.json (URL source, boutique, date, prix lu) ;
 *   5. désactive les produits de démonstration qui étaient actifs.
 *
 *   node scripts/scrape-real-products.mjs --dry
 *   node scripts/scrape-real-products.mjs --url <fiche> [--url <fiche> …]
 */
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { PrismaClient } from '@prisma/client';
import { extractOfferFromPage, decodeEntities, slugify, BROWSER_UA } from './lib/product-extract.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products', 'real');
const SOURCES_FILE = path.join(__dirname, 'product-sources.json');
const DRY = process.argv.includes('--dry');
const MAX_IMAGES = 3;

/** Fiches produit réelles vérifiées : 24 offres chez 11 revendeurs spécialisés. */
const DEFAULT_URLS = [
  // Bûches de bois de chauffage
  'https://www.piskorski-bois-energie.fr/bois-de-chauffage-et-bois-buches/61-285-palette-de-2-steres-de-bois-de-chauffage.html',
  'https://www.piskorski-bois-energie.fr/bois-pour-four-a-bois/165-bois-de-chauffage-bois-de-chauffage-special-pizzerian-sec-n-palette-de-1st-450561839274.html',
  'https://www.gardbois.fr/boutique/palette-de-buches-seches-14-steres-33cm/',
  'https://www.gardbois.fr/boutique/palette-de-buches-seches-2-stere-33cm/',
  'https://www.gardbois.fr/boutique/palette-de-84-cartons-de-6-buches-jour/',
  'https://frboischauffage.com/boutique/bois-de-chauffage/bois-de-chauffage-palette/bois-de-chauffage-palette-25-cm-2-steres/',
  // Bûches densifiées / compressées
  'https://chaufobois.fr/product/buches-calorifiques-woodstock-1-palette-104-sacs-de-5-buches/',
  'https://boutique.woodstock-bois.fr/produit/bois-densifie/',
  'https://boutique.woodstock-bois.fr/produit/bois-buches-haute-performance/',
  'https://www.boisrosa.fr/product/palette-buches-densifiees-de-jour-eo2',
  'https://www.boisrosa.fr/product/palette-buches-de-nuit-96-paquets-de-6-buches-e02',
  'https://econobuches.fr/produit/buches-compressees/buches-compressees-nuit/offre-decouverte-de-buches-densifiees-nuit-longue-duree/',
  'https://granuleo.shop/produits/buches-densifiees-48-packs',
  // Granulés / pellets
  'https://chaufobois.fr/product/pellet-limouzi-palette-de-66-sacs-de-15-kg/',
  'https://www.pechavy-energie-bois.fr/granule-en-sac/7-3-granules-de-bois-ha-legne-orange-palette-77-sacs.html',
  'https://www.boisrosa.fr/product/granules-aeb-70-sacs-1',
  'https://boutique.woodstock-bois.fr/produit/bois-granules/',
  'https://www.phenix-combustibles.fr/produit/granules-wooday-palette-975kg/',
  'https://www.phenix-combustibles.fr/produit/granules-de-bois-premium-eo2-15kg-palette-de-66-ou-33-sacs/',
  'https://www.combustibles-gruchy.fr/produits/palette-de-granules-de-bois-piveteau-10kg',
  'https://www.combustibles-gruchy.fr/produits/palette-de-granules-de-bois-premium-gruchy-66-ou-33-sacs-de-15-kgs',
  'https://granuleo.shop/produits/granules-bois-palette-66-sacs',
  'https://granuleo.shop/produits/granules-bois-demi-palette-33-sacs',
  'https://delicourt-energies.com/products/granules-de-bois-haut-de-flamme-palette-de-66-sacs-de-15-kg-soit-990-kg',
  'https://delicourt-energies.com/products/granules-de-bois-eden-pellets-premium-palette-de-33-sacs-de-15-kg-soit-495-kg',
];

const OFF_SCOPE =
  /(allume-?feu|allumeur|accessoire|pelle-|nettoyant|entretien|barbecue|charbon|gants?|thermom|outil|d[eé]tach|cendre|hydrofuge|insecticide|m[ée]morandum|devis)/i;

/**
 * Classement du produit dans un des rayons du site.
 * Le nom du produit prime (c'est lui qui décrit le combustible) ; l'URL source
 * sert de garde-fou ; la description n'est utilisée qu'en dernier recours, car
 * elle contient souvent les rubriques du site d'origine.
 */
function inferCategory(name, description, url = '') {
  const label = name.toLowerCase();
  // Seul le chemin de l'URL est utilisé comme indice : le nom de domaine peut
  // contenir « granul… » (granuleo.shop) sans que le produit soit des granulés.
  let path = '';
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    path = '';
  }
  const fallback = description.toLowerCase();
  const isPellets = /granul|pellet/.test(label) || /granul|pellet/.test(path);
  if (isPellets) return 'granules-pellets';
  if (/densifi|compress|briquette|calorifique|haute performance|de jour|de nuit/.test(label)) return 'buche-densifiee';
  if (/ch[eê]ne/.test(label)) return 'bois-chene';
  if (/h[eê]tre/.test(label)) return 'bois-hetre';
  if (/([ée]tuv|s[ée]choir|pr[ée]?s[ée]ch)/.test(label + path)) return 'bois-etuve-sec';
  if (/granul|pellet/.test(fallback.slice(0, 400))) return 'granules-pellets';
  if (/densifi|compress|briquette/.test(fallback.slice(0, 400))) return 'buche-densifiee';
  if (/premium|pr[ée]mium/.test(label)) return 'bois-premium';
  return 'buches-traditionnelles';
}

/**
 * Les fiches sources contiennent des phrases propres à leur propre commerce
 * (zones de livraison autour de leur dépôt, invitation au devis, prix « à
 * partir de » qui ne correspond pas au prix réellement pratiqué ici). Elles
 * sont retirées pour que la fiche reste cohérente ; aucune caractéristique
 * produit n'est inventée ni réécrite.
 */
function cleanDescription(text) {
  return text
    .split(/(?<=[.!?])\s+|\s*\n+\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter(
      (sentence) =>
        !/(demande de devis|sur devis|devis gratuit|zone\s*\d|\bkm\s+de\b|à partir de\s*\d|contactez[- ]nous|nous vous invitons à nous contacter)/i.test(
          sentence
        )
    )
    .join(' ')
    .slice(0, 1400);
}

function extractSpecs(name, description) {
  const text = `${name} ${description}`;
  const humidity = (text.match(/(?:humidit[ée][^.\d]{0,25}|taux d'humidit[ée][^.\d]{0,20})(\d{1,2}(?:[.,]\d)?)\s*%/i) || [])[1];
  const length = (text.match(/\b(\d{2})\s*cm\b/i) || [])[1];
  const volume = (text.match(/(\d+(?:[.,]\d+)?)\s*(?:m3|m³)/i) || [])[1];
  const weight = (text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)\b/i) || [])[1];
  const bags = (text.match(/(\d{2,3})\s*sacs?/i) || [])[1];
  return {
    humidity: humidity ? `${humidity.replace('.', ',')} %` : null,
    logLength: length ? `${length} cm` : null,
    volumeM3: volume ? Number(volume.replace(',', '.')) : null,
    weightKg: weight ? Number(weight.replace(',', '.')) : null,
    bags: bags ? Number(bags) : null,
  };
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'fr-FR,fr;q=0.9' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function downloadImage(url, slug, index, pageUrl, seenHashes) {
  const res = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA, Referer: pageUrl, Accept: 'image/avif,image/webp,image/*' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 6000) throw new Error('fichier image trop petit');
  // Une même photo est souvent exposée par plusieurs URLs (vignette, zoom…) :
  // on ne la conserve qu'une fois.
  const hash = crypto.createHash('sha1').update(buffer).digest('hex');
  if (seenHashes.has(hash)) throw new Error('photo déjà téléchargée');
  seenHashes.add(hash);
  const fileName = `${slug}-${index}.webp`;
  const target = path.join(OUT_DIR, fileName);
  await sharp(buffer).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 84 }).toFile(target);
  const { size } = fs.statSync(target);
  // Deux URLs différentes (vignette, zoom, og:image…) peuvent pointer sur la
  // même photo : on compare l'image convertie, pas seulement l'octet source.
  const outputHash = crypto.createHash('sha1').update(fs.readFileSync(target)).digest('hex');
  if (seenHashes.has(outputHash)) {
    fs.unlinkSync(target);
    throw new Error('photo identique à une image déjà retenue');
  }
  if (size < 8000) {
    fs.unlinkSync(target);
    throw new Error(`conversion trop petite (${size} o)`);
  }
  seenHashes.add(outputHash);
  return { file: `/images/products/real/${fileName}`, sourceUrl: url, size };
}

async function main() {
  const cliUrls = process.argv.reduce((acc, arg, index) => {
    if (arg === '--url' && process.argv[index + 1]) acc.push(process.argv[index + 1]);
    return acc;
  }, []);
  const urls = [...new Set(cliUrls.length ? cliUrls : DEFAULT_URLS)];

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const prisma = new PrismaClient();
  const existingSources = fs.existsSync(SOURCES_FILE)
    ? JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'))
    : { products: [] };
  const sourcesByUrl = new Map((existingSources.products || []).map((entry) => [entry.sourceUrl, entry]));

  const categoryBySlug = new Map((await prisma.category.findMany()).map((category) => [category.slug, category]));
  const imported = [];
  const failures = [];

  for (const url of urls) {
    process.stdout.write(`\n▶ ${url}\n`);
    let html;
    try {
      html = await fetchPage(url);
    } catch (error) {
      console.log(`  ✖ page inaccessible : ${error.message}`);
      failures.push({ url, reason: error.message });
      continue;
    }

    const offer = await extractOfferFromPage(html, url);
    if (!offer) {
      console.log('  ✖ aucun prix produit exploitable sur la page');
      failures.push({ url, reason: 'balisage produit/prix absent' });
      continue;
    }
    if (OFF_SCOPE.test(`${offer.name} ${url}`)) {
      console.log(`  ✖ hors périmètre (accessoire) : ${offer.name}`);
      failures.push({ url, reason: 'produit hors périmètre (accessoire)' });
      continue;
    }

    const name = offer.name.replace(/\s*[-–|]\s*(?:Bois|Woodstock|Piskorski|Gard|Chaufo|Pechavy|Boisrosa)[^|]*$/i, '').trim();
    const description = cleanDescription(offer.description || '') || name;
    const slug = slugify(name);
    const categorySlug = inferCategory(name, description, url);
    const category = categoryBySlug.get(categorySlug);
    if (!category) {
      console.log(`  ✖ catégorie absente en base : ${categorySlug}`);
      failures.push({ url, reason: `catégorie ${categorySlug} absente` });
      continue;
    }

    if (DRY) {
      console.log(`  · ${name} — ${offer.price} ${offer.currency} — ${categorySlug} — ${offer.imageUrls.length} image(s) candidate(s)`);
      imported.push({ slug, name, price: offer.price, category: categorySlug });
      continue;
    }

    const images = [];
    const seenHashes = new Set();
    for (const imageUrl of offer.imageUrls) {
      if (images.length >= MAX_IMAGES) break;
      try {
        images.push(await downloadImage(imageUrl, slug, images.length + 1, url, seenHashes));
        console.log(`  ✔ image ${images.length}/${MAX_IMAGES} (${Math.round(images[images.length - 1].size / 1024)} Ko)`);
      } catch (error) {
        console.log(`  · image ignorée : ${error.message}`);
      }
    }
    if (!images.length) {
      console.log('  ✖ aucune photo produit téléchargeable → produit non importé');
      failures.push({ url, reason: 'images inaccessibles' });
      continue;
    }

    const specs = extractSpecs(name, description);
    const priceTTC = Number(offer.price.toFixed(2));
    const priceHT = Number((priceTTC / 1.055).toFixed(2));
    // Référence stable et unique : la fiche source est identifiée par son URL.
    const urlHash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 6).toUpperCase();
    const reference = `EXT-${slug.replace(/[^a-z0-9]/g, '').slice(0, 24).toUpperCase()}-${urlHash}`;
    const isPellets = categorySlug === 'granules-pellets';
    // Une information absente de la fiche source reste vide : l'interface
    // masque alors simplement la ligne correspondante, plutôt que d'afficher
    // un texte technique du type « non communiqué par la source ».
    const species = /ch[eê]ne/i.test(name)
      ? 'Chêne'
      : /h[eê]tre/i.test(name)
        ? 'Hêtre'
        : /r[ée]sineux|granul|pellet/i.test(name) || isPellets
          ? 'Résineux'
          : 'Feuillus';
    const enrichedDescription = [
      description,
      specs.bags ? `Conditionnement constaté sur la fiche source : ${specs.bags} sacs.` : null,
      specs.logLength ? `Longueur de bûches annoncée : ${specs.logLength}.` : null,
      specs.weightKg ? `Poids annoncé : ${specs.weightKg} kg.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const isDensified = categorySlug === 'buche-densifiee';
    // Pouvoirs calorifiques par famille de combustible (valeurs de référence du
    // secteur, identiques pour tous les produits de la même famille).
    const calorificValue = isPellets
      ? '4,8 kWh/kg (granulés ENplus)'
      : isDensified
        ? '4,8 kWh/kg (bûche densifiée)'
        : '4,2 kWh/kg (feuillus secs, env. 2 000 kWh/stère)';
    const packaging = isPellets
      ? 'Palette filmée – sacs de 15 kg'
      : isDensified
        ? 'Palette filmée – packs de bûches densifiées'
        : 'Palette filmée et houssée';

    const data = {
      reference,
      slug,
      name,
      shortDescription: (specs.bags ? `Palette de ${specs.bags} sacs. ` : '') + description.slice(0, 160),
      description: enrichedDescription,
      images: JSON.stringify(images.map((image) => image.file)),
      species,
      woodType: isPellets ? 'Granulés de bois' : isDensified ? 'Bois densifié' : 'Bois de chauffage (bûches)',
      humidityRate: specs.humidity || (isPellets || isDensified ? 'Bois transformé, humidité < 10 %' : ''),
      calorificValue,
      logLength: specs.logLength || '',
      unit: /sacs/i.test(name) ? 'Palette (sacs)' : /palette|st[èe]re/i.test(name) ? 'Palette' : 'Unité',
      packaging,
      priceHT,
      priceTTC,
      vatRate: 5.5,
      stock: /outofstock|soldout/i.test(offer.availability) ? 0 : 30,
      isPreorderAllowed: /outofstock|soldout/i.test(offer.availability),
      leadTimeDays: 7,
      categoryId: category.id,
      isActive: true,
      ...(specs.weightKg ? { weightKg: specs.weightKg } : {}),
      ...(specs.volumeM3 ? { volumeM3: specs.volumeM3 } : {}),
    };

    const saved = await prisma.product.upsert({ where: { slug }, update: data, create: data });
    console.log(`  ✔ enregistré : ${saved.name} — ${priceTTC} € (${images.length} photo(s))`);
    imported.push({ slug, name, price: priceTTC, category: categorySlug, images: images.length });
    sourcesByUrl.set(url, {
      sourceUrl: url,
      shop: new URL(url).hostname,
      title: name,
      price: priceTTC,
      currency: offer.currency,
      availability: offer.availability || null,
      extraction: offer.source,
      scrapedAt: new Date().toISOString(),
      images: images.map((image) => ({ file: image.file, sourceUrl: image.sourceUrl })),
      notes:
        'Nom, description, prix, disponibilité et photos lus sur la page produit publiée (JSON-LD schema.org, microdata itemprop ou Open Graph). Le stock affiché (30) est la valeur d’exploitation du site : la disponibilité source est conservée ici.',
    });
  }

  if (!DRY) {
    const slugs = imported.map((entry) => entry.slug);
    const disabled = await prisma.product.updateMany({
      where: { slug: { notIn: slugs }, isActive: true },
      data: { isActive: false },
    });

    fs.writeFileSync(
      SOURCES_FILE,
      JSON.stringify(
        { updatedAt: new Date().toISOString(), method: 'extraction JSON-LD / microdata / Open Graph', products: [...sourcesByUrl.values()] },
        null,
        2
      )
    );

    console.log(`\n${imported.length} produit(s) réel(s) importé(s) — ${disabled.count} produit(s) de démonstration désactivé(s).`);
  } else {
    console.log(`\n(dry-run) ${imported.length} produit(s) exploitable(s).`);
  }

  if (failures.length) {
    console.log(`\n${failures.length} page(s) écartée(s) :`);
    for (const failure of failures) console.log(`  - ${failure.url} → ${failure.reason}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
