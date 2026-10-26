/**
 * Contrôle du site réellement servi (HTTP), pour le catalogue importé :
 *  - chaque page publique répond 200 ;
 *  - chaque produit actif est visible sur sa fiche et sur la boutique ;
 *  - aucune page publique ne renvoie vers un site marchand d'origine.
 *
 *   node scripts/audit-http-public.mjs            # http://localhost:3000
 *   AUDIT_BASE_URL=http://localhost:3000 node scripts/audit-http-public.mjs
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES_FILE = path.join(ROOT, 'scripts', 'product-sources.json');
const prisma = new PrismaClient();

/** Domaines des boutiques sources : ils ne doivent jamais apparaître côté client. */
function sourceHosts() {
  const hosts = new Set(['gardbois.fr', 'chaufobois.fr', 'pechavy-energie-bois.fr', 'boisrosa.fr', 'woodstock-bois.fr', 'granuleo.shop', 'econobuches.fr', 'frboischauffage.com', 'phenix-combustibles.fr', 'combustibles-gruchy.fr', 'delicourt-energies.com', 'piskorski-bois-energie.fr']);
  if (fs.existsSync(SOURCES_FILE)) {
    for (const entry of JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8')).products || []) {
      try {
        hosts.add(new URL(entry.sourceUrl).hostname.replace(/^www\./, ''));
      } catch {
        /* URL illisible */
      }
    }
  }
  return [...hosts];
}

const problems = [];
const results = [];

async function getPage(url) {
  const res = await fetch(`${BASE}${url}`, { headers: { Accept: 'text/html' }, redirect: 'follow' });
  return { status: res.status, html: await res.text() };
}

function findSourceLinks(html, hosts) {
  const found = new Set();
  for (const match of html.matchAll(/(?:href|src|action)="([^"]+)"/gi)) {
    const target = match[1];
    for (const host of hosts) {
      if (target.includes(host)) found.add(`${target} (${host})`);
    }
  }
  return [...found];
}

const products = await prisma.product.findMany({ where: { isActive: true }, include: { category: true } });
const categories = [...new Set(products.map((p) => p.category?.slug).filter(Boolean))];
const hosts = sourceHosts();

const pages = [
  '/',
  '/boutique',
  '/categories',
  '/panier',
  '/commande',
  '/promotions',
  '/faq',
  '/contact',
  '/catalogue',
  // Les rayons sont servis par la boutique filtrée : /boutique?categorie=<slug>.
  ...categories.map((slug) => `/boutique?categorie=${slug}`),
  ...products.map((p) => `/produit/${p.slug}`),
];

for (const page of pages) {
  try {
    const { status, html } = await getPage(page);
    const links = findSourceLinks(html, hosts);
    if (status !== 200) problems.push(`${page} → HTTP ${status}`);
    if (links.length) problems.push(`${page} → lien vers une boutique source : ${links.join(', ')}`);
    results.push({ page, status, length: html.length, sourceLinks: links.length });
  } catch (error) {
    problems.push(`${page} → erreur : ${error.message}`);
  }
}

// Chaque rayon filtré doit réellement afficher les produits de sa catégorie.
for (const slug of categories) {
  const expected = products.filter((p) => p.category?.slug === slug);
  try {
    const { html } = await getPage(`/boutique?categorie=${slug}`);
    const missing = expected.filter((p) => !html.includes(p.name.replace(/\s+/g, ' ').trim().slice(0, 40)));
    if (missing.length) {
      problems.push(`/boutique?categorie=${slug} → ${missing.length}/${expected.length} produit(s) de la catégorie absents : ${missing.map((p) => p.slug).join(', ')}`);
    }
  } catch (error) {
    problems.push(`/boutique?categorie=${slug} → erreur : ${error.message}`);
  }
}

// Chaque produit doit apparaître nommément sur sa fiche.
for (const product of products) {
  try {
    const { html } = await getPage(`/produit/${product.slug}`);
    const name = product.name.replace(/\s+/g, ' ').trim();
    const needle = name.slice(0, 40);
    if (!html.includes(needle)) problems.push(`/produit/${product.slug} → le nom du produit n'apparaît pas dans la page`);
    const images = JSON.parse(product.images || '[]');
    for (const image of images) {
      if (!html.includes(image)) problems.push(`/produit/${product.slug} → image ${image} absente du HTML`);
    }
  } catch (error) {
    problems.push(`/produit/${product.slug} → erreur : ${error.message}`);
  }
}

console.log(`Pages testées : ${results.length} (dont ${products.length} fiches produit, ${categories.length} catégories)`);
console.log(`Boutiques sources surveillées : ${hosts.length}`);
const failures = results.filter((r) => r.status !== 200);
console.log(`Pages en erreur : ${failures.length}`);
for (const failure of failures) console.log(`  - ${failure.page} → ${failure.status}`);

if (problems.length) {
  console.log(`\n❌ ${problems.length} problème(s) :`);
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exitCode = 1;
} else {
  console.log('\n✅ Toutes les pages publiques répondent 200, affichent les produits réels et ne renvoient vers aucun site marchand source.');
}

await prisma.$disconnect();
