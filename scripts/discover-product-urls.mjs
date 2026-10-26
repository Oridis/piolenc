/**
 * Découverte de fiches produit réelles chez des revendeurs spécialisés.
 *
 * Pour chaque domaine : lecture du sitemap (repli sur les liens de la page
 * d'accueil), filtrage des URLs d'offres de bois de chauffage, puis
 * vérification que la page expose réellement un prix (JSON-LD, microdata ou
 * Open Graph) via scripts/lib/product-extract.mjs. Rien n'est inventé : seules
 * les pages vérifiées sont imprimées, prêtes pour scrape-real-products.mjs.
 *
 *   node scripts/discover-product-urls.mjs --max-per-host=2
 */
import { extractOfferFromPage, decodeEntities, BROWSER_UA } from './lib/product-extract.mjs';

const HOSTS = [
  'https://www.piskorski-bois-energie.fr',
  'https://gardbois.fr',
  'https://chaufobois.fr',
  'https://www.pechavy-energie-bois.fr',
  'https://www.boisrosa.fr',
  'https://boutique.woodstock-bois.fr',
  'https://www.carlier-combustibles.fr',
  'https://www.boisbuchemolinario.fr',
  'https://econobuches.fr',
  'https://frboischauffage.com',
  'https://www.phenix-combustibles.fr',
  'https://www.granulesaupoele.com',
  'https://proxi.totalenergies.fr',
  'https://www.combustibles-gruchy.fr',
  'https://www.granulest.fr',
  'https://simplyfeu.fr',
  'https://www.etsverrier.fr',
  'https://www.boisenergienord.fr',
  'https://delicourt-energies.com',
  'https://granuleo.shop',
];

const KEYWORDS =
  /(buche|b[ûu]che|bois-de-chauffage|bois-chauffage|granul|pellet|densifi|compress|briquette|stere|st[èe]re|palette|chene|ch[eê]ne|hetre|h[eê]tre|chauffage-bois|combustible)/i;
const OFF_SCOPE =
  /(allumage|allume|accessoire|pelle-|nettoyant|entretien|barbecue|charbon|gant|panier|rangement|housse|bache|b[âa]che|thermom|outil|detache|d[eé]tach|souffleur|cendre|hydrofuge|insecticide|m[ée]morandum)/i;
const EXTRA_HOSTS = ((process.argv.find((arg) => arg.startsWith('--hosts=')) || '').split('=')[1] || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
const HOST_LIST = EXTRA_HOSTS.length ? EXTRA_HOSTS : HOSTS;
const MAX_PER_HOST = Number((process.argv.find((arg) => arg.startsWith('--max-per-host=')) || '').split('=')[1] || 3);
const CANDIDATE_LIMIT = Number((process.argv.find((arg) => arg.startsWith('--candidates=')) || '').split('=')[1] || 20);
const MIN_PRICE = Number((process.argv.find((arg) => arg.startsWith('--min-price=')) || '').split('=')[1] || 40);

process.on('uncaughtException', (error) => {
  console.log(`  ! incident réseau ignoré (${error.code || error.message})`);
});

async function get(url, accept = 'text/html') {
  const res = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA, Accept: accept, 'Accept-Language': 'fr-FR,fr;q=0.9' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function candidateUrls(host) {
  const found = new Set();
  const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml', '/sitemap1.xml', '/1_index_sitemap.xml'];
  for (const pathName of sitemapPaths) {
    try {
      const xml = await get(`${host}${pathName}`, 'application/xml,text/xml');
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1]);
      for (const loc of locs) {
        if (/sitemap.*\.xml/i.test(loc)) continue;
        if (KEYWORDS.test(loc)) found.add(loc);
      }
      for (const loc of locs.filter((loc) => /sitemap.*\.xml/i.test(loc)).slice(0, 10)) {
        try {
          const child = await get(loc, 'application/xml,text/xml');
          for (const match of child.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
            if (KEYWORDS.test(match[1])) found.add(match[1]);
          }
        } catch {
          /* sous-sitemap ignoré */
        }
      }
      if (found.size) break;
    } catch {
      /* pas de sitemap ici */
    }
  }
  if (!found.size) {
    try {
      const html = await get(host);
      for (const match of html.matchAll(/href="([^"]+)"/gi)) {
        const url = new URL(match[1], host).toString();
        if (new URL(url).hostname === new URL(host).hostname && KEYWORDS.test(url)) found.add(url);
      }
    } catch {
      /* accueil inaccessible */
    }
  }
  return [...found]
    .filter((url) => !/\.(jpg|jpeg|png|webp|pdf|xml|css|js)$/i.test(url))
    .filter((url) => !OFF_SCOPE.test(decodeURIComponent(url)))
    .sort((a, b) => score(b) - score(a))
    .slice(0, CANDIDATE_LIMIT);

  function score(url) {
    let value = 0;
    if (/\/(produit|product|fiche|articles?|boutique)\//i.test(url)) value += 3;
    if (/\.html?$/i.test(url)) value += 2;
    if (/palette|stere|st[èe]re|sac|kg|m3/i.test(url)) value += 1;
    if (/\/(categorie|category|tags?|page)\//i.test(url)) value -= 3;
    return value;
  }
}

const results = [];
for (const host of HOST_LIST) {
  process.stdout.write(`\n▶ ${host}\n`);
  let candidates = [];
  try {
    candidates = await candidateUrls(host);
  } catch (error) {
    console.log(`  ✖ exploration impossible : ${error.message}`);
    continue;
  }
  let accepted = 0;
  for (const url of candidates) {
    if (accepted >= MAX_PER_HOST) break;
    try {
      const offer = await extractOfferFromPage(await get(url), url);
      if (!offer) continue;
      const label = `${offer.name} ${decodeURIComponent(url)}`;
      if (OFF_SCOPE.test(label)) continue;
      if (!/bois|buche|b[ûu]che|granul|pellet|densifi|compress|briquette|st[èe]re|palette|chauffage|combustible/i.test(label)) continue;
      if (offer.price < MIN_PRICE) continue;
      accepted += 1;
      results.push(url);
      console.log(`  ✔ ${offer.price} € [${offer.source}] — ${offer.name.slice(0, 70)}\n    ${url}`);
    } catch {
      /* page ignorée */
    }
  }
  if (!accepted) console.log('  ✖ aucune fiche produit exploitable trouvée');
}

console.log(`\n=== ${results.length} URL(s) vérifiée(s) ===`);
for (const url of results) console.log(url);
