'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  UserCog,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type Profile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
};

export default function AdminMyAccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/me', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chargement impossible');
      setProfile(data.user);
      setEmail(data.user.email);
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Chargement impossible' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!currentPassword) {
      setStatus({ kind: 'error', message: 'Saisissez votre mot de passe actuel pour confirmer.' });
      return;
    }
    if (password && password.length < 8) {
      setStatus({ kind: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (password && password !== confirm) {
      setStatus({ kind: 'error', message: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    if (profile && email.trim().toLowerCase() === profile.email && !password) {
      setStatus({ kind: 'error', message: 'Aucune modification : l’e-mail est inchangé et aucun nouveau mot de passe n’est saisi.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password || undefined,
          currentPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Modification impossible');

      setProfile(data.user);
      setEmail(data.user.email);
      setCurrentPassword('');
      setPassword('');
      setConfirm('');

      const champs = Object.keys(data.changes || {});
      setStatus({
        kind: 'ok',
        message:
          champs.length === 0
            ? 'Aucune modification enregistrée.'
            : `Mis à jour : ${champs.map((c) => (c === 'password' ? 'mot de passe' : 'adresse e-mail')).join(' et ')}. ` +
              'Utilisez ces nouveaux identifiants à votre prochaine connexion.',
      });
    } catch (error: any) {
      setStatus({ kind: 'error', message: error?.message || 'Modification impossible' });
    } finally {
      setSaving(false);
    }
  };

  const input = 'input-field text-xs';
  const label = 'block font-semibold text-primaryText mb-1';

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <UserCog className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-primaryText tracking-tight">
                Mon compte
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Modifiez l&apos;adresse e-mail avec laquelle vous vous connectez et votre mot de passe.
            </p>
          </div>

          <button
            onClick={load}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-subtleBorder rounded-lg text-xs font-semibold text-primaryText hover:bg-beige-50 transition shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>

        {status && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${
              status.kind === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-statusError'
            }`}
            role="status"
          >
            {status.kind === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{status.message}</span>
          </div>
        )}

        {/* Identité */}
        <div className="bg-white rounded-xl border border-subtleBorder shadow-subtle p-5 text-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-forest" />
            <h2 className="font-semibold text-primaryText">Votre accès</h2>
          </div>
          {loading && !profile ? (
            <p className="text-secondaryText">Chargement…</p>
          ) : profile ? (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <dt className="text-[11px] text-secondaryText">Titulaire</dt>
                <dd className="font-semibold text-primaryText">
                  {profile.firstName} {profile.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-secondaryText">Rôle</dt>
                <dd className="font-mono text-[11px] text-forest-800">{profile.role}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-secondaryText">Statut</dt>
                <dd className={profile.isActive ? 'text-emerald-700 font-semibold' : 'text-statusError'}>
                  {profile.isActive ? 'Actif' : 'Désactivé'}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        {/* Identifiants */}
        <form onSubmit={submit} className="bg-white rounded-xl border border-subtleBorder shadow-subtle">
          <div className="p-5 border-b border-subtleBorder">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-forest" />
              <h2 className="font-semibold text-primaryText text-sm">Identifiants de connexion</h2>
            </div>
            <p className="text-[11px] text-secondaryText mt-1">
              Le mot de passe actuel est demandé pour toute modification. 8 caractères minimum.
            </p>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className={label} htmlFor="admin-email">
                Adresse e-mail de connexion *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-secondaryText absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${input} pl-9 font-mono`}
                  placeholder="vous@piolencboisdirect.fr"
                />
              </div>
              <p className="text-[10px] text-secondaryText mt-1 leading-relaxed">
                C&apos;est cette adresse qui sert d&apos;identifiant sur la page de connexion.
              </p>
            </div>

            <div>
              <label className={label} htmlFor="admin-current-password">
                Mot de passe actuel *
              </label>
              <input
                id="admin-current-password"
                required
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={input}
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="admin-new-password">
                  Nouveau mot de passe
                </label>
                <input
                  id="admin-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                  placeholder="inchangé si vide"
                />
              </div>
              <div>
                <label className={label} htmlFor="admin-confirm-password">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={input}
                  placeholder="••••••••"
                  disabled={!password}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-subtleBorder">
            <button type="submit" disabled={saving} className="btn-primary text-xs py-2 disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-secondaryText leading-relaxed">
          Après un changement d&apos;e-mail, l&apos;ancienne adresse ne permet plus de se connecter. Un
          changement de mot de passe ne déconnecte pas les autres sessions déjà ouvertes : déconnectez-vous
          depuis la barre latérale si vous partagez le poste.
        </p>
      </div>
    </AdminLayout>
  );
}
