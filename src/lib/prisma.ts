import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const prism = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Database health check on startup
  // Runs a lightweight query to verify the SQLite database is accessible
  // This helps catch issues like DATABASE_URL pointing to an empty database file
  ;(async () => {
    try {
      await prism.$executeRawUnsafe('SELECT 1') as Prisma.Sql
      // eslint-disable-next-line no-console
      console.log('✅ Database health check passed: SQLite database is accessible')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('⚠️ Database health check failed:', error instanceof Error ? error.message : String(error))
      // Re-throw in development to prevent silent failures
      if (process.env.NODE_ENV === 'development') {
        throw error
      }
    }
  })()

  return prism
}

export const prisma =
  global.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
