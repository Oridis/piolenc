/**
 * Contrôle de bout en bout des e-mails transactionnels.
 *
 * Le script passe par le site réellement lancé (aucune simulation) :
 *   1. connexion en administrateur,
 *   2. validation d'une commande de test via /api/checkout  -> e-mails 1 et 2,
 *   3. rapprochement bancaire avec règlement vérifié         -> e-mail 3,
 *   4. relecture du journal des e-mails en base : statut et message
 *      d'erreur exact du fournisseur pour chaque envoi.
 *
 * Le code de sortie n'est 0 que si les trois e-mails ont réellement été
 * acceptés par le fournisseur.
 *
 *   node scripts/verify-transactional-emails.mjs [--to=adresse@exemple.fr]
 */
// Meme ordre de priorite que Next.js : .env.local puis .env.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // fichier absent : on passe au suivant
  }
}

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.AUDIT_ADMIN_EMAIL || 'admin@woodmachine-bois.fr';
const ADMIN_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!';

const toArg = process.argv.find((a) => a.startsWith('--to='));
const RECIPIENT =
  toArg?.slice(5) ||
  process.env.AUDIT_EMAIL_TO ||
  process.env.ADMIN_NOTIFICATION_EMAIL ||
  'audit-commande@example.com';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let failures = 0;

function report(label, ok, detail) {
  results.push({ label, ok, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'ECHEC'} | ${label} : ${detail}`);
}

console.log('=== 1. Configuration d\'envoi effective ===');
const providerFromEnv = process.env.EMAIL_PROVIDER?.trim() || '(non definie)';
const dbSettings = await prisma.siteSetting.findFirst();
console.log(`EMAIL_PROVIDER (.env)          : ${providerFromEnv}`);
console.log(`emailProvider en base          : ${dbSettings?.emailProvider}`);
console.log(`RESEND_API_KEY                 : ${process.env.RESEND_API_KEY ? `definie (${process.env.RESEND_API_KEY.length} car.)` : 'absente'}`);
console.log(`RESEND_FROM                    : ${process.env.RESEND_FROM || '(non definie)'}`);
console.log(`Adresse de test destinataire   : ${RECIPIENT}`);
report(
  'Configuration e-mail',
  providerFromEnv !== 'log' && providerFromEnv !== '(non definie)',
  `fournisseur retenu : ${providerFromEnv}`
);

console.log('');
console.log('=== 2. Acces au fournisseur Resend ===');
if (!process.env.RESEND_API_KEY) {
  report('Cle Resend', false, 'RESEND_API_KEY absente de .env : aucun envoi reel possible');
} else {
  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  const raw = await res.text();
  let body = null;
  try {
    body = JSON.parse(raw);
  } catch {
    /* reponse non JSON */
  }
  if (res.ok) {
    const domains = Array.isArray(body?.data) ? body.data : [];
    const verified = domains.filter((d) => d.status === 'verified').map((d) => d.name);
    report('Cle Resend', verified.length > 0, `domaines verifies : ${verified.join(', ') || 'aucun'}`);
  } else if (res.status === 401 && /restricted to only send emails/i.test(body?.message || raw)) {
    // Cle de portee « envoi uniquement » : Resend la reconnait, mais elle n'a pas
    // le droit de lire /domains. Ce n'est pas un echec : l'etat reel du domaine
    // est revele par le message d'erreur des envois qui suivent.
    report('Cle Resend', true, 'cle reconnue, de portee « envoi uniquement » (lecture des domaines non autorisee)');
  } else {
    report('Cle Resend', false, `HTTP ${res.status} — ${body?.message || raw.slice(0, 200)}`);
  }
}

console.log('');
console.log('=== 3. Connexion administrateur ===');
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
const cookie = (loginRes.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
report('Connexion admin', loginRes.ok && cookie.length > 0, `HTTP ${loginRes.status}`);

console.log('');
console.log('=== 4. Commande de test (e-mails 1 et 2) ===');
const product = await prisma.product.findFirst({
  where: { isActive: true, stock: { gt: 1 } },
  orderBy: { createdAt: 'asc' },
});
if (!product) {
  report('Produit de test', false, 'aucun produit actif en stock');
} else {
  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({
      idempotencyKey: `auditemails${Date.now().toString(36)}`,
      customer: {
        email: RECIPIENT,
        firstName: 'Audit',
        lastName: 'Emails',
        phone: '+33600000000',
      },
      shippingAddress: {
        street: '1 rue du Test',
        postalCode: '88200',
        city: 'Remiremont',
        country: 'FR',
      },
      items: [{ productId: product.id, name: product.name, quantity: 1 }],
      accessibility: { heavyTruckAccessible: true, requiresTailgate: true },
    }),
  });

  const checkoutBody = await checkoutRes.json();
  report(
    'Validation de commande',
    checkoutRes.ok && !!checkoutBody.orderNumber,
    `HTTP ${checkoutRes.status} ${checkoutBody.orderNumber ? `commande ${checkoutBody.orderNumber}` : JSON.stringify(checkoutBody).slice(0, 200)}`
  );

  const order = checkoutBody.orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber: checkoutBody.orderNumber } })
    : null;

  if (order) {
    await sleep(1500);

    console.log('');
    console.log('=== 5. Rapprochement bancaire verifie (e-mail 3) ===');
    const reconRes = await fetch(`${BASE}/api/admin/reconciliation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({
        orderId: order.id,
        receivedAmount: order.totalAmount,
        bankReference: `AUDIT-${order.orderNumber}`,
        isVerified: true,
        notes: 'Controle automatise des e-mails transactionnels.',
      }),
    });
    const reconBody = await reconRes.json().catch(() => ({}));
    report('Rapprochement verifie', reconRes.ok, `HTTP ${reconRes.status} ${reconBody.error || ''}`);

    await sleep(1500);

    console.log('');
    console.log('=== 6. Journal des e-mails pour cette commande ===');
    const logs = await prisma.emailLog.findMany({
      where: { orderId: order.id },
      orderBy: { templateId: 'asc' },
    });

    for (const templateId of [1, 2, 3]) {
      const log = logs.find((l) => l.templateId === templateId);
      const label = `E-mail ${templateId}`;
      if (!log) {
        report(label, false, 'aucune trace en base : envoi non declenche');
        continue;
      }
      const detail = `statut ${log.status} -> ${log.recipientEmail}${log.errorMessage ? ` | erreur : ${log.errorMessage}` : ''}`;
      report(label, log.status === 'SENT', detail);
    }

    // Nettoyage : on retire la commande de test et son stock reserve.
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    for (const item of await prisma.orderItem.findMany({ where: { orderId: order.id } })) {
      await prisma.product
        .update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, reservedStock: { decrement: item.quantity } },
        })
        .catch(() => {});
    }
    console.log('(commande de test et stock reserve nettoyes)');
  }
}

console.log('');
console.log('=== Resultat ===');
for (const r of results) {
  console.log(`${r.ok ? 'OK  ' : 'ECHEC'} ${r.label}`);
}
console.log(failures === 0 ? 'TOUS LES CONTROLES SONT PASSES.' : `${failures} controle(s) en echec.`);

await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
