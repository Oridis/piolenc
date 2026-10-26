/**
 * Diagnostic de la configuration e-mail.
 *
 * N'affiche JAMAIS la valeur d'un secret : uniquement sa présence et sa longueur.
 * Usage : node scripts/email-state.mjs
 */
// Node charge les fichiers .env nativement ici : le projet n'embarque pas
// dotenv. Ordre identique a celui de Next.js (.env.local prioritaire sur
// .env) : la premiere valeur lue n'est pas ecrasee par les suivantes.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // fichier absent : on passe au suivant
  }
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const isSecret = (key) => /PASSWORD|KEY|SECRET|TOKEN/i.test(key);
const show = (key, value) => {
  if (value === undefined) return 'absente';
  if (isSecret(key)) return value === '' ? 'definie mais vide' : `<definie, ${String(value).length} car.>`;
  return JSON.stringify(value);
};
const maskDb = (value) => {
  if (value === null || value === undefined) return '(non defini en base)';
  const str = String(value);
  if (str.trim() === '') return '(vide en base)';
  return `<en base, ${str.length} car.>`;
};

const s = await prisma.siteSetting.findFirst();

console.log('--- Reglages e-mail enregistres en base ---');
console.log('emailProvider           :', JSON.stringify(s?.emailProvider));
console.log('smtpHost                :', JSON.stringify(s?.smtpHost));
console.log('smtpPort                :', JSON.stringify(s?.smtpPort));
console.log('smtpUser                :', JSON.stringify(s?.smtpUser));
console.log('smtpPassword            :', maskDb(s?.smtpPassword));
console.log('smtpFrom                :', JSON.stringify(s?.smtpFrom));
console.log('adminNotificationEmail  :', JSON.stringify(s?.adminNotificationEmail));

console.log('');
console.log('--- Variables d environnement (presence seulement) ---');
for (const k of [
  'EMAIL_PROVIDER',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'ADMIN_NOTIFICATION_EMAIL',
  'NEXT_PUBLIC_APP_URL',
]) {
  console.log(k.padEnd(24), show(k, process.env[k]));
}

console.log('');
console.log('--- Journal des e-mails (par statut) ---');
const counts = await prisma.emailLog.groupBy({ by: ['status'], _count: { _all: true } });
if (counts.length === 0) console.log('(aucun e-mail enregistre)');
for (const c of counts) console.log(c.status.padEnd(10), c._count._all);

console.log('');
console.log('--- 5 derniers e-mails ---');
const last = await prisma.emailLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: {
    templateId: true,
    recipientEmail: true,
    status: true,
    errorMessage: true,
    retryCount: true,
    createdAt: true,
  },
});
if (last.length === 0) console.log('(aucun)');
for (const l of last) {
  console.log(
    `tpl${l.templateId} -> ${l.recipientEmail} [${l.status}] essais=${l.retryCount} ${l.errorMessage ?? ''}`
  );
}

await prisma.$disconnect();
