/**
 * Test de bout en bout, sur le site réellement lancé, du parcours client et du
 * règlement avec le seul moyen de paiement intégré au projet : le virement
 * bancaire SEPA (paymentMethod = BANK_TRANSFER).
 *
 * Chaque assertion repose sur un résultat observable : code HTTP, corps de
 * réponse, page HTML rendue et état relu en base.
 *
 *   node scripts/test-parcours-paiement.mjs
 *   AUDIT_BASE_URL=http://localhost:3000 node scripts/test-parcours-paiement.mjs
 */
import { PrismaClient } from '@prisma/client';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();
const ADMIN = { email: 'admin@woodmachine-bois.fr', password: process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!' };
const ACCOUNTANT = { email: 'compta@woodmachine-bois.fr', password: process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!' };

const results = [];
let failures = 0;

function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function json(pathName, options = {}) {
  const res = await fetch(`${BASE}${pathName}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body, res };
}

function baseOrder(product, quantity = 1, overrides = {}) {
  return {
    customer: { email: 'test.parcours@example.com', firstName: 'Test', lastName: 'Parcours', phone: '0600000000' },
    shippingAddress: { street: '10 rue des Tests', postalCode: '84500', city: 'Bollène', country: 'FR' },
    billingAddress: { street: '10 rue des Tests', postalCode: '84500', city: 'Bollène', country: 'FR' },
    items: [
      {
        productId: product.id,
        name: product.name,
        quantity,
        // Prix volontairement faux : le serveur doit recalculer depuis la base.
        unitPriceTTC: 1,
        priceTTC: 1,
      },
    ],
    accessibility: { heavyTruckAccessible: true, steepSlope: false, accessInstructions: '' },
    customerNotes: 'TEST AUTOMATISÉ — parcours et paiement (virement bancaire).',
    ...overrides,
  };
}

const randomKey = () => `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---------------------------------------------------------------- 1. Catalogue
const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { priceTTC: 'asc' } });
check('Le catalogue actif contient au moins 20 produits réels', products.length >= 20, `${products.length} produits actifs`);

const product = products.find((p) => p.stock > 2) || products[0];
const productPage = await fetch(`${BASE}/produit/${product.slug}`);
const productHtml = await productPage.text();
check('La fiche produit répond 200', productPage.status === 200, `${product.slug} → HTTP ${productPage.status}`);
check(
  'La fiche affiche le nom et le prix du produit enregistré',
  productHtml.includes(product.name.slice(0, 30)) && productHtml.includes(String(product.priceTTC).replace('.', ',')),
  `prix attendu ${product.priceTTC} €`
);

// ------------------------------------------------- 2. Contrôles d'intégrité
const falsified = await json('/api/checkout', { method: 'POST', body: JSON.stringify(baseOrder(product, 1, { idempotencyKey: randomKey() })) });
check('Une commande réelle est acceptée (HTTP 200)', falsified.status === 200, `HTTP ${falsified.status} ${falsified.body?.error || ''}`);
check(
  'Le prix falsifié par le navigateur est ignoré (recalcul serveur)',
  falsified.body?.totalAmount >= product.priceTTC,
  `total renvoyé ${falsified.body?.totalAmount} € pour un produit à ${product.priceTTC} €`
);
check(
  'Les coordonnées bancaires de règlement sont renvoyées',
  Boolean(falsified.body?.bankDetails?.iban && falsified.body?.bankDetails?.reference),
  `IBAN ...${String(falsified.body?.bankDetails?.iban || '').slice(-4)} · réf ${falsified.body?.bankDetails?.reference}`
);
check(
  'La référence de virement reprend le numéro de commande',
  falsified.body?.bankDetails?.reference === falsified.body?.orderNumber,
  `${falsified.body?.orderNumber}`
);

const orderAfterCreate = await prisma.order.findUnique({
  where: { orderNumber: falsified.body.orderNumber },
  include: { paymentRecords: true, deliveryShipment: true },
});
check(
  'La commande est enregistrée en attente de règlement (PENDING_TRANSFER)',
  orderAfterCreate?.paymentStatus === 'PENDING_TRANSFER' && orderAfterCreate?.paymentMethod === 'BANK_TRANSFER',
  `paymentStatus=${orderAfterCreate?.paymentStatus}, paymentMethod=${orderAfterCreate?.paymentMethod}`
);
check(
  'Un enregistrement de paiement est créé avec le montant attendu et 0 € reçu',
  Math.abs((orderAfterCreate?.paymentRecords?.[0]?.expectedAmount ?? 0) - orderAfterCreate.totalAmount) < 0.01 &&
    (orderAfterCreate?.paymentRecords?.[0]?.receivedAmount ?? -1) === 0,
  `attendu ${orderAfterCreate?.paymentRecords?.[0]?.expectedAmount} € / reçu ${orderAfterCreate?.paymentRecords?.[0]?.receivedAmount} €`
);

// ------------------------------------------------ 3. Cas d'erreur et limites
const zeroQty = await json('/api/checkout', { method: 'POST', body: JSON.stringify(baseOrder(product, 0, { idempotencyKey: randomKey() })) });
check('Une quantité nulle est refusée', zeroQty.status === 400, `HTTP ${zeroQty.status} — ${zeroQty.body?.error}`);

const tooMany = await json('/api/checkout', {
  method: 'POST',
  body: JSON.stringify(baseOrder(product, product.stock + 5, { idempotencyKey: randomKey() })),
});
check('Une quantité supérieure au stock est refusée', tooMany.status === 400, `HTTP ${tooMany.status} — ${tooMany.body?.error}`);

const ghost = await json('/api/checkout', {
  method: 'POST',
  body: JSON.stringify(baseOrder({ ...product, id: 'produit-inexistant' }, 1, { idempotencyKey: randomKey() })),
});
check('Un produit inexistant est refusé', ghost.status === 400, `HTTP ${ghost.status} — ${ghost.body?.error}`);

const inactive = await prisma.product.findFirst({ where: { isActive: false } });
if (inactive) {
  const inactiveOrder = await json('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(baseOrder(inactive, 1, { idempotencyKey: randomKey() })),
  });
  check(
    "Un produit retiré du catalogue n'est pas commandable",
    inactiveOrder.status === 400,
    `HTTP ${inactiveOrder.status} — ${inactiveOrder.body?.error}`
  );
}

const emptyCart = await json('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({ ...baseOrder(product, 1, { idempotencyKey: randomKey() }), items: [] }),
});
check('Un panier vide est refusé', emptyCart.status === 400, `HTTP ${emptyCart.status} — ${emptyCart.body?.error}`);

