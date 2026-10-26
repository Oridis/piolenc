import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.$connect();
const products = await prisma.$queryRaw`SELECT id, name, reference FROM "Product"`;
console.log(products);
await prisma.$disconnect();