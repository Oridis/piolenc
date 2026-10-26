/**
 * Contrôle du catalogue réellement présent en base et dans le stockage du site.
 *   node scripts/verify-catalogue.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { isActive: true },
  include: { category: true },
  orderBy: { name: 'asc' },
});
const all = await prisma.product.count();
const inactive = await prisma.product.count({ where: { isActive: false } });

let externalRefs = 0;
let missingFiles = 0;
const rows = [];
for (const p of products) {
  let images = [];
  try { images = JSON.parse(p.images || '[]'); } catch { images = []; }
  const local = images.filter((url) => String(url).startsWith('/images/'));
  const external = images.filter((url) => /^https?:\/\//i.test(String(url)));
  externalRefs += external.length;
  const existing = local.filter((url) => fs.existsSync(path.join(ROOT, 'public', url.replace(/^\//, ''))));
  missingFiles += local.length - existing.length;
  rows.push({
    id: p.id, name: p.name, ref: p.reference, slug: p.slug,
    category: p.category?.name || '(aucune)',
    priceTTC: p.priceTTC, priceHT: p.priceHT, vat: p.vatRate,
    stock: p.stock, images: local.length, existantes: existing.length,
    externes: external.length, description: p.description?.length || 0,
  });
}

console.log(`Produits en base : ${all} (actifs : ${products.length}, désactivés : ${inactive})`);
console.log(`Catégories : ${(await prisma.category.findMany()).map((c) => `${c.name}(${c.slug})`).join(', ')}`);
console.log(`Images externes encore référencées : ${externalRefs}`);
console.log(`Fichiers image manquants dans public/ : ${missingFiles}\n`);
for (const [index, row] of rows.entries()) {
  console.log(
    `${String(index + 1).padStart(2)}. ${row.name.slice(0, 58).padEnd(60)} | ${row.category.padEnd(30)} | ${String(row.priceTTC).padStart(8)} € | img ${row.existantes}/${row.images} loc. + ${row.externes} ext. | desc ${String(row.description).padStart(4)} car.`
  );
}
const problems = rows.filter((r) => r.existantes === 0 || r.externes > 0 || !r.category || r.description < 60);
console.log(`\nProduits à corriger : ${problems.length}`);
for (const p of problems) console.log(`  - ${p.name} (images ${p.existantes}, ext ${p.externes}, desc ${p.description})`);
await prisma.$disconnect();