const missingAddress = await json('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    ...baseOrder(product, 1, { idempotencyKey: randomKey() }),
    shippingAddress: { street: '', postalCode: '', city: '', country: 'FR' },
  }),
});
check('Une adresse de livraison incomplète est refusée', missingAddress.status === 400, `HTTP ${missingAddress.status} — ${missingAddress.body?.error}`);

// -------------------------------------- 4. Double soumission / rafraîchissement
// Même clé d'idempotence envoyée deux fois en parallèle : c'est ce qui se passe
// lors d'un double clic ou d'une revalidation du formulaire.
const sharedKey = randomKey();
const before = await prisma.order.count();
const [resubmitA, resubmitB] = await Promise.all([
  json('/api/checkout', { method: 'POST', body: JSON.stringify(baseOrder(product, 1, { idempotencyKey: sharedKey })) }),
  json('/api/checkout', { method: 'POST', body: JSON.stringify(baseOrder(product, 1, { idempotencyKey: sharedKey })) }),
]);
const after = await prisma.order.count();
check(
  'Un double clic sur « Confirmer ma commande » ne crée qu’une seule commande',
  after - before === 1 &&
    resubmitA.status === 200 &&
    resubmitB.status === 200 &&
    resubmitA.body?.orderNumber === resubmitB.body?.orderNumber,
  `${after - before} commande(s) créée(s), réponses ${resubmitA.status}/${resubmitB.status}, n° ${resubmitA.body?.orderNumber}`
);

