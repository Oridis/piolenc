import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTables() {
  // Create Category table using raw SQL
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS public.Category (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    imageUrl TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  
  // Create Product table using raw SQL
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS public.Product (
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
  )`;
  
  console.log('Tables created successfully');
  await prisma.$disconnect();
}

createTables().catch(e => {
  console.error('Error creating tables:', e);
  process.exit(1);
});