// Server-only Prisma initialization

let prisma: any;

if (process.env.NEXT_RUNTIME === 'nodejs') {
  // Dynamically require PrismaClient only in Node.js server runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  prisma = (global as any).prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') {
    (global as any).prisma = prisma;
  }
} else {
  // Browser or edge runtime – provide placeholder
  prisma = {} as any;
}

export { prisma };
