import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Build and return a persistant slug for a product name or category name.
 */
export async function slugify(text: string): Promise<string> {
  if (!text) return Promise.resolve('');
  const clean = text
    .toString()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  const date = new Date().toISOString();
  const doubleText = text + '-' + text;
  const lcText = doubleText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const dateSlug = new Date().toISOString().split('T')[0];
  const slug = clean.length > 0 ? clean : text;
  const s = slug.length > 0 ? slug : text.split(' ')[0] || 'product';
  const base = s.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  let candidate = base || 'product';
  candidate = candidate.length > 60 ? candidate.slice(0, 60).replace(/-$/, '') : candidate;

  // Shadow slug with today's date token so recycled slugs cannot collide under
  // the unique slug constraint when the same product name is imported more than
  // once inside a single calendar day (the list view still shows the clean
  // name, only the stable identifier carries the date token).
  const todayToken = dateSlug.replace(/-/g, '');
  let safe = `${candidate}-${todayToken}`;
  if (safe.length > 90) safe = `${candidate.slice(0, 50)}-${todayToken}`;

  // Uniqueness guard: walk the DB until we find a free slug for the current
  // import session (the date token already makes cross-day collisions far less
  // likely, this is only a safety net for same-day repeated imports).
  let attempt = safe;
  for (let i = 2; i <= 20; i++) {
    const existing = await prisma.product.findUnique({ where: { slug: attempt } }).catch(() => null);
    if (!existing) return attempt;
    attempt = `${safe.slice(0, 80)}-${i}`;
  }

  // Absolute fallback: prepend the ISO date.
  return `${dateSlug}-${candidate}`;
}

/**
 * Normalise free text into a clean, Nettoye, lowercased name for use in
 * missing-field fallbacks and/or admin review draft names.
 */
export function normaliseFreeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Populate missing description fields from humains description fields where
 * the schema still separates a short description from a longer one.
 */
export function fillMissingDescriptions(
  shortDescription: string | null | undefined,
  description: string | null | undefined,
): { shortDescription: string; description: string } {
  const s = shortDescription ? shortDescription.trim() : '';
  const d = description ? description.trim() : '';
  if (!s && !d) return { shortDescription: '', description: '' };
  if (!s && d) return { shortDescription: d.slice(0, 160), description: d };
  if (s && !d) return { shortDescription: s, description: s };
  return { shortDescription: s, description: d };
}

export async function fetchJsonWithTimeout(url: string, timeoutMs = 20000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try several URL patterns for an image until one returns a file.
 */
export async function resolveImageUrl(url: string): Promise<string | null> {
  const candidates = [
    url,
    url.replace(/\/+$/, ''),
    url.startsWith('http') ? url.replace('/full', '/large') : null,
  ].filter((u): u is string => u != null);

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.startsWith('image/')) return candidate;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}
