/**
 * Remplacement des visuels produits par des photos réellement pertinentes.
 *
 * Constat d'audit : les images précédentes venaient d'une recherche par mots-clés
 * sur Openverse et comprenaient des photos totalement hors sujet (façades de
 * maisons, livres anciens, champignons, bateaux…). Une boutique de bois de
 * chauffage ne peut pas afficher cela sur une fiche produit.
 *
 * Cette version interroge Wikimedia Commons (catégories de recherche dédiées),
 * ne garde que des licences sans obligation d'attribution visible (domaine
 * public / CC0), filtre les titres sur le vocabulaire du bois de chauffage,
 * télécharge les fichiers, les convertit en WebP dans public/images/products/,
 * puis met à jour :
 *   - scripts/product-image-credits.json (traçabilité des licences) ;
 *   - scripts/product-images.json (mapping produit -> fichiers) ;
 *   - la colonne `images` des produits en base.
 *
 *   node scripts/fetch-product-images-commons.mjs
 *   node scripts/fetch-product-images-commons.mjs --only feuillus --per 2
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');
const CREDITS_FILE = path.join(__dirname, 'product-image-credits.json');
const MAPPING_FILE = path.join(__dirname, 'product-images.json');

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'PiolencBoisCatalog/2.0 (product photography; contact: contact@piolencboisdirect.fr)';

const args = process.argv.slice(2);
const PER_PRODUCT = (() => {
  const i = args.indexOf('--per');
  return i >= 0 ? Math.max(1, parseInt(args[i + 1], 10) || 3) : 3;
})();

/** Familles de produits : termes de recherche Commons et vocabulaire attendu dans le titre. */
const FAMILIES = {
  buches: {
    search: [
      'firewood stacked',
      'firewood pile logs',
      'split firewood',
      'stacked logs firewood drying',
      'brennholz gestapelt',
      'kaminholz',
      'scheitholz',
      'cordwood',
      'firewood storage',
      'wood logs stacked outdoor',
    ],
    categories: ['Firewood', 'Log_piles', 'Woodpiles', 'Firewood_in_Germany', 'Firewood_in_France'],
    titleFilter: /(firewood|fire wood|log pile|logs|brennholz|bûche|buche|bois de chauffage|split wood|woodpile|stacked wood|kaminholz|scheitholz|cordwood)/i,
  },
  granules: {
    search: ['wood pellets', 'holzpellets', 'pellet fuel wood', 'wood pellet bag', 'pellets sack'],
    categories: ['Wood_pellets'],
    titleFilter: /(pellet|granul|pellets)/i,
  },
  briquettes: {
    search: [
      'wood briquettes',
      'compressed wood briquettes',
      'holzbrikett',
      'sawdust briquette',
      'brikett holz',
      'rindenbrikett',
      'biomass briquette',
    ],
    categories: ['Wood_briquettes', 'Briquettes', 'Holzbriketts'],
    titleFilter: /(briquette|brikett|briqueta|compressed wood|pressling)/i,
  },
};

/** Rattachement de chaque produit du catalogue à une famille visuelle. */
function familyOf(slug) {
  if (slug.startsWith('granules')) return 'granules';
  if (slug.includes('compresse') || slug.includes('briquette')) return 'briquettes';
  return 'buches';
}

const prisma = new PrismaClient();

/**
 * Notation des candidats : on privilégie les plans « produit » (tas, pile,
 * rangée de bûches, sacs de granulés) et on écarte les photos de contexte
 * (personnes, camions, usines, documents historiques) qui ne montrent pas la
 * marchandise.
 */
const PRODUCT_LIKE = /(stack|stacked|pile|heap|cord|wall of|stored|storage|drying|dry|pallet|crate|sack|bag|bundle)/i;
const CONTEXT_LIKE = /(truck|lorry|factory|plant |mill|building|house|street|road|snow ?sled|sled|man |woman|child|girl|boy|people|portrait|nara|fmib|postcard|stamp|drawing|painting|engraving|map|logo|sign|ship|boat|train)/i;
/**
 * Sujets à exclure sans discussion : les recherches « briquette » / « biomass »
 * ramènent des briquettes de fumier ou de déchets, inacceptables dans un
 * catalogue de bois de chauffage.
 */
