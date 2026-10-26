'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Layers, Plus, Pencil, Trash2, X, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  displayOrder: '0',
  isActive: true,
});

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chargement impossible');
      setCategories(data.categories || []);
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Chargement impossible' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const isUpdate = Boolean(form.id);
      const res = await fetch('/api/admin/categories', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, displayOrder: form.displayOrder, imageUrl: form.imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');
      setStatus({
        kind: 'ok',
        message: isUpdate
          ? `Catégorie « ${data.category.name} » mise à jour.`
          : `Catégorie « ${data.category.name} » créée.`,
      });
      setForm(null);
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Enregistrement impossible' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    const count = category._count?.products ?? 0;
    const confirmed = window.confirm(
      count > 0
        ? `« ${category.name} » regroupe ${count} produit(s).\n\nLa suppression sera refusée tant que des produits y sont rattachés : voulez-vous essayer ?`
        : `Supprimer la catégorie « ${category.name} » ?`
    );
    if (!confirmed) return;
    setBusyId(category.id);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(category.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Suppression impossible');
      setStatus({ kind: 'ok', message: `Catégorie « ${category.name} » supprimée.` });
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Suppression impossible' });
    } finally {
      setBusyId(null);
    }
  };

  const input = 'input-field text-xs';
  const label = 'block font-semibold text-primaryText mb-1';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Catégories du catalogue
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Créez, renommez, réordonnez ou retirez les familles de produits affichées sur la boutique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-subtleBorder rounded-lg text-xs font-semibold text-primaryText hover:bg-beige-50 transition shadow-subtle"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser</span>
            </button>
            <button
              onClick={() => {
                setStatus(null);
                setForm(emptyForm());
              }}
              className="btn-primary inline-flex items-center gap-1.5 text-xs py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une catégorie</span>
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${
              status.kind === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-statusError'
            }`}
          >
            {status.kind === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{status.message}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-secondaryText">Chargement des catégories...</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-xs text-secondaryText">
              Aucune catégorie pour le moment. Créez la première pour classer vos produits.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                  <tr>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Ordre</th>
                    <th className="py-3 px-4">Produits</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtleBorder">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-beige-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-10 h-10 object-cover rounded-lg border border-subtleBorder shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-beige-100 text-forest-700 flex items-center justify-center shrink-0">
                              <Layers className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block font-semibold text-primaryText truncate max-w-[16rem]">
                              {category.name}
                            </span>
                            <span className="block text-[10px] text-secondaryText font-mono truncate">
                              /{category.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-secondaryText max-w-sm">
                        <span className="line-clamp-2">{text(category.description) || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-secondaryText">{category.displayOrder}</td>
                      <td className="py-3.5 px-4 font-bold text-primaryText">{category._count?.products ?? 0}</td>
                      <td className="py-3.5 px-4">
                        {category.isActive ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-neutral">Masquée</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => {
                            setStatus(null);
                            setForm({
                              id: category.id,
                              name: category.name,
                              slug: category.slug,
                              description: text(category.description),
                              imageUrl: text(category.imageUrl),
                              displayOrder: text(category.displayOrder),
                              isActive: category.isActive,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-subtleBorder hover:bg-beige-100 text-primaryText rounded-lg font-medium text-[11px] transition"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => remove(category)}
                          disabled={busyId === category.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-200 hover:bg-red-50 text-statusError rounded-lg font-medium text-[11px] transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {form && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs" onClick={() => setForm(null)} />
            <form
              onSubmit={save}
              className="relative bg-white rounded-xl border border-subtleBorder shadow-elevated z-10 w-full max-w-lg my-10 space-y-4"
            >
              <div className="flex items-start justify-between gap-4 p-5 border-b border-subtleBorder">
                <div>
                  <h2 className="text-sm font-bold font-heading text-primaryText">
                    {form.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
                  </h2>
                  <p className="text-[11px] text-secondaryText mt-0.5">
                    L’identifiant d’URL est généré depuis le nom s’il reste vide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="p-1 rounded-lg text-secondaryText hover:text-primaryText hover:bg-beige-100 transition"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 space-y-3 text-xs">
                <div>
                  <label className={label}>Nom de la catégorie *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={input}
                    placeholder="Bûches compressées"
                  />
                </div>
                <div>
                  <label className={label}>Identifiant d’URL (slug)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className={`${input} font-mono`}
                    placeholder="généré automatiquement"
                  />
                </div>
                <div>
                  <label className={label}>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={input}
                    placeholder="Présentation de la famille de produits"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Image de la catégorie (URL)</label>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className={`${input} font-mono`}
                      placeholder="/images/categories/…"
                    />
                  </div>
                  <div>
                    <label className={label}>Ordre d’affichage</label>
                    <input
                      inputMode="numeric"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                      className={input}
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 font-medium text-primaryText">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-forest-700"
                  />
                  <span>Catégorie visible sur la boutique</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 p-5 border-t border-subtleBorder">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="px-4 py-2 border border-subtleBorder rounded-lg text-xs font-semibold text-primaryText hover:bg-beige-50 transition"
                >
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-xs py-2 disabled:opacity-60">
                  {saving ? 'Enregistrement...' : form.id ? 'Enregistrer' : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
