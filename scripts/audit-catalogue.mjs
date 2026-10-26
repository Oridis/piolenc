/**
 * Contrôle de qualité du catalogue (exécutable à tout moment):
 *  - unicité des identifiants, slugs et références ;
 *  - champs obligatoires renseignés ;
 *  - prix cohérents (HT/TTC/TVA) ;
 *  - catégorie existante et active ;
 *  - chaque produit a une image principale et des fichiers réellement présents ;
 *  - aucune image partagée entre deux produits (pas de mélange) ;
 *  - aucun lien externe (site source) dans les données publiques.
 *
 *   node scripts/audit-catalogue.mjs            # vérifie les fichiers sur disque
 *   node scripts/audit-catalogue.mjs --http      # vérifie en plus via HTTP (site lancé)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const USE_HTTP = process.argv.includes('--http');
const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

const problems = [];
const warnings = [];

function problem(msg) { problems.push(msg); }
function warn(msg) { warnings.push(msg); }

function parseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

async function httpStatus(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.status;
  } catch (err) {
    return `ERR ${err.message}`;
  }
}

async function main() {
  const products = await prisma.product.findMany({ include: { category: true } });
  const categories = await prisma.category.findMany();
  const settings = await prisma.siteSetting.findFirst();

  console.log(`Produits: ${products.length} | Catégories: ${categories.length}\n`);

  // --- Unicité ---
  for (const field of ['id', 'slug', 'reference']) {
    const seen = new Map();
    for (const p of products) {
      const v = p[field];
      if (seen.has(v)) problem(`Doublon de ${field}: "${v}" (${p.slug})`);
      seen.set(v, p.slug);
    }
  }
  const catSlugs = new Map();
  for (const c of categories) {
    if (catSlugs.has(c.slug)) problem(`Doublon de slug catégorie: ${c.slug}`);
    catSlugs.set(c.slug, c.id);
  }

  // --- Champs, prix, catégorie ---
  for (const p of products) {
    if (!p.name || p.name.trim().length < 3) problem(`${p.slug}: nom manquant`);
    if (!(p.priceTTC > 0)) problem(`${p.slug}: prix TTC invalide (${p.priceTTC})`);
    if (!(p.priceHT > 0)) problem(`${p.slug}: prix HT invalide (${p.priceHT})`);
    if (p.vatRate < 0 || p.vatRate > 30) problem(`${p.slug}: taux de TVA invalide (${p.vatRate})`);
    const expectedHT = Number((p.priceTTC / (1 + p.vatRate / 100)).toFixed(2));
    if (Math.abs(expectedHT - p.priceHT) > 0.05) {
      problem(`${p.slug}: prix HT (${p.priceHT}) incohérent avec TTC ${p.priceTTC} à ${p.vatRate}% (attendu ${expectedHT})`);
    }
    if (!p.category) problem(`${p.slug}: aucune catégorie`);
    else if (!p.category.isActive) problem(`${p.slug}: catégorie inactive (${p.category.slug})`);
    if (!p.shortDescription || p.shortDescription.trim().length < 10) warn(`${p.slug}: description courte manquante`);
    if (p.stock < 0) problem(`${p.slug}: stock négatif`);
    if (!p.isActive) warn(`${p.slug}: produit inactif`);
  }

  // --- Images ---
  const fileOwners = new Map();
  for (const p of products) {
    const images = parseJson(p.images, []);
    if (!Array.isArray(images) || images.length === 0) {
      problem(`${p.slug}: aucune image enregistrée`);
      continue;
    }
    for (const src of images) {
      if (!src || typeof src !== 'string') { problem(`${p.slug}: entrée d'image invalide`); continue; }
      if (/^https?:\/\//i.test(src)) {
        problem(`${p.slug}: image non hébergée localement -> ${src}`);
      } else if (!src.startsWith('/images/')) {
        warn(`${p.slug}: chemin d'image inattendu -> ${src}`);
      }
      const onDisk = path.join(PUBLIC_DIR, src.replace(/^\//, ''));
      if (!fs.existsSync(onDisk)) {
        problem(`${p.slug}: fichier d'image absent du disque -> ${src}`);
      } else if (fs.statSync(onDisk).size < 2000) {
        problem(`${p.slug}: fichier d'image suspect (trop petit) -> ${src}`);
      }
      if (fileOwners.has(src)) {
        problem(`Image partagée entre deux produits: ${src} (${fileOwners.get(src)} et ${p.slug})`);
      } else {
        fileOwners.set(src, p.slug);
      }
      if (USE_HTTP) {
        const status = await httpStatus(`${BASE}${src}`);
        if (status !== 200) problem(`${p.slug}: image ${src} -> HTTP ${status}`);
      }
    }
  }

  // --- Catégories: couverture ---
  for (const c of categories) {
    const n = products.filter((p) => p.categoryId === c.id).length;
    if (n === 0) warn(`catégorie ${c.slug}: aucun produit`);
    if (c.imageUrl) {
      const onDisk = path.join(PUBLIC_DIR, c.imageUrl.replace(/^\//, ''));
      if (!fs.existsSync(onDisk)) problem(`catégorie ${c.slug}: image absente -> ${c.imageUrl}`);
    } else {
      warn(`catégorie ${c.slug}: pas d'image de couverture`);
    }
  }

  // --- Liens externes dans les données publiques ---
  const urlRe = /https?:\/\/[^\s"'<>]+/gi;
  const allowedHosts = /(facebook\.com|instagram\.com|piolenc|allomaison)/i;
  for (const p of products) {
    for (const field of ['description', 'shortDescription', 'seoTitle', 'seoDescription', 'images']) {
      const value = p[field];
      if (typeof value !== 'string') continue;
      for (const match of value.match(urlRe) || []) {
        if (!allowedHosts.test(match)) problem(`${p.slug}: lien externe dans ${field} -> ${match}`);
      }
    }
  }
  for (const c of categories) {
    for (const match of (c.description || '').match(urlRe) || []) {
      if (!allowedHosts.test(match)) problem(`catégorie ${c.slug}: lien externe -> ${match}`);
    }
  }
  if (settings) {
    for (const key of ['cgvText', 'privacyPolicyText', 'cookiePolicyText', 'legalMentionsText', 'deliveryPolicyText', 'seoDescription']) {
      for (const match of (settings[key] || '').match(urlRe) || []) {
        if (!allowedHosts.test(match)) problem(`paramètres ${key}: lien externe -> ${match}`);
      }
    }
  }

  // --- Rapport ---
  console.log(`Images distinctes: ${fileOwners.size}`);
  if (problems.length) {
    console.log(`\n❌ ${problems.length} PROBLÈME(S):`);
    for (const p of problems) console.log('  - ' + p);
  } else {
    console.log('\n✅ Aucun problème bloquant détecté.');
  }
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} avertissement(s):`);
    for (const w of warnings) console.log('  - ' + w);
  }

  await prisma.$disconnect();
  if (problems.length) process.exitCode = 1;
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
