/**
 * Extraction d'une offre produit depuis une page HTML réelle.
 *
 * Trois sources sont utilisées, dans cet ordre de fiabilité :
 *   1. balisage JSON-LD schema.org `Product` (avec son prix et ses images) ;
 *   2. microdata `itemprop="price"` / `itemprop="name"` (PrestaShop, Shopify,
 *      Magento) ;
 *   3. balises Open Graph (`og:title`, `og:description`, `og:image`).
 * Aucune valeur n'est inventée : si aucun prix n'est trouvé, l'extraction
 * échoue et l'appelant doit ignorer la page.
 */

export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export function decodeEntities(text) {
  return String(text || '')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(value) {
  return decodeEntities(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function readPriceSpecification(spec) {
  const list = Array.isArray(spec) ? spec : [spec].filter(Boolean);
  const ranked = list
    .filter((item) => item && Number.isFinite(Number(String(item.price ?? '').replace(',', '.'))))
    .map((item) => ({ item, value: Number(String(item.price).replace(',', '.')) }))
    // `ListPrice` est un prix barré : on privilégie le prix de vente réel.
    .sort(
      (a, b) =>
        Number(String(a.item.priceType || '').includes('ListPrice')) -
        Number(String(b.item.priceType || '').includes('ListPrice'))
    );
  if (!ranked.length) return null;
  return { price: ranked[0].value, currency: ranked[0].item.priceCurrency || 'EUR' };
}

function priceFromOffers(offers) {
  const list = Array.isArray(offers) ? offers : [offers].filter(Boolean);
  for (const offer of list) {
    if (!offer) continue;
    const direct = Number(String(offer.price ?? offer.lowPrice ?? '').replace(',', '.'));
    const fromSpec = Number.isFinite(direct) && direct > 0 ? null : readPriceSpecification(offer.priceSpecification);
    const price = Number.isFinite(direct) && direct > 0 ? direct : fromSpec?.price;
    if (Number.isFinite(price) && price > 0) {
      return {
        price,
        currency: offer.priceCurrency || fromSpec?.currency || 'EUR',
        availability: String(offer.availability || offer.inventoryLevel?.name || ''),
        sku: String(offer.sku || '').trim(),
      };
    }
  }
  return null;
}

function jsonLdProduct(html) {
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  for (const raw of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').trim());
    } catch {
      continue;
    }
    const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (queue.length) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (types.some((type) => String(type).includes('Product'))) {
        const priced = priceFromOffers(node.offers);
        if (priced) {
          return {
            source: 'json-ld',
            name: node.name,
            description: node.description,
            sku: priced.sku || node.sku,
            price: priced.price,
            currency: priced.currency,
            availability: priced.availability,
            images: node.image,
          };
        }
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && value['@type']) queue.push(value);
      }
    }
  }
  return null;
}

