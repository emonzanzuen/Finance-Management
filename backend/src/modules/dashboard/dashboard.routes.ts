import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { dashboardSummaryController } from './dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.get('/dashboard/summary', requireAuth, dashboardSummaryController);
