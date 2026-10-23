'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Paintbrush,
  Save,
  CheckCircle2,
  Building2,
  CreditCard,
  Mail,
  ShieldCheck,
  Globe,
  Eye,
  Flame,
} from 'lucide-react';

export default function SiteCustomizationPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'bank' | 'company' | 'legal' | 'email'>('brand');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-xs text-gray-500">Chargement des paramètres de marque...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
        {/* Header with Save & Publish */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <Paintbrush className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Identité et personnalisation centralisée du site
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Source unique de vérité : modifiez le nom, la marque, les coordonnées bancaires et le contenu sans développeur.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {saveSuccess && (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Publié avec succès partout !</span>
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-forest-800 hover:bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publication en cours...' : 'Enregistrer et publier'}</span>
            </button>
          </div>
        </div>

        {/* Live Brand Preview Card */}
        <div className="bg-wood-50 p-5 rounded-2xl border border-wood-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-wood-800 uppercase tracking-wider mb-2">
            <Eye className="w-4 h-4" />
            <span>Prévisualisation en direct de l'en-tête client</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 font-bold shadow"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <Flame className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="text-xl font-black text-gray-950 block">{settings.siteName}</span>
                <span className="text-xs text-gray-500 block">{settings.slogan}</span>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="font-bold text-gray-900 block">{settings.companyPhone}</span>
              <span className="text-gray-500">{settings.companyEmail}</span>
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-gray-200 space-x-2">
          {[
            { id: 'brand', label: 'Marque & Nom du site', icon: Paintbrush },
            { id: 'bank', label: 'Coordonnées Bancaires (Virement)', icon: CreditCard },
            { id: 'company', label: 'Entreprise & Contact', icon: Building2 },
            { id: 'legal', label: 'Textes Juridiques & CGV', icon: ShieldCheck },
            { id: 'email', label: 'Configuration Emails', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                  active
                    ? 'border-forest-800 text-forest-900 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Brand */}
        {activeTab === 'brand' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5 text-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Identité de marque &amp; Nom du site
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Nom du site (ex: Allo Maison) :
                </label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Se répercute instantanément sur l'en-tête, le pied de page, les emails, les factures et les métadonnées SEO.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Slogan du site :
                </label>
                <input
                  type="text"
                  value={settings.slogan}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-1">Couleur Principale :</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Couleur Secondaire (Bois) :</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Seuil Livraison Offerte (€) :</label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bank details */}
        {activeTab === 'bank' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5 text-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Coordonnées bancaires pour virement des clients
            </h2>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
              Ces coordonnées sont affichées sur la page de paiement, dans l'Email n°1 de confirmation et sur la facture pro forma. Ne jamais inventer d'IBAN fictif en production.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-1">Nom du bénéficiaire :</label>
                <input
                  type="text"
                  required
                  value={settings.bankBeneficiary}
                  onChange={(e) => setSettings({ ...settings, bankBeneficiary: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Établissement bancaire :</label>
                <input
                  type="text"
                  required
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">IBAN :</label>
                <input
                  type="text"
                  required
                  value={settings.bankIban}
                  onChange={(e) => setSettings({ ...settings, bankIban: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">BIC / SWIFT :</label>
                <input
                  type="text"
                  required
                  value={settings.bankBic}
                  onChange={(e) => setSettings({ ...settings, bankBic: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl font-mono text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-900 mb-1">
                Instructions de virement à l'attention du client :
              </label>
              <textarea
                rows={3}
                value={settings.bankInstructions}
                onChange={(e) => setSettings({ ...settings, bankInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Company */}
        {activeTab === 'company' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5 text-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Coordonnées de l'entreprise &amp; Horaires de service client
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-1">Raison sociale :</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Adresse complète du siège :</label>
                <input
                  type="text"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Téléphone service client :</label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Email de contact public :</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Numéro SIRET :</label>
                <input
                  type="text"
                  value={settings.companySiret}
                  onChange={(e) => setSettings({ ...settings, companySiret: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">TVA Intracommunautaire :</label>
                <input
                  type="text"
                  value={settings.companyVatNumber}
                  onChange={(e) => setSettings({ ...settings, companyVatNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-900 mb-1">Horaires d'ouverture :</label>
              <input
                type="text"
                value={settings.supportHours}
                onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Legal Texts */}
        {activeTab === 'legal' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5 text-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Textes légaux et politiques contractuelles
            </h2>

            <div>
              <label className="block font-bold text-gray-900 mb-1">Conditions Générales de Vente (CGV) :</label>
              <textarea
                rows={4}
                value={settings.cgvText}
                onChange={(e) => setSettings({ ...settings, cgvText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-900 mb-1">Politique de Confidentialité RGPD :</label>
              <textarea
                rows={3}
                value={settings.privacyPolicyText}
                onChange={(e) => setSettings({ ...settings, privacyPolicyText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-900 mb-1">Modalités de Livraison &amp; Déchargement :</label>
              <textarea
                rows={3}
                value={settings.deliveryPolicyText}
                onChange={(e) => setSettings({ ...settings, deliveryPolicyText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-[11px]"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Email provider */}
        {activeTab === 'email' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5 text-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Service d'envoi d'emails transactionnels
            </h2>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              {settings.emailProvider === 'log'
                ? 'ℹ️ Mode actuel : Journal d\'audit interne (Sandbox). Les emails sont générés, tracés en base de données et consultables dans l\'onglet "Emails & Notifications" sans nécessiter de serveur SMTP.'
                : '✅ Mode SMTP Actif : Les emails sont réellement délivrés par votre serveur de messagerie.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-1">Fournisseur :</label>
                <select
                  value={settings.emailProvider}
                  onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="log">Journal d'audit sécurisé (Par défaut / Recette)</option>
                  <option value="smtp">Serveur SMTP externe (Production)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Email notification administrateur :</label>
                <input
                  type="email"
                  value={settings.adminNotificationEmail}
                  onChange={(e) => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              {settings.emailProvider === 'smtp' && (
                <>
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">Hôte SMTP :</label>
                    <input
                      type="text"
                      value={settings.smtpHost}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      placeholder="smtp.sendgrid.net, ssl0.ovh.net..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">Port SMTP :</label>
                    <input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">Utilisateur SMTP :</label>
                    <input
                      type="text"
                      value={settings.smtpUser}
                      onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">Mot de passe SMTP :</label>
                    <input
                      type="password"
                      value={settings.smtpPassword || ''}
                      onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </AdminLayout>
  );
}
