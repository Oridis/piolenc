'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, Mail, Key, ArrowRight, ShieldCheck, CreditCard, Truck, User } from 'lucide-react';

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

      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-white border border-subtleBorder text-forest rounded-lg flex items-center justify-center mx-auto shadow-subtle">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-poppins font-semibold text-2xl text-primaryText tracking-tight">Connexion à votre espace</h1>
          <p className="text-xs text-secondaryText">
            Accédez à vos commandes de bois, factures et suivi de livraison en direct.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-statusError font-medium">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs"
        >
          <div>
            <label className="block font-medium text-primaryText mb-1">Adresse email :</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-secondaryText absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@example.com"
                className="input-field pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-primaryText mb-1">Mot de passe :</label>
            <div className="relative">
              <Key className="w-4 h-4 text-secondaryText absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-9 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs inline-flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="pt-1 text-center text-secondaryText text-[11px]">
            Pas encore de compte client ?{' '}
            <Link href="/inscription" className="text-forest hover:underline font-medium">
              Créer un compte
            </Link>
          </div>
        </form>

        {/* 1-Click Fast Demo Credentials */}
        <div className="bg-white p-5 rounded-xl border border-subtleBorder text-xs space-y-3">
          <span className="font-poppins font-medium text-secondaryText uppercase tracking-wider block text-[10px]">
            Accès de test rapide (1-clic)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLogin('admin@woodmachine-bois.fr', 'Password123!')}
              className="p-2.5 bg-ivory rounded-lg border border-subtleBorder hover:border-forest text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-primaryText">
                <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                <span>Super Admin</span>
              </div>
              <span className="block text-[10px] text-secondaryText mt-0.5">Accès backoffice</span>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('compta@woodmachine-bois.fr', 'Password123!')}
              className="p-2.5 bg-ivory rounded-lg border border-subtleBorder hover:border-forest text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-primaryText">
                <CreditCard className="w-3.5 h-3.5 text-forest" />
                <span>Comptable</span>
              </div>
              <span className="block text-[10px] text-secondaryText mt-0.5">Rapprochement</span>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('logistique@woodmachine-bois.fr', 'Password123!')}
              className="p-2.5 bg-ivory rounded-lg border border-subtleBorder hover:border-forest text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-primaryText">
                <Truck className="w-3.5 h-3.5 text-forest" />
                <span>Logistique</span>
              </div>
              <span className="block text-[10px] text-secondaryText mt-0.5">Jalons &amp; suivi</span>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('jean.dupont@example.com', 'Password123!')}
              className="p-2.5 bg-ivory rounded-lg border border-subtleBorder hover:border-forest text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-primaryText">
                <User className="w-3.5 h-3.5 text-forest" />
                <span>Client Démo</span>
              </div>
              <span className="block text-[10px] text-secondaryText mt-0.5">Jean Dupont</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
