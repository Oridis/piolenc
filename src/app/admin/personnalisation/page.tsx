'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { generateThemeCss } from '@/lib/colors';
import {
  Paintbrush,
  Save,
  CheckCircle2,
  Building2,
  CreditCard,
  Mail,
  ShieldCheck,
  Eye,
  Flame,
  Info,
  Upload,
  Trash2,
  Image as ImageIcon,
  Home,
  ArrowRight,
} from 'lucide-react';

export default function SiteCustomizationPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'hero' | 'bank' | 'company' | 'legal' | 'email'>('brand');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  // Update theme colors live on change
  useEffect(() => {
    if (settings?.primaryColor || settings?.secondaryColor) {
      const themeCss = generateThemeCss(settings.primaryColor, settings.secondaryColor, settings.accentColor);
      let styleTag = document.getElementById('dynamic-brand-theme');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-brand-theme';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = themeCss;
    }
  }, [settings?.primaryColor, settings?.secondaryColor, settings?.accentColor]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (PNG, SVG, JPG, WebP).');
      return;
    }

    // Max 4MB file size check
    if (file.size > 4 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (maximum 4 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSettings((prev: any) => ({
          ...prev,
          logoUrl: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings((prev: any) => ({
      ...prev,
      logoUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.ico')) {
      alert('Veuillez sélectionner un fichier image ou favicon valide (ICO, PNG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Le favicon est trop volumineux (maximum 2 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSettings((prev: any) => ({
          ...prev,
          faviconUrl: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFavicon = () => {
    setSettings((prev: any) => ({
      ...prev,
      faviconUrl: '',
    }));
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

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

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || `Erreur serveur (${res.status})` };
      }

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-xs text-secondaryText">Chargement des paramètres de marque...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
        {/* Header with Save & Publish */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-subtleBorder shadow-subtle">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
                <Paintbrush className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold font-heading text-primaryText tracking-tight">
                Identité et personnalisation centralisée du site
              </h1>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Source unique de vérité : modifiez le nom, la marque, les coordonnées bancaires et le contenu sans développeur.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {saveSuccess && (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Publié avec succès partout</span>
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publication en cours...' : 'Enregistrer et publier'}</span>
            </button>
          </div>
        </div>

        {/* Live Brand Preview Card - Dynamic Colors & Logo without Box */}
        <div className="bg-beige-50 p-5 rounded-xl border border-subtleBorder space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-primaryText uppercase tracking-wider">
              <Eye className="w-4 h-4 text-forest" />
              <span>Aperçu en direct de votre charte graphique &amp; de vos couleurs</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-subtleBorder bg-white font-mono">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: settings.primaryColor || '#244B38' }} />
                <span>Principale: {settings.primaryColor || '#244B38'}</span>
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-subtleBorder bg-white font-mono">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: settings.secondaryColor || '#8A6445' }} />
                <span>Secondaire: {settings.secondaryColor || '#8A6445'}</span>
              </span>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border border-subtleBorder shadow-subtle">
            {/* Top Bar Preview */}
            <div
              className="text-white text-[11px] py-1.5 px-4 flex justify-between items-center transition-colors duration-200"
              style={{ backgroundColor: settings.primaryColor || '#244B38' }}
            >
              <span>Bois sec certifié NF H1 · Taux d&apos;humidité &lt; 20%</span>
              <span>Service client : {settings.companyPhone || '+33 (0)3 29 00 12 34'}</span>
            </div>

            {/* Header Content */}
            <div className="bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.siteName}
                    className="h-10 sm:h-12 w-auto max-w-[220px] object-contain shrink-0"
                  />
                ) : (
                  <Flame className="w-8 h-8 text-forest shrink-0 fill-forest/15" />
                )}
                {/* Aperçu fidèle de l'en-tête : le nom en texte n'apparaît que
                    si le réglage « En-tête » est actif (ou sans logo). */}
                {(!settings.logoUrl || settings.showSiteName !== false) && (
                  <span className="text-lg font-bold font-heading text-primaryText block leading-tight">
                    {settings.siteName}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-xs font-semibold text-white shadow-sm transition-all"
                  style={{ backgroundColor: settings.primaryColor || '#244B38' }}
                >
                  Bouton Principal
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-xs font-semibold text-white shadow-sm transition-all"
                  style={{ backgroundColor: settings.secondaryColor || '#8A6445' }}
                >
                  Bouton Secondaire
                </button>
              </div>
            </div>

            {/* Aperçu du pied de page : son réglage est indépendant de
                l'en-tête, on peut donc y garder le texte seul. */}
            <div className="bg-forest-dark px-4 py-3 flex items-center space-x-2.5">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="h-7 w-auto max-w-[140px] object-contain shrink-0"
                />
              ) : (
                <Flame className="w-6 h-6 text-beige shrink-0 fill-beige/20" />
              )}
              {(!settings.logoUrl || settings.showSiteNameFooter !== false) && (
                <span className="text-sm font-semibold font-poppins text-white tracking-tight">
                  {settings.siteName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-subtleBorder space-x-2">
          {[
            { id: 'brand', label: 'Marque & Nom du site', icon: Paintbrush },
            { id: 'hero', label: "Hero d'accueil", icon: Home },
            { id: 'bank', label: 'Coordonnées Bancaires', icon: CreditCard },
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
                className={`flex items-center space-x-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition ${
                  active
                    ? 'border-forest-700 text-forest-800 bg-white rounded-t-lg'
                    : 'border-transparent text-secondaryText hover:text-primaryText'
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
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-6 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText border-b border-subtleBorder pb-2">
              Identité de marque, Logo &amp; Nom du site
            </h2>

            {/* Logo Upload Section - Unboxed */}
            <div className="p-4 bg-beige-50/70 border border-subtleBorder rounded-xl space-y-3">
              <label className="block font-bold text-primaryText text-xs">
                Logo de la boutique (Téléversement sans conteneur ni boîte) :
              </label>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Visual rendering of current logo */}
                <div className="min-w-[120px] min-h-[50px] flex items-center justify-start p-2">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.siteName}
                      className="h-12 w-auto max-w-[220px] object-contain"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-secondaryText italic text-xs">
                      <ImageIcon className="w-4 h-4" />
                      <span>Aucun logo image (icône texte par défaut)</span>
                    </div>
                  )}
                </div>

                {/* Upload action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary py-2 px-3 text-xs flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Téléverser une image de logo</span>
                  </button>

                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer le logo</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-secondaryText leading-relaxed space-y-1">
                <p>
                  <strong>Redimensionnement automatique garanti :</strong> Votre logo est affiché de façon libre et naturelle, sans boîte, sans fond imposé et sans bordure. Il est automatiquement contraint à une hauteur fluide (max. 48px) pour s'adapter à toutes les formes (rectangulaire, carrée, circulaire ou typographique).
                </p>
                <p>
                  Formats acceptés : PNG transparent, SVG vectoriel, JPEG ou WebP (max. 4 Mo).
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-secondaryText mb-1">
                  Ou URL directe de l'image du logo :
                </label>
                <input
                  type="text"
                  placeholder="https://... ou /logo.png"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  className="input-field text-xs font-mono"
                />
              </div>

              {/* Affichage du nom du site : deux réglages indépendants, un pour
                  l'en-tête, un pour le pied de page. Le choix n'a de sens
                  qu'avec un logo image ; sinon le nom reste affiché. */}
              <div className="p-3.5 bg-beige-50/70 border border-subtleBorder rounded-xl space-y-3">
                <span className="font-semibold block text-xs text-primaryText">
                  Afficher le nom du site en texte à côté du logo
                </span>

                <div className="flex items-start gap-3">
                  <input
                    id="showSiteName"
                    type="checkbox"
                    checked={settings.showSiteName !== false}
                    disabled={!settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, showSiteName: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-forest-700 disabled:opacity-40"
                  />
                  <label
                    htmlFor="showSiteName"
                    className={`text-[11px] leading-relaxed ${settings.logoUrl ? 'text-primaryText cursor-pointer' : 'text-secondaryText'}`}
                  >
                    <span className="font-semibold block text-xs">En-tête (barre de navigation)</span>
                    {settings.logoUrl
                      ? "Décochez pour n'afficher que le logo image en haut du site."
                      : "Définissez d'abord un logo : sans logo, le nom du site reste affiché."}
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="showSiteNameFooter"
                    type="checkbox"
                    checked={settings.showSiteNameFooter !== false}
                    disabled={!settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, showSiteNameFooter: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-forest-700 disabled:opacity-40"
                  />
                  <label
                    htmlFor="showSiteNameFooter"
                    className={`text-[11px] leading-relaxed ${settings.logoUrl ? 'text-primaryText cursor-pointer' : 'text-secondaryText'}`}
                  >
                    <span className="font-semibold block text-xs">Pied de page</span>
                    {settings.logoUrl
                      ? "Décochez pour n'afficher que le logo image en bas du site. Indépendant de l'en-tête : vous pouvez garder le logo seul en haut et le texte seul en bas, ou l'inverse."
                      : "Définissez d'abord un logo : sans logo, le nom du site reste affiché."}
                  </label>
                </div>
              </div>
            </div>

            {/* Favicon Upload Section - Modifiable depuis l'admin, sans conteneur */}
            <div className="p-4 bg-beige-50/70 border border-subtleBorder rounded-xl space-y-3">
              <label className="block font-bold text-primaryText text-xs">
                Favicon du site (icône de l&apos;onglet navigateur) :
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Visual rendering of current favicon without box */}
                <div className="min-w-[70px] min-h-[40px] flex items-center justify-start p-1 gap-2">
                  {settings.faviconUrl ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={settings.faviconUrl}
                        alt="Favicon preview"
                        className="w-8 h-8 object-contain shrink-0"
                      />
                      <span className="text-[10px] text-secondaryText font-mono">32x32</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-secondaryText italic text-xs">
                      <ImageIcon className="w-4 h-4" />
                      <span>Favicon par défaut (/favicon.ico)</span>
                    </div>
                  )}
                </div>

                {/* Upload action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={faviconInputRef}
                    onChange={handleFaviconUpload}
                    accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp,image/gif"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="btn-secondary py-2 px-3 text-xs flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Téléverser un favicon</span>
                  </button>

                  {settings.faviconUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveFavicon}
                      className="px-3 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Réinitialiser le favicon</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-secondaryText leading-relaxed space-y-1">
                <p>
                  <strong>Pris en compte instantanément :</strong> Le favicon est injecté dans l&apos;en-tête HTML de toutes les pages pour les visiteurs.
                </p>
                <p>
                  Formats recommandés : .ico, PNG carré (32x32 ou 64x64 px), SVG vectoriel (max. 2 Mo).
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-secondaryText mb-1">
                  Ou URL directe du favicon :
                </label>
                <input
                  type="text"
                  placeholder="/favicon.ico ou https://..."
                  value={settings.faviconUrl || ''}
                  onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                  className="input-field text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">
                  Nom du site (ex: piolencboisdirect) :
                </label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="input-field font-semibold"
                />
                <p className="text-[11px] text-secondaryText mt-1">
                  Se répercute instantanément sur l'en-tête, le pied de page, les emails et les métadonnées.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">
                  Slogan du site :
                </label>
                <input
                  type="text"
                  value={settings.slogan}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">Couleur Principale :</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-subtleBorder"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Couleur Secondaire (Bois) :</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-subtleBorder"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Seuil Livraison Offerte (€) :</label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                  className="input-field font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hero de la page d'accueil */}
        {activeTab === 'hero' && (
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-6 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText border-b border-subtleBorder pb-2">
              Hero de la page d&apos;accueil (première section du site)
            </h2>

            <div className="p-3 bg-beige-50 border border-subtleBorder rounded-lg text-secondaryText leading-relaxed flex items-start space-x-2">
              <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
              <span>
                Tout ce qui s&apos;affiche en haut de la page d&apos;accueil se règle ici. Laisser un champ vide masque
                l&apos;élément correspondant sur le site ; le titre et l&apos;image reprennent leur valeur par défaut
                s&apos;ils sont vidés. Les autres sections de la page d&apos;accueil ne sont pas concernées.
              </span>
            </div>

            {/* Aperçu en direct */}
            <div>
              <label className="block font-bold text-primaryText text-xs mb-2">Aperçu en direct :</label>
              <div className="rounded-xl border border-subtleBorder bg-white p-4 space-y-3">
                {settings.heroBadge && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-forest-50 border border-forest-100 text-forest text-[11px] font-medium">
                    {settings.heroBadge}
                  </span>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-2 space-y-2">
                    <p className="font-poppins font-semibold text-lg text-primaryText leading-tight">
                      {settings.heroTitle || '(titre par défaut)'}
                    </p>
                    {settings.heroSubtitle && (
                      <p className="text-secondaryText text-[11px] leading-relaxed">{settings.heroSubtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {settings.heroPrimaryLabel && (
                        <span className="px-3 py-1.5 rounded-md bg-forest-700 text-white text-[11px] font-semibold">
                          {settings.heroPrimaryLabel}
                        </span>
                      )}
                      {settings.heroSecondaryLabel && (
                        <span className="px-3 py-1.5 rounded-md border border-subtleBorder text-primaryText text-[11px] font-semibold">
                          {settings.heroSecondaryLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-subtleBorder text-[11px]">
                      {[
                        { v: settings.heroFact1Value, l: settings.heroFact1Label },
                        { v: settings.heroFact2Value, l: settings.heroFact2Label },
                        { v: settings.heroFact3Value, l: settings.heroFact3Label },
                      ]
                        .filter((f) => (f.v || '').trim() || (f.l || '').trim())
                        .map((f, i) => (
                          <span key={i} className="leading-tight">
                            <span className="block font-semibold text-primaryText">{f.v}</span>
                            <span className="text-secondaryText">{f.l}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-subtleBorder">
                    {settings.heroImageUrl ? (
                      <img
                        src={settings.heroImageUrl}
                        alt={settings.heroImageCaption || 'Visuel du hero'}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-secondaryText italic text-[11px]">
                        Aucun visuel
                      </div>
                    )}
                    {(settings.heroImageCaption || settings.heroImageBadge) && (
                      <div className="p-2 bg-white border-t border-subtleBorder flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-primaryText">{settings.heroImageCaption}</span>
                        {settings.heroImageBadge && <span className="badge-success">{settings.heroImageBadge}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Textes */}
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">
                  Accroche (petit bandeau au-dessus du titre) :
                </label>
                <input
                  value={settings.heroBadge ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Bois sec étuvé certifié NF H1"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Titre principal (H1) *</label>
                <textarea
                  rows={2}
                  value={settings.heroTitle ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Texte d&apos;introduction :</label>
                <textarea
                  rows={3}
                  value={settings.heroSubtitle ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  className="input-field text-xs"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">Bouton principal — libellé :</label>
                <input
                  value={settings.heroPrimaryLabel ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroPrimaryLabel: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Consulter le catalogue"
                />
              </div>
              <div>
                <label className="block font-semibold text-primaryText mb-1">Bouton principal — lien :</label>
                <input
                  value={settings.heroPrimaryHref ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroPrimaryHref: e.target.value })}
                  className="input-field text-xs font-mono"
                  placeholder="/boutique"
                />
              </div>
              <div>
                <label className="block font-semibold text-primaryText mb-1">Bouton secondaire — libellé :</label>
                <input
                  value={settings.heroSecondaryLabel ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroSecondaryLabel: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Calculer les frais de port"
                />
              </div>
              <div>
                <label className="block font-semibold text-primaryText mb-1">Bouton secondaire — lien :</label>
                <input
                  value={settings.heroSecondaryHref ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroSecondaryHref: e.target.value })}
                  className="input-field text-xs font-mono"
                  placeholder="/calculateurs/livraison"
                />
              </div>
            </div>

            {/* Visuel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-beige-50/70 border border-subtleBorder rounded-xl">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-primaryText mb-1">
                  Visuel — URL de l&apos;image (ou téléversez-la puis copiez son chemin) :
                </label>
                <input
                  value={settings.heroImageUrl ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
                  className="input-field text-xs font-mono"
                  placeholder="/images/hero.webp"
                />
              </div>
              <div>
                <label className="block font-semibold text-primaryText mb-1">Légende du visuel :</label>
                <input
                  value={settings.heroImageCaption ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroImageCaption: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Palettes filmées &amp; cerclées"
                />
              </div>
              <div>
                <label className="block font-semibold text-primaryText mb-1">Sous-légende du visuel :</label>
                <input
                  value={settings.heroImageCaptionSub ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroImageCaptionSub: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Bûches 25 cm, 33 cm et 50 cm disponibles"
                />
              </div>
              <div>
                <label className="block font-semibold text-primaryText mb-1">Pastille du visuel :</label>
                <input
                  value={settings.heroImageBadge ?? ''}
                  onChange={(e) => setSettings({ ...settings, heroImageBadge: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Stock disponible"
                />
              </div>
            </div>

            {/* Chiffres clés */}
            <div className="space-y-3">
              <h3 className="font-bold text-primaryText uppercase tracking-wider text-[11px]">
                Chiffres clés sous le hero
              </h3>
              {[
                { value: 'heroFact1Value', label: 'heroFact1Label', titre: 'Chiffre 1' },
                { value: 'heroFact2Value', label: 'heroFact2Label', titre: 'Chiffre 2' },
                { value: 'heroFact3Value', label: 'heroFact3Label', titre: 'Chiffre 3' },
              ].map((fact) => (
                <div key={fact.value} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">{fact.titre} — valeur :</label>
                    <input
                      value={settings[fact.value] ?? ''}
                      onChange={(e) => setSettings({ ...settings, [fact.value]: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">{fact.titre} — légende :</label>
                    <input
                      value={settings[fact.label] ?? ''}
                      onChange={(e) => setSettings({ ...settings, [fact.label]: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-secondaryText">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Enregistrez puis ouvrez la page d&apos;accueil du site pour vérifier le rendu réel.</span>
            </div>
          </div>
        )}

        {/* Tab 3: Bank details */}
        {activeTab === 'bank' && (
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-5 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText border-b border-subtleBorder pb-2">
              Coordonnées bancaires pour virement des clients
            </h2>

            <div className="p-3 bg-beige-50 border border-subtleBorder rounded-lg text-secondaryText leading-relaxed flex items-start space-x-2">
              <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
              <span>Ces coordonnées sont affichées sur la page de paiement, dans l'email de confirmation et sur les récapitulatifs. Ne jamais saisir d'IBAN fictif en production.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">Nom du bénéficiaire :</label>
                <input
                  type="text"
                  required
                  value={settings.bankBeneficiary}
                  onChange={(e) => setSettings({ ...settings, bankBeneficiary: e.target.value })}
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Établissement bancaire :</label>
                <input
                  type="text"
                  required
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">IBAN :</label>
                <input
                  type="text"
                  required
                  value={settings.bankIban}
                  onChange={(e) => setSettings({ ...settings, bankIban: e.target.value })}
                  className="input-field font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">BIC / SWIFT :</label>
                <input
                  type="text"
                  required
                  value={settings.bankBic}
                  onChange={(e) => setSettings({ ...settings, bankBic: e.target.value })}
                  className="input-field font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-primaryText mb-1">
                Instructions de virement à l'attention du client :
              </label>
              <textarea
                rows={3}
                value={settings.bankInstructions}
                onChange={(e) => setSettings({ ...settings, bankInstructions: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Company */}
        {activeTab === 'company' && (
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-5 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText border-b border-subtleBorder pb-2">
              Coordonnées de l'entreprise &amp; Horaires de service client
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">Raison sociale :</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Adresse complète du siège :</label>
                <input
                  type="text"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Téléphone service client :</label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Email de contact public :</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Numéro SIRET :</label>
                <input
                  type="text"
                  value={settings.companySiret}
                  onChange={(e) => setSettings({ ...settings, companySiret: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">TVA Intracommunautaire :</label>
                <input
                  type="text"
                  value={settings.companyVatNumber}
                  onChange={(e) => setSettings({ ...settings, companyVatNumber: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">Horaires d'ouverture :</label>
                <input
                  type="text"
                  value={settings.supportHours}
                  onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Zones de livraison :</label>
                <input
                  type="text"
                  value={settings.deliveryZonesText || ''}
                  onChange={(e) => setSettings({ ...settings, deliveryZonesText: e.target.value })}
                  className="input-field"
                  placeholder="France métropolitaine, Belgique, Allemagne, Suisse"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Legal Texts */}
        {activeTab === 'legal' && (
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-5 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText border-b border-subtleBorder pb-2">
              Textes légaux et politiques contractuelles
            </h2>

            <div>
              <label className="block font-semibold text-primaryText mb-1">Conditions Générales de Vente (CGV) :</label>
              <textarea
                rows={4}
                value={settings.cgvText}
                onChange={(e) => setSettings({ ...settings, cgvText: e.target.value })}
                className="input-field font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-primaryText mb-1">Politique de Confidentialité RGPD :</label>
              <textarea
                rows={3}
                value={settings.privacyPolicyText}
                onChange={(e) => setSettings({ ...settings, privacyPolicyText: e.target.value })}
                className="input-field font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-primaryText mb-1">Modalités de Livraison &amp; Déchargement :</label>
              <textarea
                rows={3}
                value={settings.deliveryPolicyText}
                onChange={(e) => setSettings({ ...settings, deliveryPolicyText: e.target.value })}
                className="input-field font-mono text-[11px]"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Email provider */}
        {activeTab === 'email' && (
          <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-5 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText border-b border-subtleBorder pb-2">
              Service d'envoi d'emails transactionnels
            </h2>

            <div className="p-3 bg-beige-50 border border-subtleBorder rounded-lg text-primaryText flex items-start space-x-2">
              <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
              <span>
                {settings.emailProvider === 'log'
                  ? 'Mode actuel : Journal d\'audit interne (Sandbox). Les emails sont générés, tracés en base de données et consultables dans l\'onglet "Emails & Notifications" sans nécessiter de serveur SMTP.'
                  : settings.emailProvider === 'resend'
                    ? 'Mode Resend actif : les emails sont réellement délivrés par l\'API HTTPS de Resend. La clé se trouve dans le fichier .env du serveur (RESEND_API_KEY), jamais en base ni dans le navigateur.'
                    : 'Mode SMTP Actif : Les emails sont délivrés par votre serveur de messagerie externe.'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-primaryText mb-1">Fournisseur :</label>
                <select
                  value={settings.emailProvider}
                  onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })}
                  className="input-field bg-white"
                >
                  <option value="log">Journal d'audit sécurisé (Par défaut / Recette)</option>
                  <option value="resend">Resend — API HTTPS (recommandé)</option>
                  <option value="smtp">Serveur SMTP externe (Production)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primaryText mb-1">Email notification administrateur :</label>
                <input
                  type="email"
                  value={settings.adminNotificationEmail}
                  onChange={(e) => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                  className="input-field"
                />
              </div>

              {settings.emailProvider === 'resend' && (
                <div className="sm:col-span-2 p-3 bg-beige-50 border border-subtleBorder rounded-lg text-primaryText space-y-1">
                  <p className="font-semibold">Configuration Resend (côté serveur)</p>
                  <p className="font-mono text-[11px] text-secondaryText">
                    RESEND_API_KEY=re_... &nbsp;·&nbsp; RESEND_FROM="Votre société &lt;contact@votre-domaine.fr&gt;"
                  </p>
                  <p className="text-secondaryText">
                    Adresse d'expédition utilisée : <span className="font-mono">{settings.smtpFrom || '(non définie)'}</span>. Le domaine de
                    cette adresse doit être vérifié dans votre compte Resend. La clé n'est ni stockée en base ni transmise au navigateur.
                  </p>
                </div>
              )}

              {settings.emailProvider === 'smtp' && (
                <>
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Hôte SMTP :</label>
                    <input
                      type="text"
                      value={settings.smtpHost}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      placeholder="smtp.sendgrid.net, ssl0.ovh.net..."
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Port SMTP :</label>
                    <input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value, 10) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Utilisateur SMTP :</label>
                    <input
                      type="text"
                      value={settings.smtpUser}
                      onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Mot de passe SMTP :</label>
                    <input
                      type="password"
                      value={settings.smtpPassword || ''}
                      onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                      className="input-field font-mono"
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
