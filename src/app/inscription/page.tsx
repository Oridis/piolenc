'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de compte');
      }

      router.push('/mon-compte');
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
            <UserPlus className="w-5 h-5" />
          </div>
          <h1 className="font-poppins font-semibold text-2xl text-primaryText tracking-tight">Créer votre compte client</h1>
          <p className="text-xs text-secondaryText">
            Enregistrez vos coordonnées pour commander facilement votre bois de chauffage et suivre vos livraisons.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-statusError font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-primaryText mb-1">Prénom * :</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-primaryText mb-1">Nom * :</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-primaryText mb-1">Adresse email * :</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@example.com"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-primaryText mb-1">Numéro de téléphone * :</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-primaryText mb-1">Mot de passe * :</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="input-field text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs inline-flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Création du compte...' : 'Créer mon compte'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="pt-1 text-center text-secondaryText text-[11px]">
            Déjà inscrit ?{' '}
            <Link href="/connexion" className="text-forest hover:underline font-medium">
              Se connecter
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
