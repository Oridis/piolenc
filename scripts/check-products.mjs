import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.$connect();
const products = await prisma.product.findMany({});
console.log('Products count:', products.length);
products.forEach(p => console.log('-', p.id, p.name, p.reference));
await prisma.$disconnect();