/**
 * Réhydrate les fichiers images produits à partir du registre de crédits.
 *
 * Le registre scripts/product-image-credits.json est la source de vérité des
 * licences. Après un téléchargement partiel, les fichiers du disque peuvent ne
 * plus correspondre aux crédits enregistrés : ce script retélécharge chaque
 * fichier depuis l'URL d'origine créditée, le reconvertit en WebP et réécrit le
 * même chemin. Le registre et les fichiers restent ainsi cohérents.
 *
 *   node scripts/rehydrate-images-from-credits.mjs
 *   node scripts/rehydrate-images-from-credits.mjs --slug buches-compressees-33cm
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');
const CREDITS_FILE = path.join(__dirname, 'product-image-credits.json');
const UA = 'PiolencBoisCatalog/2.0 (image integrity sync; contact: contact@piolencboisdirect.fr)';

const args = process.argv.slice(2);
const ONLY_SLUGS = (() => {
  const i = args.indexOf('--slug');
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',').map((s) => s.trim())) : null;
})();

const credits = JSON.parse(fs.readFileSync(CREDITS_FILE, 'utf8'));

async function main() {
  let done = 0;
  let failed = 0;

  for (const product of credits.products) {
    if (ONLY_SLUGS && !ONLY_SLUGS.has(product.slug)) continue;
    for (const image of product.images) {
      const fileName = path.basename(image.file);
      const target = path.join(OUT_DIR, fileName);
      const url = image.originalUrl || image.thumbUrl;
      if (!url) {
        console.warn(`  ⚠ ${product.slug}/${fileName}: aucune URL d'origine`);
        failed++;
        continue;
      }
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await sharp(buffer)
          .rotate()
          .resize({ width: 1400, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(target);
        const { size } = fs.statSync(target);
        if (size < 8000) throw new Error(`fichier trop petit (${size} o)`);
        done++;
        console.log(`  ✔ ${fileName} (${Math.round(size / 1024)} Ko) ← ${image.title.slice(0, 45)}`);
      } catch (error) {
        console.warn(`  ✖ ${fileName}: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n${done} fichier(s) synchronisé(s), ${failed} échec(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
