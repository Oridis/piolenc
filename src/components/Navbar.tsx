'use client';

import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';

interface NavbarProps {
  siteName?: string;
  phone?: string;
  slogan?: string;
}

export default function Navbar({
  siteName = 'Allo Maison',
  phone = '+33 (0)3 29 00 12 34',
  slogan = 'Spécialiste du bois de chauffage haute performance',
}: NavbarProps) {
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guidesDropdownOpen, setGuidesDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      {/* Top reassuring banner */}
      <div className="bg-forest-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-forest-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bois sec certifié NF &lt; 20% • Forêts durables</span>
            </span>
            <span className="hidden md:inline text-forest-300">|</span>
            <span className="hidden md:inline text-forest-200">
              Livraison par camion porteur avec hayon et transpalette
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center space-x-1.5 text-forest-100 hover:text-white transition font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Conseil &amp; Commande : {phone}</span>
            </a>
            <span className="text-forest-400">|</span>
            <div className="flex items-center space-x-1 font-semibold text-forest-100">
              <span title="France">🇫🇷</span>
              <span title="Belgique">🇧🇪</span>
              <span title="Allemagne">🇩🇪</span>
              <span title="Suisse">🇨🇭</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-forest-800 to-forest-950 rounded-xl flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition">
              <Flame className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-forest-950 block">
                {siteName}
              </span>
              <span className="text-[11px] font-medium text-wood-700 tracking-wide block uppercase">
                Bois de chauffage étuvé
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-gray-700">
            <Link href="/boutique" className="hover:text-forest-800 transition py-2">
              Boutique
            </Link>
            <Link href="/catalogue" className="hover:text-forest-800 transition py-2">
              Catalogue &amp; Tarifs
            </Link>
            <Link href="/promotions" className="text-amber-700 hover:text-amber-800 transition py-2 flex items-center space-x-1">
              <span>Offres Spéciales</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Promo</span>
            </Link>

            {/* Guides Dropdown */}
            <div className="relative">
              <button
                onClick={() => setGuidesDropdownOpen(!guidesDropdownOpen)}
                onMouseEnter={() => setGuidesDropdownOpen(true)}
                className="flex items-center space-x-1 hover:text-forest-800 transition py-2"
              >
                <span>Guides &amp; Conseils</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {guidesDropdownOpen && (
                <div
                  onMouseLeave={() => setGuidesDropdownOpen(false)}
                  className="absolute left-0 mt-1 w-64 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 text-xs"
                >
                  <Link
                    href="/guides/essences"
                    onClick={() => setGuidesDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-forest-50 hover:text-forest-900 font-medium"
                  >
                    🪵 Guide des essences de bois
                  </Link>
                  <Link
                    href="/guides/humidite"
                    onClick={() => setGuidesDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-forest-50 hover:text-forest-900 font-medium"
                  >
                    💧 Humidité et pouvoir calorifique (NF)
                  </Link>
                  <Link
                    href="/guides/stockage"
                    onClick={() => setGuidesDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-forest-50 hover:text-forest-900 font-medium"
                  >
                    🏡 Conseils de stockage et allumage
                  </Link>
                </div>
              )}
            </div>

            <Link href="/calculateurs/quantite" className="hover:text-forest-800 transition py-2 flex items-center space-x-1 text-forest-800">
              <Calculator className="w-4 h-4 text-forest-600" />
              <span>Calculateur volume</span>
            </Link>
            <Link href="/calculateurs/livraison" className="hover:text-forest-800 transition py-2 flex items-center space-x-1">
              <Truck className="w-4 h-4 text-wood-600" />
              <span>Frais &amp; Délais</span>
            </Link>
            <Link href="/contact" className="hover:text-forest-800 transition py-2">
              Contact
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/mon-compte"
              className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-gray-700 hover:text-forest-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              title="Espace Client"
            >
              <User className="w-4 h-4" />
              <span>Mon compte</span>
            </Link>

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative bg-forest-800 text-white p-2.5 rounded-xl hover:bg-forest-700 transition flex items-center space-x-2 shadow-sm"
              aria-label="Voir le panier"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">Panier</span>
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-gray-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-5 space-y-3">
          <Link
            href="/boutique"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-gray-800 py-2 border-b border-gray-100"
          >
            Boutique
          </Link>
          <Link
            href="/catalogue"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-gray-800 py-2 border-b border-gray-100"
          >
            Catalogue &amp; Tarifs
          </Link>
          <Link
            href="/promotions"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-amber-700 py-2 border-b border-gray-100"
          >
            🔥 Offres Spéciales
          </Link>
          <Link
            href="/guides/essences"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            🪵 Guide des essences de bois
          </Link>
          <Link
            href="/guides/humidite"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            💧 Humidité et pouvoir calorifique (NF)
          </Link>
          <Link
            href="/guides/stockage"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            🏡 Conseils de stockage et allumage
          </Link>
          <Link
            href="/calculateurs/quantite"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-forest-800 py-2 border-b border-gray-100"
          >
            Calculateur de stères
          </Link>
          <Link
            href="/calculateurs/livraison"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-wood-800 py-2 border-b border-gray-100"
          >
            Calculateur de livraison
          </Link>
          <Link
            href="/a-propos"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-gray-800 py-2"
          >
            À propos de nous
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-gray-800 py-2"
          >
            Contactez-nous
          </Link>
          <Link
            href="/mon-compte"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-forest-800 py-2"
          >
            Mon Compte Client
          </Link>
        </div>
      )}
    </header>
  );
}
