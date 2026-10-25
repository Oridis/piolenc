'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileJson, CheckCircle, AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react';

export default function ProductImportTool({ onStatus }: { onStatus?: (m: string, t?: 'ok' | 'error' | 'info') => void }) {
  const [payload, setPayload] = useState('');
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      setResult({ kind: 'fetched', keys: Object.keys(data) });
    } catch (e: any) {
      setError(e?.message || 'Impossible de récupérer la fiche distant');
    } finally {
      setFetching(false);
    }
  }, [fetchUrl]);

  const runImport = useCallback(async () => {
    let items: any[] = [];
    try {
      const parsed = JSON.parse(payload);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setError('PayLoad JSON non valide');
      return;
    }
    if (!items.length) { setError('Aucun produit dans le payload'); return; }
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/products-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur import');
      setResult({ kind: 'imported', imported: data.imported, categories: data.categories, results: data.results });
      onStatus?.(`${data.imported} produit(s) importé(s)`, 'ok');
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
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-forest text-forest hover:bg-forest/5"
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
          <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">Payload JSON des produits</label>
          <textarea
            rows={14}
            className="w-full font-mono text-xs border border-subtleBorder rounded-lg p-3 resize-y bg-white"
            placeholder='[{"name":"…","reference":"…","slug":"…","categorySlug":"bois-etuve-sec",…}]'
            value={payload}
            onChange={e => setPayload(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">URL de fiche distante</label>
          <input
            className="w-full border border-subtleBorder rounded-lg p-3 text-sm bg-white"
            placeholder="https://example.com/fiche-produit.json"
            value={fetchUrl}
            onChange={e => setFetchUrl(e.target.value)}
          />
          <p className="text-[11px] text-secondaryText mt-2">
            Récupère un JSON distant pour le pré-remplir. Aucune image-texte tiers ne doit subsister dans les fiches importées.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-statusError/10 border border-statusError/30 text-statusError text-sm">
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
              <div className="flex items-center gap-2 text-forest-800"><CheckCircle className="w-4 h-4" /> Import terminé</div>
              <div>Catégories créées/ mises à jour: {result.categories?.length ?? 0}</div>
              <ul>
                {result.results?.map((r: any, i: number) => (
                  <li key={i} className={r.ok ? 'text-forest-800' : 'text-statusError'}>
                    {r.ok ? 'OK' : 'ERR'}: {r.reference ?? r.error}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
