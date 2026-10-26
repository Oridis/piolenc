/**
 * Bascule l'expéditeur d'e-mails et l'adresse des alertes administrateur sur une
 * nouvelle boîte, dans les fichiers d'environnement locaux ET dans les réglages
 * enregistrés en base (page d'administration).
 *
 * Les fichiers .env ne sont jamais réécrits entièrement : seules les lignes des
 * deux clés concernées sont remplacées, tout le reste (commentaires, ordre,
 * secrets) est conservé tel quel. Aucun secret n'est affiché.
 *
 *   node scripts/switch-mail-sender.mjs serviceclient@piolencboisdirect.fr ["Nom affiché"]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const adresse = (process.argv[2] || '').trim();
if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(adresse)) {
  console.error('Usage : node scripts/switch-mail-sender.mjs adresse@domaine ["Nom affiché"]');
  process.exit(2);
}
const nomAffiche = process.argv[3]?.trim() || 'piolencboisdirect Bois';
const smtpFrom = `${nomAffiche} <${adresse}>`;

const CIBLES = [
  ['SMTP_FROM', smtpFrom],
  ['ADMIN_NOTIFICATION_EMAIL', adresse],
];

/** Remplace la valeur d'une clé, en conservant le reste du fichier intact. */
function majEnv(fichier) {
  const contenu = readFileSync(fichier, 'utf8');
  let resultat = contenu;
  const appliquees = [];

  for (const [cle, valeur] of CIBLES) {
    const motif = new RegExp(`^${cle}=.*$`, 'm');
    const ligne = `${cle}="${valeur}"`;
    if (motif.test(resultat)) {
      const avant = resultat.match(motif)[0];
      resultat = resultat.replace(motif, ligne);
      appliquees.push(`${cle} : ${avant} -> ${ligne}`);
    } else {
      resultat = resultat.replace(/\n?$/, `\n${ligne}\n`);
      appliquees.push(`${cle} : (absente) -> ${ligne}`);
    }
  }

  if (resultat !== contenu) writeFileSync(fichier, resultat, 'utf8');
  return appliquees;
}

console.log('=== Fichiers d\'environnement ===');
for (const fichier of ['.env.local', '.env']) {
  if (!existsSync(fichier)) {
    console.log(`${fichier} : absent, ignore`);
    continue;
  }
  for (const ligne of majEnv(fichier)) console.log(`${fichier} | ${ligne}`);
}

console.log('');
console.log('=== Reglages en base (page d\'administration) ===');
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const avant = await prisma.siteSetting.findUnique({ where: { id: 'default-settings' } });
const apres = await prisma.siteSetting.update({
  where: { id: 'default-settings' },
  data: { smtpFrom, adminNotificationEmail: adresse },
  select: { smtpFrom: true, adminNotificationEmail: true, emailProvider: true },
});
console.log('smtpFrom               :', avant?.smtpFrom, '->', apres.smtpFrom);
console.log('adminNotificationEmail :', avant?.adminNotificationEmail, '->', apres.adminNotificationEmail);
console.log('emailProvider          :', apres.emailProvider, '(inchange)');
await prisma.$disconnect();

console.log('');
console.log('Pour la production (Vercel), pensez a reporter les memes valeurs dans le tableau de bord.');
