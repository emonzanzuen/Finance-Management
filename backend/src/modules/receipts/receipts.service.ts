import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { loadEnv } from '../../config/env';
import { isValidDateOnly, wibToday } from '../../lib/dates';
import { AppError } from '../../lib/errors';
import { MAX_AMOUNT } from '../../lib/money';
import { prisma } from '../../lib/prisma';
import { getCurrencies } from '../currencies/currencies.service';
import { inspectReceiptImage } from './receipts.image';
import { GeminiReceiptExtractor, type ReceiptExtractor } from './receipts.extractor';

const receiptResponseSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().int().positive().max(MAX_AMOUNT).nullable(),
  transactionDate: z.string().nullable(),
  description: z.string().nullable(),
  suggestedCategoryId: z.string().uuid().nullable(),
  confidence: z.enum(['low', 'medium', 'high']),
  warnings: z.array(z.string()),
});

export type ReceiptScanResult = z.infer<typeof receiptResponseSchema>;

function scanFailed(): AppError {
  return new AppError('SCAN_FAILED', 503, 'Scan nota tidak dapat diproses saat ini.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = stripControlCharacters(value).trim().slice(0, 255);
  return clean || null;
}

function stripControlCharacters(value: string): string {
  return [...value].filter((character) => {
    const code = character.charCodeAt(0);
    return code > 0x1f && (code < 0x7f || code > 0x9f);
  }).join('');
}

function warningList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, 20).map((item) => stripControlCharacters(item).slice(0, 160));
}

async function normalizeModelResult(userId: string, raw: unknown): Promise<ReceiptScanResult> {
  if (!isRecord(raw)) throw scanFailed();
  const warnings = warningList(raw.warnings);
  let amount: number | null = typeof raw.amount === 'number' && Number.isFinite(raw.amount) ? raw.amount : null;
  const currency = typeof raw.currency === 'string' ? raw.currency.trim().toUpperCase() : 'IDR';
  if (amount !== null && currency !== 'IDR') {
    if (!Number.isInteger(amount) || amount <= 0) {
      amount = null;
      warnings.push('Nominal hasil scan tidak valid.');
    } else {
      const rates = await getCurrencies();
      const rate = rates.currencies.find((item) => item.code === currency)?.rate;
      if (!rate || rate <= 0) {
        amount = null;
        warnings.push('Mata uang nota tidak didukung untuk konversi ke IDR.');
      } else {
        amount = Math.round(amount / rate);
        warnings.push(`Nominal dikonversi dari ${currency} ke IDR menggunakan kurs aktif.`);
      }
    }
  }
  if (amount !== null && (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_AMOUNT)) {
    amount = null;
    warnings.push('Nominal hasil scan berada di luar batas yang didukung.');
  }
  let transactionDate = typeof raw.transactionDate === 'string' ? raw.transactionDate : null;
  if (!transactionDate || !isValidDateOnly(transactionDate) || transactionDate > wibToday()) {
    transactionDate = null;
    if (raw.transactionDate !== null && raw.transactionDate !== undefined && raw.transactionDate !== '') warnings.push('Tanggal nota tidak valid atau berada di masa depan.');
  }
  const categories = await prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, type: true },
  });
  const suggestedName = typeof raw.suggestedCategoryName === 'string' ? raw.suggestedCategoryName.trim().toLocaleLowerCase('id-ID') : '';
  const suggested = categories.find((category) => category.type === raw.type && category.name.trim().toLocaleLowerCase('id-ID') === suggestedName);
  return receiptResponseSchema.parse({
    type: raw.type,
    amount,
    transactionDate,
    description: cleanDescription(raw.description),
    suggestedCategoryId: suggested?.id ?? null,
    confidence: raw.confidence,
    warnings,
  });
}

export async function scanReceipt(
  userId: string,
  scanId: string,
  imageBuffer: Buffer,
  extractor: ReceiptExtractor = new GeminiReceiptExtractor(),
  requestTimeoutMs = 25_000,
): Promise<ReceiptScanResult> {
  const image = inspectReceiptImage(imageBuffer);
  const categories = (await prisma.category.findMany({ where: { userId }, select: { name: true, type: true } }))
    .map(({ name, type }) => ({ name, type }));
  const controller = new AbortController();
  let timeout: NodeJS.Timeout | undefined;
  try {
    const raw = await Promise.race([
      extractor.extract({ image: imageBuffer, mimeType: image.mimeType, categories }, controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(scanFailed());
        }, requestTimeoutMs);
      }),
    ]);
    const normalized = await normalizeModelResult(userId, raw);
    await prisma.receiptScan.updateMany({ where: { id: scanId, userId }, data: { status: 'success' } });
    return normalized;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw scanFailed();
  } finally {
    if (timeout) clearTimeout(timeout);
    controller.abort();
    imageBuffer.fill(0);
  }
}

export async function hasReceiptScanConsent(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { receiptScanConsentAt: true } });
  return Boolean(user?.receiptScanConsentAt);
}

export async function setReceiptScanConsent(userId: string, consent: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { receiptScanConsentAt: consent ? new Date() : null } });
}

export function scanDailyLimit(): number {
  return loadEnv().SCAN_DAILY_LIMIT;
}

export async function reserveReceiptScan(userId: string, limit = scanDailyLimit()): Promise<string> {
  const today = wibToday();
  const start = new Date(`${today}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
    const count = await tx.receiptScan.count({ where: { userId, createdAt: { gte: start, lt: end } } });
    if (count >= limit) throw new AppError('SCAN_QUOTA_EXCEEDED', 429, 'Kuota scan nota hari ini sudah habis.');
    const scan = await tx.receiptScan.create({ data: { userId, status: 'failed' }, select: { id: true } });
    return scan.id;
  });
}

export function receiptError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return scanFailed();
  return scanFailed();
}
