import React from 'react';
import Link from 'next/link';
import { Flame, Phone, Mail, MapPin, Clock, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';

interface FooterProps {
  settings?: Partial<SiteSettingsData>;
}

export default function Footer({ settings }: FooterProps) {
  const siteName = settings?.siteName || 'piolencboisdirect';
  const companyName = settings?.companyName || 'Piolenc Bois Direct SAS';
  const companyAddress = settings?.companyAddress || '14 Rue des Scieries, 88200 Remiremont, France';
  const companyPhone = settings?.companyPhone || '+33 (0)3 29 00 12 34';
  const companyEmail = settings?.companyEmail || 'contact@woodmachine-bois.fr';
  const supportHours = settings?.supportHours || 'Du Lundi au Vendredi de 8h00 à 19h00, Samedi de 8h30 à 13h00';
  const siret = settings?.companySiret || '892 341 982 00019';
  const vatNumber = settings?.companyVatNumber || 'FR 34 892341982';
  const deliveryZones = settings?.deliveryZonesText || 'France métropolitaine, Belgique, Allemagne, Suisse';

  return (
    <footer className="bg-forest-dark text-ivory border-t border-forest-dark/80 font-sans">
      {/* Upper Reassurance Section */}
      <div className="border-b border-forest-secondary/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-forest/80 border border-forest-secondary/50 flex items-center justify-center text-beige shrink-0">
              <Truck className="w-5 h-5 text-beige" />
            </div>
            <div>
              <h4 className="font-poppins font-medium text-sm text-white">Livraison spécialisée avec hayon</h4>
              <p className="text-xs text-ivory/80 mt-1 leading-relaxed">
                Dépose par camion porteur équipé d&apos;un hayon élévateur et d&apos;un transpalette au plus près de votre stockage.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-forest/80 border border-forest-secondary/50 flex items-center justify-center text-beige shrink-0">
              <CreditCard className="w-5 h-5 text-beige" />
            </div>
            <div>
              <h4 className="font-poppins font-medium text-sm text-white">Virement bancaire direct</h4>
              <p className="text-xs text-ivory/80 mt-1 leading-relaxed">
                Paiement direct de banque à banque en toute transparence avec communication structurée unique.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-forest/80 border border-forest-secondary/50 flex items-center justify-center text-beige shrink-0">
              <ShieldCheck className="w-5 h-5 text-beige" />
            </div>
            <div>
              <h4 className="font-poppins font-medium text-sm text-white">Humidité garantie NF H1</h4>
              <p className="text-xs text-ivory/80 mt-1 leading-relaxed">
                Taux d&apos;humidité contrôlé inférieur à 20% à cœur pour un allumage immédiat et un rendement thermique maximal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 5-Column Navigation */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand & Corporate */}
        <div className="lg:col-span-2 space-y-3.5">
          <Link href="/" className="flex items-center space-x-2.5">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={siteName}
                className="h-8 w-auto max-w-[180px] object-contain shrink-0"
              />
            ) : (
              <Flame className="w-6 h-6 text-beige shrink-0 fill-beige/20" />
            )}
            <span className="font-poppins font-semibold text-lg text-white tracking-tight">{siteName}</span>
          </Link>
          <p className="text-xs text-ivory/80 leading-relaxed max-w-sm">
            {siteName} est spécialisé dans l&apos;approvisionnement et la livraison à domicile de bois de chauffage haute performance et biocombustibles issus de massifs forestiers durables.
          </p>
          <div className="pt-2 text-[11px] text-ivory/60 space-y-1">
            <p className="font-medium text-ivory/90">{companyName}</p>
            <p>SIRET : {siret} | N° TVA : {vatNumber}</p>
            <p>{companyAddress}</p>
            <p>Zones de livraison : {deliveryZones}.</p>
          </div>
        </div>

        {/* Catalog */}
        <div className="space-y-3">
          <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-beige">Boutique &amp; Produits</h4>
          <ul className="space-y-2 text-xs text-ivory/80">
            <li>
              <Link href="/boutique" className="hover:text-white transition-colors">Toute la boutique</Link>
            </li>
            <li>
              <Link href="/catalogue" className="hover:text-white transition-colors">Palettes de bois étuvé</Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-white transition-colors">Bûches 25, 33 et 50 cm</Link>
            </li>
            <li>
              <Link href="/promotions" className="hover:text-white transition-colors">Offres de saison</Link>
            </li>
          </ul>
        </div>

        {/* Tools & Guides */}
        <div className="space-y-3">
          <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-beige">Outils &amp; Guides</h4>
          <ul className="space-y-2 text-xs text-ivory/80">
            <li>
              <Link href="/calculateurs/quantite" className="hover:text-white transition-colors">Calculateur de stères</Link>
            </li>
            <li>
              <Link href="/calculateurs/livraison" className="hover:text-white transition-colors">Tarifs de livraison</Link>
            </li>
            <li>
              <Link href="/guides/essences" className="hover:text-white transition-colors">Guide des essences</Link>
            </li>
            <li>
              <Link href="/guides/humidite" className="hover:text-white transition-colors">Norme NF &amp; Humidité</Link>
            </li>
            <li>
              <Link href="/guides/stockage" className="hover:text-white transition-colors">Stockage et allumage</Link>
            </li>
            <li>
              <Link href="/virement-bancaire" className="hover:text-white transition-colors">Mode d&apos;emploi virement</Link>
            </li>
          </ul>
        </div>

        {/* Contact & Legal */}
        <div className="space-y-3">
          <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-beige">Assistance &amp; Légal</h4>
          <div className="space-y-2 text-xs text-ivory/80">
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-beige shrink-0" />
              <a href={`tel:${companyPhone.replace(/\s+/g, '')}`} className="hover:text-white">
                {companyPhone}
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-beige shrink-0" />
              <a href={`mailto:${companyEmail}`} className="hover:text-white">
                {companyEmail}
              </a>
            </div>
            <div className="flex items-start space-x-2 pt-1 text-[11px] text-ivory/70">
              <Clock className="w-3.5 h-3.5 text-beige shrink-0 mt-0.5" />
              <span>{supportHours}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-forest-secondary/40 flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-ivory/60">
            <Link href="/cgv" className="hover:text-white">CGV</Link>
            <span>·</span>
            <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
            <span>·</span>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
            <span>·</span>
            <Link href="/livraison-et-retours" className="hover:text-white">Livraison</Link>
            <span>·</span>
            <Link href="/admin" className="text-beige/90 hover:text-white font-medium">Administration</Link>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-forest-secondary/30 py-5 px-4 text-center text-xs text-ivory/60">
        <p>© {new Date().getFullYear()} {siteName}. Tous droits réservés. Distribution certifiée de biocombustibles.</p>
      </div>
    </footer>
  );
}
