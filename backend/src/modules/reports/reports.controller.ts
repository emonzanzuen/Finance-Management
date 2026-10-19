import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { monthlyReportQuery, trendReportQuery } from './reports.schema';
import { getMonthlyReport, getTrendReport } from './reports.service';

export async function monthlyReportController(req: Request, res: Response): Promise<void> {
  const query = monthlyReportQuery.parse(req.query);
  res.status(200).json({ data: await getMonthlyReport(authenticatedUserId(req), query.month, query.year) });
}

export async function trendReportController(req: Request, res: Response): Promise<void> {
  const query = trendReportQuery.parse(req.query);
  res.status(200).json({ data: await getTrendReport(authenticatedUserId(req), query.year) });
}
