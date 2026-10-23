'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError('');
    setLoading(true);

    const emailToSend = loginEmail || email;
    const passwordToSend = loginPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, password: passwordToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      if (data.user.role === 'CUSTOMER') {
        router.push('/mon-compte');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-forest-100 text-forest-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Connexion à votre Espace</h1>
          <p className="text-xs text-gray-500">
            Accédez à vos commandes de bois, factures et suivi de livraison en direct.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-gray-900 mb-1">Adresse Email :</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@example.com"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-900 mb-1">Mot de passe :</label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-md"
          >
            <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-gray-500 text-[11px]">
            Pas encore de compte client ?{' '}
            <Link href="/inscription" className="text-forest-800 font-bold hover:underline">
              Créer un compte
            </Link>
          </div>
        </form>

        {/* 1-Click Fast Demo Credentials for Evaluation */}
        <div className="bg-wood-50 p-5 rounded-2xl border border-wood-200 text-xs space-y-3">
          <span className="font-extrabold text-wood-900 uppercase tracking-wider block text-[10px]">
            Accès Démo 1-Clic pour Test Fonctionnel
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLogin('admin@allomaison-bois.fr', 'AdminAlloMaison2026!')}
              className="p-2 bg-white rounded-xl border border-wood-200 hover:border-forest-600 text-left font-bold text-forest-950 transition"
            >
              👑 Super Admin
              <span className="block text-[10px] text-gray-500 font-normal">Accès total backoffice</span>
            </button>
            <button
              type="button"
              onClick={() => handleLogin('compta@allomaison-bois.fr', 'AdminAlloMaison2026!')}
              className="p-2 bg-white rounded-xl border border-wood-200 hover:border-forest-600 text-left font-bold text-amber-950 transition"
            >
              💳 Comptable
              <span className="block text-[10px] text-gray-500 font-normal">Rapprochement virements</span>
            </button>
            <button
              type="button"
              onClick={() => handleLogin('logistique@allomaison-bois.fr', 'AdminAlloMaison2026!')}
              className="p-2 bg-white rounded-xl border border-wood-200 hover:border-forest-600 text-left font-bold text-blue-950 transition"
            >
              🚚 Logistique
              <span className="block text-[10px] text-gray-500 font-normal">Expéditions &amp; jalons</span>
            </button>
            <button
              type="button"
              onClick={() => handleLogin('jean.dupont@example.com', 'Client2026!')}
              className="p-2 bg-white rounded-xl border border-wood-200 hover:border-forest-600 text-left font-bold text-gray-900 transition"
            >
              👤 Client Démo
              <span className="block text-[10px] text-gray-500 font-normal">Jean Dupont</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