// Deux commandes réellement distinctes (clés différentes) doivent, elles,
// aboutir toutes les deux : le tunnel ne doit pas échouer sous la charge.
const [distinctA, distinctB] = await Promise.all([
  json('/api/checkout', { method: 'POST', body: JSON.stringify(baseOrder(product, 1, { idempotencyKey: randomKey() })) }),
  json('/api/checkout', { method: 'POST', body: JSON.stringify(baseOrder(product, 1, { idempotencyKey: randomKey() })) }),
]);
check(
  'Deux commandes distinctes validées en parallèle aboutissent toutes les deux (HTTP 200)',
  distinctA.status === 200 && distinctB.status === 200 && distinctA.body?.orderNumber !== distinctB.body?.orderNumber,
  `HTTP ${distinctA.status}/${distinctB.status} — ${distinctA.body?.orderNumber}, ${distinctB.body?.orderNumber}`
);
for (const number of [distinctA.body?.orderNumber, distinctB.body?.orderNumber]) {
  if (!number) continue;
  await prisma.order.update({
    where: { orderNumber: number },
    data: { internalNotes: 'Commande issue du test de concurrence — à annuler côté backoffice.' },
  });
}

// ------------------------------------------- 5. Confirmation et suivi client
const confirmation = await fetch(`${BASE}/commande/confirmation/${falsified.body.secureToken}`);
const confirmationHtml = await confirmation.text();
check('La page de confirmation répond 200 avec le jeton de la commande', confirmation.status === 200, `HTTP ${confirmation.status}`);

const enumerable = await fetch(`${BASE}/commande/confirmation/${falsified.body.orderNumber}`);
check(
  'Le numéro de commande seul ne donne pas accès au récapitulatif (jeton obligatoire)',
  enumerable.status === 404,
  `HTTP ${enumerable.status}`
);
check(
  'La confirmation affiche le numéro de commande et les instructions de virement',
  confirmationHtml.includes(falsified.body.orderNumber) && /virement/i.test(confirmationHtml),
  'numéro + mention « virement » présents'
);
check(
  "La confirmation n'annonce pas un paiement déjà encaissé",
  !/paiement\s+(réussi|accepté|encais[ée]|confirm[ée]\s+par\s+la\s+banque)/i.test(confirmationHtml.replace(/\s+/g, ' ')),
  'aucune mention de paiement encaissé'
);

const tracking = await json(`/api/tracking/${falsified.body.secureToken}`);
check('Le suivi client répond 200', tracking.status === 200, `HTTP ${tracking.status}`);
check(
  'Le suivi indique un règlement en attente avant virement',
  /PENDING_TRANSFER|attente/i.test(JSON.stringify(tracking.body)),
  `paymentStatus=${tracking.body?.order?.paymentStatus ?? tracking.body?.paymentStatus}`
);

// ----------------------------------- 6. Règlement : rapprochement bancaire
const anonymousReconciliation = await json('/api/admin/reconciliation', {
  method: 'POST',
  body: JSON.stringify({ orderId: orderAfterCreate.id, receivedAmount: orderAfterCreate.totalAmount, isVerified: true }),
});
check(
  'Un visiteur anonyme ne peut pas valider un encaissement',
  anonymousReconciliation.status === 401 || anonymousReconciliation.status === 403,
  `HTTP ${anonymousReconciliation.status}`
);

const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(ACCOUNTANT),
});
const cookie = (login.headers.getSetCookie?.() || []).map((value) => value.split(';')[0]).join('; ');
check('Connexion du compte comptable réussie', login.status === 200 && cookie.length > 0, `HTTP ${login.status}`);

