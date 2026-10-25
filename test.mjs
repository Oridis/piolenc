import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.$connect().then(() => prisma.product.findMany({ where: { isActive: true } })).then(products => { console.log('Active products:', products.length); }).catch(e => console.error('Error:', e.message)).finally(() => prisma.$disconnect());