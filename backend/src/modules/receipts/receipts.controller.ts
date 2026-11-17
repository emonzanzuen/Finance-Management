import type { Request, Response } from 'express';
import { AppError } from '../../lib/errors';
import { authenticatedUserId } from '../../middleware/auth';
import type { ReceiptExtractor } from './receipts.extractor';
import { scanReceipt, setReceiptScanConsent } from './receipts.service';

export async function grantReceiptConsentController(req: Request, res: Response): Promise<void> {
  await setReceiptScanConsent(authenticatedUserId(req), true);
  res.status(204).end();
}

export async function revokeReceiptConsentController(req: Request, res: Response): Promise<void> {
  await setReceiptScanConsent(authenticatedUserId(req), false);
  res.status(204).end();
}

export async function scanReceiptController(req: Request, res: Response, extractor: ReceiptExtractor, requestTimeoutMs = 25_000): Promise<void> {
  if (!req.file) throw new AppError('VALIDATION_ERROR', 400, 'Foto nota wajib dipilih.');
  const scanId = res.locals.receiptScanId;
  if (typeof scanId !== 'string') throw new AppError('SCAN_FAILED', 503, 'Scan nota tidak dapat diproses saat ini.');
  const result = await scanReceipt(authenticatedUserId(req), scanId, req.file.buffer, extractor, requestTimeoutMs);
  res.status(200).json({ data: result });
}
