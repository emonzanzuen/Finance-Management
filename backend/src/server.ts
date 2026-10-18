import { createApp } from './app';
import { loadEnv } from './config/env';
import { createLogger } from './lib/logger';
import { prisma } from './lib/prisma';

const env = loadEnv();
const logger = createLogger(env.NODE_ENV);

const app = createApp({
  nodeEnv: env.NODE_ENV,
  corsOrigins: env.CORS_ORIGINS,
  trustProxy: env.TRUST_PROXY,
});

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'FinManage API listening');
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down server gracefully');

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error while closing HTTP server');
    }
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
      process.exit(err ? 1 : 0);
    } catch (disconnectErr) {
      logger.error({ err: disconnectErr }, 'Error while disconnecting Prisma');
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
