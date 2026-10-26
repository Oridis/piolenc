'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ProductImportTool from '@/components/ProductImportTool';
import { formatPrice } from '@/lib/pricing';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type Category = { id: string; name: string; slug: string; isActive: boolean };
type Product = Record<string, any>;

type FormState = {
  id?: string;
  name: string;
  reference: string;
  slug: string;
  categoryId: string;
  priceHT: string;
  priceTTC: string;
  vatRate: string;
  promoPrice: string;
  stock: string;
  unit: string;
  leadTimeDays: string;
  isPreorderAllowed: boolean;
  species: string;
  woodType: string;
  humidityRate: string;
  calorificValue: string;
  logLength: string;
  packaging: string;
  dimensions: string;
  weightKg: string;
  volumeM3: string;
  shortDescription: string;
  description: string;
  images: string;
  seoTitle: string;
  seoDescription: string;
  allowedCountries: string;
  isActive: boolean;
};

const emptyForm = (categoryId = ''): FormState => ({
  name: '',
  reference: '',
  slug: '',
  categoryId,
  priceHT: '',
  priceTTC: '',
  vatRate: '5.5',
  promoPrice: '',
  stock: '0',
  unit: '',
  leadTimeDays: '4',
  isPreorderAllowed: false,
  species: '',
  woodType: '',
  humidityRate: '',
  calorificValue: '',
  logLength: '',
  packaging: '',
  dimensions: '',
  weightKg: '',
  volumeM3: '',
  shortDescription: '',
  description: '',
  images: '',
  seoTitle: '',
  seoDescription: '',
  allowedCountries: 'FR, DE, BE, CH',
  isActive: true,
});

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

function toForm(product: Product): FormState {
  return {
    id: product.id,
    name: text(product.name),
    reference: text(product.reference),
    slug: text(product.slug),
    categoryId: text(product.categoryId),
    priceHT: text(product.priceHT),
    priceTTC: text(product.priceTTC),
    vatRate: text(product.vatRate ?? 5.5),
    promoPrice: product.promoPrice === null || product.promoPrice === undefined ? '' : text(product.promoPrice),
    stock: text(product.stock),
    unit: text(product.unit),
    leadTimeDays: text(product.leadTimeDays),
    isPreorderAllowed: product.isPreorderAllowed === true,
    species: text(product.species),
    woodType: text(product.woodType),
    humidityRate: text(product.humidityRate),
    calorificValue: text(product.calorificValue),
    logLength: text(product.logLength),
    packaging: text(product.packaging),
    dimensions: text(product.dimensions),
    weightKg: text(product.weightKg),
    volumeM3: text(product.volumeM3),
    shortDescription: text(product.shortDescription),
    description: text(product.description),
    images: (() => {
      try {
        const parsed = JSON.parse(text(product.images) || '[]');
        return Array.isArray(parsed) ? parsed.join('\n') : text(product.images);
      } catch {
        return text(product.images);
      }
    })(),
    seoTitle: text(product.seoTitle),
    seoDescription: text(product.seoDescription),
    allowedCountries: (() => {
      try {
        const parsed = JSON.parse(text(product.allowedCountries) || '[]');
        return Array.isArray(parsed) ? parsed.join(', ') : text(product.allowedCountries);
      } catch {
        return text(product.allowedCountries);
      }
    })(),
    isActive: product.isActive !== false,
  };
}

