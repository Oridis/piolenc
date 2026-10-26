/**
 * Test d'acceptation du courrier pour une ou plusieurs boîtes d'un domaine.
 *
 * Connexion directe au serveur MX du domaine sur le port 25 et conversation
 * SMTP RÉELLE, arrêtée volontairement après RCPT TO : aucune commande DATA
 * n'est envoyée, donc aucun message n'est transmis ni déposé dans une boîte.
 * Un code 250 sur RCPT TO signifie que la boîte existe et accepte le courrier ;
 * un code 5xx signifie qu'elle n'existe pas ou le refuse.
 *
 *   node scripts/verify-mailbox-delivery.mjs serviceclient@piolencboisdirect.fr [autre@domaine]
 */
import net from 'node:net';

const domain = process.env.AUDIT_MAIL_DOMAIN || 'piolencboisdirect.fr';
const mxHosts = (process.env.AUDIT_MX_HOSTS || 'mx1.hostinger.com,mx2.hostinger.com').split(',');
const sender = process.env.AUDIT_MAIL_FROM || `contact@${domain}`;
const TIMEOUT_MS = Number(process.env.AUDIT_MAIL_TIMEOUT_MS || 15000);

const addresses = process.argv.slice(2).filter((a) => a.includes('@'));
if (addresses.length === 0) {
  console.error('Usage : node scripts/verify-mailbox-delivery.mjs adresse@domaine [...]');
  process.exit(2);
}

/** Une conversation SMTP minimale : accueil -> EHLO -> MAIL FROM -> RCPT TO -> arret. */
function probe(host, port, recipient) {
  return new Promise((resolve) => {
    const trace = [];
    let buffer = '';
    let etape = -1; // -1 : attente de l'accueil, 0 : EHLO, 1 : MAIL FROM, 2 : RCPT TO
    let termine = false;

    const socket = net.createConnection({ host, port });
    socket.setTimeout(TIMEOUT_MS, () =>
      finir({ host, port, recipient, ok: false, reason: `delai depasse (${TIMEOUT_MS} ms)` })
    );
    socket.on('error', (err) =>
      finir({ host, port, recipient, ok: false, reason: `erreur reseau : ${err.message}` })
    );
    socket.on('connect', () => trace.push(`# connecte a ${host}:${port}`));

    const envoyer = (cmd) => {
      trace.push(`> ${cmd}`);
      socket.write(`${cmd}\r\n`);
    };

    function finir(resultat) {
      if (termine) return;
      termine = true;
      socket.destroy();
      resolve({ ...resultat, trace });
    }

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lignes = buffer.split(/\r?\n/);
      buffer = lignes.pop() ?? '';
      for (const ligne of lignes) if (ligne) trace.push(`< ${ligne}`);

      // Une reponse SMTP se termine par une ligne "NNN " (espace, pas tiret).
      const derniere = lignes.filter(Boolean).pop();
      if (!derniere || !/^\d{3}[ ]/.test(derniere)) return;
      const code = Number(derniere.slice(0, 3));
      const message = derniere.replace(/^\d{3}[ -]?/, '');

      if (etape === -1) {
        if (code !== 220) return finir({ ok: false, code, reason: `accueil refuse : ${message}` });
        etape = 0;
        return envoyer('EHLO audit.local');
      }

      if (etape === 0) {
        if (code >= 400) return finir({ ok: false, code, reason: `EHLO refuse : ${message}` });
        etape = 1;
        return envoyer(`MAIL FROM:<${sender}>`);
      }

      if (etape === 1) {
        if (code >= 400) return finir({ ok: false, code, reason: `MAIL FROM refuse : ${message}` });
        etape = 2;
        return envoyer(`RCPT TO:<${recipient}>`);
      }

      // Reponse a RCPT TO : on s'arrete ici, sans DATA.
      envoyer('QUIT');
      finir({ ok: code === 250 || code === 251, code, reason: message });
    });
  });
}

const resultats = [];
for (const adresse of addresses) {
  for (const mx of mxHosts) {
    const r = await probe(mx, 25, adresse);
    resultats.push({ adresse, ...r });
    console.log(`${r.ok ? 'ACCEPTE' : 'REFUSE '} | ${adresse} via ${mx}:25 | ${r.code ?? '-'} ${r.reason ?? ''}`);
  }
}

console.log('');
console.log('Trace de la derniere conversation :');
for (const ligne of resultats.at(-1)?.trace ?? []) console.log('  ' + ligne);

const acceptees = [...new Set(resultats.filter((r) => r.ok).map((r) => r.adresse))];
console.log('');
console.log('Boites qui acceptent le courrier :', acceptees.length ? acceptees.join(', ') : 'aucune');
process.exit(acceptees.length > 0 ? 0 : 1);
