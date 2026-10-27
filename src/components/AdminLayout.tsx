'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  Truck,
  Paintbrush,
  Mail,
  Users,
  ShieldAlert,
  FileText,
  UserCog,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
}

export default function AdminLayout({
  children,
  userRole = 'SUPER_ADMIN',
  userName = 'Administrateur',
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    { name: 'Commandes', href: '/admin/commandes', icon: ShoppingBag },
    { name: 'Virements bancaires', href: '/admin/virements', icon: CreditCard },
    { name: 'Catalogue & Stocks', href: '/admin/produits', icon: Package },
    { name: 'Catégories', href: '/admin/categories', icon: Layers },
    { name: 'Suivi logistique', href: '/admin/livraisons', icon: Truck },
    { name: 'Personnalisation du site', href: '/admin/personnalisation', icon: Paintbrush },
    { name: 'Notifications & Emails', href: '/admin/emails', icon: Mail },
    { name: 'Comptes clients', href: '/admin/clients', icon: Users },
    { name: 'Équipe & Permissions', href: '/admin/utilisateurs', icon: ShieldAlert },
    { name: 'Journal d\'audit', href: '/admin/audit', icon: FileText },
    { name: 'Mon compte', href: '/admin/mon-compte', icon: UserCog },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/connexion');
  };

  return (
    <div className="min-h-screen bg-ivory flex font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primaryText/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-forest-dark text-white flex flex-col border-r border-forest-secondary/30 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-forest-secondary/30">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <Flame className="w-6 h-6 text-beige shrink-0 fill-beige/20" />
            <div>
              <span className="font-poppins font-semibold text-sm text-white block leading-tight">
                Gestion Commerciale
              </span>
              <span className="text-[10px] text-ivory/60 block">
                Bois &amp; Biomasse
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-ivory/70 hover:text-white"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-forest text-white'
                    : 'text-ivory/80 hover:bg-forest/50 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-ivory/80" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer & Storefront link */}
        <div className="p-4 border-t border-forest-secondary/30 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-forest/40 hover:bg-forest text-ivory rounded-md text-xs font-medium transition-colors border border-forest-secondary/40"
          >
            <span>Boutique publique</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/admin/mon-compte"
              onClick={() => setSidebarOpen(false)}
              className="text-xs truncate mr-2 hover:opacity-80 transition-opacity"
              title="Modifier mon e-mail et mon mot de passe"
            >
              <p className="font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] text-ivory/60 truncate">{userRole}</p>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-ivory/70 hover:text-statusError rounded-md transition-colors"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-subtleBorder flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-secondaryText hover:text-primaryText rounded-md"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-xs text-secondaryText">
            <span>Portail de gestion</span>
            <span>/</span>
            <span className="text-primaryText font-medium capitalize">
              {pathname.split('/')[2] || 'Tableau de bord'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="badge-success">
              <CheckCircle2 className="w-3 h-3" />
              <span>Système connecté</span>
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
