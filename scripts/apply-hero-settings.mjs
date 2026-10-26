/**
 * Applique la migration additive des champs du hero de la page d'accueil
 * (prisma/migrations/20261026160000_site_setting_hero_content/migration.sql).
 *
 * La base distante n'est pas mise à jour par `prisma migrate deploy` dans ce
 * projet : ce script rejoue le SQL de façon idempotente (ADD COLUMN IF NOT
 * EXISTS), affiche les colonnes manquantes avant / après et ne touche à aucune
 * donnée existante.
 *
 *   node scripts/apply-hero-settings.mjs
 */
import { readFileSync } from 'node:fs';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // fichier absent : on passe au suivant
  }
}

const MIGRATION = 'prisma/migrations/20261026160000_site_setting_hero_content/migration.sql';
const COLONNES = [
  'heroBadge',
  'heroTitle',
  'heroSubtitle',
  'heroPrimaryLabel',
  'heroPrimaryHref',
  'heroSecondaryLabel',
  'heroSecondaryHref',
  'heroImageUrl',
  'heroImageCaption',
  'heroImageCaptionSub',
  'heroImageBadge',
  'heroFact1Value',
  'heroFact1Label',
  'heroFact2Value',
  'heroFact2Label',
  'heroFact3Value',
  'heroFact3Label',
];

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const presentes = async () => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'SiteSetting' AND column_name = ANY($1)`,
    COLONNES
  );
  return new Set(rows.map((r) => r.column_name));
};

const avant = await presentes();
console.log(`Colonnes hero presentes avant : ${avant.size}/${COLONNES.length}`);
if (avant.size < COLONNES.length) {
  console.log(`Manquantes : ${COLONNES.filter((c) => !avant.has(c)).join(', ')}`);
}

const sql = readFileSync(MIGRATION, 'utf8')
  .split('\n')
  .filter((ligne) => !ligne.trim().startsWith('--'))
  .join('\n');

const instructions = sql
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const instruction of instructions) {
  await prisma.$executeRawUnsafe(instruction);
}
console.log(`${instructions.length} instruction(s) SQL rejouee(s) (ADD COLUMN IF NOT EXISTS).`);

const apres = await presentes();
console.log(`Colonnes hero presentes apres : ${apres.size}/${COLONNES.length}`);
if (apres.size < COLONNES.length) {
  console.log(`TOUJOURS MANQUANTES : ${COLONNES.filter((c) => !apres.has(c)).join(', ')}`);
}

const reglages = await prisma.siteSetting.findUnique({
  where: { id: 'default-settings' },
  select: { heroBadge: true, heroTitle: true, heroPrimaryHref: true, heroImageUrl: true },
});
console.log('Valeurs enregistrees (inchangees) :', JSON.stringify(reglages, null, 2));

await prisma.$disconnect();
process.exit(apres.size === COLONNES.length ? 0 : 1);