const FORBIDDEN_SUBJECT =
  /(manure|dung|feces|faeces|slurry|waste|garbage|rubbish|plastic|paper briquette|charcoal briquette|charcoal\b|twig|branch|basket|cat litter|coffee|biomass briquette|anlage|presse|press\b|machine|maschine|brikettieranlage|handlung|shop|store|lodge|chairs|3d\b)/i;
const WOOD_SUBJECT = /(firewood|fire wood|brennholz|kaminholz|scheitholz|holzscheit|log pile|logs stack|stacked logs|stack of logs|woodpile|wood pile|wood pellet|holzpellets|pellet|wood briquette|holzbrikett|brikett|buche|bûche|brennstoff)/i;

function scoreCandidate(candidate) {
  let score = 0;
  if (FORBIDDEN_SUBJECT.test(candidate.title)) return -100;
  if (!WOOD_SUBJECT.test(candidate.title)) score -= 6;
  if (PRODUCT_LIKE.test(candidate.title)) score += 6;
  if (CONTEXT_LIKE.test(candidate.title)) score -= 8;
  if (/firewood|brennholz|pellet|brikett|briquette|log/i.test(candidate.title)) score += 2;
  if (candidate.width >= 1600 && candidate.height >= 1200) score += 1;
  return score;
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params }).toString()}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons HTTP ${res.status}`);
  return res.json();
}

// Licences réutilisables commercialement : CC0 / domaine public et CC-BY
// (attribution obligatoire, affichée sous la galerie produit). Les licences
// NC (usage commercial interdit) et ND (modification interdite) sont exclues.
const ALLOWED_LICENSE =
  /^(cc0|public domain|pd |no restrictions|pd-|cc-zero|cc by(?!-nc|-nd)|cc-by(?!-nc|-nd))/i;

function collect(seen, json, family) {
  const pages = Object.values(json?.query?.pages || {});
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const title = page.title.replace(/^File:/, '');
    if (!/\.(jpe?g|png)$/i.test(title)) continue;
    if (!FAMILIES[family].titleFilter.test(title)) continue;
    if ((info.width || 0) < 1000 || (info.height || 0) < 700) continue;
    const license = info.extmetadata?.LicenseShortName?.value || '';
    if (!ALLOWED_LICENSE.test(license.trim())) continue;
    if (seen.has(title)) continue;
    if (FORBIDDEN_SUBJECT.test(title)) return;
    if (!WOOD_SUBJECT.test(title)) return;
    seen.set(title, {
      title,
      descriptionUrl: info.descriptionurl,
      originalUrl: info.url,
      thumbUrl: info.thumburl || info.url,
      width: info.width,
      height: info.height,
      license,
      licenseUrl: info.extmetadata?.LicenseUrl?.value || '',
      artist: (info.extmetadata?.Artist?.value || '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120),
    });
  }
}

/** Fichiers membres de catégories Commons : vivier complémentaire à la recherche. */
async function harvestCategories(family, seen) {
  for (const category of FAMILIES[family].categories || []) {
    let members = [];
    try {
      const json = await api({
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmtype: 'file',
        cmlimit: '100',
      });
      members = (json?.query?.categorymembers || []).map((member) => member.title);
    } catch (error) {
      console.warn(`  ⚠ catégorie ${category} indisponible : ${error.message}`);
      continue;
    }
    for (let i = 0; i < members.length; i += 20) {
      const batch = members.slice(i, i + 20).map((title) => title.replace(/^File:/, ''));
      try {
        const json = await api({
          action: 'query',
          titles: batch.map((title) => `File:${title}`).join('|'),
          prop: 'imageinfo',
          iiprop: 'url|size|mime|extmetadata',
          iiurlwidth: '1600',
        });
        collect(seen, json, family);
      } catch (error) {
        console.warn(`  ⚠ lot ${category} ignoré : ${error.message}`);
      }
    }
  }
}

async function searchCandidates(family, limit = 50) {
  const seen = new Map();
  await harvestCategories(family, seen);
  for (const term of FAMILIES[family].search) {
    let json;
    try {
      json = await api({
        action: 'query',
        generator: 'search',
        gsrsearch: `filetype:bitmap ${term}`,
        gsrnamespace: '6',
        gsrlimit: String(limit),
        prop: 'imageinfo',
        iiprop: 'url|size|mime|extmetadata',
        iiurlwidth: '1600',
      });
    } catch (error) {
      console.warn(`  ⚠ recherche « ${term} » impossible : ${error.message}`);
      continue;
    }
    collect(seen, json, family);
  }
  return [...seen.values()];
}

async function download(candidate, slug, index) {
  const res = await fetch(candidate.thumbUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const target = path.join(OUT_DIR, `${slug}-${index}.webp`);
  await sharp(buffer)
    .rotate()
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(target);
  const { size } = fs.statSync(target);
  if (size < 8000) throw new Error(`fichier trop petit (${size} o)`);
  return { file: `/images/products/${slug}-${index}.webp`, size };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, slug: true, name: true },
  });
  if (!products.length) throw new Error('Aucun produit actif en base.');

  const byFamily = new Map();
  for (const product of products) {
    const family = familyOf(product.slug);
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(product);
  }

  const credits = { generatedAt: new Date().toISOString(), licenseFilter: 'public-domain,cc0,cc-by', products: [] };
  const mapping = {};
  const usedTitles = new Set();
  const report = [];
  const leftovers = new Map();

  const ONLY_FAMILY = process.env.ONLY_FAMILY || '';
  for (const [family, list] of byFamily) {
    if (ONLY_FAMILY && family !== ONLY_FAMILY) continue;
    console.log(`\n▶ Famille ${family} (${list.length} produits) — recherche Commons…`);
    const candidates = (await searchCandidates(family)).sort(
      (a, b) => scoreCandidate(b) - scoreCandidate(a)
    );
    console.log(`  ${candidates.length} candidats pertinents sous licence libre.`);
    let cursor = 0;
    // Vivier de secours : les photos de bûches empilées restent pertinentes pour
    // des bûches densifiées, faute de photos libres de briquettes en quantité.
    // Secours uniquement pour les bûches densifiées (aspect proche de bûches empilées).
    const fallbackPool = family === 'briquettes' ? leftovers.get('buches') || [] : [];
    let fallbackCursor = 0;

    for (const product of list) {
      const images = [];
      while (images.length < PER_PRODUCT) {
        const candidate =
          cursor < candidates.length
            ? candidates[cursor++]
            : fallbackCursor < fallbackPool.length
              ? fallbackPool[fallbackCursor++]
              : null;
        if (!candidate) break;
        if (usedTitles.has(candidate.title)) continue;
        try {
          const saved = await download(candidate, product.slug, images.length + 1);
          usedTitles.add(candidate.title);
          images.push({
            file: saved.file,
            title: candidate.title,
            creator: candidate.artist || 'Wikimedia Commons',
            creatorUrl: candidate.descriptionUrl,
            license: candidate.license,
            licenseUrl: candidate.licenseUrl,
            sourcePage: candidate.descriptionUrl,
            provider: 'wikimedia-commons',
            originalUrl: candidate.originalUrl,
            width: candidate.width,
            height: candidate.height,
          });
        } catch (error) {
          console.warn(`  ⚠ ${product.slug}: ${candidate.title.slice(0, 50)} → ${error.message}`);
        }
      }

      if (!images.length) {
        console.error(`  ✖ ${product.slug} : aucune image exploitable, produit laissé en l'état.`);
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(images.map((image) => image.file)) },
      });

      mapping[product.slug] = images.map((image) => image.file);
      credits.products.push({ slug: product.slug, images });
      report.push({ slug: product.slug, count: images.length });
      console.log(`  ✔ ${product.slug} : ${images.length} image(s)`);
    }

    leftovers.set(
      family,
      candidates.filter((candidate) => !usedTitles.has(candidate.title))
    );
  }

  fs.writeFileSync(CREDITS_FILE, JSON.stringify(credits, null, 2));
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));

  // Copie importable par l'application pour afficher les crédits photo (CC-BY).
  const CREDITS_MODULE = path.join(ROOT, 'src', 'lib', 'product-image-credits.json');
  fs.mkdirSync(path.dirname(CREDITS_MODULE), { recursive: true });
  fs.writeFileSync(CREDITS_MODULE, JSON.stringify(credits, null, 2));

  const total = report.reduce((sum, row) => sum + row.count, 0);
  console.log(`\n${report.length}/${products.length} produits mis à jour, ${total} images hébergées localement.`);
  const light = report.filter((row) => row.count < PER_PRODUCT);
  if (light.length) {
    console.log(`Produits avec moins de ${PER_PRODUCT} images : ${light.map((r) => `${r.slug}(${r.count})`).join(', ')}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
