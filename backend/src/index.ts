import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { config } from './config/env';
import logger from './utils/logger';
import { AppError } from './utils/errors';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes (placeholder - will be populated in Phase 1)
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not implemented', path: req.path });
  });

  // Webhook routes (placeholder - will be populated in Phase 1.2)
  app.use('/webhooks', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Webhook route not implemented', path: req.path });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  // Global error handler
  app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      logger.error(err.message, {
        statusCode: err.statusCode,
        isOperational: err.isOperational,
        stack: err.stack,
      });
      return res.status(err.statusCode).json({
        error: err.message,
        statusCode: err.statusCode,
      });
    }

    // Unexpected error
    logger.error('Unexpected error', {
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      statusCode: 500,
    });
  });

  return app;
}

// Start server
if (require.main === module) {
  const app = createApp();
  const port = config.app.port;

  app.listen(port, () => {
    logger.info(`Server started on port ${port}`, {
      environment: config.app.env,
      port,
    });
  });
}

export default createApp;
