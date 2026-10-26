/**
 * Applique la migration additive qui permet de piloter séparément le nom du
 * site dans l'en-tête et dans le pied de page (SiteSetting.showSiteNameFooter).
 *
 * La base Neon n'est pas mise à jour par `prisma migrate deploy` dans ce
 * projet : cette commande rejoue le SQL de
 *   prisma/migrations/20261026180000_site_setting_show_site_name_footer/migration.sql
 * de façon idempotente et affiche l'état de la colonne avant / après, ainsi
 * que les deux réglages enregistrés. Aucune donnée existante n'est perdue : la
 * valeur de l'en-tête est recopiée dans le pied de page à la création.
 *
 *   node scripts/apply-footer-site-name.mjs
 */
// Meme ordre de priorite que Next.js : .env.local puis .env.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // fichier absent : on passe au suivant
  }
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const describeColumn = () =>
  prisma.$queryRawUnsafe(
    `SELECT data_type, is_nullable, column_default FROM information_schema.columns
     WHERE table_name = 'SiteSetting' AND column_name = 'showSiteNameFooter'`
  );

console.log('=== Colonne showSiteNameFooter sur SiteSetting ===');
const before = await describeColumn();
console.log('avant :', before.length > 0 ? JSON.stringify(before[0]) : 'absente');

if (before.length === 0) {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SiteSetting' AND column_name = 'showSiteNameFooter'
      ) THEN
        ALTER TABLE "SiteSetting" ADD COLUMN "showSiteNameFooter" BOOLEAN NOT NULL DEFAULT true;
        UPDATE "SiteSetting" SET "showSiteNameFooter" = "showSiteName";
      END IF;
    END $$;
  `);
  console.log('ALTER TABLE + reprise de showSiteName exécutés (colonne nullable : non, defaut true).');
}

const after = await describeColumn();
console.log('après :', after.length > 0 ? JSON.stringify(after[0]) : 'TOUJOURS ABSENTE');

const rows = await prisma.$queryRawUnsafe(
  `SELECT "siteName", "logoUrl", "showSiteName", "showSiteNameFooter"
   FROM "SiteSetting" WHERE id = 'default-settings'`
);
console.log('réglages en base :', JSON.stringify(rows[0] ?? null));

await prisma.$disconnect();
process.exit(after.length > 0 ? 0 : 1);
