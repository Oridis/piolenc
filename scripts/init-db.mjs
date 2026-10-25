import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Read DATABASE_URL from env
const envPath = path.resolve('./.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

console.log('🔧 Initialisation de la base de données...\n');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL non trouvé dans .env');
  process.exit(1);
}

console.log(`📍 DATABASE_URL: ${databaseUrl}`);

// Vérifier la version de la base et forcer reset si nécessaire
console.log('🔄 Vérification et réinitialisation de la base de données...');
try {
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  console.log('✅ Base de données réinitialisée');
} catch (err) {
  console.error('❌ Échec de la migration:', err.message);
  process.exit(1);
}

// Lancer le seed
console.log('🌱 Lancement du seed de démonstration...');
try {
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Seed terminé');
} catch (err) {
  console.error('❌ Échec du seed:', err.message);
  process.exit(1);
}

console.log('\n✅ Initialisation terminée !');
console.log('   Vous pouvez lancer l\'application avec : npm run dev');