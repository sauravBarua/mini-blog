import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});

// Docker stops containers with SIGTERM. As PID 1, Node ignores it without a handler,
// and Docker would wait 10 seconds before killing the process.
function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down');

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
