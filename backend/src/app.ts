import cors from 'cors';
import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { createLogger } from './lib/logger';
import { serializeRequest } from './lib/logSerializers';
import { errorHandler, notFound } from './middleware/errorHandler';
import { createGlobalRateLimit } from './middleware/rateLimit';
import { requestId } from './middleware/requestId';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { profileRouter } from './modules/profile/profile.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { transactionsRouter } from './modules/transactions/transactions.routes';
import { budgetsRouter } from './modules/budgets/budgets.routes';
import { savingsRouter } from './modules/savings/savings.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { currenciesRouter } from './modules/currencies/currencies.routes';

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
        req: serializeRequest,
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  app.use(createGlobalRateLimit(options.rateLimitMax, options.rateLimitWindowMs));

  app.use('/api/v1', healthRouter);
  app.use('/api/v1', authRouter);
  app.use('/api/v1', profileRouter);
  app.use('/api/v1', categoriesRouter);
  app.use('/api/v1', transactionsRouter);
  app.use('/api/v1', budgetsRouter);
  app.use('/api/v1', savingsRouter);
  app.use('/api/v1', dashboardRouter);
  app.use('/api/v1', reportsRouter);
  app.use('/api/v1', currenciesRouter);
  if (options.extraRoutes) {
    app.use('/api/v1', options.extraRoutes);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
