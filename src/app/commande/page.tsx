'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice, calculateShippingFee } from '@/lib/pricing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DeliveryAccessModal from '@/components/DeliveryAccessModal';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  AlertTriangle,
  Lock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  User,
  Info,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalTTC, subtotalHT, totalItemsCount, clearCart } = useCart();

  // Customer Contact Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Shipping Address
  const [street, setStreet] = useState('');
  const [additional, setAdditional] = useState('');
  const [postalCode, setPostalCode] = useState('75008');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('FR');

  // Billing address
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingStreet, setBillingStreet] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('FR');

  // Truck Accessibility Checklist
  const [accessibility, setAccessibility] = useState({
    heavyTruckAccessible: true,
    requiresTailgate: true,
    hasTurningArea: true,
    steepSlope: false,
    accessInstructions: '',
  });
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Delivery slot & Customer notes
  const [requestedSlot, setRequestedSlot] = useState('Matinée (8h00 - 12h00)');
  const [customerNotes, setCustomerNotes] = useState('');
  const [cgvAccepted, setCgvAccepted] = useState(false);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server-like shipping estimation preview
  const shippingPreview = calculateShippingFee(
    {
      countryCode: country,
      postalCode,
      itemsCount: totalItemsCount,
      totalWeightKg: totalItemsCount * 900,
      difficultAccess: accessibility.steepSlope || !accessibility.heavyTruckAccessible,
    },
    subtotalTTC
  );

  const estimatedTotal = Number((subtotalTTC + shippingPreview.shippingFeeTTC).toFixed(2));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cgvAccepted) {
      setErrorMessage('Veuillez accepter les Conditions Générales de Vente pour valider votre commande.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Votre panier est vide.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer: {
          firstName,
          lastName,
          email,
          phone,
        },
        shippingAddress: {
          firstName,
          lastName,
          street,
          additional,
          postalCode,
          city,
          country,
          phone,
        },
        billingAddress: sameAsShipping
          ? {
              firstName,
              lastName,
              street,
              additional,
              postalCode,
              city,
              country,
              phone,
            }
          : {
              firstName,
              lastName,
              street: billingStreet,
              postalCode: billingPostalCode,
              city: billingCity,
              country: billingCountry,
              phone,
            },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          name: i.name,
        })),
        accessibility,
        requestedDeliverySlot: requestedSlot,
        customerNotes,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la commande');
      }

      clearCart();
      router.push(`/commande/confirmation/${data.orderNumber}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Une erreur est survenue lors de la validation.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="flex-1 font-sans bg-ivory py-16 px-4 max-w-md mx-auto text-center space-y-4">
          <div className="bg-white p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-3">
            <h1 className="font-poppins font-medium text-lg text-primaryText">Votre panier est vide</h1>
            <p className="text-xs text-secondaryText">Ajoutez des palettes de bois avant de passer commande.</p>
            <div className="pt-2">
              <Link href="/boutique" className="btn-primary text-xs">
                Accéder à la boutique
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 font-sans bg-ivory py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-md bg-ivory border border-subtleBorder flex items-center justify-center text-forest">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-primaryText tracking-tight">
              Finalisation de votre commande
            </h1>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Tunnel sécurisé : informations de livraison, contraintes d&apos;accès camion et coordonnées de virement bancaire.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-statusError font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Customer & Addresses (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Contact Information */}
            <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs">
              <h2 className="font-poppins font-medium text-sm text-primaryText flex items-center space-x-2 border-b border-subtleBorder pb-3">
                <User className="w-4 h-4 text-forest" />
                <span>1. Vos coordonnées de contact</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <span className="text-[10px] text-secondaryText mt-1 block">
                    Pour la confirmation de commande, le RIB et le lien de suivi.
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-primaryText mb-1">Téléphone mobile * :</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="input-field text-xs"
                  />
                  <span className="text-[10px] text-secondaryText mt-1 block">
                    Nécessaire pour le contact préalable du chauffeur transporteur.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs">
              <h2 className="font-poppins font-medium text-sm text-primaryText flex items-center space-x-2 border-b border-subtleBorder pb-3">
                <MapPin className="w-4 h-4 text-forest" />
                <span>2. Adresse de livraison (dépôt des palettes)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-primaryText mb-1">Numéro et voie * :</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="28 Allée des Chênes"
                    className="input-field text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-primaryText mb-1">Complément d&apos;adresse (facultatif) :</label>
                  <input
                    type="text"
                    value={additional}
                    onChange={(e) => setAdditional(e.target.value)}
                    placeholder="Résidence, lieudit, numéro de portail..."
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-primaryText mb-1">Code postal * :</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="88000"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-primaryText mb-1">Commune * :</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Épinal"
                    className="input-field text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-primaryText mb-1">Pays de destination * :</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-field text-xs bg-white font-medium"
                  >
                    <option value="FR">France (TVA 5.5% biocombustibles)</option>
                    <option value="BE">Belgique (TVA 6%)</option>
                    <option value="DE">Allemagne (MwSt 7%)</option>
                    <option value="CH">Suisse (TVA 8.1% - Tarifs en CHF)</option>
                  </select>
                </div>
              </div>

              {/* Truck Accessibility Checklist */}
              <div className="mt-4 p-4 bg-ivory border border-subtleBorder rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2.5">
                    <Truck className="w-4 h-4 text-forest" />
                    <div>
                      <h4 className="font-poppins font-medium text-primaryText text-xs">
                        Contraintes d&apos;accès camion &amp; déchargement
                      </h4>
                      <p className="text-[11px] text-secondaryText">
                        Camion porteur 19T/26T avec hayon élévateur et transpalette
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccessModalOpen(true)}
                    className="text-xs text-forest hover:underline font-medium"
                  >
                    Modifier les critères
                  </button>
                </div>

                <div className="text-[11px] text-secondaryText space-y-1">
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-statusSuccess shrink-0" />
                    <span>Rue accessible aux poids lourds (largeur &gt; 2.50 m)</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-statusSuccess shrink-0" />
                    <span>Sol dur et carrossable (enrobé, dalle béton, sol stabilisé)</span>
                  </p>
                  {accessibility.accessInstructions && (
                    <p className="italic text-primaryText mt-1">
                      Note chauffeur : &ldquo;{accessibility.accessInstructions}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white p-6 rounded-xl border border-subtleBorder shadow-subtle space-y-4 text-xs">
              <h2 className="font-poppins font-medium text-sm text-primaryText flex items-center space-x-2 border-b border-subtleBorder pb-3">
                <CreditCard className="w-4 h-4 text-forest" />
                <span>3. Mode de règlement sécurisé</span>
              </h2>

              <div className="p-4 bg-ivory border border-forest/60 rounded-lg flex items-start space-x-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={true}
                  readOnly
                  className="mt-1 w-4 h-4 text-forest focus:ring-forest"
                />
                <div className="space-y-1">
                  <strong className="font-poppins font-medium text-primaryText text-xs block">
                    Virement bancaire direct (SEPA / National)
                  </strong>
                  <p className="text-secondaryText leading-relaxed">
                    Mode de règlement privilégié pour les approvisionnements en biocombustibles. Traçabilité complète de compte à compte, sans intermédiaire ni risque d&apos;interception de coordonnées bancaires.
                  </p>
                  <p className="text-forest text-[11px] pt-1 flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5" />
                    <span>Les coordonnées bancaires (IBAN, BIC et référence structurée) vous seront présentées immédiatement après validation.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-subtleBorder shadow-subtle p-6 space-y-5">
            <h2 className="font-poppins font-medium text-xs text-secondaryText uppercase tracking-wider border-b border-subtleBorder pb-3">
              Total de votre commande
            </h2>

            <div className="space-y-2.5 text-xs text-secondaryText">
              <div className="flex justify-between items-center">
                <span>Articles ({totalItemsCount} unités)</span>
                <span className="font-medium text-primaryText">{formatPrice(subtotalTTC, country === 'CH' ? 'CHF' : 'EUR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>TVA ({shippingPreview.vatRate}%)</span>
                <span className="font-medium text-primaryText">{formatPrice(subtotalTTC - subtotalHT, country === 'CH' ? 'CHF' : 'EUR')}</span>
              </div>
              <div className="flex justify-between items-center text-forest">
                <span>Livraison par camion avec hayon</span>
                <span className="font-medium">
                  {shippingPreview.isEligibleForFreeShipping
                    ? 'OFFERTE'
                    : formatPrice(shippingPreview.shippingFeeTTC, country === 'CH' ? 'CHF' : 'EUR')}
                </span>
              </div>

              <div className="border-t border-subtleBorder pt-3 flex justify-between items-baseline">
                <span className="font-poppins font-medium text-sm text-primaryText">Total TTC à régler</span>
                <span className="font-poppins font-semibold text-2xl text-primaryText">
                  {formatPrice(estimatedTotal, country === 'CH' ? 'CHF' : 'EUR')}
                </span>
              </div>
            </div>

            {/* CGV Checkbox */}
            <div className="p-3 bg-ivory rounded-lg border border-subtleBorder">
              <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  required
                  checked={cgvAccepted}
                  onChange={(e) => setCgvAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-forest rounded border-subtleBorder focus:ring-forest"
                />
                <span className="text-secondaryText">
                  J&apos;ai pris connaissance et j&apos;accepte les{' '}
                  <Link href="/cgv" target="_blank" className="text-forest hover:underline font-medium">
                    Conditions Générales de Vente
                  </Link>{' '}
                  ainsi que les conditions de dépose camion.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-xs inline-flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Validation en cours...' : 'Confirmer ma commande'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-[11px] text-secondaryText text-center space-y-1">
              <p className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                <span>Validation sécurisée avec référence structurée unique</span>
              </p>
            </div>
          </div>
        </form>
      </main>

      <DeliveryAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        accessibility={accessibility}
        onChange={setAccessibility}
      />

      <Footer />
    </>
  );
}
