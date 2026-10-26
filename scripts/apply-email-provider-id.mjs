/**
 * Applique la migration additive qui ajoute l'identifiant de message du
 * fournisseur au journal des e-mails (EmailLog.providerMessageId).
 *
 * La base Neon n'est pas mise à jour par `prisma migrate deploy` dans ce
 * projet : cette commande rejoue le SQL de
 *   prisma/migrations/20261026120000_email_log_provider_id/migration.sql
 * de façon idempotente (ADD COLUMN IF NOT EXISTS) et affiche l'état de la
 * colonne avant / après. Aucune donnée existante n'est touchée.
 *
 *   node scripts/apply-email-provider-id.mjs
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
    `SELECT data_type, is_nullable FROM information_schema.columns
     WHERE table_name = 'EmailLog' AND column_name = 'providerMessageId'`
  );

console.log('=== Colonne providerMessageId sur EmailLog ===');
const before = await describeColumn();
console.log('avant :', before.length > 0 ? JSON.stringify(before[0]) : 'absente');

if (before.length === 0) {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT'
  );
  console.log('ALTER TABLE exécuté (ADD COLUMN IF NOT EXISTS, colonne nullable).');
}

const after = await describeColumn();
console.log('après :', after.length > 0 ? JSON.stringify(after[0]) : 'TOUJOURS ABSENTE');

const total = await prisma.emailLog.count();
console.log(`Données existantes intactes : ${total} ligne(s) de journal.`);

await prisma.$disconnect();
process.exit(after.length > 0 ? 0 : 1);
