import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { monthlyReportQuery, trendReportQuery } from './reports.schema';
import { buildReportExportData, getMonthlyReport, getTrendReport } from './reports.service';
import { createPdfReport, createXlsxReport } from './reports.export';
import { exportReportQuery } from './reports.schema';

export async function monthlyReportController(req: Request, res: Response): Promise<void> {
  const query = monthlyReportQuery.parse(req.query);
  res.status(200).json({ data: await getMonthlyReport(authenticatedUserId(req), query.month, query.year) });
}

export async function trendReportController(req: Request, res: Response): Promise<void> {
  const query = trendReportQuery.parse(req.query);
  res.status(200).json({ data: await getTrendReport(authenticatedUserId(req), query.year) });
}

export async function exportReportController(req: Request, res: Response): Promise<void> {
  const query = exportReportQuery.parse(req.query);
  const data = await buildReportExportData(authenticatedUserId(req), query.month, query.year);
  const month = String(query.month).padStart(2, '0');
  const extension = query.format === 'pdf' ? 'pdf' : 'xlsx';
  const buffer = query.format === 'pdf' ? await createPdfReport(data) : await createXlsxReport(data);
  res.setHeader('Content-Type', query.format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="FinManage_Laporan_${query.year}-${month}.${extension}"`);
  res.status(200).send(buffer);
}
