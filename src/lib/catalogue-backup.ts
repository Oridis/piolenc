/**
 * Sauvegarde complète du catalogue : le CSV réimportable **et** les fichiers
 * d'images, réunis dans une seule archive ZIP.
 *
 * Le téléchargement se construit dans le navigateur : les images sont demandées
 * à leurs adresses publiques, puis assemblées avec l'encodeur ZIP local. Cela
 * évite les limites de durée et de mémoire d'une fonction serveur, et
 * fonctionne aussi lorsque le site est servi par un hébergement statique.
 */

import { createZip, type ZipEntry } from './zip';

export interface CatalogueBackupProgress {
  done: number;
  total: number;
  current: string;
}

export interface CatalogueBackupOptions {
  /** Contenu CSV du catalogue (celui de l'export). */
  csv: string;
  /** Adresses de toutes les images référencées par les fiches. */
  imageUrls: string[];
  fetchImpl?: typeof fetch;
  onProgress?: (progress: CatalogueBackupProgress) => void;
  now?: Date;
}

export interface CatalogueBackupResult {
  archive: Uint8Array;
  fileName: string;
  /** Images téléchargées et rangées dans l'archive. */
  storedImages: number;
  bytes: number;
  /** Images hébergées ailleurs : non récupérables depuis le navigateur. */
  remoteImages: string[];
  /** Images locales illisibles au moment de la sauvegarde. */
  missingImages: string[];
}

/** Garde-fou mémoire : au-delà, mieux vaut sauvegarder par lots. */
const MAX_BACKUP_BYTES = 300 * 1024 * 1024;

const isRemote = (url: string) => /^https?:\/\//i.test(url) || url.startsWith('//');

/** Chemin rangé dans l'archive : « /images/… » → « public/images/… ». */
export function archivePathFor(imageUrl: string): string {
  const clean = imageUrl.split('?')[0].split('#')[0];
  return `public/${clean.replace(/^\/+/, '')}`;
}

function readme(options: {
  date: Date;
  csvName: string;
  storedImages: number;
  remoteImages: string[];
  missingImages: string[];
}): string {
  const lines = [
    `Sauvegarde du catalogue — ${options.date.toLocaleString('fr-FR')}`,
    '',
    'Contenu de cette archive',
    `- ${options.csvName} : le catalogue complet (références, textes, images, tarifs,`,
    '  stocks, données SEO). Réimportable depuis le backoffice, rubrique',
    '  « Catalogue & Stocks » → « Importer les produits » → « Choisir un fichier CSV ».',
    `- public/images/products/ : ${options.storedImages} fichier(s) d'images référencés par`,
    '  le catalogue. Copiez le dossier « public » à la racine du projet pour',
    '  rétablir les visuels.',
    '',
    'Comment restaurer',
    "1. Décompressez l'archive.",
    '2. Replacez le dossier « public/images/products » dans le projet, puis déployez.',
    '3. Importez le CSV : les fiches existantes sont mises à jour, les fiches absentes',
    '   sont recréées avec leurs textes, leurs images, leurs tarifs et leurs stocks.',
    '',
  ];

  if (options.remoteImages.length > 0) {
    lines.push(
      `Remarque : ${options.remoteImages.length} image(s) sont hébergées sur un autre site et`,
      "n'ont donc pas été téléchargées :",
      ...options.remoteImages.map((url) => `  - ${url}`),
      ''
    );
  }
  if (options.missingImages.length > 0) {
    lines.push(
      `Attention : ${options.missingImages.length} image(s) locale(s) n'ont pas pu être lues :`,
      ...options.missingImages.map((url) => `  - ${url}`),
      ''
    );
  }
  return lines.join('\n');
}

export async function buildCatalogueBackup(options: CatalogueBackupOptions): Promise<CatalogueBackupResult> {
  const doFetch = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  const dateSlug = now.toISOString().slice(0, 10);
  const csvName = `catalogue-produits-${dateSlug}.csv`;

  const unique = [...new Set(options.imageUrls.map((url) => url.trim()).filter(Boolean))];
  const local = unique.filter((url) => !isRemote(url));
  const remoteImages = unique.filter(isRemote);

  const entries: ZipEntry[] = [
    { path: csvName, data: new TextEncoder().encode(options.csv), date: now },
  ];
  const imageEntries: ZipEntry[] = [];
  const missingImages: string[] = [];
  let totalBytes = entries[0].data.length;

  for (const [index, url] of local.entries()) {
    options.onProgress?.({ done: index + 1, total: local.length, current: url });
    try {
      const response = await doFetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = new Uint8Array(await response.arrayBuffer());
      if (buffer.length === 0) throw new Error('fichier vide');
      totalBytes += buffer.length;
      if (totalBytes > MAX_BACKUP_BYTES) {
        throw new Error('Catalogue trop volumineux pour une sauvegarde en une fois');
      }
      imageEntries.push({ path: archivePathFor(url), data: buffer, date: now });
    } catch {
      missingImages.push(url);
    }
  }

  entries.push({ path: 'LISEZ-MOI.txt', data: new TextEncoder().encode(readme({ date: now, csvName, storedImages: imageEntries.length, remoteImages, missingImages })), date: now });
  entries.push(...imageEntries);

  const archive = createZip(entries);
  return {
    archive,
    fileName: `sauvegarde-catalogue-${dateSlug}.zip`,
    storedImages: imageEntries.length,
    bytes: archive.length,
    remoteImages,
    missingImages,
  };
}
