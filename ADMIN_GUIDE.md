# GUIDE D'UTILISATION DE L'ESPACE D'ADMINISTRATION — ALLO MAISON

Ce guide pratique est destiné aux administrateurs, comptables et gestionnaires logistiques pour piloter l'intégralité de l'activité commerciale quotidienne sans compétences techniques particulières.

---

## 1. Accès & Rôles Métier

L'interface d'administration est accessible sur l'URL :
```
http://localhost:3000/admin (ou https://votre-domaine.com/admin)
```

Chaque collaborateur dispose d'un rôle adapté à sa fonction :
- **Super Administrateur** : accès complet à tous les modules, secrets techniques et gestion des utilisateurs.
- **Comptable** : spécialisé dans le rapprochement des virements bancaires et l'export des écritures de ventes.
- **Gestionnaire Logistique** : gestion des transporteurs, édition des numéros d'expédition et publication des jalons de suivi.
- **Gestionnaire Commercial** : gestion des commandes, fiches produits, stocks et promotions.
- **Gestionnaire de Contenu** : mise à jour des pages d'information et des guides techniques.

---

## 2. Modifier le Nom du Site et l'Identité de Marque en 1 Clic

1. Rendez-vous dans **Personnalisation du site** (`/admin/personnalisation`).
2. Dans l'onglet **Marque & Nom du site**, modifiez le champ **Nom du site** (ex: *Bois Vosges Express* au lieu d'*Allo Maison*).
3. Modifiez si souhaité le slogan et les couleurs principales.
4. Observez la **Prévisualisation en direct** située en haut de la page.
5. Cliquez sur le bouton vert **« Enregistrer et publier »**.

> **Impact immédiat :** Le nouveau nom est instantanément déployé sur l'en-tête de navigation, le pied de page, les emails transactionnels envoyés aux clients, les pages de confirmation et les balises de référencement Google (SEO), sans toucher à une seule ligne de code. Les anciennes commandes conservent leur instantané immuable d'origine pour respecter les obligations comptables.

---

## 3. Rapprochement et Validation des Virements Bancaires

Le virement bancaire étant le moyen de règlement privilégié, la validation des encaissements s'effectue dans **Rapprochement Virements** (`/admin/virements`).

### Procédure de validation :
1. Connectez-vous sur votre espace bancaire professionnel en ligne (ex: BNP Paribas, Crédit Agricole, etc.).
2. Relevez les virements crédités du jour et notez le libellé inscrit par le client (ex: `AM-2026-1001`).
3. Dans la barre de recherche du module de rapprochement, saisissez la référence `AM-2026-1001` ou le nom du client.
4. Cliquez sur le bouton orange **« Rapprocher »**.
5. Renseignez :
   - Le montant réellement crédité en banque.
   - La date d'opération bancaire.
   - La référence de la transaction inscrite sur votre relevé (ex: `VIR SEPA DUPONT JEAN 20261023`).
   - Cochez la case **« Certifier la réception des fonds et valider le paiement »**.
6. Cliquez sur **« Enregistrer le rapprochement »**.

> **Automatisation :** Dès l'enregistrement, la commande passe automatiquement au statut *Paiement Vérifié*, un journal d'audit est créé, et l'**Email n°3 (Confirmation de réception du règlement)** est immédiatement expédié au client pour l'informer que sa palette part en préparation.

---

## 4. Gestion des Commandes & Expéditions

### Étape 1 : Préparation de commande
- Dans **Commandes** (`/admin/commandes`), retrouvez les commandes validées.
- Cliquez sur **« En préparation »** pour informer l'équipe d'entrepôt de cercler et housser les palettes. Le client reçoit l'**Email n°5 (Préparation en cours)**.

### Étape 2 : Prise en charge transporteur
- Rendez-vous dans **Livraisons & Suivi** (`/admin/livraisons`).
- Sur la commande concernée, cliquez sur **« Mettre à jour »**.
- Renseignez le transporteur (ex: Geodis Calberson) et le numéro de suivi du bordereau d'expédition (ex: `GEO-88492019FR`).
- Sélectionnez le statut **« Expédiée »** et indiquez la date estimée de livraison.
- Cliquez sur **« Enregistrer et notifier »**. Le client reçoit l'**Email n°6 (Expédition & Numéro de suivi)**.

### Étape 3 : Suivi d'acheminement & Gestion des aléas
- Lors du transit de la palette, vous pouvez ajouter un jalon (ex: *Arrivée Hub Nancy 54*, *En cours de livraison chauffeur*).
- Vous devez qualifier la **source de l'information** :
  - *Position réelle transporteur (Scan)*
  - *Dernière étape logistique confirmée (Dépôt)*
  - *Estimation calculée*
  - *Information saisie manuellement*
- En cas de météo défavorable ou de route enneigée en montagne, sélectionnez **« Livraison retardée »** : le client reçoit l'**Email n°9 (Information retard logistique)** avec les explications transparentes.

### Étape 4 : Confirmation de livraison
- Dès le bon de livraison émargé par le client, passez le statut à **« Livrée »**. Le client reçoit l'**Email n°8 (Livraison terminée & Invitation avis client)**.

---

## 5. Gestion des Stocks & Produits

1. Rendez-vous dans **Produits & Stocks** (`/admin/produits`).
2. Visualisez en un coup d'œil les stocks restants et les unités réservées par des commandes en attente de virement.
3. Les produits dont le stock descend sous 30 unités sont signalés par une alerte visuelle orange sur le tableau de bord principal.

---

## 6. Surveillance de la File d'Emails Transactionnels

1. Rendez-vous dans **Emails & Notifications** (`/admin/emails`).
2. Visualisez les 9 types d'emails envoyés, leur état (*Envoyé*, *En attente*, *Échec*) et leur date exacte d'envoi.
3. Cliquez sur **« Aperçu »** pour prévisualiser le rendu HTML exact envoyé au client.
4. En cas d'échec temporaire de votre serveur SMTP, cliquez sur **« Relancer »** pour réexpédier immédiatement la notification.

---

## 7. Export des Données Comptables (CSV)

- Dans **Commandes** (`/admin/commandes`), cliquez sur le bouton **« Exporter CSV »**.
- Le fichier CSV généré contient l'intégralité des lignes de commandes, les montants HT, les ventilations de TVA par pays (5.5%, 7%, 6%, 8.1%), les frais de transport et les coordonnées clients, prêt pour l'intégration dans votre logiciel de comptabilité (Sage, Cegid, Pennylane, etc.).
