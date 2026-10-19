import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { monthlyReportController, trendReportController } from './reports.controller';

export const reportsRouter = Router();
reportsRouter.get('/reports/monthly', requireAuth, monthlyReportController);
reportsRouter.get('/reports/trend', requireAuth, trendReportController);
