import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL must be set in the environment (see .env.example).');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  // Check if tables exist
  const { rows } = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `);
  console.log('Existing tables:', rows.map(r => r.table_name));

  // Create Category table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.Category (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      imageUrl TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('Category table created');

  // Create Product table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.Product (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      shortDescription TEXT,
      description TEXT,
      images TEXT,
      species VARCHAR(255),
      woodType VARCHAR(255),
      humidityRate VARCHAR(255),
      calorificValue TEXT,
      logLength VARCHAR(255),
      unit VARCHAR(255),
      priceHT DECIMAL(10,2) NOT NULL,
      priceTTC DECIMAL(10,2) NOT NULL,
      vatRate DECIMAL(5,2) NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      reservedStock INTEGER NOT NULL DEFAULT 0,
      weightKg DECIMAL(10,2),
      volumeM3 DECIMAL(10,2),
      dimensions VARCHAR(255),
      packaging VARCHAR(255),
      isPreorderAllowed BOOLEAN NOT NULL DEFAULT false,
      allowedCountries JSONB NOT NULL DEFAULT '[]'::jsonb,
      leadTimeDays INTEGER NOT NULL DEFAULT 7,
      seoTitle VARCHAR(255),
      seoDescription TEXT,
      categoryId INTEGER REFERENCES public.Category(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('Product table created');

  // Insert categories
  await pool.query(`
    INSERT INTO public.Category (slug, name, description) VALUES 
    ('bois-chene', 'Bois de chêne', 'Chêne français sélectionné'),
    ('bois-premium', 'Bois premium', 'Premium sélectionné supérieur'),
    ('bois-hetre', 'Bois d\'hêtre', 'Hêtre français étuvé')
    ON CONFLICT (slug) DO NOTHING
  `);
  console.log('Categories inserted');

  // Get category IDs
  const { rows: cats } = await pool.query('SELECT id, slug FROM public.Category');
  const categoryMap = {};
  cats.forEach(c => categoryMap[c.slug] = c.id);

  // Insert products
  const products = [
    {
      reference: 'BOIS-CHENE-33-PAL2',
      slug: 'bois-chene-33-pal2',
      name: 'Bûches de chêne 33 cm - Palette 2 stères',
      shortDescription: 'Bûches de chêne sec, étuvé, prêt à brûler',
      description: 'Bûches de chêne de haute qualité, sèches sous 20% humidity, étuvées and prêtes à brûler. Ideal for stoves and fireplaces.',
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
      categoryId: categoryMap['bois-chene'],
    },
    {
      reference: 'BOIS-PREM-25-PAL1',
      slug: 'bois-prem-25-pal1',
      name: 'Bûches Premium 25 cm - Palette 1 stère',
      shortDescription: 'Bûches premium sélectionnées',
      description: 'Bûches premium sélectionnée supérieure, sèches sous 15% humidity, étuvées and prêtes à brûler. Qualité supérieure for poêles and cheminées.',
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
      categoryId: categoryMap['bois-premium'],
    },
    {
      reference: 'BOIS-HETRE-20-PAL2',
      slug: 'bois-hetre-20-pal2',
      name: 'Bûches d\'hêtre 20 cm - Palette 2 stères',
      shortDescription: 'Bûches d\'hêtre sec étuvé',
      description: 'Bûches d\'hêtre de qualité, sèches and étuvées, prêt à brûler.',
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
      categoryId: categoryMap['bois-hetre'],
    },
  ];

  for (const prod of products) {
    const allowedCountriesJson = JSON.stringify(prod.allowedCountries);
    await pool.query(`
      INSERT INTO public.Product (reference, slug, name, shortDescription, description, images, species, woodType, humidityRate, calorificValue, logLength, unit, priceHT, priceTTC, vatRate, stock, reservedStock, weightKg, volumeM3, dimensions, packaging, isPreorderAllowed, allowedCountries, leadTimeDays, seoTitle, seoDescription, categoryId)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
    `, [
      prod.reference,
      prod.slug,
      prod.name,
      prod.shortDescription,
      prod.description,
      prod.images,
      prod.species,
      prod.woodType,
      prod.humidityRate,
      prod.calorificValue,
      prod.logLength,
      prod.unit,
      prod.priceHT,
      prod.priceTTC,
      prod.vatRate,
      prod.stock,
      prod.reservedStock,
      prod.weightKg,
      prod.volumeM3,
      prod.dimensions,
      prod.packaging,
      prod.isPreorderAllowed,
      allowedCountriesJson,
      prod.leadTimeDays,
      prod.seoTitle,
      prod.seoDescription,
      prod.categoryId,
    ]);
    console.log('Created product:', prod.name);
  }

  // Insert site settings
  await pool.query(`
    INSERT INTO public.SiteSetting (id, siteName, slogan, companyName, companyAddress, companyPhone, companyEmail, companySiret, companyVatNumber, bankName, bankBeneficiary, bankIban, bankBic, bankTransferDeadlineDays, bankInstructions, supportedCountries, supportedCurrencies, defaultCurrency, activeLanguages, seoTitle)
    VALUES ('default-settings', 'piolencboisdirect', 'Votre spécialiste du bois de chauffage premium', 'Piolenc Bois Direct SAS', '14 Rue des Scieries, 88200 Remiremont, France', '+33 (0)3 29 00 12 34', 'contact@woodmachine-bois.fr', '892 341 982 00019', 'FR 34 892341982', 'BNP Paribas France', 'Piolenc Bois Direct SAS', 'FR76 3000 4012 3400 0123 4567 890', 'BNPAFRPP', 5, 'Veuillez indiquer impérativement votre référence de commande dans le libellé de votre virement bancaire pour un traitement sous 24h ouvrées.', ['FR','DE','BE','CH'], ['EUR','CHF'], 'EUR', ['fr','de','nl'], 'piolencboisdirect | Bois de chauffage sec, étuvé et certifié livré chez vous')
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('Site settings inserted');

  console.log('\n✅ Database seeded successfully');
  await pool.end();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});