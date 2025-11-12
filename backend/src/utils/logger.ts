import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const customFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${ts} [${level}]: ${message} ${meta}`.trim();
});

const logger = winston.createLogger({
  level: config.app.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.logging.format === 'json' ? json() : customFormat
  ),
  defaultMeta: { service: 'nod-pos-backend' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
    }),
  ],
});

export default logger;
