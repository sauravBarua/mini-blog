import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url?.startsWith('/health') ?? false,
  },
});
