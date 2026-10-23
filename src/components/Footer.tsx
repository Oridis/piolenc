import React from 'react';
import Link from 'next/link';
import { Flame, Phone, Mail, MapPin, Clock, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';

interface FooterProps {
  settings?: Partial<SiteSettingsData>;
}

export default function Footer({ settings }: FooterProps) {
  const siteName = settings?.siteName || 'Allo Maison';
  const companyName = settings?.companyName || 'Allo Maison Distribution SAS';
  const companyAddress = settings?.companyAddress || '14 Rue des Scieries, 88200 Remiremont, France';
  const companyPhone = settings?.companyPhone || '+33 (0)3 29 00 12 34';
  const companyEmail = settings?.companyEmail || 'contact@allomaison-bois.fr';
  const supportHours = settings?.supportHours || 'Du Lundi au Vendredi de 8h00 à 19h00, Samedi de 8h30 à 13h00';
  const siret = settings?.companySiret || '892 341 982 00019';
  const vatNumber = settings?.companyVatNumber || 'FR 34 892341982';

  return (
    <footer className="bg-forest-950 text-white border-t border-forest-900">
      {/* Upper Footer Benefits */}
      <div className="border-b border-forest-900/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex items-center space-x-4 justify-center md:justify-start">
            <div className="p-3 bg-forest-900 rounded-xl text-amber-400 shrink-0">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Livraison Poids Lourd Spécialisée</h4>
              <p className="text-xs text-forest-200 mt-1">Camion porteur avec hayon et transpalette tout terrain directement à votre abri.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 justify-center md:justify-start">
            <div className="p-3 bg-forest-900 rounded-xl text-emerald-400 shrink-0">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Règlement par Virement Bancaire</h4>
              <p className="text-xs text-forest-200 mt-1">Transaction directe sans frais, validation comptable rigoureuse et traçabilité.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 justify-center md:justify-start">
            <div className="p-3 bg-forest-900 rounded-xl text-amber-400 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Contrôle Hygrométrique NF</h4>
              <p className="text-xs text-forest-200 mt-1">Bûches séchées en étuve certifiées &lt; 20% d'humidité prêtes pour un allumage immédiat.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand column */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-forest-950 font-bold">
              <Flame className="w-6 h-6 fill-forest-950" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">{siteName}</span>
          </Link>
          <p className="text-sm text-forest-200 leading-relaxed max-w-sm">
            {siteName} est votre plateforme d'approvisionnement direct en bois de chauffage sec étuvé de haute qualité. Exploitations forestières françaises et européennes durables certifiées PEFC / FSC.
          </p>

          <div className="pt-2 text-xs text-forest-300 space-y-1">
            <p className="font-semibold text-white">{companyName}</p>
            <p>SIRET : {siret} | N° TVA Intracommunautaire : {vatNumber}</p>
            <p>Zones desservies : France entière, Belgique, Allemagne et Suisse.</p>
          </div>
        </div>

        {/* Catalog Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Notre Bois</h4>
          <ul className="space-y-2.5 text-sm text-forest-200">
            <li>
              <Link href="/boutique" className="hover:text-white transition">Boutique complète</Link>
            </li>
            <li>
              <Link href="/catalogue" className="hover:text-white transition">Palettes de bois dur étuvé</Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-white transition">Bûches 25 cm, 33 cm, 50 cm</Link>
            </li>
            <li>
              <Link href="/promotions" className="hover:text-white transition">Offres et remises volume</Link>
            </li>
            <li>
              <Link href="/calculateurs/quantite" className="hover:text-white transition">Calculateur de stères</Link>
            </li>
            <li>
              <Link href="/calculateurs/livraison" className="hover:text-white transition">Calculateur de transport</Link>
            </li>
          </ul>
        </div>

        {/* Guides & Advice */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Guides &amp; Conseils</h4>
          <ul className="space-y-2.5 text-sm text-forest-200">
            <li>
              <Link href="/guides/essences" className="hover:text-white transition">Guide des essences de bois</Link>
            </li>
            <li>
              <Link href="/guides/humidite" className="hover:text-white transition">Taux d'humidité &amp; PCI</Link>
            </li>
            <li>
              <Link href="/guides/stockage" className="hover:text-white transition">Conseils de stockage</Link>
            </li>
            <li>
              <Link href="/virement-bancaire" className="hover:text-white transition">Guide virement bancaire</Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition">Questions fréquentes (FAQ)</Link>
            </li>
            <li>
              <Link href="/a-propos" className="hover:text-white transition">À propos de l'entreprise</Link>
            </li>
          </ul>
        </div>

        {/* Contact & Legal */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Service Client &amp; Légal</h4>
          <div className="space-y-3 text-sm text-forest-200">
            <div className="flex items-start space-x-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <a href={`tel:${companyPhone.replace(/\s+/g, '')}`} className="hover:text-white">
                {companyPhone}
              </a>
            </div>
            <div className="flex items-start space-x-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <a href={`mailto:${companyEmail}`} className="hover:text-white">
                {companyEmail}
              </a>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{companyAddress}</span>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-xs">{supportHours}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-forest-900/80 flex flex-wrap gap-2 text-[11px] text-forest-300">
            <Link href="/cgv" className="hover:text-white">CGV</Link>
            <span>•</span>
            <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
            <span>•</span>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
            <span>•</span>
            <Link href="/livraison-et-retours" className="hover:text-white">Livraison</Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-amber-400 font-semibold">Administration</Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-forest-900 py-6 px-4 text-center text-xs text-forest-400">
        <p>© {new Date().getFullYear()} {siteName}. Tous droits réservés. Plateforme de distribution de bois de chauffage haute performance.</p>
      </div>
    </footer>
  );
}
