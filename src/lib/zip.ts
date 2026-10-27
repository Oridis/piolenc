/**
 * Écriture d'archives ZIP (méthode « stored », sans compression).
 *
 * Les images du catalogue sont déjà compressées (WebP) : les recompresser
 * n'apporterait rien et imposerait une dépendance supplémentaire. Cet encodeur
 * autonome produit une archive lisible par les outils standards (Explorer,
 * macOS, unzip, Python) avec les noms de fichiers en UTF-8.
 *
 * Référence : PKWARE APPNOTE.TXT, format ZIP32 (`0x04034b50`, `0x02014b50`,
 * `0x06054b50`).
 */

export interface ZipEntry {
  /** Chemin à l'intérieur de l'archive, séparateurs `/`. */
  path: string;
  data: Uint8Array;
  /** Date de modification inscrite dans l'entête (défaut : maintenant). */
  date?: Date;
}

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_DIRECTORY_SIGNATURE = 0x06054b50;
/** Bit 11 : les noms de fichiers sont encodés en UTF-8. */
const UTF8_FLAG = 0x0800;
const VERSION = 20;
const STORED_METHOD = 0;

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  crcTable = table;
  return table;
}

export function crc32(data: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = table[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Date et heure au format MS-DOS (deux entiers 16 bits). */
function toDosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/** Nom d'entrée assaini : pas de chemin absolu ni de remontée de dossier. */
export function normaliseZipPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/');
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const prepared = entries.map((entry) => {
    const name = encoder.encode(normaliseZipPath(entry.path));
    return { name, data: entry.data, ...toDosDateTime(entry.date ?? new Date()) };
  });

  const localSize = prepared.reduce((total, entry) => total + 30 + entry.name.length + entry.data.length, 0);
  const centralSize = prepared.reduce((total, entry) => total + 46 + entry.name.length, 0);
  const archive = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(archive.buffer);
  const writeName = (offset: number, name: Uint8Array) => {
    archive.set(name, offset);
  };

  let offset = 0;
  const offsets: number[] = [];

  for (const entry of prepared) {
    offsets.push(offset);
    view.setUint32(offset, LOCAL_HEADER_SIGNATURE, true);
    view.setUint16(offset + 4, VERSION, true);
    view.setUint16(offset + 6, UTF8_FLAG, true);
    view.setUint16(offset + 8, STORED_METHOD, true);
    view.setUint16(offset + 10, entry.time, true);
    view.setUint16(offset + 12, entry.date, true);
    view.setUint32(offset + 14, crc32(entry.data), true);
    view.setUint32(offset + 18, entry.data.length, true);
    view.setUint32(offset + 22, entry.data.length, true);
    view.setUint16(offset + 26, entry.name.length, true);
    view.setUint16(offset + 28, 0, true);
    offset += 30;
    writeName(offset, entry.name);
    offset += entry.name.length;
    archive.set(entry.data, offset);
    offset += entry.data.length;
  }

  const centralOffset = offset;
  prepared.forEach((entry, index) => {
    view.setUint32(offset, CENTRAL_HEADER_SIGNATURE, true);
    view.setUint16(offset + 4, VERSION, true);
    view.setUint16(offset + 6, VERSION, true);
    view.setUint16(offset + 8, UTF8_FLAG, true);
    view.setUint16(offset + 10, STORED_METHOD, true);
    view.setUint16(offset + 12, entry.time, true);
    view.setUint16(offset + 14, entry.date, true);
    view.setUint32(offset + 16, crc32(entry.data), true);
    view.setUint32(offset + 20, entry.data.length, true);
    view.setUint32(offset + 24, entry.data.length, true);
    view.setUint16(offset + 28, entry.name.length, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    view.setUint16(offset + 34, 0, true);
    view.setUint16(offset + 36, 0, true);
    view.setUint32(offset + 38, 0, true);
    view.setUint32(offset + 42, offsets[index], true);
    offset += 46;
    writeName(offset, entry.name);
    offset += entry.name.length;
  });

  view.setUint32(offset, END_OF_DIRECTORY_SIGNATURE, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, offset - centralOffset, true);
  view.setUint32(offset + 16, centralOffset, true);
  view.setUint16(offset + 20, 0, true);

  return archive;
}
