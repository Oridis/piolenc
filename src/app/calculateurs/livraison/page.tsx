import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShippingEstimator from '@/components/ShippingEstimator';

export default function ShippingCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Logistique &amp; Transport spécialisé
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Calculateur des frais et délais d&apos;acheminement
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Consultez les frais de transport par camion porteur avec hayon élévateur pour la France métropolitaine, la Belgique, l&apos;Allemagne et la Suisse.
          </p>
        </div>

        <ShippingEstimator />
      </main>
      <Footer />
    </>
  );
}
