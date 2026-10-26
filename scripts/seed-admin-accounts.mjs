/**
 * Provisionnement des comptes de démonstration.
 *
 * Constat d'audit : la base ne contenait AUCUN utilisateur alors que la page
 * /connexion propose des boutons d'accès rapide et que le README documente des
 * identifiants. Résultat : le backoffice (validation des virements, expéditions,
 * catalogue) était inaccessible et le parcours marchand impossible.
 *
 * Ce script crée (ou met à jour) les comptes attendus par l'interface.
 * Les mots de passe sont volontairement ceux des boutons d'accès rapide :
 * ils DOIVENT être changés avant toute mise en production.
 *
 *   node scripts/seed-admin-accounts.mjs
 */
// Le client Prisma charge lui-même la variable DATABASE_URL depuis .env.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'Password123!';

const ACCOUNTS = [
  {
    email: 'admin@woodmachine-bois.fr',
    role: 'SUPER_ADMIN',
    firstName: 'Marc',
    lastName: 'Dubois',
    phone: '0612345678',
  },
  {
    email: 'compta@woodmachine-bois.fr',
    role: 'ACCOUNTANT',
    firstName: 'Sophie',
    lastName: 'Bertrand',
    phone: '0612345679',
  },
  {
    email: 'logistique@woodmachine-bois.fr',
    role: 'LOGISTICS_MANAGER',
    firstName: 'Thomas',
    lastName: 'Moreau',
    phone: '0612345680',
  },
  {
    email: 'jean.dupont@example.com',
    role: 'CUSTOMER',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0612345681',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const account of ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { role: account.role, isActive: true },
      create: { ...account, passwordHash, isActive: true },
    });
    console.log(`✔ ${user.email} (${user.role})`);
  }

  console.log(
    `\n${ACCOUNTS.length} comptes disponibles. Mot de passe de démonstration : ${DEMO_PASSWORD}\n` +
      'À changer impérativement avant mise en production (les identifiants de démo sont publics dans le code client).'
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
