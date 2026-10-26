/**
 * Installe une clé API Resend dans le .env du projet, en la validant d'abord
 * auprès du fournisseur. La clé n'est jamais affichée : seules sa longueur et
 * une empreinte SHA-256 le sont.
 *
 *   node scripts/install-resend-key.mjs [chemin-du-fichier-cle] [--from="Expéditeur <adresse>"]
 *
 * Par défaut le fichier est .resend-key.txt à la racine du projet : il doit
 * contenir la clé seule, sur une ligne. Il est supprimé après installation.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const fromArg = args.find((a) => a.startsWith('--from='));
const keyFile = args.find((a) => !a.startsWith('--')) || '.resend-key.txt';

const describe = (value) =>
  `${value.length} car. · empreinte ${createHash('sha256').update(value).digest('hex').slice(0, 12)}`;

if (!existsSync(keyFile)) {
  console.error(`Fichier introuvable : ${keyFile}`);
  console.error('');
  console.error('Deposez la clé Resend seule dans ce fichier (elle y est lue puis supprimée) :');
  console.error(`  ${keyFile}`);
  console.error('');
  console.error('Le fichier ne doit contenir QUE la clé, sur une seule ligne, sans guillemets.');
  process.exit(2);
}

// Une clé collée depuis un navigateur peut contenir des espaces, des retours à
// la ligne ou des guillemets : on nettoie avant de juger la validité.
const raw = readFileSync(keyFile, 'utf8');
const cleaned = raw.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');

if (!cleaned) {
  console.error('Le fichier ne contient pas de clé.');
  process.exit(2);
}

console.log(`Clé lue depuis ${keyFile} : ${describe(cleaned)}`);

if (!cleaned.startsWith('re_')) {
  console.error('Format inattendu : une clé Resend commence par « re_ ». Rien n\'a été écrit.');
  process.exit(1);
}
if (cleaned.length < 30) {
  console.error(`Clé trop courte (${cleaned.length} caractères) : la copie est probablement tronquée. Rien n'a été écrit.`);
  process.exit(1);
}

console.log('Validation auprès de Resend...');
const check = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${cleaned}` },
});
const rawBody = await check.text();
let body = null;
try {
  body = JSON.parse(rawBody);
} catch {
  /* réponse non JSON */
}

// Une clé de portée « envoi uniquement » est reconnue par Resend mais n'a pas
// le droit de lire /domains : Resend répond 401 « restricted to only send
// emails ». Ce n'est pas une clé invalide, c'est une clé d'envoi : on l'accepte
// et on note que la liste des domaines restera indisponible.
const sendOnly =
  !check.ok && check.status === 401 && /restricted to only send emails/i.test(body?.message || rawBody);
const invalid = !check.ok && !sendOnly;

if (invalid) {
  console.error(`Clé REFUSÉE par Resend (HTTP ${check.status}) : ${body?.message || rawBody.slice(0, 200)}`);
  console.error('Rien n\'a été écrit dans .env. Le fichier temporaire est conservé pour correction.');
  process.exit(1);
}

if (sendOnly) {
  console.log('Clé reconnue par Resend, de portée « envoi uniquement » (lecture des domaines non autorisée).');
}

const domains = Array.isArray(body?.data) ? body.data : [];
const verified = domains.filter((d) => d.status === 'verified');

// Mise à jour ciblée de .env : les autres lignes sont conservées telles quelles.
const envPath = '.env';
const envLines = (existsSync(envPath) ? readFileSync(envPath, 'utf8') : '').split(/\r?\n/);
let replaced = false;
const updated = envLines.map((line) => {
  if (/^\s*RESEND_API_KEY\s*=/.test(line)) {
    replaced = true;
    return `RESEND_API_KEY="${cleaned}"`;
  }
  return line;
});

if (fromArg) {
  const fromValue = fromArg.slice(7);
  let fromReplaced = false;
  for (let i = 0; i < updated.length; i += 1) {
    if (/^\s*RESEND_FROM\s*=/.test(updated[i])) {
      updated[i] = `RESEND_FROM="${fromValue}"`;
      fromReplaced = true;
    }
  }
  if (!fromReplaced) updated.push(`RESEND_FROM="${fromValue}"`);
}

if (!replaced) updated.push(`RESEND_API_KEY="${cleaned}"`);

writeFileSync(envPath, updated.join('\n'));
rmSync(keyFile, { force: true });

console.log('');
console.log(`Clé valide${sendOnly ? ' (envoi uniquement)' : ''}. Écrite dans .env (${replaced ? 'ligne RESEND_API_KEY remplacée' : 'ligne RESEND_API_KEY ajoutée'}).`);
console.log(`Fichier temporaire supprimé : ${keyFile}`);
if (fromArg) console.log(`Expéditeur forcé : RESEND_FROM="${fromArg.slice(7)}"`);

console.log('');
console.log('=== Domaines du compte Resend ===');
if (sendOnly) {
  console.log('Indisponible : cette clé ne peut pas lire la liste des domaines.');
  console.log('La vérification se fera au premier envoi réel (message d\'erreur de Resend).');
} else if (domains.length === 0) {
  console.log('Aucun domaine : Resend n\'autorise alors que l\'expéditeur onboarding@resend.dev');
  console.log('et uniquement vers l\'adresse propriétaire du compte.');
} else {
  for (const d of domains) console.log(`  - ${d.name} : ${d.status}`);
}

console.log('');
console.log('Prochaine étape : redémarrer le serveur, puis');
console.log('  node scripts/verify-transactional-emails.mjs --to=adresse@exemple.fr');
