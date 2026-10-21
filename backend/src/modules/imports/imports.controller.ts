import type { Request, Response } from 'express';
import { AppError } from '../../lib/errors';
import { authenticatedUserId } from '../../middleware/auth';
import { importCommitSchema } from './imports.schema';
import { commitTransactionsImport, importSpec, makeImportTemplate, previewTransactionsImport } from './imports.service';

export async function getImportSpecController(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: importSpec });
}

export async function getImportTemplateController(_req: Request, res: Response): Promise<void> {
  const buffer = await makeImportTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="FinManage_Template_Import.xlsx"');
  res.status(200).send(buffer);
}

export async function previewTransactionsImportController(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new AppError('VALIDATION_ERROR', 400, 'File Excel wajib dipilih.');
  const data = await previewTransactionsImport(authenticatedUserId(req), req.file.buffer);
  res.status(200).json({ data });
}

export async function commitTransactionsImportController(req: Request, res: Response): Promise<void> {
  const input = importCommitSchema.parse(req.body);
  const data = await commitTransactionsImport(authenticatedUserId(req), input);
  res.status(201).json({ data });
}
