'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { 
  Flame, 
  ShoppingBag, 
  User, 
  PhoneCall, 
  Calculator, 
  Truck, 
  Menu, 
  X, 
  ShieldCheck, 
  ChevronDown,
  BookOpen,
  Layers,
  Droplets,
  Warehouse
} from 'lucide-react';

interface NavbarProps {
  siteName?: string;
  phone?: string;
  slogan?: string;
  logoUrl?: string;
}

export default function Navbar({
  siteName: initialSiteName = 'piolencboisdirect',
  phone: initialPhone = '+33 (0)3 29 00 12 34',
  slogan = 'Spécialiste du bois de chauffage haute performance',
  logoUrl: initialLogoUrl,
}: NavbarProps) {
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guidesDropdownOpen, setGuidesDropdownOpen] = useState(false);
  const [siteName, setSiteName] = useState(initialSiteName);
  const [phone, setPhone] = useState(initialPhone);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  // Réglage admin « en-tête » : le nom en texte peut être masqué pour ne
  // garder que le logo image. Le pied de page a son propre réglage
  // (showSiteNameFooter), les deux sont indépendants.
  const [showSiteNameInHeader, setShowSiteNameInHeader] = useState(true);

  // Sync with live settings in case logo was recently uploaded
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.siteName) setSiteName(data.siteName);
        if (data.companyPhone) setPhone(data.companyPhone);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (typeof data.showSiteName === 'boolean') setShowSiteNameInHeader(data.showSiteName);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-subtleBorder">
      {/* Top Reassuring Service Bar - Streamlined single-row on mobile */}
      <div className="bg-forest text-white text-xs py-1.5 sm:py-2 px-3 sm:px-6 lg:px-8 border-b border-forest-dark">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          {/* Left: Quality guarantee (min-w-0 permet à truncate d'agir vraiment
              à l'intérieur d'un flex, sinon la barre déborde sur mobile) */}
          <div className="flex items-center space-x-3 text-ivory/95 truncate min-w-0">
            <span className="inline-flex items-center gap-1.5 font-medium truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-beige shrink-0" />
              <span className="truncate">Bois sec certifié NF H1</span>
              <span className="hidden sm:inline text-ivory/80">(&lt; 20% humidité)</span>
            </span>
            <span className="hidden md:inline text-forest-secondary">|</span>
            <span className="hidden md:inline text-ivory/80">
              Livraison spécialisée avec hayon
            </span>
          </div>

          {/* Right: Contact & Delivery countries */}
          <div className="flex items-center space-x-3 shrink-0 min-w-0 max-w-[58%] sm:max-w-none">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 min-w-0 text-ivory hover:text-white transition-colors duration-150 font-medium"
            >
              <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-beige shrink-0" />
              <span className="hidden sm:inline">Service client : </span>
              <span className="truncate">{phone}</span>
            </a>
            <span className="hidden lg:inline text-forest-secondary">|</span>
            <span className="hidden lg:inline text-ivory/80 font-medium tracking-wide">
              Livraison : FR · BE · DE · CH
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] py-2 sm:py-3">
          {/* Brand Logo - Completely unboxed without stacked subtitle */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-9 sm:h-11 w-auto max-w-[180px] sm:max-w-[220px] object-contain shrink-0"
              />
            ) : (
              <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-forest shrink-0 fill-forest/15" />
            )}
            {(!logoUrl || showSiteNameInHeader) && (
              <span className="font-poppins font-semibold text-base sm:text-xl tracking-tight text-primaryText block leading-tight truncate min-w-0">
                {siteName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium font-poppins text-primaryText">
            <Link 
              href="/boutique" 
              className="hover:text-forest transition-colors duration-150 py-1"
            >
              Boutique
            </Link>
            <Link 
              href="/catalogue" 
              className="hover:text-forest transition-colors duration-150 py-1"
            >
              Catalogue
            </Link>
            <Link 
              href="/promotions" 
              className="hover:text-forest transition-colors duration-150 py-1"
            >
              Offres
            </Link>

            {/* Guides Dropdown */}
            <div className="relative">
              <button
                onClick={() => setGuidesDropdownOpen(!guidesDropdownOpen)}
                onMouseEnter={() => setGuidesDropdownOpen(true)}
                className="inline-flex items-center gap-1 hover:text-forest transition-colors duration-150 py-1"
              >
                <span>Guides &amp; Conseils</span>
                <ChevronDown className="w-3.5 h-3.5 text-secondaryText" />
              </button>

              {guidesDropdownOpen && (
                <div
                  onMouseLeave={() => setGuidesDropdownOpen(false)}
                  className="absolute left-0 mt-2 w-72 bg-white border border-subtleBorder shadow-card rounded-lg py-2 z-50 text-xs"
                >
                  <Link
                    href="/guides/essences"
                    onClick={() => setGuidesDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-ivory text-primaryText transition-colors"
                  >
                    <Layers className="w-4 h-4 text-forest-secondary" />
                    <div>
                      <div className="font-medium">Guide des essences</div>
                      <div className="text-[11px] text-secondaryText">Chêne, charme, hêtre, frêne</div>
                    </div>
                  </Link>
                  <Link
                    href="/guides/humidite"
                    onClick={() => setGuidesDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-ivory text-primaryText transition-colors"
                  >
                    <Droplets className="w-4 h-4 text-forest-secondary" />
                    <div>
                      <div className="font-medium">Humidité &amp; Rendement NF</div>
                      <div className="text-[11px] text-secondaryText">Moins de 20% d&apos;humidité garantie</div>
                    </div>
                  </Link>
                  <Link
                    href="/guides/stockage"
                    onClick={() => setGuidesDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-ivory text-primaryText transition-colors"
                  >
                    <Warehouse className="w-4 h-4 text-forest-secondary" />
                    <div>
                      <div className="font-medium">Stockage &amp; Conservation</div>
                      <div className="text-[11px] text-secondaryText">Ventilation et protection contre la pluie</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link 
              href="/calculateurs/quantite" 
              className="inline-flex items-center gap-1.5 hover:text-forest transition-colors duration-150 py-1 text-secondaryText hover:text-primaryText"
            >
              <Calculator className="w-4 h-4 text-forest" />
              <span>Calculateur</span>
            </Link>
            <Link 
              href="/calculateurs/livraison" 
              className="inline-flex items-center gap-1.5 hover:text-forest transition-colors duration-150 py-1 text-secondaryText hover:text-primaryText"
            >
              <Truck className="w-4 h-4 text-wood" />
              <span>Livraison</span>
            </Link>
            <Link 
              href="/contact" 
              className="hover:text-forest transition-colors duration-150 py-1 text-secondaryText hover:text-primaryText"
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/mon-compte"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-primaryText hover:text-forest px-3 py-2 rounded-md hover:bg-ivory transition-colors duration-150"
              title="Accès à l'espace client"
            >
              <User className="w-4 h-4 text-secondaryText" />
              <span>Mon compte</span>
            </Link>

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 bg-forest text-white text-xs font-medium font-poppins px-3.5 py-2 rounded-md hover:bg-forest-dark transition-colors duration-150 shadow-subtle"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Panier</span>
              {totalItemsCount > 0 && (
                <span className="inline-flex items-center justify-center bg-beige text-forest-dark text-[11px] font-semibold h-5 min-w-[20px] px-1.5 rounded-full">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-secondaryText hover:text-primaryText rounded-md hover:bg-ivory"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-subtleBorder bg-white px-4 py-4 space-y-2">
          <Link
            href="/boutique"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-primaryText py-2 border-b border-subtleBorder/50"
          >
            Boutique
          </Link>
          <Link
            href="/catalogue"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-primaryText py-2 border-b border-subtleBorder/50"
          >
            Catalogue &amp; Tarifs
          </Link>
          <Link
            href="/promotions"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-primaryText py-2 border-b border-subtleBorder/50"
          >
            Offres du moment
          </Link>
          <div className="pt-2 pb-1 text-xs font-medium text-secondaryText uppercase tracking-wider">
            Guides &amp; Calculateurs
          </div>
          <Link
            href="/guides/essences"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-primaryText py-1.5 pl-2"
          >
            Guide des essences de bois
          </Link>
          <Link
            href="/guides/humidite"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-primaryText py-1.5 pl-2"
          >
            Humidité et rendement NF
          </Link>
          <Link
            href="/guides/stockage"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-primaryText py-1.5 pl-2"
          >
            Conseils de stockage
          </Link>
          <Link
            href="/calculateurs/quantite"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-forest py-2 border-t border-subtleBorder/50 mt-2"
          >
            Calculateur de stères
          </Link>
          <Link
            href="/calculateurs/livraison"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-primaryText py-2"
          >
            Frais et délais de livraison
          </Link>
          <Link
            href="/mon-compte"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-forest py-2 border-t border-subtleBorder/50 mt-2"
          >
            Espace Client &amp; Suivi
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-secondaryText py-2"
          >
            Contactez le service client
          </Link>
        </div>
      )}
    </header>
  );
}
