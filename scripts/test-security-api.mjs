/**
 * Tests de non-régression sécurité (nécessite le serveur de développement lancé).
 *
 * Couvre les failles corrigées pendant l'audit :
 *  1. les routes /api/admin/* répondaient 200 aux visiteurs ANONYMES et
 *     renvoyaient les commandes, les jetons de suivi et l'export clients ;
 *  2. PUT /api/settings acceptait un appel anonyme (réécriture de l'IBAN,
 *     des textes légaux et des identifiants SMTP) ;
 *  3. GET /api/settings exposait le mot de passe SMTP ;
 *  4. tres POST /api/checkout faisait confiance au prix envoyé par le navigateur ;
 *  5. les quantités invalides n'étaient pas rejetées.
 *
 *   node scripts/test-security-api.mjs            # http://localhost:3000
 *   AUDIT_BASE_URL=http://localhost:3000 node scripts/test-security-api.mjs
 */
import { PrismaClient } from '@prisma/client';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function status(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  let json = null;
  try {
    json = await res.clone().json();
  } catch {
    /* réponse non JSON (HTML) */
  }
  return { status: res.status, json };
}

async function main() {
  const adminGetRoutes = [
    '/api/admin/orders',
    '/api/admin/emails',
    '/api/admin/reconciliation',
    '/api/admin/export/orders',
  ];

  for (const route of adminGetRoutes) {
    const { status: code } = await status('GET', route);
    check(`GET ${route} refuse un visiteur anonyme`, code === 401 || code === 403, `HTTP ${code}`);
  }

  const adminMutationRoutes = [
    ['POST', '/api/admin/tracking/event', { orderId: 'x', status: 'X' }],
    ['PUT', '/api/admin/orders', { orderId: 'x', paymentStatus: 'PAID' }],
    ['POST', '/api/admin/reconciliation', { orderId: 'x' }],
    ['POST', '/api/admin/products-import', { products: [] }],
  ];
  for (const [method, route, body] of adminMutationRoutes) {
    const { status: code } = await status(method, route, body);
    check(`${method} ${route} refuse un visiteur anonyme`, code === 401 || code === 403, `HTTP ${code}`);
  }

  const putSettings = await status('PUT', '/api/settings', { siteName: 'TEST-INTRUSION' });
  check('PUT /api/settings refuse un visiteur anonyme', putSettings.status === 403 || putSettings.status === 401, `HTTP ${putSettings.status}`);

  const settings = await prisma.siteSetting.findFirst();
  check(
    "Le nom du site n'a pas été modifié par la tentative anonyme",
    !settings || settings.siteName !== 'TEST-INTRUSION',
    settings ? `siteName=${settings.siteName}` : 'paramètres absents'
  );

  const publicSettings = await fetch(`${BASE}/api/settings`);
  const publicJson = await publicSettings.json().catch(() => ({}));
  check('GET /api/settings n’expose plus le mot de passe SMTP', !('smtpPassword' in publicJson));
  check('GET /api/settings n’expose plus l’identifiant SMTP', !('smtpUser' in publicJson));
  check('GET /api/settings conserve les coordonnées bancaires utiles au client', Boolean(publicJson.bankIban));

  // Prix falsifié : le serveur doit recalculer depuis la base.
  const product = await prisma.product.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!product) {
    check('Produit de test disponible', false, 'aucun produit actif en base');
  } else {
    const payload = {
      customer: { firstName: 'Test', lastName: 'Secu', email: 'secu.regression@example.com', phone: '0612345678' },
      shippingAddress: { street: '1 rue du Test', postalCode: '88200', city: 'Remiremont', country: 'FR' },
      items: [{ productId: product.id, quantity: 1, priceTTC: 1, unitPriceTTC: 1, priceHT: 0.01 }],
    };
    const { status: code, json } = await status('POST', '/api/checkout', payload);
    const expectedTotal = Number((product.priceTTC + 49).toFixed(2));
    check(
      'Le prix envoyé par le navigateur est ignoré (recalcul serveur)',
      code === 200 && json?.totalAmount === expectedTotal,
      `HTTP ${code} total=${json?.totalAmount} attendu=${expectedTotal}`
    );

    const badQty = await status('POST', '/api/checkout', {
      ...payload,
      customer: { ...payload.customer, email: 'secu.regression@example.com' },
      items: [{ productId: product.id, quantity: 0, priceTTC: 1 }],
    });
    check('Une quantité nulle est rejetée', badQty.status === 400, `HTTP ${badQty.status}`);

    const tooMany = await status('POST', '/api/checkout', {
      ...payload,
      customer: { ...payload.customer, email: 'secu.regression@example.com' },
      items: [{ productId: product.id, quantity: 100000, priceTTC: 1 }],
    });
    check('Une quantité supérieure au stock est rejetée', tooMany.status === 400, `HTTP ${tooMany.status}`);

    const empty = await status('POST', '/api/checkout', { ...payload, items: [] });
    check('Un panier vide est rejeté', empty.status === 400, `HTTP ${empty.status}`);

    const unknown = await status('POST', '/api/checkout', {
      ...payload,
      items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
    });
    check('Un produit inexistant est rejeté', unknown.status === 400, `HTTP ${unknown.status}`);

    // Jetons de suivi : accès impossible avec un jeton inventé.
    const guessed = await status('GET', '/api/tracking/tok_ffffffffffffffffffffffffffffffff');
    const guessedBody = JSON.stringify(guessed.json ?? {});
    check(
      'Un jeton de suivi inventé ne renvoie aucune donnée',
      guessed.status === 404 || /introuvable|invalide/i.test(guessedBody),
      `HTTP ${guessed.status}`
    );

    // Les tests créent des commandes réelles : on les supprime pour laisser la base propre.
    const created = await prisma.order.findMany({
      where: { customerEmail: 'secu.regression@example.com' },
      select: { id: true, items: { select: { productId: true, quantity: true } } },
    });
    for (const order of created) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, reservedStock: { decrement: item.quantity } },
        });
      }
      await prisma.order.delete({ where: { id: order.id } });
    }
    if (created.length) console.log(`\n🧹 ${created.length} commande(s) de test nettoyée(s) et stocks restaurés.`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${'='.repeat(60)}`);
  console.log(
    failed.length
      ? `❌ ${failed.length}/${results.length} vérifications en échec`
      : `🎉 ${results.length}/${results.length} vérifications de sécurité réussies`
  );
  console.log('='.repeat(60));

  await prisma.$disconnect();
  if (failed.length) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
