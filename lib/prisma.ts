import { PrismaClient } from '@prisma/client'

// 1. Define the global type to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 2. Export the prisma instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors in production to keep build logs clean
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // ADD THIS: It tells Prisma to wait for the first query before connecting
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma