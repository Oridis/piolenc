import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Allo Maison firewood database...');

  // 1. Site Settings
  await prisma.siteSetting.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      siteName: 'Allo Maison',
      slogan: 'Votre spécialiste du bois de chauffage haute performance & étuvé',
      logoUrl: '/logo.svg',
      faviconUrl: '/favicon.ico',
      emailLogoUrl: '/email-logo.png',
      primaryColor: '#14532d',
      secondaryColor: '#7c4a2d',
      accentColor: '#ea580c',
      fontFamily: 'Inter, system-ui, sans-serif',
      companyName: 'Allo Maison Distribution SAS',
      companySiret: '892 341 982 00019',
      companyVatNumber: 'FR 34 892341982',
      companyAddress: '14 Rue des Scieries, 88200 Remiremont, France',
      companyPhone: '+33 (0)3 29 00 12 34',
      companyEmail: 'contact@allomaison-bois.fr',
      supportHours: 'Du Lundi au Vendredi de 8h00 à 19h00, Samedi de 8h30 à 13h00',
      bankName: 'BNP Paribas France',
      bankBeneficiary: 'ALLO MAISON DISTRIBUTION SAS',
      bankIban: 'FR76 3000 4012 3400 0123 4567 890',
      bankBic: 'BNPAFRPP',
      bankTransferDeadlineDays: 5,
      bankInstructions:
        'Veuillez indiquer impérativement votre référence de commande dans le libellé de votre virement bancaire pour validation et expédition sous 24h ouvrées.',
      supportedCountries: JSON.stringify(['FR', 'DE', 'BE', 'CH']),
      supportedCurrencies: JSON.stringify(['EUR', 'CHF']),
      defaultCurrency: 'EUR',
      activeLanguages: JSON.stringify(['fr', 'de', 'nl']),
      freeShippingThreshold: 650.0,
      emailProvider: 'log',
      adminNotificationEmail: 'commandes@allomaison-bois.fr',
      isPublished: true,
      cgvText: `Conditions Générales de Vente (CGV) - Allo Maison Distribution SAS au capital de 50 000€.
1. Objet : Les présentes CGV régissent la vente de bois de chauffage conditionné sur le site Allo Maison.
2. Prix et Taxes : Les prix sont indiqués en Euros ou Francs Suisses toutes taxes comprises selon le pays de destination. Taux de TVA réduit bois énergie de 5.5% en France, 7% en Allemagne, 6% en Belgique, 8.1% en Suisse.
3. Modalités de Paiement : Le moyen de règlement exclusif et sécurisé est le virement bancaire. La commande n'est validée et préparée qu'après confirmation effective du crédit bancaire.
4. Livraison : La livraison est effectuée par camion porteur 19T/26T avec hayon élévateur et transpalette. L'acheteur s'engage à vérifier l'accessibilité de son domicile.`,
      privacyPolicyText: `Politique de Confidentialité et RGPD - Allo Maison s'engage à protéger les données personnelles de ses clients.
Les informations collectées (nom, adresse, téléphone, email) sont exclusivement réservées au traitement, à la facturation et à la livraison de vos commandes. Aucune donnée n'est cédée à des tiers à des fins publicitaires.`,
      cookiePolicyText: `Politique de Gestion des Cookies - Le site Allo Maison utilise des cookies techniques strictement indispensables au fonctionnement du panier et à la sécurisation des sessions d'administration.`,
      legalMentionsText: `Mentions Légales : Allo Maison Distribution SAS. Siège social : 14 Rue des Scieries, 88200 Remiremont, France. RCS Epinal 892 341 982. Directeur de la publication : Direction Générale Allo Maison. Hébergeur : Infrastructure Cloud Sécurisée.`,
      deliveryPolicyText: `Modalités et Charte de Livraison :
- Livraison par camion porteur 19T à 26T équipé d'un hayon élévateur et transpalette tout terrain.
- Prise de rendez-vous téléphonique par le transporteur sous 48h après expédition.
- Dépose de la palette sur sol dur, plan et stabilisé (bitume, dalle, béton). Pas de roulage sur pelouse ou pente > 8%.`,
    },
  });

  // 2. Admin & User Accounts
  const adminPasswordHash = await bcrypt.hash('AdminAlloMaison2026!', 10);
  const clientPasswordHash = await bcrypt.hash('Client2026!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@allomaison-bois.fr' },
    update: {},
    create: {
      email: 'admin@allomaison-bois.fr',
      passwordHash: adminPasswordHash,
      firstName: 'Marc',
      lastName: 'Dubois',
      phone: '+33 6 12 34 56 78',
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'commercial@allomaison-bois.fr' },
    update: {},
    create: {
      email: 'commercial@allomaison-bois.fr',
      passwordHash: adminPasswordHash,
      firstName: 'Sophie',
      lastName: 'Laurent',
      phone: '+33 6 98 76 54 32',
      role: 'COMMERCIAL_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'logistique@allomaison-bois.fr' },
    update: {},
    create: {
      email: 'logistique@allomaison-bois.fr',
      passwordHash: adminPasswordHash,
      firstName: 'Thomas',
      lastName: 'Moreau',
      phone: '+33 6 55 44 33 22',
      role: 'LOGISTICS_MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'compta@allomaison-bois.fr' },
    update: {},
    create: {
      email: 'compta@allomaison-bois.fr',
      passwordHash: adminPasswordHash,
      firstName: 'Claire',
      lastName: 'Bertrand',
      phone: '+33 6 11 22 33 44',
      role: 'ACCOUNTANT',
    },
  });

  const testCustomer = await prisma.user.upsert({
    where: { email: 'jean.dupont@example.com' },
    update: {},
    create: {
      email: 'jean.dupont@example.com',
      passwordHash: clientPasswordHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33 6 45 67 89 01',
      role: 'CUSTOMER',
    },
  });

  // 3. Categories
  const catEtuv = await prisma.category.upsert({
    where: { slug: 'bois-etuve-sec' },
    update: {},
    create: {
      slug: 'bois-etuve-sec',
      name: 'Bois Sec Étuvé NF H1 (< 20%)',
      description: 'Bois de chauffage dur séché en séchoir biomasse. Allumage immédiat, zéro fumée, rendement calorifique maximal.',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      displayOrder: 1,
    },
  });

  const catTradi = await prisma.category.upsert({
    where: { slug: 'buches-traditionnelles' },
    update: {},
    create: {
      slug: 'buches-traditionnelles',
      name: 'Bûches Traditionnelles en Palette',
      description: 'Bûches de chêne, charme et hêtre fendues et empilées sur palette cerclée et houssée.',
      imageUrl: 'https://images.unsplash.com/photo-1520114878144-6123749968dd?w=800&auto=format&fit=crop&q=80',
      displayOrder: 2,
    },
  });

  const catDensifie = await prisma.category.upsert({
    where: { slug: 'buches-densifiees' },
    update: {},
    create: {
      slug: 'buches-densifiees',
      name: 'Bûches Compressées & Densifiées',
      description: 'Sciure de bois dur recyclée sous haute pression sans aucun liant chimique. Très haute densité énergétique.',
      imageUrl: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=800&auto=format&fit=crop&q=80',
      displayOrder: 3,
    },
  });

  const catPellets = await prisma.category.upsert({
    where: { slug: 'granules-pellets' },
    update: {},
    create: {
      slug: 'granules-pellets',
      name: 'Granulés & Pellets de Bois DINplus',
      description: 'Pellets 100% résineux certifiés DINplus / ENplus A1 pour poêles et chaudières automatiques.',
      imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=800&auto=format&fit=crop&q=80',
      displayOrder: 4,
    },
  });

  // 4. Products
  const prod1 = await prisma.product.upsert({
    where: { reference: 'BOIS-ETUV-33-PAL2' },
    update: {},
    create: {
      reference: 'BOIS-ETUV-33-PAL2',
      slug: 'palette-bois-sec-etuve-33cm-2-steres',
      name: 'Palette 2 stères Bois Sec Étuvé 33 cm (Chêne, Hêtre, Charme)',
      shortDescription: 'La référence n°1 des poêles à bois : bûches de 33 cm séchées en étuve sous 20% d\'humidité, prêtes à l\'emploi.',
      description: `Notre palette de bois de chauffage sec étuvé en bûches de 33 cm est composée d'un mélange de bois durs de groupe 1 (Chêne, Hêtre, Charme).
Passé en séchoir biomasse haute température pendant 48 heures, ce bois affiche un taux d'humidité garanti inférieur à 20% à cœur.
Il garantit un allumage rapide, un pouvoir calorifique optimal d'environ 2 000 kWh par stère et évite l'encrassement de la vitre de votre poêle ou de votre conduit de fumée.

Conditionnement :
Palette de 1,40 m³ de bois soigneusement rangé, correspondant exactement à 2 stères de bois en vrac. Housse étanche de protection contre la pluie.
Livraison avec hayon élévateur et transpalette tout-terrain devant votre garage.`,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1520114878144-6123749968dd?w=1000&auto=format&fit=crop&q=80',
      ]),
      species: 'Chêne, Hêtre, Charme',
      woodType: 'Bois dur (Groupe 1)',
      humidityRate: '< 18% (NF Bois de Chauffage H1)',
      calorificValue: '4.3 kWh / kg (~ 2 050 kWh / stère)',
      logLength: '33 cm',
      unit: 'Palette 2 stères (~1.4 m³ rangé)',
      priceHT: 321.33,
      priceTTC: 339.00,
      vatRate: 5.5,
      promoPrice: 319.00,
      stock: 45,
      weightKg: 880.0,
      volumeM3: 1.4,
      dimensions: '100 x 120 x 155 cm',
      packaging: 'Palette bois perdue filmée et coiffée',
      allowedCountries: JSON.stringify(['FR', 'DE', 'BE', 'CH']),
      leadTimeDays: 4,
      categoryId: catEtuv.id,
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { reference: 'BOIS-ETUV-25-PAL2' },
    update: {},
    create: {
      reference: 'BOIS-ETUV-25-PAL2',
      slug: 'palette-bois-sec-etuve-25cm-2-steres',
      name: 'Palette 2 stères Bois Sec Étuvé 25 cm (Chêne & Charme)',
      shortDescription: 'Idéal petits foyers et inserts étroits : bûches courtes de 25 cm séchées à cœur < 20%.',
      description: `Format idéal pour les poêles à bois de petite taille ou suspendus nécessitant des bûches de 25 cm.
Bois dur de qualité supérieure séché en étuve industrielle, écorcé et propre sans poussière excessive.
Allumage vif et combustion prolongée sans projections d'escarbilles.`,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520114878144-6123749968dd?w=1000&auto=format&fit=crop&q=80',
      ]),
      species: 'Chêne & Charme',
      woodType: 'Bois dur (Groupe 1)',
      humidityRate: '< 18% (NF Bois de Chauffage H1)',
      calorificValue: '4.4 kWh / kg',
      logLength: '25 cm',
      unit: 'Palette 2 stères (~1.2 m³ rangé)',
      priceHT: 340.28,
      priceTTC: 359.00,
      vatRate: 5.5,
      stock: 28,
      weightKg: 850.0,
      volumeM3: 1.2,
      dimensions: '100 x 120 x 140 cm',
      packaging: 'Palette filmée avec coiffe étanche',
      allowedCountries: JSON.stringify(['FR', 'DE', 'BE', 'CH']),
      leadTimeDays: 4,
      categoryId: catEtuv.id,
    },
  });

  const prod3 = await prisma.product.upsert({
    where: { reference: 'BOIS-CHENE-50-PAL15' },
    update: {},
    create: {
      reference: 'BOIS-CHENE-50-PAL15',
      slug: 'palette-100-chene-50cm-2-steres',
      name: 'Palette 2 stères 100% Chêne dur 50 cm',
      shortDescription: 'Grandes bûches de 50 cm pour foyers ouverts et grands inserts. Braises intenses et longue durée.',
      description: `Bûches de chêne fendu de 50 cm coupées avec précision. Idéal pour les cheminées traditionnelles et les grands poêles chauffant de grands volumes.
Chêne français issu de forêts des Vosges et de Franche-Comté.`,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80',
      ]),
      species: '100% Chêne de pays',
      woodType: 'Bois dur',
      humidityRate: '< 20% (Sec prêt à brûler)',
      calorificValue: '4.2 kWh / kg',
      logLength: '50 cm',
      unit: 'Palette 2 stères (~1.6 m³ rangé)',
      priceHT: 298.58,
      priceTTC: 315.00,
      vatRate: 5.5,
      stock: 35,
      weightKg: 950.0,
      volumeM3: 1.6,
      dimensions: '100 x 120 x 170 cm',
      packaging: 'Palette cerclée',
      allowedCountries: JSON.stringify(['FR', 'DE', 'BE', 'CH']),
      leadTimeDays: 4,
      categoryId: catTradi.id,
    },
  });

  const prod4 = await prisma.product.upsert({
    where: { reference: 'PELLET-DINPLUS-1T' },
    update: {},
    create: {
      reference: 'PELLET-DINPLUS-1T',
      slug: 'palette-granules-pellets-dinplus-66-sacs',
      name: 'Palette 66 sacs de 15 kg Granulés de Bois Résineux DINplus (990 kg)',
      shortDescription: 'Pellets premium 100% résineux naturel, faible teneur en cendres (<0.5%), rendement maximal.',
      description: `Pellets de bois certifiés DINplus et ENplus A1. Fabriqués exclusivement à partir de sciure de conifères sans aucun additif chimique.
Taux de cendre ultra-faible pour préserver votre creuset et réduire le nettoyage.`,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=1000&auto=format&fit=crop&q=80',
      ]),
      species: '100% Résineux (Épicéa / Pin)',
      woodType: 'Granulés de bois compressés',
      humidityRate: '< 8%',
      calorificValue: '≥ 4.9 kWh / kg',
      logLength: 'Pellets 6 mm',
      unit: 'Palette 66 sacs de 15 kg (990 kg)',
      priceHT: 397.16,
      priceTTC: 419.00,
      vatRate: 5.5,
      stock: 60,
      weightKg: 990.0,
      volumeM3: 1.3,
      dimensions: '100 x 120 x 160 cm',
      packaging: 'Palette houssée étanche',
      allowedCountries: JSON.stringify(['FR', 'DE', 'BE', 'CH']),
      leadTimeDays: 3,
      categoryId: catPellets.id,
    },
  });

  // 5. Carriers
  const carrierGeodis = await prisma.carrier.upsert({
    where: { code: 'GEODIS' },
    update: {},
    create: {
      code: 'GEODIS',
      name: 'Geodis Calberson Distribution',
      trackingUrlTemplate: 'https://mon.geodis.com/suivi/{trackingNumber}',
      contactPhone: '0892 05 05 05',
    },
  });

  const carrierDachser = await prisma.carrier.upsert({
    where: { code: 'DACHSER' },
    update: {},
    create: {
      code: 'DACHSER',
      name: 'Dachser European Logistics',
      trackingUrlTemplate: 'https://tracking.dachser.com/search?order={trackingNumber}',
      contactPhone: '+49 831 5916 0',
    },
  });

  // 6. Discount Codes
  await prisma.discountCode.upsert({
    where: { code: 'BIENVENUE10' },
    update: {},
    create: {
      code: 'BIENVENUE10',
      discountAmount: 10.0,
      minOrderAmount: 300.0,
      isActive: true,
    },
  });

  await prisma.discountCode.upsert({
    where: { code: 'HIVER2026' },
    update: {},
    create: {
      code: 'HIVER2026',
      discountPercent: 5.0,
      minOrderAmount: 600.0,
      isActive: true,
    },
  });

  // 7. Seed Sample Order with Complete Wire Transfer Lifecycle
  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber: 'AM-2026-1001' },
  });

  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'AM-2026-1001',
        secureToken: 'tok_live_78942a0b81c2',
        userId: testCustomer.id,
        customerEmail: 'jean.dupont@example.com',
        customerPhone: '+33 6 45 67 89 01',
        customerFirstName: 'Jean',
        customerLastName: 'Dupont',
        siteSnapshot: JSON.stringify({
          siteName: 'Allo Maison',
          companyName: 'Allo Maison Distribution SAS',
          bankIban: 'FR76 3000 4012 3400 0123 4567 890',
          bankBic: 'BNPAFRPP',
          bankBeneficiary: 'ALLO MAISON DISTRIBUTION SAS',
        }),
        shippingAddress: JSON.stringify({
          firstName: 'Jean',
          lastName: 'Dupont',
          street: '28 Allée des Chênes',
          postalCode: '88000',
          city: 'Épinal',
          country: 'FR',
          phone: '+33 6 45 67 89 01',
        }),
        billingAddress: JSON.stringify({
          firstName: 'Jean',
          lastName: 'Dupont',
          street: '28 Allée des Chênes',
          postalCode: '88000',
          city: 'Épinal',
          country: 'FR',
          phone: '+33 6 45 67 89 01',
        }),
        subtotalHT: 302.37,
        subtotalTTC: 319.00,
        vatTotal: 16.63,
        shippingFee: 49.00,
        discountTotal: 0.0,
        totalAmount: 368.00,
        currency: 'EUR',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PENDING_TRANSFER',
        fulfillmentStatus: 'ORDER_CREATED',
        accessibilityInfo: JSON.stringify({
          heavyTruckAccessible: true,
          requiresTailgate: true,
          hasTurningArea: true,
          steepSlope: false,
          accessInstructions: 'Portail noir automatique, sonner à Dupont.',
        }),
        requestedDeliverySlot: 'Matinée 8h-12h',
        items: {
          create: [
            {
              productId: prod1.id,
              productName: prod1.name,
              productRef: prod1.reference,
              unitPriceHT: 302.37,
              unitPriceTTC: 319.00,
              quantity: 1,
              totalHT: 302.37,
              totalTTC: 319.00,
              snapshot: JSON.stringify({
                species: prod1.species,
                logLength: prod1.logLength,
                humidityRate: prod1.humidityRate,
                packaging: prod1.packaging,
              }),
            },
          ],
        },
        paymentRecords: {
          create: [
            {
              expectedAmount: 368.00,
              receivedAmount: 0.0,
              notes: 'En attente de réception du virement bancaire libellé AM-2026-1001.',
              isVerified: false,
            },
          ],
        },
        deliveryShipment: {
          create: {
            carrierId: carrierGeodis.id,
            trackingNumber: 'GEO-88492019FR',
            carrierTrackingUrl: 'https://mon.geodis.com/suivi/GEO-88492019FR',
            currentStage: 'PREPARATION',
            estimatedDeliveryDate: new Date(Date.now() + 4 * 86400000),
            trackingEvents: {
              create: [
                {
                  status: 'Commande enregistrée',
                  sourceType: 'WAREHOUSE_CONFIRMED',
                  location: 'Dépôt Central Remiremont (88)',
                  description: 'Votre commande a été prise en compte et attend le virement bancaire.',
                  occurredAt: new Date(),
                },
              ],
            },
          },
        },
        emailLogs: {
          create: [
            {
              templateId: 1,
              recipientEmail: 'jean.dupont@example.com',
              subject: 'Confirmation de votre commande AM-2026-1001 - Allo Maison',
              status: 'SENT',
              idempotencyKey: 'email-1-AM-2026-1001-init',
              sentAt: new Date(),
            },
            {
              templateId: 2,
              recipientEmail: 'commandes@allomaison-bois.fr',
              subject: '[NOUVELLE COMMANDE] AM-2026-1001 (368.00 EUR) - Dupont',
              status: 'SENT',
              idempotencyKey: 'email-2-AM-2026-1001-admin',
              sentAt: new Date(),
            },
          ],
        },
      },
    });

    console.log(`✅ Sample order ${order.orderNumber} created with tracking token ${order.secureToken}`);
  }

  // 8. Reviews
  await prisma.customerReview.create({
    data: {
      productId: prod1.id,
      authorName: 'Michel V.',
      authorCity: 'Colmar (68)',
      rating: 5,
      comment: 'Bois d\'une qualité exceptionnelle ! Le taux d\'humidité mesuré avec mon testeur personnel était de 16%. Démarrage au quart de tour dans mon poêle Hase. Chauffeur très pro avec le transpalette dans ma cour.',
      isVerifiedBuyer: true,
      isApproved: true,
    },
  });

  await prisma.customerReview.create({
    data: {
      productId: prod1.id,
      authorName: 'Éric D.',
      authorCity: 'Bruxelles (BE)',
      rating: 5,
      comment: 'Livraison en Belgique en 4 jours chrono. Les palettes sont très bien filmées, le bois est propre sans moisissure. Virement sans accroc.',
      isVerifiedBuyer: true,
      isApproved: true,
    },
  });

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
