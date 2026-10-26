/**
 * Télécharge des photos de bois de chauffage sous licence libre commercialement
 * réutilisable (CC0 / domaine public / CC-BY, jamais NC ni SA) depuis l'API
 * Openverse, les convertit en WebP et les enregistre dans
 * public/images/products/.
 *
 * Usage:
 *   node scripts/fetch-product-images.mjs --pool        # ne télécharge rien, liste les pools
 *   node scripts/fetch-product-images.mjs --limit 4     # traite 4 produits (debug)
 *   node scripts/fetch-product-images.mjs               # traitement complet
 *
 * Sortie: public/images/products/<slug>-1.webp (principale) puis -2, -3 (galerie)
 *         scripts/product-image-credits.json (traçabilité interne, non servi au public)
 *         scripts/product-images.json (mapping produit -> fichiers)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// `sharp` est fourni par la chaîne d'outils déjà présente dans node_modules
// (@opennextjs/cloudflare / miniflare). On le charge en CJS et on retombe sur
// le JPEG d'origine si l'optimisation n'est pas disponible.
const require = createRequire(import.meta.url);
let sharp = null;
try {
  sharp = require('sharp');
} catch {
  console.warn('sharp indisponible : les images seront enregistrées sans conversion WebP.');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');
const CREDITS_FILE = path.join(__dirname, 'product-image-credits.json');
const MAPPING_FILE = path.join(__dirname, 'product-images.json');

const API = 'https://api.openverse.org/v1/images/';
const LICENSES = 'cc0,pdm,by'; // commercialement réutilisables uniquement
const UA = 'AlloMaisonCatalog/1.0 (product image import; contact: contact@piolencboisdirect.fr)';
const CACHE_FILE = path.join(__dirname, '.openverse-pools.json');
const args = process.argv.slice(2);
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? parseInt(args[i + 1], 10) : 0;
})();
const ONLY = (() => {
  const i = args.indexOf('--only');
  if (i < 0 || !args[i + 1]) return null;
  return new Set(args[i + 1].split(',').map((s) => s.trim()).filter(Boolean));
})();
const POOL_ONLY = args.includes('--pool');

/**
 * Une entrée par produit: slug + requêtes Openverse par ordre de préférence.
 * La 1re requête sert à l'image principale, les suivantes à la galerie.
 */
const PLAN = [
  { slug: 'briquette-bois-compresse-100-hetre', queries: ['briquette fuel', 'briquettes', 'compressed wood'] },
  { slug: 'bois-chauffage-25cm-2-steres', queries: ['firewood stack', 'stacked firewood logs', 'firewood pile'] },
  { slug: 'bois-chauffage-sec-30cm-3-steres', queries: ['chopped firewood', 'wood pile stacked', 'firewood heap'] },
  { slug: 'bois-chauffage-etuve-extra-sec-40cm', queries: ['kiln dried firewood', 'firewood logs stacked', 'log pile'] },
  { slug: 'bois-chauffage-seche-naturel-40cm', queries: ['wood logs pile', 'logs stacked outdoors', 'natural dried firewood'] },
  { slug: 'bois-chauffage-33cm-2-steres', queries: ['beech firewood', 'firewood bundles', 'oak logs'] },
  { slug: 'bois-chauffage-50cm-2-steres', queries: ['large firewood logs', 'firewood stack outdoor', 'split logs'] },
  { slug: 'granules-bois-premium-66-sacs', queries: ['wood pellets', 'pellet bags', 'pellet fuel'] },
  { slug: 'granules-bois-premium-65-sacs', queries: ['pellet fuel', 'wood pellets closeup', 'pellet bags'] },
  { slug: 'granules-bois-dinplus-66-sacs', queries: ['pellet bags', 'wood pellets', 'pellet fuel'] },
  { slug: 'buches-compressees-25cm', queries: ['briquettes', 'compressed wood', 'briquette fuel'] },
  { slug: 'buches-compressees-33cm', queries: ['compressed wood', 'briquettes', 'wood briquettes'] },
  { slug: 'buches-compressees-40cm', queries: ['briquette fuel', 'compressed wood', 'briquettes'] },
  { slug: 'buches-compressees-50cm', queries: ['wood briquettes', 'briquettes', 'compressed wood'] },
  { slug: 'buches-chauffage-25cm-2-steres', queries: ['firewood logs', 'stacked logs firewood', 'oak firewood pile'] },
  { slug: 'buches-chauffage-30cm-3-steres', queries: ['hardwood logs', 'firewood stack covered', 'split wood pile'] },
  { slug: 'buches-chauffage-33cm-2-steres', queries: ['seasoned firewood', 'logs in garden', 'firewood row'] },
  { slug: 'buches-chauffage-40cm-25-steres', queries: ['chopped wood pile', 'firewood stack winter', 'wood logs'] },
  { slug: 'buches-chauffage-50cm-palette-2-steres', queries: ['long logs firewood', 'log pile forest', 'firewood storage'] },
  { slug: 'granules-bois-100-resineux-66-sacs', queries: ['wood pellets closeup', 'pellet fuel', 'wood pellets'] },
  // Produits historiques du catalogue (conservés: 122 commandes y font référence).
  { slug: 'bois-chene-33-pal2', queries: ['oak logs', 'firewood stack', 'log pile'] },
  { slug: 'bois-prem-25-pal1', queries: ['hardwood logs', 'split logs', 'firewood bundles'] },
  { slug: 'bois-hetre-20-pal2', queries: ['beech firewood', 'firewood pile', 'chopped firewood'] },
];

