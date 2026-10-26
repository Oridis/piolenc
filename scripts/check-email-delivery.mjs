/**
 * Confirme la LIVRAISON réelle (et non la simple acceptation) des derniers
 * envois : lit le journal des e-mails en base, puis interroge l'API Resend pour
 * le statut de chaque message (from / to / last_event).
 */
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* absent */
  }
}

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.log('RESEND_API_KEY absente : impossible d interrogere le fournisseur.');
  process.exit(1);
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const logs = await prisma.emailLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  where: { providerMessageId: { not: null } },
  select: { templateId: true, recipientEmail: true, status: true, providerMessageId: true, createdAt: true },
});

const statut = async (id) => {
  const res = await fetch(`https://api.resend.com/emails/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json().catch(() => null);
  return { http: res.status, body };
};

const TERMINAUX = ['delivered', 'bounced', 'complained', 'failed', 'canceled'];

for (const log of logs) {
  console.log('');
  console.log(`--- journal : tpl ${log.templateId} -> ${log.recipientEmail} (${log.createdAt.toISOString()}) ---`);
  console.log(`    id fournisseur : ${log.providerMessageId}`);
  let dernier = null;
  for (let essai = 1; essai <= 8; essai++) {
    const { http, body } = await statut(log.providerMessageId);
    if (http !== 200) {
      console.log(`    HTTP ${http} : ${body?.message || 'reponse illisible'}`);
      break;
    }
    dernier = body;
    console.log(`    essai ${essai} : last_event=${body.last_event} | from=${body.from} | to=${JSON.stringify(body.to)}`);
    if (TERMINAUX.includes(body.last_event)) break;
    await new Promise((r) => setTimeout(r, 7000));
  }
  if (dernier && dernier.last_event !== 'delivered') {
    console.log(`    ATTENTION : evenement final = ${dernier.last_event}`);
  }
}

await prisma.$disconnect();
