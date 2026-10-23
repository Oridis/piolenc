'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserPlus, Mail, Key, Phone, User, ArrowRight } from 'lucide-react';

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

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-forest-100 text-forest-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Créer votre Compte Client</h1>
          <p className="text-xs text-gray-500">
            Enregistrez vos coordonnées pour commander facilement votre bois de chauffage chaque hiver.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-900 mb-1">Prénom * :</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-900 mb-1">Nom * :</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-900 mb-1">Adresse Email * :</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-900 mb-1">Numéro de téléphone * :</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-900 mb-1">Mot de passe * :</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-md"
          >
            <span>{loading ? 'Création du compte...' : 'Créer mon compte'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-gray-500 text-[11px]">
            Déjà inscrit ?{' '}
            <Link href="/connexion" className="text-forest-800 font-bold hover:underline">
              Se connecter
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
