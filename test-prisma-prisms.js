const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({ log: ['query', 'error', 'warn'] });

p.$connect()
  .then(() => p.$executeRawUnsafe('PRAGMA journal_mode'))
  .then(r => { 
    // $executeRawUnsafe returns a result set, need to handle it
    console.log('Journal mode query executed');
    return p.$executeRawUnsafe('PRAGMA busy_timeout=5000');
  })
  .then(() => {
    console.log('Busy timeout set');
    return p.$executeRawUnsafe('PRAGMA journal_mode');
  })
  .then(r => {
    // r is a result, need to extract the value
    console.log('Current journal mode:', JSON.stringify(r));
    p.$disconnect();
    console.log('Done');
  })
  .catch(e => { 
    console.error('Error:', e.message); 
    p.$disconnect(); 
  });