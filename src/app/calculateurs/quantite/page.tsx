import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QuantityCalculator from '@/components/QuantityCalculator';

export default function QuantityCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
            Outil d'Aide à la Décision
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Calculateur de Quantité de Bois de Chauffage
          </h1>
          <p className="text-sm text-gray-600">
            Déterminez précisément le nombre de stères et de palettes nécessaires selon votre surface, votre appareil et votre niveau d'isolation thermique.
          </p>
        </div>

        <QuantityCalculator />
      </main>
      <Footer />
    </>
  );
}