function metaContent(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function microdataProduct(html) {
  const price = Number(
    String(
      metaContent(html, [
        /itemprop="price"[^>]*(?:content|value)="([^"]+)"/i,
        /(?:content|value)="([^"]+)"[^>]*itemprop="price"/i,
        /data-price-amount="([^"]+)"/i,
      ]) || ''
    ).replace(',', '.')
  );
  if (!Number.isFinite(price) || price <= 0) return null;
  const name =
    metaContent(html, [/itemprop="name"[^>]*content="([^"]+)"/i, /<h1[^>]*itemprop="name"[^>]*>([^<]+)<\/h1>/i]) ||
    metaContent(html, [/<h1[^>]*>([^<]+)<\/h1>/i]) ||
    metaContent(html, [/og:title"[^>]*content="([^"]+)"/i]);
  const availability = metaContent(html, [/itemprop="availability"[^>]*href="([^"]+)"/i]) || '';
  return { source: 'microdata', name, description: null, sku: null, price, currency: 'EUR', availability, images: null };
}

function openGraphProduct(html) {
  const priced =
    metaContent(html, [
      /product:price:amount"[^>]*content="([^"]+)"/i,
      /content="([^"]+)"[^>]*property="product:price:amount"/i,
    ]) || null;
  const price = Number(String(priced || '').replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    source: 'open-graph',
    name: metaContent(html, [/og:title"[^>]*content="([^"]+)"/i]),
    description: metaContent(html, [/og:description"[^>]*content="([^"]+)"/i]),
    sku: null,
    price,
    currency: 'EUR',
    availability: '',
    images: null,
  };
}

function collectImageUrls(offer, html, pageUrl) {
  const urls = new Set();
  const push = (value) => {
    if (!value) return;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === 'string') urls.add(item);
      else if (item && typeof item === 'object' && typeof item.url === 'string') urls.add(item.url);
    }
  };
  push(offer.images);
  const metaImages = html.match(/<(?:meta)[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]+content="([^"]+)"/gi) || [];
  for (const tag of metaImages) push(tag.replace(/^.*content="/, '').replace(/"$/, ''));
  for (const match of html.matchAll(/<img[^>]+(?:data-image-large-src|data-src|src)="(https?:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi)) {
    urls.add(match[1]);
  }
  for (const match of html.matchAll(/"(?:large|big|full|zoom|def)[^"]*"\s*:\s*"(https?:\/\/[^"]+\.(?:jpe?g|png|webp))"/gi)) {
    urls.add(match[1]);
  }
  return [...urls]
    .map((raw) => {
      try {
        return new URL(raw.replace(/\\\//g, '/'), pageUrl).toString();
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    // Meilleure résolution disponible chez PrestaShop / WooCommerce.
    .map((url) => url.replace(/-home_default\//, '-large_default/').replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, ''))
    .filter((url) => !/logo|sprite|placeholder|payment|banner|icon|avatar|drapeau/i.test(url));
}

/**
 * Boutiques Shopify : l'API publique `/<handle>.js` renvoie l'offre exacte
 * (titre, prix en centimes, variantes, photos) sans dépendre du HTML.
 */
export async function shopifyOffer(pageUrl) {
  const match = pageUrl.match(/^(https?:\/\/[^/]+)\/products\/([^/?#]+)/i);
  if (!match) return null;
  const endpoint = `${match[1]}/products/${match[2]}.js`;
  try {
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const variant = (data.variants || []).find((item) => item.available) || (data.variants || [])[0];
    const price = Number(variant?.price) / 100;
    if (!Number.isFinite(price) || price <= 0) return null;
    // L'API renvoie les visuels tantôt sous forme de chaînes (« //cdn.shopify… »),
    // tantôt sous forme d'objets { src } : on normalise les deux cas.
    const imageUrls = (data.images || data.media || [])
      .map((image) => (typeof image === 'string' ? image : image?.src || image?.preview_image?.src))
      .filter(Boolean)
      .map((src) => (src.startsWith('//') ? `https:${src}` : src))
      .slice(0, 6);
    if (data.featured_image) imageUrls.unshift(data.featured_image.startsWith('//') ? `https:${data.featured_image}` : data.featured_image);
    return {
      source: 'shopify-json',
      name: data.title,
      description: decodeEntities(data.description || data.body_html || ''),
      sku: variant?.sku || '',
      price,
      currency: 'EUR',
      availability: variant?.available === false ? 'OutOfStock' : 'InStock',
      imageUrls: [...new Set(imageUrls)],
    };
  } catch {
    return null;
  }
}

/**
 * @returns {{source:string,name:string,description:string,sku:string,price:number,
 *   currency:string,availability:string,imageUrls:string[]}|null}
 */
export async function extractOfferFromPage(html, pageUrl) {
  if (typeof html === 'string') {
    const inline = extractOffer(html, pageUrl);
    if (inline) return inline;
    return shopifyOffer(pageUrl);
  }
  return null;
}

/**
 * @returns {{source:string,name:string,description:string,sku:string,price:number,
 *   currency:string,availability:string,imageUrls:string[]}|null}
 */
export function extractOffer(html, pageUrl) {
  const offer = jsonLdProduct(html) || microdataProduct(html) || openGraphProduct(html);
  if (!offer) return null;
  const name = decodeEntities(
    offer.name || metaContent(html, [/<h1[^>]*>([^<]+)<\/h1>/i, /<title[^>]*>([^<]+)<\/title>/i]) || ''
  );
  if (!name) return null;
  const description = decodeEntities(
    offer.description ||
      metaContent(html, [
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i,
        /itemprop="description"[^>]*content="([^"]+)"/i,
        /<div[^>]+class="[^"]*(?:product-description|product_description|woocommerce-product-details__short-description)[^"]*"[^>]*>([\s\S]{0,1200}?)<\/(?:div|section)>/i,
      ]) ||
      ''
  );
  const uniqueImages = [...new Set(collectImageUrls(offer, html, pageUrl))];
  return {
    source: offer.source,
    name,
    description,
    sku: String(offer.sku || '').trim(),
    price: offer.price,
    currency: offer.currency || 'EUR',
    availability: offer.availability || '',
    imageUrls: uniqueImages,
  };
}