/**
 * Dernier recours si les requêtes d'un produit sont épuisées: on garde une
 * image de bois de chauffage générique plutôt que de laisser la fiche vide.
 */
const FALLBACKS = ['firewood stack', 'chopped firewood', 'firewood pile', 'wood pellets', 'briquettes', 'compressed wood'];


function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchPool(query) {
  // L'API Openverse plafonne page_size à 20 et limite le débit des appels
  // anonymes (429). On espace les requêtes et on retente avec un backoff.
  const url = `${API}?q=${encodeURIComponent(query)}&license=${LICENSES}&extension=jpg&page_size=20&mature=false`;
  const headers = { Accept: 'application/json', 'User-Agent': UA };
  if (process.env.OPENVERSE_TOKEN) headers.Authorization = `Bearer ${process.env.OPENVERSE_TOKEN}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429 || res.status === 401) {
        const wait = 5000 * attempt;
        console.log(`   ${res.status} sur "${query}", pause ${wait}ms (essai ${attempt}/5)`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        console.log(`   HTTP ${res.status} sur "${query}"`);
        return [];
      }
      const json = await res.json();
      const results = Array.isArray(json.results) ? json.results : [];
      return results
        .filter((r) => r && r.url && LICENSES.split(',').includes(r.license))
        .filter((r) => (r.width || 0) >= 640 && (r.height || 0) >= 480)
        .filter((r) => {
          const ar = (r.width || 1) / (r.height || 1);
          return ar >= 0.7 && ar <= 2.0; // formats exploitables en fiche produit
        })
        .map((r) => ({
          id: r.id,
          url: r.url,
          thumbnail: r.thumbnail,
          title: r.title || '',
          creator: r.creator || '',
          creatorUrl: r.creator_url || '',
          license: r.license,
          licenseVersion: r.license_version,
          licenseUrl: r.license_url || '',
          landingUrl: r.foreign_landing_url || '',
          provider: r.provider || '',
          width: r.width,
          height: r.height,
          query,
        }));
    } catch (err) {
      console.log(`   erreur réseau sur "${query}": ${err.message}`);
      await sleep(2000 * attempt);
    }
  }
  return [];
}

async function downloadAndConvert(candidate, outFile, width, quality) {
  const res = await fetch(candidate.url, {
    headers: { 'User-Agent': UA, Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 3000) throw new Error(`fichier trop petit (${buf.byteLength} o)`);

  let outBuf = buf;
  if (sharp) {
    outBuf = await sharp(buf)
      .rotate()
      .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } else if (path.extname(outFile) !== '.jpg') {
    outFile = outFile.replace(/\.webp$/, '.jpg');
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, outBuf);
  return { bytes: outBuf.byteLength, file: `/images/products/${path.basename(outFile)}` };
}

async function main() {
  let plan = LIMIT > 0 ? PLAN.slice(0, LIMIT) : PLAN;
  if (ONLY) plan = plan.filter((p) => ONLY.has(p.slug));

  // 1. Construire les pools de candidats (une requête HTTP par terme unique).
  //    Les pools sont mis en cache sur disque: relancer le script complète
  //    uniquement les termes manquants, ce qui évite de saturer l'API anonyme.
  const terms = [...new Set([...plan.flatMap((p) => p.queries), ...FALLBACKS])];
  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    cache = {};
  }

  const pools = {};
  const toFetch = terms.filter((t) => !Array.isArray(cache[t]) || cache[t].length === 0);
  console.log(`${terms.length} termes, ${toFetch.length} à récupérer (licences ${LICENSES})...`);
  for (const term of toFetch) {
    const list = await fetchPool(term);
    if (list.length > 0) cache[term] = list;
    console.log(`  "${term}" -> ${list.length} candidats`);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    await sleep(4000); // respect des limites de l'API anonyme
  }
  for (const term of terms) {
    pools[term] = cache[term] || [];
    if (!toFetch.includes(term)) console.log(`  "${term}" -> ${pools[term].length} candidats (cache)`);
  }

  if (POOL_ONLY) {
    const total = Object.values(pools).reduce((n, l) => n + l.length, 0);
    console.log(`\nTotal candidats: ${total} (mode --pool, rien téléchargé)`);
    return;
  }

  // On préserve les entrées déjà produites pour les produits non retraités.
  let previousCredits = [];
  let previousMapping = {};
  try {
    previousCredits = JSON.parse(fs.readFileSync(CREDITS_FILE, 'utf8')).products || [];
    previousMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8')) || {};
  } catch {
    previousCredits = [];
    previousMapping = {};
  }

  const usedIds = new Set();
  const credits = [];
  const mapping = {};

  for (const product of plan) {
    const files = [];
    const picked = [];

    for (const term of product.queries) {
      const pool = pools[term] || [];
      const candidate = pool.find((c) => !usedIds.has(c.id));
      if (!candidate) {
        console.log(`  ⚠ ${product.slug}: plus de candidat pour "${term}"`);
        continue;
      }
      usedIds.add(candidate.id);
      const isMain = files.length === 0;
      const name = `${product.slug}-${files.length + 1}.webp`;
      const outFile = path.join(OUT_DIR, name);
      try {
        const saved = await downloadAndConvert(candidate, outFile, isMain ? 1200 : 900, isMain ? 80 : 76);
        files.push(saved.file);
        picked.push({ ...candidate, file: saved.file, bytes: saved.bytes });
      } catch (err) {
        console.log(`  ⚠ ${product.slug}: téléchargement échoué (${err.message}) pour ${candidate.url}`);
        usedIds.delete(candidate.id);
      }
      await sleep(600);
    }

    // Compléter la galerie avec les pools génériques si nécessaire.
    if (files.length < 3) {
      for (const term of FALLBACKS) {
        if (files.length >= 3) break;
        const pool = pools[term] || [];
        const candidate = pool.find((c) => !usedIds.has(c.id));
        if (!candidate) continue;
        usedIds.add(candidate.id);
        const isMain = files.length === 0;
        const name = `${product.slug}-${files.length + 1}.webp`;
        const outFile = path.join(OUT_DIR, name);
        try {
          const saved = await downloadAndConvert(candidate, outFile, isMain ? 1200 : 900, isMain ? 80 : 76);
          files.push(saved.file);
          picked.push({ ...candidate, file: saved.file, bytes: saved.bytes, fallback: true });
          console.log(`  ↳ ${product.slug}: complété par "${term}"`);
        } catch (err) {
          usedIds.delete(candidate.id);
        }
        await sleep(500);
      }
    }

    mapping[product.slug] = files;
    credits.push({
      slug: product.slug,
      images: picked.map((p) => ({
        file: p.file,
        title: p.title,
        creator: p.creator,
        creatorUrl: p.creatorUrl,
        license: p.license,
        licenseVersion: p.licenseVersion,
        licenseUrl: p.licenseUrl,
        sourcePage: p.landingUrl,
        provider: p.provider,
        originalUrl: p.url,
        width: p.width,
        height: p.height,
        bytes: p.bytes,
        query: p.query,
      })),
    });
    console.log(`✓ ${product.slug}: ${files.length} image(s)`);
  }

  // Fusion avec les produits déjà traités lors d'une exécution précédente.
  const mergedMapping = { ...previousMapping, ...mapping };
  const bySlug = new Map(previousCredits.map((c) => [c.slug, c]));
  for (const c of credits) bySlug.set(c.slug, c);
  const mergedCredits = [...bySlug.values()];

  fs.writeFileSync(CREDITS_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), licenseFilter: LICENSES, products: mergedCredits }, null, 2));
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mergedMapping, null, 2));

  const totalBytes = credits.flatMap((c) => c.images).reduce((n, i) => n + (i.bytes || 0), 0);
  console.log(`\n${credits.length} produits, ${credits.flatMap((c) => c.images).length} images, ${(totalBytes / 1024 / 1024).toFixed(2)} Mo`);
  console.log(`Crédits: ${path.relative(ROOT, CREDITS_FILE)}`);
  console.log(`Mapping: ${path.relative(ROOT, MAPPING_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
