import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { dashboardQuery } from './dashboard.schema';
import { getDashboardSummary } from './dashboard.service';

export async function dashboardSummaryController(req: Request, res: Response): Promise<void> {
  const query = dashboardQuery.parse(req.query);
  res.status(200).json({ data: await getDashboardSummary(authenticatedUserId(req), query.month, query.year) });
}
