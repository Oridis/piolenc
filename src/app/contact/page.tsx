'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Demande de devis / renseignement livraison');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 w-full">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Assistance &amp; Service Commercial
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-primaryText tracking-tight">
            Contactez notre Équipe
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText max-w-2xl mx-auto">
            Une question sur une essence, un accès camion difficile ou le suivi de votre virement ? Nos conseillers vous répondent sous 24h.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coordinates Info (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-xl border border-subtleBorder shadow-subtle space-y-6 text-xs">
            <h2 className="text-sm font-bold font-heading text-primaryText uppercase tracking-wider border-b border-subtleBorder pb-3">
              Coordonnées Directes
            </h2>

            <div className="space-y-5 text-secondaryText">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-forest-100 text-forest-800 rounded-lg shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-primaryText block font-semibold text-sm">Téléphone</strong>
                  <a href="tel:+33329001234" className="text-forest-700 font-semibold hover:underline">
                    +33 (0)3 29 00 12 34
                  </a>
                  <p className="text-[11px] text-secondaryText mt-0.5">Appel non surtaxé</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-forest-100 text-forest-800 rounded-lg shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-primaryText block font-semibold text-sm">Email</strong>
                  <a href="mailto:contact@woodmachine-bois.fr" className="text-forest-700 font-semibold hover:underline">
                    contact@woodmachine-bois.fr
                  </a>
                  <p className="text-[11px] text-secondaryText mt-0.5">Réponse rapide sous 24h ouvrées</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-forest-100 text-forest-800 rounded-lg shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-primaryText block font-semibold text-sm">Siège &amp; Dépôt Central</strong>
                  <p className="text-secondaryText leading-relaxed">14 Rue des Scieries<br />88200 Remiremont, France</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-forest-100 text-forest-800 rounded-lg shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-primaryText block font-semibold text-sm">Horaires d'ouverture</strong>
                  <p className="text-secondaryText leading-relaxed">Du Lundi au Vendredi : 8h00 - 19h00<br />Samedi : 8h30 - 13h00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-subtleBorder shadow-subtle text-xs">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-heading text-primaryText">Message envoyé avec succès</h3>
                <p className="text-secondaryText max-w-sm mx-auto leading-relaxed">
                  Merci {name}, notre équipe commerciale vous recontactera par email ou téléphone dans les plus brefs délais.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 btn-secondary text-xs"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Votre Nom &amp; Prénom * :</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primaryText mb-1">Votre Numéro de Téléphone :</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Votre Adresse Email * :</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@example.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Objet de votre demande :</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-primaryText mb-1">Votre Message :</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Précisez votre demande, votre code postal ou vos questions d'accès..."
                    className="input-field"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer ma demande</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
