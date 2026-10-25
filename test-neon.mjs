import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.$connect();
const products = await prisma.product.findMany({ where: { isActive: true } });
console.log('Active products:', products.length);
const settings = await prisma.siteSetting.findFirst();
console.log('Site name:', settings?.siteName);
await prisma.$disconnect();