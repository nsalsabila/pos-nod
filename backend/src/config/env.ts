import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/nod_pos_dev',
    testUrl: process.env.DATABASE_URL_TEST || 'postgresql://localhost:5432/nod_pos_test',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    webhookSecret: process.env.WEBHOOK_SECRET || 'webhook-secret',
  },
  payments: {
    xendit: {
      apiKey: process.env.XENDIT_API_KEY || '',
    },
    stripe: {
      apiKey: process.env.STRIPE_API_KEY || '',
    },
    adyen: {
      apiKey: process.env.ADYEN_API_KEY || '',
    },
  },
  communications: {
    whatsapp: {
      apiToken: process.env.WHATSAPP_API_TOKEN || '',
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '',
    },
  },
  logging: {
    format: process.env.LOG_FORMAT || 'json',
    output: process.env.LOG_OUTPUT || 'console',
  },
  features: {
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enableRealtimeSync: process.env.ENABLE_REAL_TIME_SYNC === 'true',
  },
};
