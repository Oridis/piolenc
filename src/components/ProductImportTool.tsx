'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from 'lucide-react';

type ImportedLine = {
  ok: boolean;
  line: number;
  status?: 'created' | 'updated';
  name?: string;
  reference?: string;
  slug?: string;
  error?: string;
  warnings?: string[];
};

/**
 * Import du catalogue : fichier CSV exporté depuis le backoffice, CSV collé ou
 * payload JSON. Un CSV réimporté met à jour les fiches existantes au lieu de
 * créer des doublons.
 */
export default function ProductImportTool({ onStatus }: { onStatus?: (m: string, t?: 'ok' | 'error' | 'info') => void }) {
  const [payload, setPayload] = useState('');
  const [fetchUrl, setFetchUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const looksLikeJson = (() => {
    const trimmed = payload.trim();
    return trimmed.startsWith('[') || trimmed.startsWith('{');
  })();

  const fetchRemote = useCallback(async () => {
    if (!fetchUrl) { setError('URL de fiche à récupérer manquante'); return; }
    setFetching(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPayload(JSON.stringify(data, null, 2));
      setFileName('');
      setResult({ kind: 'fetched', keys: Object.keys(data) });
    } catch (e: any) {
      setError(e?.message || 'Impossible de récupérer la fiche distante');
    } finally {
      setFetching(false);
    }
  }, [fetchUrl]);

  const loadFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setPayload(text);
      setFileName(file.name);
      setResult(null);
      setError(null);
      onStatus?.(`Fichier « ${file.name} » prêt à importer`, 'info');
    } catch (e: any) {
      setError(e?.message || 'Fichier illisible');
    }
  }, [onStatus]);

  const runImport = useCallback(async () => {
    const raw = payload.trim();
    if (!raw) { setError('Collez un contenu CSV ou JSON, ou choisissez un fichier'); return; }

    let body: string;
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        body = JSON.stringify(Array.isArray(parsed) ? { products: parsed } : parsed);
      } catch {
        setError('Payload JSON non valide');
        return;
      }
    } else {
      body = JSON.stringify({ csv: raw });
    }

    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/products-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur import');
      setResult({ kind: 'imported', ...data });
      onStatus?.(
        `Import terminé : ${data.created ?? 0} créé(s), ${data.updated ?? 0} mis à jour, ${data.failed ?? 0} échec(s)`,
        data.failed ? 'error' : 'ok'
      );
    } catch (e: any) {
      setError(e?.message || 'Import échoué');
      onStatus?.(e?.message || 'Import échoué', 'error');
    } finally {
      setImporting(false);
    }
  }, [payload, onStatus]);

  const clear = () => {
    setPayload('');
    setFetchUrl('');
    setFileName('');
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const lines: ImportedLine[] = result?.kind === 'imported' ? result.results || [] : [];
  const shown = lines.slice(0, 60);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-subtleBorder bg-white hover:bg-beige-50 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Choisir un fichier CSV</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) loadFile(file);
            }}
          />
        </label>
        <button
          type="button"
          onClick={fetchRemote}
          disabled={fetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-subtleBorder bg-white hover:bg-beige-50 disabled:opacity-50"
        >
          {fetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
          Récupérer fiche distante
        </button>
        <button
          type="button"
          onClick={runImport}
          disabled={importing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-forest text-forest hover:bg-forest/5 disabled:opacity-50"
        >
          {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Importer les produits
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-subtleBorder bg-white hover:bg-beige-50 text-secondaryText"
        >
          <Trash2 className="w-4 h-4" />
          Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2 gap-2">
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block">
              Contenu CSV ou JSON des produits
            </label>
            {payload.trim() ? (
              <span className="text-[11px] font-mono text-secondaryText">
                {fileName ? `${fileName} · ` : ''}
                {looksLikeJson ? 'format JSON' : 'format CSV'}
              </span>
            ) : null}
          </div>
          <textarea
            rows={14}
            className="w-full font-mono text-xs border border-subtleBorder rounded-lg p-3 resize-y bg-white"
            placeholder={'Nom;Référence;Identifiant URL (slug);Prix TTC;Images (URLs séparées par |)\nBois de chêne 33 cm;BOIS-CHENE-33;bois-chene-33;129,90;/images/products/bois-chene-33-1.webp | /images/products/bois-chene-33-2.webp\n\nou un payload JSON :\n[{"name":"…","reference":"…","images":["…"]}]'}
            value={payload}
            onChange={(event) => {
              setPayload(event.target.value);
              setFileName('');
            }}
          />
          <p className="text-[11px] text-secondaryText mt-2">
            Le fichier exporté depuis « Exporter en CSV » se réimporte tel quel : les fiches existantes sont mises à jour
            (appariement par référence, puis par identifiant d’URL), les autres sont créées.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">URL de fiche distante</label>
          <input
            className="w-full border border-subtleBorder rounded-lg p-3 text-sm bg-white"
            placeholder="https://example.com/fiche-produit.json"
            value={fetchUrl}
            onChange={(event) => setFetchUrl(event.target.value)}
          />
          <p className="text-[11px] text-secondaryText mt-2">
            Récupère un JSON distant pour le pré-remplir. Aucune image-texte tiers ne doit subsister dans les fiches importées.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-statusError/10 border border-statusError/30 text-statusError text-sm whitespace-pre-line">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="p-4 rounded-lg border border-subtleBorder bg-white text-sm space-y-2">
          {result.kind === 'fetched' && (
            <>
              <div className="flex items-center gap-2 text-forest-800"><CheckCircle className="w-4 h-4" /> Fiche récupérée</div>
              <div>Clés: {result.keys.join(', ') || '—'}</div>
            </>
          )}
          {result.kind === 'imported' && (
            <>
              <div className="flex items-center gap-2 text-forest-800">
                <CheckCircle className="w-4 h-4" /> Import terminé
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span>Créés : <strong>{result.created ?? 0}</strong></span>
                <span>Mis à jour : <strong>{result.updated ?? 0}</strong></span>
                <span className={result.failed ? 'text-statusError' : ''}>Échecs : <strong>{result.failed ?? 0}</strong></span>
                {(result.categories?.length ?? 0) > 0 && (
                  <span>Catégories créées : <strong>{result.categories.length}</strong></span>
                )}
              </div>
              <ul className="text-[11px] space-y-0.5 max-h-64 overflow-y-auto">
                {shown.map((entry, index) => (
                  <li key={`${entry.line}-${index}`} className={entry.ok ? 'text-forest-800' : 'text-statusError'}>
                    Ligne {entry.line} — {entry.ok ? (entry.status === 'updated' ? 'mise à jour' : 'créée') : 'échec'} :{' '}
                    {entry.ok ? entry.reference : entry.error}
                    {entry.warnings?.length ? (
                      <span className="text-wood-700"> ({entry.warnings.join(' ; ')})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {lines.length > shown.length && (
                <p className="text-[11px] text-secondaryText">… et {lines.length - shown.length} autre(s) ligne(s).</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
