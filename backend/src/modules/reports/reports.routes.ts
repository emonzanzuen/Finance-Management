import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { exportReportController, monthlyReportController, trendReportController } from './reports.controller';
import { createUserRateLimit } from '../../middleware/rateLimit';

export const reportsRouter = Router();
reportsRouter.get('/reports/monthly', requireAuth, monthlyReportController);
reportsRouter.get('/reports/trend', requireAuth, trendReportController);
reportsRouter.get('/reports/export', requireAuth, createUserRateLimit(20, 60 * 60_000), exportReportController);
