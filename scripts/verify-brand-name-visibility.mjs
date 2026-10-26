/**
 * Contrôle non régressif des deux réglages d'affichage du nom du site :
 *  - showSiteName       -> en-tête (barre de navigation)
 *  - showSiteNameFooter -> pied de page
 *
 * Le pied de page est rendu côté serveur : sa marque est donc vérifiable dans
 * le HTML de l'accueil. La barre de navigation, elle, relit /api/settings au
 * montage du navigateur : ce script contrôle donc pour l'en-tête la valeur
 * renvoyée par l'API et l'enregistrement en base, et s'assure que la page
 * inspectable (celle qui porte la barre) est bien servie.
 *
 * Le paramétrage d'origine est restauré à la fin.
 *
 *   node scripts/verify-brand-name-visibility.mjs
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

const SITE_PAGE = process.env.AUDIT_SITE_PAGE || '/boutique';

/** Classe du <span> qui porte le nom du site à côté du logo, en-tête et pied de page. */
const BRAND_TEXT_FOOTER = 'font-semibold text-lg text-white tracking-tight';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK   ' : 'ECHEC'} | ${label} : ${detail}`);
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

const readPublic = async () =>
  await (await fetch(`${BASE}/api/settings`, { headers: { Cookie: cookie } })).json();

/** Rejoue exactement ce que fait la page d'administration : charge puis renvoie la charge utile. */
const save = async (patch) => {
  const payload = { ...(await readPublic()), ...patch };
  const res = await fetch(`${BASE}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  return res;
};

const homeHtml = async () => await (await fetch(`${BASE}/`)).text();

const blockOf = (html, tag) => {
  const match = html.match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`));
  return match ? match[0] : '';
};

const scenario = async (label, patch, expectations) => {
  const res = await save(patch);
  check(`${label} — enregistrement`, res.ok, `HTTP ${res.status}`);

  const saved = await prisma.siteSetting.findFirst();
  const api = await readPublic();
  const html = await homeHtml();
  const footer = blockOf(html, 'footer');
  const navPage = blockOf(await (await fetch(`${BASE}${SITE_PAGE}`)).text(), 'header');

  check(
    `${label} — réglages en base`,
    saved?.showSiteName === expectations.headerInDb &&
      saved?.showSiteNameFooter === expectations.footerInDb,
    `showSiteName=${saved?.showSiteName} showSiteNameFooter=${saved?.showSiteNameFooter}`
  );
  check(
    `${label} — API publique`,
    api.showSiteName === expectations.headerInDb && api.showSiteNameFooter === expectations.footerInDb,
    `showSiteName=${api.showSiteName} showSiteNameFooter=${api.showSiteNameFooter}`
  );
  check(
    `${label} — pied de page rendu`,
    footer.includes(BRAND_TEXT_FOOTER) === expectations.footerTextShown,
    expectations.footerTextShown ? 'nom affiché à côté du logo' : 'logo seul, aucun nom en texte'
  );
  // Le pied de page doit rester complet dans tous les cas.
  check(`${label} — pied de page intact`, footer.includes('SIRET'), 'mentions société toujours présentes');
  // La barre de navigation est hydratée côté navigateur : le HTML initial porte
  // toujours le nom, c'est l'API qui décide de son affichage final. On vérifie
  // ici que la page d'inspection sert bien la barre (contrôle navigateur ensuite).
  check(
    `${label} — barre de navigation servie sur ${SITE_PAGE}`,
    navPage.includes('sticky top-0'),
    navPage.includes('sticky top-0') ? 'en-tête présent' : 'en-tête ABSENT de la page'
  );
};

try {
  const withLogo = original.logoUrl || '/logo.svg';

  await scenario(
    'A. logo seul en haut, texte en bas',
    { logoUrl: withLogo, showSiteName: false, showSiteNameFooter: true },
    { headerInDb: false, footerInDb: true, footerTextShown: true }
  );

  await scenario(
    'B. texte en haut, logo seul en bas',
    { logoUrl: withLogo, showSiteName: true, showSiteNameFooter: false },
    { headerInDb: true, footerInDb: false, footerTextShown: false }
  );

  await scenario(
    'C. logo seul partout',
    { logoUrl: withLogo, showSiteName: false, showSiteNameFooter: false },
    { headerInDb: false, footerInDb: false, footerTextShown: false }
  );

  // Garde-fou : sans logo image, le nom doit rester affiché même si les deux
  // cases ont été décochées puis le logo retiré.
  await scenario(
    'D. sans logo, cases décochées',
    { logoUrl: '', showSiteName: false, showSiteNameFooter: false },
    { headerInDb: false, footerInDb: false, footerTextShown: true }
  );
} finally {
  const { id, createdAt, updatedAt, ...restorable } = original;
  await prisma.siteSetting.update({ where: { id }, data: restorable });
  const restored = await prisma.siteSetting.findFirst();
  console.log(
    `(paramétrage d'origine restauré : showSiteName=${restored?.showSiteName} showSiteNameFooter=${restored?.showSiteNameFooter} logoUrl="${restored?.logoUrl}")`
  );
}

console.log(failures === 0 ? 'TOUS LES CONTROLES SONT PASSES.' : `${failures} controle(s) en echec.`);
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
