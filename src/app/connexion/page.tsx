'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, Mail, Key, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
      </main>

      <Footer />
    </>
  );
}
