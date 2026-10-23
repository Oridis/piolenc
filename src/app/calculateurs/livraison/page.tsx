import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShippingEstimator from '@/components/ShippingEstimator';

export default function ShippingCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-wood-800">
            Logistique &amp; Délais Poids Lourd
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Calculateur de Frais et Délais de Livraison
          </h1>
          <p className="text-sm text-gray-600">
            Consultez les frais de transport par camion porteur avec hayon pour la France, la Belgique, l'Allemagne et la Suisse.
          </p>
        </div>

        <ShippingEstimator />
      </main>
      <Footer />
    </>
  );
}
