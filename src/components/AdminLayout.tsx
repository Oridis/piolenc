'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  Paintbrush,
  Mail,
  Users,
  ShieldAlert,
  FileText,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Flame,
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
    { name: 'Rapprochement Virements', href: '/admin/virements', icon: CreditCard, highlight: true },
    { name: 'Produits & Stocks', href: '/admin/produits', icon: Package },
    { name: 'Livraisons & Suivi', href: '/admin/livraisons', icon: Truck },
    { name: 'Personnalisation du site', href: '/admin/personnalisation', icon: Paintbrush },
    { name: 'Emails & Notifications', href: '/admin/emails', icon: Mail },
    { name: 'Clients', href: '/admin/clients', icon: Users },
    { name: 'Utilisateurs & Rôles', href: '/admin/utilisateurs', icon: ShieldAlert },
    { name: 'Journal d\'audit', href: '/admin/audit', icon: FileText },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/connexion');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-forest-950 text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-forest-900 bg-forest-900/60">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500 rounded-lg text-forest-950 font-black">
              <Flame className="w-5 h-5 fill-forest-950" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base block tracking-tight">
                Allo Maison Backoffice
              </span>
              <span className="text-[10px] text-forest-300 block uppercase font-bold tracking-wider">
                E-Commerce Bois
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-forest-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-forest-800 text-amber-400 shadow-sm'
                    : 'text-forest-200 hover:bg-forest-900 hover:text-white'
                } ${item.highlight && !isActive ? 'text-amber-300' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
                {item.highlight && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer & Storefront link */}
        <div className="p-4 border-t border-forest-900 bg-forest-950/90 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center space-x-2 w-full py-2 px-3 bg-forest-900 hover:bg-forest-800 text-forest-100 rounded-xl text-xs font-medium transition border border-forest-800"
          >
            <span>Voir le site public</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs truncate mr-2">
              <p className="font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-forest-400 truncate">{userRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-forest-300 hover:text-red-400 rounded-lg hover:bg-forest-900 transition"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
            <span>Administration</span>
            <span>/</span>
            <span className="text-gray-900 font-bold capitalize">
              {pathname.split('/')[2] || 'Tableau de bord'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              ● Système opérationnel
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