const unverified = await json('/api/admin/reconciliation', {
  method: 'POST',
  headers: { Cookie: cookie },
  body: JSON.stringify({
    orderId: orderAfterCreate.id,
    receivedAmount: 0,
    bankReference: 'REF-ABSENTE',
    isVerified: false,
    notes: 'TEST AUTOMATISÉ — virement non reçu.',
  }),
});
const afterUnverified = await prisma.order.findUnique({ where: { id: orderAfterCreate.id } });
check(
  'Un virement non reçu laisse la commande en attente (aucun encaissement fictif)',
  unverified.status === 200 && afterUnverified.paymentStatus === 'PENDING_TRANSFER',
  `HTTP ${unverified.status} — paymentStatus=${afterUnverified.paymentStatus}`
);

const partial = await json('/api/admin/reconciliation', {
  method: 'POST',
  headers: { Cookie: cookie },
  body: JSON.stringify({
    orderId: orderAfterCreate.id,
    receivedAmount: Number((orderAfterCreate.totalAmount / 2).toFixed(2)),
    bankReference: 'REF-PARTIELLE',
    isVerified: true,
    notes: 'TEST AUTOMATISÉ — virement partiel.',
  }),
});
const afterPartial = await prisma.order.findUnique({ where: { id: orderAfterCreate.id } });
check(
  'Un virement partiel donne un statut PARTIALLY_PAID (pas de solde réputé payé)',
  partial.status === 200 && afterPartial.paymentStatus === 'PARTIALLY_PAID',
  `paymentStatus=${afterPartial.paymentStatus}`
);

const full = await json('/api/admin/reconciliation', {
  method: 'POST',
  headers: { Cookie: cookie },
  body: JSON.stringify({
    orderId: orderAfterCreate.id,
    receivedAmount: orderAfterCreate.totalAmount,
    bankReference: `VIR-${falsified.body.orderNumber}`,
    receiptDate: new Date().toISOString(),
    isVerified: true,
    notes: 'TEST AUTOMATISÉ — virement complet reçu.',
  }),
});
const afterFull = await prisma.order.findUnique({
  where: { id: orderAfterCreate.id },
  include: { paymentRecords: true, statusHistory: true },
});
check(
  'Un virement complet vérifié passe la commande en PAYMENT_VERIFIED',
  full.status === 200 && afterFull.paymentStatus === 'PAYMENT_VERIFIED',
  `paymentStatus=${afterFull.paymentStatus}, reçu ${afterFull.paymentRecords.at(-1)?.receivedAmount} €`
);
check(
  "L'historique de statut et le journal d'audit tracent le rapprochement",
  afterFull.statusHistory.some((entry) => entry.newStatus === 'PAYMENT_VERIFIED') &&
    (await prisma.auditLog.count({ where: { action: 'PAYMENT_RECONCILIATION_CONFIRMED', resourceId: orderAfterCreate.id } })) > 0,
  `${afterFull.statusHistory.length} changement(s) de statut journalisé(s)`
);

const trackingAfter = await json(`/api/tracking/${falsified.body.secureToken}`);
check(
  'Le suivi client reflète le paiement validé',
  /PAYMENT_VERIFIED/.test(JSON.stringify(trackingAfter.body)),
  `paymentStatus=${trackingAfter.body?.order?.paymentStatus ?? trackingAfter.body?.paymentStatus}`
);

const emailLogs = await prisma.emailLog.findMany({ where: { orderId: orderAfterCreate.id }, orderBy: { sentAt: 'asc' } });
check(
  'Les emails de commande et de confirmation de paiement sont tracés pour la commande',
  emailLogs.some((log) => log.templateId === 1) && emailLogs.some((log) => log.templateId === 3),
  `modèles envoyés : ${[...new Set(emailLogs.map((log) => log.templateId))].join(', ')}`
);

// ---------------------------------------------------------------- 7. Bilan
console.log(`\n${results.length - failures}/${results.length} vérifications réussies`);
console.log(`Commande de test : ${falsified.body.orderNumber} (${orderAfterCreate.totalAmount} ${orderAfterCreate.currency})`);
if (failures) {
  console.log('\nÉchecs :');
  for (const result of results.filter((r) => !r.ok)) console.log(`  - ${result.label} → ${result.detail}`);
  process.exitCode = 1;
}
await prisma.$disconnect();
