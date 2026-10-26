/**
 * Vérifie, sur le site lancé, que chaque type de compte se connecte et atteint
 * bien son espace : backoffice pour les rôles internes, espace client pour un
 * client. Les requêtes sont espacées pour ne pas saturer le serveur de
 * développement.
 *
 *   node scripts/verify-accounts-access.mjs
 */
const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!';

/** Rôles attendus : pages autorisées, et page de repli interdite le cas échéant. */
const ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    email: 'admin@woodmachine-bois.fr',
    allowed: ['/admin', '/admin/commandes', '/admin/produits', '/admin/utilisateurs', '/admin/personnalisation'],
    landing: '/admin',
  },
  {
    role: 'ACCOUNTANT',
    email: 'compta@woodmachine-bois.fr',
    allowed: ['/admin', '/admin/virements', '/admin/commandes'],
    landing: '/admin',
  },
  {
    role: 'LOGISTICS_MANAGER',
    email: 'logistique@woodmachine-bois.fr',
    allowed: ['/admin', '/admin/livraisons'],
    landing: '/admin',
  },
  {
    role: 'CUSTOMER',
    email: 'jean.dupont@example.com',
    allowed: ['/mon-compte'],
    landing: '/mon-compte',
    // Un client ne doit pas entrer dans le backoffice.
    forbidden: ['/admin'],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
let failures = 0;

function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

for (const account of ACCOUNTS) {
  console.log(`\n== ${account.role} (${account.email})`);
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: PASSWORD }),
  });
  const payload = await login.json().catch(() => null);
  const cookie = (login.headers.getSetCookie?.() || []).map((value) => value.split(';')[0]).join('; ');

  check(
    `${account.role} : connexion acceptée`,
    login.status === 200 && cookie.length > 0,
    `HTTP ${login.status}${payload?.error ? ` — ${payload.error}` : ''}`
  );
  if (!cookie) continue;

  const me = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  const meBody = await me.json().catch(() => null);
  check(
    `${account.role} : session reconnue avec le bon rôle`,
    me.status === 200 && meBody?.user?.role === account.role,
    `rôle renvoyé : ${meBody?.user?.role ?? me.status}`
  );

  await sleep(250);
  for (const path of account.allowed) {
    const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie }, redirect: 'manual' });
    const location = res.headers.get('location') || '';
    check(
      `${account.role} : ${path} accessible`,
      res.status === 200,
      `HTTP ${res.status}${location ? ` → ${location}` : ''}`
    );
    await sleep(250);
  }

  for (const path of account.forbidden || []) {
    const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie }, redirect: 'manual' });
    check(
      `${account.role} : ${path} refusé`,
      res.status !== 200,
      `HTTP ${res.status}${res.headers.get('location') ? ` → ${res.headers.get('location')}` : ''}`
    );
    await sleep(250);
  }
}

const anonymous = await fetch(`${BASE}/admin`, { redirect: 'manual' });
check(
  'Visiteur anonyme : /admin renvoie vers la connexion',
  anonymous.status !== 200,
  `HTTP ${anonymous.status}${anonymous.headers.get('location') ? ` → ${anonymous.headers.get('location')}` : ''}`
);

console.log(`\n${results.length - failures}/${results.length} vérifications réussies`);
if (failures) {
  console.log('\nÉchecs :');
  for (const result of results.filter((entry) => !entry.ok)) console.log(`  - ${result.label} → ${result.detail}`);
  process.exitCode = 1;
}