function firstImage(images: unknown): string {
  try {
    const parsed = JSON.parse(text(images) || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {
    /* images non JSON : on retombe sur l'illustration de repli */
  }
  return PLACEHOLDER_IMAGE;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chargement impossible');
      setProducts(data.products || []);
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

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  const openCreate = () => {
    setStatus(null);
    setForm(emptyForm(activeCategories[0]?.id || ''));
  };

  const openEdit = (product: Product) => {
    setStatus(null);
    setForm(toForm(product));
  };

  const patch = (changes: Partial<FormState>) => setForm((prev) => (prev ? { ...prev, ...changes } : prev));

  /** Les deux montants restent cohérents : saisir l'un recalcule l'autre. */
  const syncPrice = (field: 'priceHT' | 'priceTTC', value: string) => {
    const vat = Number(form?.vatRate ?? 5.5);
    const rate = Number.isFinite(vat) ? vat : 5.5;
    const amount = Number(value.replace(',', '.'));
    if (field === 'priceHT') {
      patch({ priceHT: value, ...(Number.isFinite(amount) ? { priceTTC: (Math.round(amount * (1 + rate / 100) * 100) / 100).toFixed(2) } : {}) });
    } else {
      patch({ priceTTC: value, ...(Number.isFinite(amount) ? { priceHT: (Math.round((amount / (1 + rate / 100)) * 100) / 100).toFixed(2) } : {}) });
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const isUpdate = Boolean(form.id);
      const res = await fetch('/api/admin/products', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          id: form.id,
          priceHT: form.priceHT,
          priceTTC: form.priceTTC,
          vatRate: form.vatRate,
          promoPrice: form.promoPrice,
          stock: form.stock,
          leadTimeDays: form.leadTimeDays,
          weightKg: form.weightKg,
          volumeM3: form.volumeM3,
          images: form.images,
          allowedCountries: form.allowedCountries,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');
      setStatus({
        kind: 'ok',
        message: isUpdate ? `Produit « ${data.product.name} » mis à jour.` : `Produit « ${data.product.name} » ajouté au catalogue.`,
      });
      setForm(null);
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Enregistrement impossible' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${product.name} » ?\n\nCette action est réservée aux produits jamais commandés.`
    );
    if (!confirmed) return;
    setBusyId(product.id);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Suppression impossible');
      setStatus({ kind: 'ok', message: `Produit « ${product.name} » supprimé.` });
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Suppression impossible' });
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !(product.isActive !== false) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mise à jour impossible');
      setStatus({
        kind: 'ok',
        message: `« ${product.name} » est désormais ${data.product.isActive ? 'actif' : 'désactivé'}.`,
      });
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Mise à jour impossible' });
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
                <Package className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Catalogue des Produits &amp; Gestion des Stocks
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Ajoutez, modifiez ou retirez les références de bois, ainsi que leurs prix, stocks et conditionnements.
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
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-1.5 text-xs py-2">
              <Plus className="w-4 h-4" />
              <span>Ajouter un produit</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-secondaryText">Chargement du catalogue...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-xs text-secondaryText">
                Aucun produit. Utilisez « Ajouter un produit » ou l’outil d’import.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                    <tr>
                      <th className="py-3 px-4">Produit</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Essence &amp; Coupe</th>
                      <th className="py-3 px-4">Prix TTC</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtleBorder">
                    {products.map((prod) => {
                      const isLowStock = Number(prod.stock) <= 30;
                      return (
                        <tr key={prod.id} className="hover:bg-beige-50/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-primaryText">
                            <div className="flex items-center space-x-3">
                              <img
                                src={firstImage(prod.images)}
                                alt={prod.name}
                                className="w-12 h-12 object-cover rounded-lg border border-subtleBorder shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="block truncate max-w-xs">{prod.name}</span>
                                <span className="text-[10px] text-secondaryText font-mono font-normal">
                                  Réf : {prod.reference}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-secondaryText font-medium">
                            {prod.category?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-primaryText">
                            <span>{prod.species || '—'}</span>
                            {[prod.logLength, prod.humidityRate].filter(Boolean).length > 0 && (
                              <span className="block text-[10px] text-secondaryText">
                                {[prod.logLength, prod.humidityRate].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-primaryText">
                            {prod.promoPrice ? (
                              <div>
                                <span className="text-wood-700">{formatPrice(Number(prod.promoPrice))}</span>
                                <span className="block text-[10px] line-through text-secondaryText font-normal">
                                  {formatPrice(Number(prod.priceTTC))}
                                </span>
                              </div>
                            ) : (
                              formatPrice(Number(prod.priceTTC))
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold text-xs ${isLowStock ? 'text-wood-700' : 'text-primaryText'}`}>
                              {prod.stock} unités
                            </span>
                            {prod.reservedStock > 0 && (
                              <span className="block text-[10px] text-secondaryText">
                                ({prod.reservedStock} réservées)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => toggleActive(prod)}
                              disabled={busyId === prod.id}
                              className={prod.isActive !== false ? 'badge-success' : 'badge-neutral'}
                              title="Basculer la disponibilité en boutique"
                            >
                              {prod.isActive !== false ? 'Actif' : 'Désactivé'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => openEdit(prod)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-subtleBorder hover:bg-beige-100 text-primaryText rounded-lg font-medium text-[11px] transition"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => remove(prod)}
                              disabled={busyId === prod.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-200 hover:bg-red-50 text-statusError rounded-lg font-medium text-[11px] transition disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Supprimer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle p-4 h-fit">
            <h2 className="text-sm font-semibold text-primaryText tracking-tight flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4" />
              Import de produits
            </h2>
            <p className="text-xs text-secondaryText mb-4">
              Récupère une fiche distante ou colle un payload JSON et importe les produits dans le catalogue.
            </p>
            <ProductImportTool onStatus={(m, t) => setStatus({ kind: t === 'error' ? 'error' : 'ok', message: m })} />
          </div>
        </div>

        {/* Formulaire d'ajout / modification */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs"
              onClick={() => (saving ? null : setForm(null))}
            />
            <form
              onSubmit={save}
              className="relative bg-white rounded-xl border border-subtleBorder shadow-elevated z-10 w-full max-w-3xl my-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4 p-5 border-b border-subtleBorder">
                <div>
                  <h2 className="text-sm font-bold font-heading text-primaryText">
                    {form.id ? 'Modifier le produit' : 'Ajouter un produit'}
                  </h2>
                  <p className="text-[11px] text-secondaryText mt-0.5">
                    La référence et l’identifiant d’URL sont générés automatiquement s’ils restent vides.
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

              <div className="px-5 space-y-6 text-xs max-h-[65vh] overflow-y-auto pb-2">
                {/* Identité */}
                <section className="space-y-3">
                  <h3 className="font-bold text-primaryText uppercase tracking-wider text-[11px]">Identité</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className={label}>Nom du produit *</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => patch({ name: e.target.value })}
                        className={input}
                        placeholder="Palette de bûches de chêne 33 cm – 2 stères"
                      />
                    </div>
                    <div>
                      <label className={label}>Catégorie *</label>
                      <select
                        required
                        value={form.categoryId}
                        onChange={(e) => patch({ categoryId: e.target.value })}
                        className={input}
                      >
                        <option value="">— Choisir —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.isActive ? '' : ' (inactive)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Référence interne</label>
                      <input
                        value={form.reference}
                        onChange={(e) => patch({ reference: e.target.value })}
                        className={`${input} font-mono`}
                        placeholder="générée automatiquement"
                      />
                    </div>
                    <div>
                      <label className={label}>Identifiant d’URL (slug)</label>
                      <input
                        value={form.slug}
                        onChange={(e) => patch({ slug: e.target.value })}
                        className={`${input} font-mono`}
                        placeholder="généré automatiquement"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-2 font-medium text-primaryText">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => patch({ isActive: e.target.checked })}
                          className="w-4 h-4 accent-forest-700"
                        />
                        <span>Produit visible dans la boutique</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Prix et stock */}
                <section className="space-y-3">
                  <h3 className="font-bold text-primaryText uppercase tracking-wider text-[11px]">Prix &amp; stock</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={label}>Prix HT (€) *</label>
                      <input
                        required
                        inputMode="decimal"
                        value={form.priceHT}
                        onChange={(e) => syncPrice('priceHT', e.target.value)}
                        className={input}
                        placeholder="123.45"
                      />
                    </div>
                    <div>
                      <label className={label}>TVA (%)</label>
                      <input
                        inputMode="decimal"
                        value={form.vatRate}
                        onChange={(e) => patch({ vatRate: e.target.value })}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}>Prix TTC (€)</label>
                      <input
                        inputMode="decimal"
                        value={form.priceTTC}
                        onChange={(e) => syncPrice('priceTTC', e.target.value)}
                        className={input}
                        placeholder="calculé depuis le HT"
                      />
                    </div>
                    <div>
                      <label className={label}>Prix promo TTC (€)</label>
                      <input
                        inputMode="decimal"
                        value={form.promoPrice}
                        onChange={(e) => patch({ promoPrice: e.target.value })}
                        className={input}
                        placeholder="laisser vide si aucune promo"
                      />
                    </div>
                    <div>
                      <label className={label}>Stock disponible</label>
                      <input
                        inputMode="numeric"
                        value={form.stock}
                        onChange={(e) => patch({ stock: e.target.value })}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}>Unité de vente</label>
                      <input
                        value={form.unit}
                        onChange={(e) => patch({ unit: e.target.value })}
                        className={input}
                        placeholder="Palette 2 stères"
                      />
                    </div>
                    <div>
                      <label className={label}>Délai de préparation (jours)</label>
                      <input
                        inputMode="numeric"
                        value={form.leadTimeDays}
                        onChange={(e) => patch({ leadTimeDays: e.target.value })}
                        className={input}
                      />
                    </div>
                    <div className="flex items-end sm:col-span-2">
                      <label className="inline-flex items-center gap-2 font-medium text-primaryText">
                        <input
                          type="checkbox"
                          checked={form.isPreorderAllowed}
                          onChange={(e) => patch({ isPreorderAllowed: e.target.checked })}
                          className="w-4 h-4 accent-forest-700"
                        />
                        <span>Précommande autorisée lorsque le stock est épuisé</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Caractéristiques */}
                <section className="space-y-3">
                  <h3 className="font-bold text-primaryText uppercase tracking-wider text-[11px]">
                    Caractéristiques techniques
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Essence</label>
                      <input value={form.species} onChange={(e) => patch({ species: e.target.value })} className={input} placeholder="Chêne & Hêtre" />
                    </div>
                    <div>
                      <label className={label}>Type de bois</label>
                      <input value={form.woodType} onChange={(e) => patch({ woodType: e.target.value })} className={input} placeholder="Bois dur (Groupe 1)" />
                    </div>
                    <div>
                      <label className={label}>Taux d’humidité</label>
                      <input value={form.humidityRate} onChange={(e) => patch({ humidityRate: e.target.value })} className={input} placeholder="< 20% (bois sec prêt à brûler)" />
                    </div>
                    <div>
                      <label className={label}>Pouvoir calorifique</label>
                      <input value={form.calorificValue} onChange={(e) => patch({ calorificValue: e.target.value })} className={input} placeholder="4.2 kWh/kg" />
                    </div>
                    <div>
                      <label className={label}>Longueur de bûche</label>
                      <input value={form.logLength} onChange={(e) => patch({ logLength: e.target.value })} className={input} placeholder="33 cm" />
                    </div>
                    <div>
                      <label className={label}>Conditionnement</label>
                      <input value={form.packaging} onChange={(e) => patch({ packaging: e.target.value })} className={input} placeholder="Palette filmée et houssée" />
                    </div>
                    <div>
                      <label className={label}>Dimensions (L x l x H)</label>
                      <input value={form.dimensions} onChange={(e) => patch({ dimensions: e.target.value })} className={input} placeholder="100 x 120 x 160 cm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Poids (kg)</label>
                        <input inputMode="decimal" value={form.weightKg} onChange={(e) => patch({ weightKg: e.target.value })} className={input} />
                      </div>
                      <div>
                        <label className={label}>Volume (m³)</label>
                        <input inputMode="decimal" value={form.volumeM3} onChange={(e) => patch({ volumeM3: e.target.value })} className={input} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Descriptions et livraison */}
                <section className="space-y-3">
                  <h3 className="font-bold text-primaryText uppercase tracking-wider text-[11px]">
                    Descriptions, visuels &amp; livraison
                  </h3>
                  <div>
                    <label className={label}>Description courte</label>
                    <input value={form.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} className={input} />
                  </div>
                  <div>
                    <label className={label}>Description détaillée</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Images (une URL par ligne)</label>
                    <textarea
                      rows={3}
                      value={form.images}
                      onChange={(e) => patch({ images: e.target.value })}
                      className={`${input} font-mono`}
                      placeholder="/images/products/mon-produit.jpg"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Pays livrés (codes séparés par des virgules)</label>
                      <input value={form.allowedCountries} onChange={(e) => patch({ allowedCountries: e.target.value })} className={input} />
                    </div>
                    <div>
                      <label className={label}>Titre SEO</label>
                      <input value={form.seoTitle} onChange={(e) => patch({ seoTitle: e.target.value })} className={input} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Description SEO</label>
                      <input value={form.seoDescription} onChange={(e) => patch({ seoDescription: e.target.value })} className={input} />
                    </div>
                  </div>
                </section>
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
                  {saving ? 'Enregistrement...' : form.id ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
