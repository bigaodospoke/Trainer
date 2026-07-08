import { PrismaClient } from '@prisma/client';

/**
 * Singleton do Prisma Client.
 * Em dev, o Next.js recarrega modulos a cada request (HMR) — sem isso,
 * cada reload abriria uma nova conexao com o Postgres ate esgotar o pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
