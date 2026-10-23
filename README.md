# ALLO MAISON — Plateforme E-Commerce Spécialisée en Bois de Chauffage

Bienvenue sur la plateforme e-commerce professionnelle **Allo Maison**, conçue pour la vente, la distribution et la livraison spécialisée de bois de chauffage haute performance (bûches sèches étuvées NF H1, bûches compressées, granulés/pellets DINplus).

Conçu pour opérer en **France**, en **Belgique**, en **Allemagne** et en **Suisse**, le système gère les spécificités fiscales, les contraintes logistiques lourdes (camion porteur avec hayon et transpalette tout terrain) et le paiement sécurisé par **virement bancaire vérifiable**.

---

## 🌟 Points Forts & Architecture

1. **Expérience Client & Confiance Maximale**
   - Design chaleureux et moderne aux teintes naturelles (vert forêt, brun bois, beige chaud).
   - Calculateur de stères et volume recommandé selon la surface, l'isolation et l'appareil.
   - Calculateur instantané de frais et délais de livraison par code postal et pays.
   - Checklist des contraintes d'accès camion (19T/26T, pente, sol roulant) dès la commande.
   - Suivi en direct par jeton sécurisé aléatoire sans obligation de mot de passe.

2. **Personnalisation Totale Centralisée (Sans Développeur)**
   - Modification en 1 clic du nom du site (répercuté instantanément sur l'en-tête, le pied de page, les emails, les factures pro forma et les métadonnées SEO).
   - Modification des coordonnées bancaires officielles (IBAN, BIC, libellé).
   - Personnalisation des couleurs, textes, bannières et mentions légales.
   - Sauvegarde avec prévisualisation en direct.

3. **Paiement par Virement Bancaire & Rapprochement Comptable**
   - Génération immédiate d'un récapitulatif bancaire avec bouton de copie d'IBAN et libellé obligatoire.
   - Espace d'administration dédié « Rapprochement des virements » pour certifier la réception réelle des fonds avant déblocage de l'expédition.
   - Gestion des paiements partiels, trop-perçus et notes d'audit internes.

4. **Notifications & Moteur d'Emails Transactionnels Réellement Fonctionnel**
   - 9 modèles d'emails transactionnels responsives (Confirmation, Alerte admin, Paiement vérifié, Validation, Préparation, Expédition, Mise à jour transport, Livraison effectuée, Retard/Incident).
   - File d'attente auditable en base de données, détection des doublons par clés d'idempotence, statut d'envoi et bouton de relance administrateur en 1 clic.
   - Configuration transparente SMTP / Fournisseur externe ou Sandbox auditée.

5. **Suivi Logistique & Expéditions**
   - Chronologie en 8 étapes avec compte à rebours dynamique jusqu'à la livraison.
   - Distinction claire des sources d'information : Scan transporteur réel (API), Étape entrepôt confirmée, Estimation calculée, Information saisie.

6. **Sécurité & Contrôle d'Accès par Rôles (RBAC)**
   - Rôles métier stricts : Super Admin, Administrateur Commercial, Gestionnaire de Commandes, Gestionnaire Logistique, Comptable, Gestionnaire de Contenu.
   - Recalcul étanche de tous les totaux, remises et taxes côté serveur.
   - Journalisation immuable des actions critiques (audit logs).

---

## 🚀 Installation & Démarrage Local

### Prérequis
- Node.js version 18+ (testé avec Node.js 20 et 26)
- npm ou yarn

### 1. Cloner ou ouvrir le dossier du projet
```bash
cd piolecen
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Copiez `.env.example` vers `.env` (déjà initialisé pour SQLite local) :
```bash
cp .env.example .env
```

### 4. Initialiser la base de données & les données de démonstration
```bash
npx prisma db push
npm run db:seed
```

### 5. Lancer le serveur de développement
```bash
npm run dev
```
Rendez-vous sur [http://localhost:3000](http://localhost:3000).

---

## 🧪 Exécution des Tests Fonctionnels (22 Scénarios)

La plateforme intègre une suite de tests automatisés validant les 22 scénarios obligatoires du cahier des charges :
```bash
npm run test:scenarios
```

Résultats testés :
- Création de commande & dispatch des emails 1 & 2
- Affichage dans le tableau de bord
- Précision des coordonnées bancaires du virement
- Rapprochement bancaire réel par l'administrateur
- Notification de réception des fonds (Email 3)
- Validation et mise en préparation (Emails 4 & 5)
- Enregistrement de l'expédition et numéro de colis (Email 6)
- Ajout de jalons logistiques et mise à jour des délais (Email 7)
- Gestion des alertes retard (Email 9) et confirmation de livraison (Email 8)
- Clés d'idempotence anti-doublon et relance d'emails échoués
- Propagation instantanée du nom du site
- Recalcul serveur étanche des prix, TVA (FR 5.5%, CH 8.1%) et fret
- Imperméabilité des jetons de suivi et sécurité RBAC
- Réservation atomique des stocks

---

## 🔑 Identifiants de Démonstration (Accès Rapide 1-Clic)

| Rôle | Email | Mot de passe | Accès |
|---|---|---|---|
| **Super Administrateur** | `admin@allomaison-bois.fr` | `AdminAlloMaison2026!` | [http://localhost:3000/admin](http://localhost:3000/admin) |
| **Comptable (Virements)** | `compta@allomaison-bois.fr` | `AdminAlloMaison2026!` | [http://localhost:3000/admin/virements](http://localhost:3000/admin/virements) |
| **Logistique (Transport)**| `logistique@allomaison-bois.fr` | `AdminAlloMaison2026!` | [http://localhost:3000/admin/livraisons](http://localhost:3000/admin/livraisons) |
| **Client Démo (Jean Dupont)**| `jean.dupont@example.com` | `Client2026!` | [http://localhost:3000/mon-compte](http://localhost:3000/mon-compte) |

*Astuce : Sur la page de connexion ([/connexion](http://localhost:3000/connexion)), des boutons d'accès rapide 1-clic remplissent et soumettent automatiquement ces identifiants.*

---

## 🏗️ Structure du Projet

```
piolecen/
├── prisma/
│   └── schema.prisma         # Modèle de données complet (Commandes, Stocks, Virements, Logistique, Logs)
├── scripts/
│   ├── seed.mjs              # Peuplement du catalogue, rôles, transporteurs et commande test
│   └── test-scenarios.mjs    # Suite automatisée des 22 scénarios du cahier des charges
├── src/
│   ├── app/
│   │   ├── admin/            # Espace d'administration complet (Pilotage, Virements, Expéditions, Marque)
│   │   ├── api/              # Endpoints API sécurisés (Checkout, Rapprochement, Suivi, Paramètres)
│   │   ├── boutique/         # Catalogue et filtres par essence et longueur
│   │   ├── calculateurs/     # Calculateurs interactifs de volume et livraison
│   │   ├── commande/         # Tunnel d'achat, contraintes poids lourds et confirmation
│   │   ├── guides/           # Guides techniques (Essences, Humidité NF, Stockage)
│   │   ├── mon-compte/       # Espace client et historique
│   │   ├── produit/[slug]/   # Fiche produit détaillée avec sélection de variantes
│   │   ├── suivi/[token]/    # Page de suivi temps réel sécurisée
│   │   └── page.tsx          # Page d'accueil avec réassurance et avis clients
│   ├── components/           # Composants UI (Navbar, Footer, CartDrawer, TrustBadges, Modals)
│   ├── context/              # CartContext avec persistance et synchronisation
│   └── lib/                  # Services métier (Pricing, Email engine, Auth RBAC, Settings)
├── .env.example              # Modèle de variables d'environnement
├── package.json
└── tailwind.config.js        # Palette de couleurs personnalisée (vert forêt, bois, crème)
```
