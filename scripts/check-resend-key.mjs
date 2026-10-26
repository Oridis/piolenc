/**
 * Diagnostic de la clé Resend : détermine QUEL fichier d'environnement la
 * fournit et si les valeurs diffèrent, sans jamais afficher la clé.
 *
 * Chaque valeur est réduite à : longueur, forme (prefixe/suffixe lisibles) et
 * empreinte SHA-256 tronquée — de quoi comparer deux clés entre elles sans
 * pouvoir les reconstituer.
 *
 *   node scripts/check-resend-key.mjs
 */
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const FILES = ['.env', '.env.local'];

function parseEnvFile(file) {
  const result = {};
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value;
  }
  return result;
}

const describe = (value) => {
  if (value === undefined) return 'non definie';
  if (value === '') return 'definie mais vide';
  const fingerprint = createHash('sha256').update(value).digest('hex').slice(0, 12);
  const shape = /^re_[A-Za-z0-9]+$/.test(value)
    ? 'format Resend (re_ + caracteres alphanumeriques)'
    : 'format INHABITUEL — verifier la copie';
  return `${value.length} car. · empreinte ${fingerprint} · ${shape}`;
};

console.log('=== Fichiers d environnement ===');
const parsed = {};
for (const file of FILES) {
  const data = parseEnvFile(file);
  parsed[file] = data;
  if (!data) {
    console.log(`${file.padEnd(12)} : absent`);
    continue;
  }
  const mtime = statSync(file).mtime.toISOString().replace('T', ' ').slice(0, 19);
  console.log(`${file.padEnd(12)} : modifie le ${mtime}`);
  console.log(`${''.padEnd(12)}   RESEND_API_KEY -> ${describe(data.RESEND_API_KEY)}`);
  console.log(`${''.padEnd(12)}   EMAIL_PROVIDER -> ${describe(data.EMAIL_PROVIDER)}`);
  console.log(`${''.padEnd(12)}   RESEND_FROM    -> ${describe(data.RESEND_FROM)}`);
}

// Priorité de Next.js : .env.local d'abord, puis .env ; l'environnement du
// processus shell reste prioritaire sur les deux.
const fromShell = process.env.RESEND_API_KEY;
const effective =
  fromShell !== undefined
    ? fromShell
    : parsed['.env.local']?.RESEND_API_KEY ?? parsed['.env']?.RESEND_API_KEY;

console.log('');
console.log('=== Cle effectivement utilisee par le site ===');
console.log('origine      :', fromShell !== undefined ? 'variable du shell' : parsed['.env.local']?.RESEND_API_KEY !== undefined ? '.env.local (prioritaire)' : parsed['.env']?.RESEND_API_KEY !== undefined ? '.env' : 'aucune');
console.log('valeur       :', describe(effective));

if (parsed['.env']?.RESEND_API_KEY !== undefined && parsed['.env.local']?.RESEND_API_KEY !== undefined) {
  const identique = parsed['.env'].RESEND_API_KEY === parsed['.env.local'].RESEND_API_KEY;
  console.log('');
  console.log(
    identique
      ? 'Les deux fichiers portent la MEME cle.'
      : 'ATTENTION : .env et .env.local portent des cles DIFFERENTES ; .env.local est prioritaire en developpement.'
  );
}

console.log('');
console.log('=== Test de la cle effective aupres de Resend ===');
const res = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${effective ?? ''}` },
});
const raw = await res.text();
let body = null;
try {
  body = JSON.parse(raw);
} catch {
  /* reponse non JSON */
}
console.log('GET /domains -> HTTP', res.status);
if (res.ok) {
  const domains = Array.isArray(body?.data) ? body.data : [];
  console.log(`Domaines du compte : ${domains.length}`);
  for (const d of domains) console.log(`  - ${d.name} : ${d.status}`);
} else {
  console.log('Message du fournisseur :', body?.message || raw.slice(0, 200));
}
