import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Log database connection events
prisma.$on('error', (err) => {
  logger.error('Database error', {
    message: err.message,
    code: err.code,
  });
});

prisma.$on('warn', (err) => {
  logger.warn('Database warning', {
    message: err.message,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connection');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
