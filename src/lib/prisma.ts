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
  // Runs a lightweight query to verify the database is reachable.
  // `$executeRaw*` rejects statements that return rows, so a SELECT has to go
  // through `$queryRaw*`.
  void (async () => {
    try {
      await prism.$queryRawUnsafe('SELECT 1')
      console.log('[db] health check passed')
    } catch (error) {
      console.error(
        '[db] health check failed:',
        error instanceof Error ? error.message : String(error)
      )
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
