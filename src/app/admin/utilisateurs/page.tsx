'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  ShieldCheck,
  UserPlus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Search,
} from 'lucide-react';

type Role = { value: string; label: string };

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  roleLabel: string;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
};

type FormState = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  password: string;
};

const emptyForm = (role = 'CONTENT_MANAGER'): FormState => ({
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  role,
  isActive: true,
  password: '',
});

const ROLE_SCOPE: Record<string, string> = {
  SUPER_ADMIN: 'Accès absolu à tous les modules, secrets, paramètres de marque et comptes.',
  COMMERCIAL_ADMIN: 'Catalogue produits, prix, codes promo, fiches clients, consultation commandes.',
  ORDER_MANAGER: 'Cycle de vie des commandes, validation et passage en préparation.',
  LOGISTICS_MANAGER: 'Transporteurs, numéros de suivi, jalons et gestion des retards.',
  ACCOUNTANT: 'Rapprochement des virements, certification du crédit, factures pro forma.',
  CONTENT_MANAGER: 'Pages CMS, guides techniques, avis clients et fiches produits.',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);
  const [filtreRole, setFiltreRole] = useState('ALL');
  const [recherche, setRecherche] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtreRole && filtreRole !== 'ALL') params.set('role', filtreRole);
      if (recherche.trim()) params.set('search', recherche.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chargement impossible');
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setCurrentUserId(data.currentUserId || null);
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Chargement impossible' });
    } finally {
      setLoading(false);
    }
  }, [filtreRole, recherche]);

  useEffect(() => {
    load();
  }, [load]);

  const superAdminsActifs = useMemo(
    () => users.filter((u) => u.role === 'SUPER_ADMIN' && u.isActive).length,
    [users]
  );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const isUpdate = Boolean(form.id);
      const payload: Record<string, unknown> = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;
      if (isUpdate) payload.id = form.id;

      const res = await fetch('/api/admin/users', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');

      setStatus({
        kind: 'ok',
        message: isUpdate
          ? `Compte de ${data.user.firstName} ${data.user.lastName} mis à jour.`
          : `Compte de ${data.user.firstName} ${data.user.lastName} créé : il peut se connecter avec le mot de passe défini.`,
      });
      setForm(null);
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Enregistrement impossible' });
    } finally {
      setSaving(false);
    }
  };

  const basculerActivation = async (user: UserRow) => {
    setBusyId(user.id);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Modification impossible');
      setStatus({
        kind: 'ok',
        message: `${user.firstName} ${user.lastName} est maintenant ${user.isActive ? 'désactivé' : 'actif'}.`,
      });
      await load();
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Modification impossible' });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (user: UserRow) => {
    const commandes = user._count?.orders ?? 0;
    const confirmed = window.confirm(
      commandes > 0
        ? `${user.firstName} ${user.lastName} est rattaché à ${commandes} commande(s).\n\n` +
            'La suppression sera refusée pour préserver cet historique : voulez-vous essayer ?'
        : `Supprimer définitivement le compte de ${user.firstName} ${user.lastName} (${user.email}) ?`
    );
    if (!confirmed) return;
    setBusyId(user.id);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Suppression impossible');
      setStatus({ kind: 'ok', message: `Compte de ${user.firstName} ${user.lastName} supprimé.` });
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
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Utilisateurs Administratifs &amp; Rôles (RBAC)
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Créez, modifiez, désactivez ou supprimez les comptes de l&apos;équipe et ajustez leurs périmètres.
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
                setForm(emptyForm(roles[0]?.value));
              }}
              className="btn-primary inline-flex items-center gap-1.5 text-xs py-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter un utilisateur</span>
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

        {/* Roles & Permissions Reference Table */}
        <div className="bg-beige-50 p-5 rounded-xl border border-subtleBorder text-xs">
          <h3 className="font-semibold text-primaryText uppercase tracking-wider mb-2">
            Matrice des Droits et Périmètres d&apos;Action
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_SCOPE).map(([role, desc]) => (
              <div key={role} className="bg-white p-3 rounded-lg border border-subtleBorder shadow-subtle">
                <span className="font-semibold text-forest-800 block font-mono text-[11px]">{role}</span>
                <p className="text-[11px] text-secondaryText mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="sm:w-64">
            <label className={label}>Filtrer par rôle</label>
            <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)} className={input}>
              <option value="ALL">Tous les rôles administratifs</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.value})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={label}>Rechercher (nom ou e-mail)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-secondaryText absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="marc, logistique@…"
                className={`${input} pl-9`}
              />
            </div>
          </div>
          <div className="text-[11px] text-secondaryText sm:pb-2">
            {users.length} compte(s) · {superAdminsActifs} accès de direction actif(s)
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-secondaryText">Chargement des comptes…</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-secondaryText">
              Aucun compte ne correspond à cette recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-beige-50 text-secondaryText font-semibold uppercase tracking-wider text-[11px] border-b border-subtleBorder">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Rôle attribué</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Commandes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtleBorder">
                  {users.map((u) => {
                    const estVous = u.id === currentUserId;
                    return (
                      <tr key={u.id} className="hover:bg-beige-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-primaryText">
                          {u.firstName} {u.lastName}
                          {estVous && (
                            <span className="ml-2 badge-neutral text-[10px] font-medium">vous</span>
                          )}
                          {u.phone && (
                            <span className="block text-[10px] text-secondaryText font-normal mt-0.5">
                              {u.phone}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-secondaryText font-mono">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="badge-warning font-mono">{u.role}</span>
                          <span className="block text-[10px] text-secondaryText mt-0.5">{u.roleLabel}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => basculerActivation(u)}
                            disabled={busyId === u.id || estVous}
                            title={
                              estVous
                                ? 'Vous ne pouvez pas désactiver votre propre compte'
                                : 'Basculer l’accès de ce compte'
                            }
                            className={u.isActive ? 'badge-success' : 'badge-neutral'}
                          >
                            {u.isActive ? 'Actif' : 'Désactivé'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-secondaryText font-mono">
                          {u._count?.orders ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => {
                              setStatus(null);
                              setForm({
                                id: u.id,
                                email: u.email,
                                firstName: u.firstName,
                                lastName: u.lastName,
                                phone: u.phone || '',
                                role: u.role,
                                isActive: u.isActive,
                                password: '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-subtleBorder hover:bg-beige-100 text-primaryText rounded-lg font-medium text-[11px] transition"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => remove(u)}
                            disabled={busyId === u.id || estVous}
                            title={estVous ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer ce compte'}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-200 hover:bg-red-50 text-statusError rounded-lg font-medium text-[11px] transition disabled:opacity-40"
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

        <p className="text-[11px] text-secondaryText leading-relaxed">
          Les comptes clients ne figurent pas ici : ils se gèrent depuis la page « Clients ». Le dernier accès de
          direction actif ne peut être ni supprimé, ni désactivé, ni rétrogradé, et un compte rattaché à des
          commandes ne peut pas être supprimé afin de préserver l&apos;historique.
        </p>

        {/* Formulaire d'ajout / modification */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs"
              onClick={() => (saving ? null : setForm(null))}
            />
            <form
              onSubmit={save}
              className="relative bg-white rounded-xl border border-subtleBorder shadow-elevated z-10 w-full max-w-2xl my-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4 p-5 border-b border-subtleBorder">
                <div>
                  <h2 className="text-sm font-bold font-heading text-primaryText">
                    {form.id ? 'Modifier le compte' : 'Ajouter un utilisateur'}
                  </h2>
                  <p className="text-[11px] text-secondaryText mt-0.5">
                    {form.id
                      ? 'Laissez le mot de passe vide pour conserver l’actuel.'
                      : 'Le mot de passe saisi permet au collaborateur de se connecter immédiatement.'}
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

              <div className="px-5 space-y-5 text-xs">
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Prénom *</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className={input}
                      placeholder="Marc"
                    />
                  </div>
                  <div>
                    <label className={label}>Nom *</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className={input}
                      placeholder="Dubois"
                    />
                  </div>
                  <div>
                    <label className={label}>Adresse e-mail *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`${input} font-mono`}
                      placeholder="prenom@domaine.fr"
                    />
                  </div>
                  <div>
                    <label className={label}>Téléphone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={input}
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                  <div>
                    <label className={label}>Rôle *(RBAC)</label>
                    <select
                      required
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={input}
                    >
                      {roles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} ({r.value})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-secondaryText mt-1 leading-relaxed">
                      {ROLE_SCOPE[form.role] || ''}
                    </p>
                  </div>
                  <div>
                    <label className={label}>
                      {form.id ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe * (8 caractères minimum)'}
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-secondaryText absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required={!form.id}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={`${input} pl-9`}
                        placeholder={form.id ? 'inchangé si vide' : '••••••••'}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="inline-flex items-center gap-2 font-medium text-primaryText">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="w-4 h-4 accent-forest-700"
                      />
                      <span>Compte actif (autorisé à se connecter)</span>
                    </label>
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
                  {saving ? 'Enregistrement…' : form.id ? 'Enregistrer les modifications' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
