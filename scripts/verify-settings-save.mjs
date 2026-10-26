/**
 * Contrôle non régressif de l'enregistrement du paramétrage du site.
 *
 * La page d'administration charge /api/settings (qui ne renvoie jamais les
 * identifiants d'envoi) puis renvoie cette même charge utile : l'hôte,
 * l'utilisateur et le mot de passe SMTP ne doivent donc pas être effacés au
 * passage. L'enregistrement d'origine est restauré à la fin.
 *
 *   node scripts/verify-settings-save.mjs
 */
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // fichier absent
  }
}

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.AUDIT_ADMIN_EMAIL || 'admin@woodmachine-bois.fr';
const ADMIN_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ECHEC'} | ${label} : ${detail}`);
};

const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
check('Connexion admin', login.ok && cookie.length > 0, `HTTP ${login.status}`);
if (!cookie) {
  await prisma.$disconnect();
  process.exit(1);
}

const original = await prisma.siteSetting.findFirst();
if (!original) {
  check('Parametrage en base', false, 'aucun enregistrement SiteSetting');
  await prisma.$disconnect();
  process.exit(1);
}

const { id, createdAt, updatedAt, ...restorable } = original;

try {
  // On place des identifiants témoins, comme s'ils avaient été saisis dans le
  // back-office, puis on rejoue exactement ce que fait la page.
  await prisma.siteSetting.update({
    where: { id },
    data: { smtpHost: 'smtp.temoin.test', smtpUser: 'temoin@test.fr', smtpPassword: 'mot-de-passe-temoin' },
  });

  const publicSettings = await (await fetch(`${BASE}/api/settings`, { headers: { Cookie: cookie } })).json();
  check('Lecture du parametrage', !!publicSettings?.siteName, `siteName=${publicSettings?.siteName}`);

  const saveRes = await fetch(`${BASE}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(publicSettings),
  });
  check('Enregistrement du parametrage', saveRes.ok, `HTTP ${saveRes.status}`);

  const after = await prisma.siteSetting.findFirst();
  check('Hote SMTP conserve', after?.smtpHost === 'smtp.temoin.test', `smtpHost="${after?.smtpHost}"`);
  check('Utilisateur SMTP conserve', after?.smtpUser === 'temoin@test.fr', `smtpUser="${after?.smtpUser}"`);
  check(
    'Mot de passe SMTP conserve',
    after?.smtpPassword === 'mot-de-passe-temoin',
    after?.smtpPassword === 'mot-de-passe-temoin' ? 'inchange' : 'EFFACE par enregistrement'
  );
  check('Nom du site conserve', after?.siteName === original.siteName, `siteName="${after?.siteName}"`);
} finally {
  await prisma.siteSetting.update({ where: { id }, data: restorable });
  console.log('(parametrage d origine restaure)');
}

console.log(failures === 0 ? 'TOUS LES CONTROLES SONT PASSES.' : `${failures} controle(s) en echec.`);
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
