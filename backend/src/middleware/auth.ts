import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/env';
import { Unauthorized } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware to verify webhook signatures (HMAC-SHA256)
 */
export function verifyWebhookSignature(req: Request, _res: Response, next: NextFunction) {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  if (!signature || !timestamp) {
    logger.warn('Webhook signature or timestamp missing', {
      path: req.path,
      signature: !!signature,
      timestamp: !!timestamp,
    });
    return next(new Unauthorized('Missing webhook signature or timestamp'));
  }

  // Verify timestamp (must be within 5 minutes)
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (isNaN(requestTime) || now - requestTime > maxAge) {
    logger.warn('Webhook timestamp outside acceptable range', {
      requestTime,
      now,
      maxAge,
    });
    return next(new Unauthorized('Webhook timestamp outside acceptable range'));
  }

  // Reconstruct the signature
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const message = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.auth.webhookSecret)
    .update(message)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Webhook signature verification failed', {
      path: req.path,
      provided: signature.substring(0, 10) + '...',
      expected: expectedSignature.substring(0, 10) + '...',
    });
    return next(new Unauthorized('Invalid webhook signature'));
  }

  logger.debug('Webhook signature verified', {
    path: req.path,
  });

  next();
}

/**
 * Middleware to verify Bearer token
 */
export function verifyBearerToken(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid Bearer token', {
      path: req.path,
      method: req.method,
    });
    return next(new Unauthorized('Missing or invalid Bearer token'));
  }

  const token = authHeader.substring(7);

  // Store token in request for later use
  (req as any).token = token;

  next();
}
