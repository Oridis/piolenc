import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Create categories
  await prisma.category.createMany({
    data: [
      { slug: 'bois-chene', name: 'Bois de chêne', description: 'Chêne français sélectionné' },
      { slug: 'bois-premium', name: 'Bois premium', description: 'Premium sélectionné supérieur' },
      { slug: 'bois-hetre', name: 'Bois d\'hêtre', description: 'Hêtre français étuvé' }
    ],
    skipDuplicates: true
  });

  // Get created categories
  const categories = {
    boisChene: await prisma.category.findUnique({ where: { slug: 'bois-chene' } }),
    boisPremium: await prisma.category.findUnique({ where: { slug: 'bois-premium' } }),
    boisHêtre: await prisma.category.findUnique({ where: { slug: 'bois-hetre' } }),
  };

  // Create products
  const products = [
    {
      reference: 'BOIS-CHENE-33-PAL2',
      slug: 'bois-chene-33-pal2',
      name: 'Bûches de chêne 33 cm - Palette 2 stères',
      shortDescription: 'Bûches de chêne sec, étuvé, prêt à brûler',
      description: 'Bûches de chêne de haute qualité, sèches sous 20% d\'humidité, étuvées et prêtes à brûler. Idéal pour les poêles et cheminées.',
      images: '/images/products/bois-chene-33-pal2-1.webp',
      species: 'Chêne',
      woodType: 'Bois dur (Groupe 1)',
      humidityRate: '< 20% (Bois sec prêt à brûler)',
      calorificValue: '4.2 kWh/kg (env. 2000 kWh/stère)',
      logLength: '33 cm',
      unit: 'Palette 2 stères',
      priceHT: 327.54,
      priceTTC: 345.55,
      vatRate: 5.5,
      stock: 100,
      reservedStock: 0,
      weightKg: 900.0,
      volumeM3: 1.8,
      dimensions: '100 x 120 x 160 cm',
      packaging: 'Palette filmée et houssée',
      isPreorderAllowed: false,
      allowedCountries: ['FR','DE','BE','CH'],
      leadTimeDays: 4,
      seoTitle: 'Bûches de chêne premium',
      seoDescription: 'Bûches de chêne sec et étuvé',
      categoryId: categories.boisChene.id,
    },
    {
      reference: 'BOIS-PREM-25-PAL1',
      slug: 'bois-prem-25-pal1',
      name: 'Bûches Premium 25 cm - Palette 1 stère',
      shortDescription: 'Bûches premium sélectionnées',
      description: 'Bûches premium sélectionnée supérieure, sèches sous 15% d\'humidité, étuvées et prêtes à brûler. Qualité supérieure pour poêles et cheminées.',
      images: '/images/products/bois-prem-25-pal1-1.webp',
      species: 'Mélange essences',
      woodType: 'Bois dur (Groupe 1)',
      humidityRate: '< 15% (Bois sec extra sec)',
      calorificValue: '4.5 kWh/kg (env. 2100 kWh/stère)',
      logLength: '25 cm',
      unit: 'Palette 1 stère',
      priceHT: 397.16,
      priceTTC: 419.00,
      vatRate: 5.5,
      stock: 50,
      reservedStock: 0,
      weightKg: 900.0,
      volumeM3: 1.8,
      dimensions: '100 x 120 x 160 cm',
      packaging: 'Palette filmée et houssée',
      isPreorderAllowed: false,
      allowedCountries: ['FR','DE','BE','CH'],
      leadTimeDays: 4,
      seoTitle: 'Bûches Premium',
      seoDescription: 'Bûches premium sélectionnée supérieure',
      categoryId: categories.boisPremium.id,
    },
    {
      reference: 'BOIS-HETRE-20-PAL2',
      slug: 'bois-hetre-20-pal2',
      name: 'Bûches d\'hêtre 20 cm - Palette 2 stères',
      shortDescription: 'Bûches d\'hêtre sec étuvé',
      description: 'Bûches d\'hêtre de qualité, sèches et étuvées, prêt à brûler.',
      images: '/images/products/bois-hetre-20-pal2-1.webp',
      species: 'Hêtre',
      woodType: 'Bois dur (Groupe 1)',
      humidityRate: '< 20%',
      calorificValue: '4.3 kWh/kg',
      logLength: '20 cm',
      unit: 'Palette 2 stères',
      priceHT: 362.46,
      priceTTC: 382.40,
      vatRate: 5.5,
      stock: 80,
      reservedStock: 0,
      weightKg: 900.0,
      volumeM3: 1.8,
      dimensions: '100 x 120 x 160 cm',
      packaging: 'Palette filmée et houssée',
      isPreorderAllowed: false,
      allowedCountries: ['FR','DE','BE','CH'],
      leadTimeDays: 4,
      seoTitle: 'Bûches d\'hêtre',
      seoDescription: 'Bûches d\'hêtre sec et étuvé',
      categoryId: categories.boisHêtre.id,
    },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
    console.log('Created product:', prod.name, '-', prod.reference);
  }

  // Seed default site settings
  await prisma.siteSetting.upsert({
    where: { id: 'default-settings' },
    update: {
      siteName: 'piolencboisdirect',
      slogan: 'Votre spécialiste du bois de chauffage premium',
      companyName: 'Piolenc Bois Direct SAS',
      companyAddress: '14 Rue des Scieries, 88200 Remiremont, France',
      companyPhone: '+33 (0)3 29 00 12 34',
      companyEmail: 'contact@woodmachine-bois.fr',
      companySiret: '892 341 982 00019',
      companyVatNumber: 'FR 34 892341982',
      bankName: 'BNP Paribas France',
      bankBeneficiary: 'Piolenc Bois Direct SAS',
      bankIban: 'FR76 3000 4012 3400 0123 4567 890',
      bankBic: 'BNPAFRPP',
      bankTransferDeadlineDays: 5,
      bankInstructions: 'Veuillez indiquer impérativement votre référence de commande dans le libellé de votre virement bancaire pour un traitement sous 24h ouvrées.',
      supportedCountries: ['FR','DE','BE','CH'],
      supportedCurrencies: ['EUR','CHF'],
      defaultCurrency: 'EUR',
      activeLanguages: ['fr','de','nl'],
      seoTitle: 'piolencboisdirect | Bois de chauffage sec, étuvé et certifié livré chez vous',
    },
    create: {
      siteName: 'piolencboisdirect',
      slogan: 'Votre spécialiste du bois de chauffage premium',
      companyName: 'Piolenc Bois Direct SAS',
      companyAddress: '14 Rue des Scieries, 88200 Remiremont, France',
      companyPhone: '+33 (0)3 29 00 12 34',
      companyEmail: 'contact@woodmachine-bois.fr',
      companySiret: '892 341 982 00019',
      companyVatNumber: 'FR 34 892341982',
      bankName: 'BNP Paribas France',
      bankBeneficiary: 'Piolenc Bois Direct SAS',
      bankIban: 'FR76 3000 4012 3400 0123 4567 890',
      bankBic: 'BNPAFRPP',
      bankTransferDeadlineDays: 5,
      bankInstructions: 'Veuillez indiquer impérativement votre référence de commande dans le libellé de votre virement bancaire pour un traitement sous 24h ouvrées.',
      supportedCountries: ['FR','DE','BE','CH'],
      supportedCurrencies: ['EUR','CHF'],
      defaultCurrency: 'EUR',
      activeLanguages: ['fr','de','nl'],
      seoTitle: 'piolencboisdirect | Bois de chauffage sec, étuvé et certifié livré chez vous',
    },
  });

  console.log('\n✅ Database seeded with', products.length, 'products');
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(' seeding error:', e);
  process.exit(1);
});