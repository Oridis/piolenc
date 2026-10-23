# CHECKLIST DE MISE EN PRODUCTION — ALLO MAISON

Ce document recense les étapes obligatoires, les contrôles techniques et les services externes à configurer avant d'ouvrir la plateforme aux commandes réelles de clients.

---

## 1. Services Externes à Configurer

### A. Base de Données PostgreSQL
- [ ] Provisionner une instance PostgreSQL managée (Supabase, AWS RDS, Neon, Scaleway ou OVHcloud).
- [ ] Configurer la variable d'environnement `DATABASE_URL` :
  ```env
  DATABASE_URL="postgresql://user:password@host:5432/allomaison_prod?sslmode=require"
  ```
- [ ] Dans `prisma/schema.prisma`, changer `provider = "sqlite"` par `provider = "postgresql"`.
- [ ] Déployer les migrations versionnées avec `npx prisma migrate deploy`.

### B. Service d'Envoi d'Emails Transactionnels
- [ ] Souscrire un compte chez un fournisseur réputé : SendGrid, Resend, Brevo (ex-Sendinblue) ou Amazon SES.
- [ ] **Validation du Nom de Domaine & Délivrabilité :**
  - Configurer les enregistrements DNS **SPF** : `v=spf1 include:... ~all`
  - Configurer les clés de signature cryptographique **DKIM** fournies par votre prestataire.
  - Configurer la politique **DMARC** : `v=DMARC1; p=quarantine; rua=mailto:dmarc@allomaison-bois.fr`
- [ ] Renseigner les identifiants SMTP dans les variables d'environnement ou directement dans l'administration (`/admin/personnalisation` -> onglet *Configuration Emails*) :
  - `SMTP_HOST`
  - `SMTP_PORT` (587 ou 465)
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `SMTP_FROM`

### C. Coordonnées Bancaires Officielles (Virement)
- [ ] Renseigner l'IBAN et le BIC définitifs du compte bancaire professionnel de l'entreprise.
- [ ] Vérifier que le nom exact du bénéficiaire correspond au libellé Kbis de la société.
- [ ] Tester un virement pilote de 1€ pour valider le délai de crédit et l'apparition de la référence de commande sur votre extrait de compte en ligne.

### D. Transporteurs & Fret Poids Lourd
- [ ] Valider les contrats transporteurs régionaux et nationaux (Geodis Calberson, Dachser, Schenker, Heppner).
- [ ] Vérifier les grilles tarifaires au code postal pour les zones de montagne et les îles (supplément d'accès restreint).
- [ ] Activer si souhaité les webhooks ou clés API transporteur pour la remontée automatique des scans de livraison.

---

## 2. Contrôles Juridiques & Fiscaux

- [ ] **Vérification des Taux de TVA Bois Énergie :**
  - France : 5,5% sur le bois énergie combustible (Art. 278-0 bis du CGI) et 20% sur les accessoires.
  - Belgique : 6% taux réduit bois de chauffage.
  - Allemagne : 7% Ermäßigter Steuersatz.
  - Suisse : 8,1% TVA fédérale standard, facturation en Francs Suisses (CHF) sans TVA intracommunautaire.
- [ ] **Informations Légales :**
  - Renseigner le numéro de SIRET définitif et le numéro de TVA intracommunautaire dans `/admin/personnalisation`.
  - Vérifier la conformité des CGV et du droit de rétractation spécifique au bois de chauffage.

---

## 3. Sécurité & Clés Secrètes

- [ ] Générer une clé secrète forte pour les sessions JWT :
  ```bash
  openssl rand -base64 48
  ```
- [ ] Définir `NEXTAUTH_SECRET` avec cette valeur sur le serveur de production.
- [ ] Modifier immédiatement les mots de passe par défaut de tous les comptes administratifs (`admin@allomaison-bois.fr`, `compta@allomaison-bois.fr`, etc.).
- [ ] Forcer HTTPS avec certificat SSL/TLS valide (Let's Encrypt ou Cloudflare).
- [ ] Vérifier que les en-têtes HTTP de sécurité sont actifs (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

---

## 4. Checklist Avant Lancement Public

1. [ ] Passer une commande de test complète avec un compte client externe.
2. [ ] Vérifier la bonne réception de l'Email n°1 (Client) et de l'Email n°2 (Administrateur).
3. [ ] Vérifier la clarté des coordonnées bancaires affichées sur mobile et ordinateur.
4. [ ] Se connecter avec le compte comptable et réaliser le rapprochement bancaire de test.
5. [ ] Vérifier la bonne réception de l'Email n°3 (Paiement vérifié).
6. [ ] Mettre à jour l'expédition avec un numéro de suivi réel et vérifier l'affichage sur la page de suivi client (`/suivi/[token]`).
7. [ ] Simuler la mise à jour des étapes et confirmer la livraison (Email n°8).
8. [ ] Tester l'export CSV des commandes pour s'assurer de la compatibilité avec le logiciel de comptabilité.
9. [ ] Effectuer une sauvegarde complète de la base de données.
10. [ ] Valider l'ouverture officielle de la boutique en ligne !
