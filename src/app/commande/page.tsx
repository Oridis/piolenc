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
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
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

      // Clear local cart
      clearCart();

      // Redirect to confirmation page with wire transfer details
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
        <main className="flex-1 py-16 px-4 max-w-xl mx-auto text-center space-y-4">
          <h1 className="text-xl font-bold">Votre panier est vide</h1>
          <p className="text-xs text-gray-500">Ajoutez des palettes de bois avant de passer commande.</p>
          <Link href="/boutique" className="inline-block px-5 py-2.5 bg-forest-800 text-white rounded-xl text-xs font-bold">
            Aller à la boutique
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-forest-100 text-forest-800 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Finalisation de votre Commande de Bois
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tunnel sécurisé : informations de livraison, contraintes d'accès camion et instructions de virement.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-xs text-red-900 font-bold">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Customer & Addresses (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Coordonnées de contact */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-black text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
                <User className="w-4 h-4 text-forest-700" />
                <span>1. Vos Coordonnées de Contact</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Prénom * :</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">Adresse Email * :</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@example.com"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Pour l'envoi de la confirmation, du RIB et du lien de suivi.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">Téléphone portable * :</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Indispensable pour la prise de rendez-vous avec le chauffeur.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Adresse de livraison */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-black text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
                <MapPin className="w-4 h-4 text-forest-700" />
                <span>2. Adresse de Livraison (Dépôt des Palettes)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-900 mb-1">Numéro et nom de rue * :</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="28 Allée des Chênes"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-900 mb-1">Complément d'adresse (facultatif) :</label>
                  <input
                    type="text"
                    value={additional}
                    onChange={(e) => setAdditional(e.target.value)}
                    placeholder="Résidence, lieudit, numéro de portail..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">Code Postal * :</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="88000"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">Ville * :</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Épinal"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-900 mb-1">Pays de livraison * :</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white font-bold"
                  >
                    <option value="FR">France 🇫🇷 (TVA 5.5% bois de chauffage)</option>
                    <option value="BE">Belgique 🇧🇪 (TVA 6%)</option>
                    <option value="DE">Allemagne 🇩🇪 (MwSt 7%)</option>
                    <option value="CH">Suisse 🇨🇭 (TVA 8.1% - Tarifs CHF)</option>
                  </select>
                </div>
              </div>

              {/* Truck Accessibility Checklist */}
              <div className="mt-4 p-4 bg-wood-50 border border-wood-200/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-wood-800" />
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-xs">
                        Contraintes d'accès camion &amp; déchargement
                      </h4>
                      <p className="text-[11px] text-gray-600">
                        Camion porteur 19T/26T avec hayon et transpalette tout terrain
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccessModalOpen(true)}
                    className="text-xs text-forest-800 font-bold underline hover:text-forest-950"
                  >
                    Modifier les critères
                  </button>
                </div>

                <div className="text-[11px] text-gray-700 space-y-1">
                  <p className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Rue accessible aux poids lourds (largeur &gt; 2.50m)</span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sol dur et carrossable (enrobé, pavé, dalle béton)</span>
                  </p>
                  {accessibility.accessInstructions && (
                    <p className="italic text-gray-500 mt-1">
                      Note chauffeur : "{accessibility.accessInstructions}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Mode de paiement - Virement bancaire */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-black text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
                <CreditCard className="w-4 h-4 text-forest-700" />
                <span>3. Mode de Règlement Sécurisé</span>
              </h2>

              <div className="p-4 bg-forest-50 border-2 border-forest-700/60 rounded-2xl flex items-start space-x-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={true}
                  readOnly
                  className="mt-1 w-4 h-4 text-forest-800 focus:ring-forest-600"
                />
                <div className="space-y-1">
                  <strong className="text-sm font-extrabold text-forest-950 block">
                    Virement Bancaire Immédiat ou SEPA
                  </strong>
                  <p className="text-gray-700 leading-relaxed">
                    Le mode de règlement privilégié pour les commandes de bois de chauffage. Aucune commission abusive, sécurité maximale de banque à banque, sans risque de fraude à la carte bancaire.
                  </p>
                  <p className="text-forest-900 font-semibold pt-1">
                    ℹ️ Les coordonnées bancaires (IBAN, BIC, libellé exact de commande) vous seront affichées dès la confirmation et envoyées par email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              Total de votre commande
            </h2>

            <div className="space-y-3 text-xs text-gray-700">
              <div className="flex justify-between items-center">
                <span>Articles ({totalItemsCount} unités)</span>
                <span className="font-bold text-gray-900">{formatPrice(subtotalTTC, country === 'CH' ? 'CHF' : 'EUR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>TVA calculée ({shippingPreview.vatRate}%)</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotalTTC - subtotalHT, country === 'CH' ? 'CHF' : 'EUR')}</span>
              </div>
              <div className="flex justify-between items-center text-forest-800">
                <span>Livraison par camion porteur</span>
                <span className="font-bold">
                  {shippingPreview.isEligibleForFreeShipping
                    ? 'OFFERTE'
                    : formatPrice(shippingPreview.shippingFeeTTC, country === 'CH' ? 'CHF' : 'EUR')}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-gray-900">Total TTC à régler</span>
                <span className="text-2xl font-black text-forest-900">
                  {formatPrice(estimatedTotal, country === 'CH' ? 'CHF' : 'EUR')}
                </span>
              </div>
            </div>

            {/* CGV Checkbox */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  required
                  checked={cgvAccepted}
                  onChange={(e) => setCgvAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-forest-700 rounded border-gray-300 focus:ring-forest-600"
                />
                <span className="text-gray-700">
                  J'ai lu et j'accepte les{' '}
                  <Link href="/cgv" target="_blank" className="text-forest-800 font-bold underline">
                    Conditions Générales de Vente
                  </Link>{' '}
                  et les conditions d'accès camion.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-forest-800 hover:bg-forest-700 disabled:bg-gray-400 text-white font-black py-4 px-4 rounded-2xl transition flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl text-sm"
            >
              <span>{isSubmitting ? 'Validation en cours...' : 'Confirmer la commande'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-gray-500 text-center space-y-1">
              <p>🔒 Vous recevrez un numéro de commande unique et le récapitulatif pour effectuer votre virement.</p>
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
