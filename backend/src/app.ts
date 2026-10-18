import cors from 'cors';
import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { createLogger } from './lib/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { createGlobalRateLimit } from './middleware/rateLimit';
import { requestId } from './middleware/requestId';
import { healthRouter } from './modules/health/health.routes';

export interface CreateAppOptions {
  nodeEnv?: 'development' | 'test' | 'production';
  corsOrigins?: string[];
  trustProxy?: number;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  extraRoutes?: Router;
}

/**
 * Builds the Express application without calling `.listen()` so it can be
 * tested directly with Supertest.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const nodeEnv = options.nodeEnv ?? 'development';
  const corsOrigins = options.corsOrigins ?? [];
  const trustProxy = options.trustProxy ?? 1;

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);

  app.use(requestId);
  app.use(helmet());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Non-browser or same-origin requests without an Origin header are allowed.
        if (!origin) {
          callback(null, true);
          return;
        }
        // Empty allowlist means cross-origin browser requests are not allowed.
        if (corsOrigins.length > 0 && corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: false,
    }),
  );

  const logger = createLogger(nodeEnv);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = res.getHeader('X-Request-Id');
        return typeof existing === 'string' ? existing : String(req.id ?? '');
      },
      // Never log request/response bodies.
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  app.use(createGlobalRateLimit(options.rateLimitMax, options.rateLimitWindowMs));

  app.use('/api/v1', healthRouter);
  if (options.extraRoutes) {
    app.use('/api/v1', options.extraRoutes);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
