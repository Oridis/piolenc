const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({ log: ['query', 'error', 'warn'] });

p.$connect()
  .then(() => {
    console.log('Connected to database');
    return p.product.findFirst();
  })
  .then(r => {
    console.log('First product:', JSON.stringify(r, null, 2));
    return p.category.findFirst();
  })
  .then(r => {
    console.log('First category:', JSON.stringify(r, null, 2));
    p.$disconnect();
    console.log('Done');
  })
  .catch(e => {
    console.error('Error:', e.message);
    p.$disconnect().then(() => process.exit(1));
  });