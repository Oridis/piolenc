import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QuantityCalculator from '@/components/QuantityCalculator';

export default function QuantityCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 font-sans bg-ivory py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-secondaryText">
            Outil d&apos;aide à la décision
          </span>
          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Calculateur de volume de bois de chauffage
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText leading-relaxed">
            Déterminez précisément le cubage en stères et le nombre de palettes nécessaires selon votre surface, votre équipement et votre isolation thermique.
          </p>
        </div>

        <QuantityCalculator />
      </main>
      <Footer />
    </>
  );
}
