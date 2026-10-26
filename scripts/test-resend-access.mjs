/**
 * Vérifie les accès au fournisseur e-mail Resend SANS jamais afficher la clé :
 * liste les domaines du compte et leur état de vérification.
 *
 *   node scripts/test-resend-access.mjs
 */
// Meme ordre de priorite que Next.js : .env.local puis .env.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // fichier absent : on passe au suivant
  }
}

const key = process.env.RESEND_API_KEY || '';
if (!key) {
  console.log('RESEND_API_KEY absente de l enveronnement (.env).');
  process.exit(1);
}
console.log(`RESEND_API_KEY presente (${key.length} caracteres, prefixe "${key.slice(0, 3)}...").`);

const res = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${key}` },
});

const bodyText = await res.text();
console.log('GET https://api.resend.com/domains ->', res.status);

let parsed = null;
try {
  parsed = JSON.parse(bodyText);
} catch {
  // reponse non JSON
}

if (res.ok && parsed) {
  const domains = Array.isArray(parsed.data) ? parsed.data : [];
  if (domains.length === 0) {
    console.log('Aucun domaine enregistre sur ce compte Resend.');
  }
  for (const d of domains) {
    console.log(`  - ${d.name} : status=${d.status} region=${d.region ?? '-'}`);
  }
} else {
  const message = parsed?.message || parsed?.error?.message || bodyText.slice(0, 300);
  console.log('Reponse du fournisseur :', message);
}
