import { z } from 'zod';
import { isValidDateOnly, wibToday } from '../../lib/dates';
import { MAX_AMOUNT } from '../../lib/money';

const dateOnlySchema = z.string().refine(isValidDateOnly, 'Tanggal tidak valid.');
const amountSchema = z.number().int().min(1).max(MAX_AMOUNT);
const optionalDate = dateOnlySchema.optional();

export const transactionIdSchema = z.string().uuid();
export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  categoryId: z.string().uuid(),
  amount: amountSchema,
  transactionDate: dateOnlySchema.refine((date) => date <= wibToday(), 'Tanggal tidak boleh melewati hari ini.'),
  description: z.string().trim().max(255).nullable().optional(),
}).strict();

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
  amount: amountSchema.optional(),
  transactionDate: dateOnlySchema.refine((date) => date <= wibToday(), 'Tanggal tidak boleh melewati hari ini.').optional(),
  description: z.string().trim().max(255).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().max(50).optional(),
  dateFrom: optionalDate,
  dateTo: optionalDate,
  sortBy: z.enum(['transactionDate', 'amount']).default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict().refine((query) => {
  if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) return false;
  if (query.dateFrom && query.dateTo) {
    const from = Date.parse(`${query.dateFrom}T00:00:00Z`);
    const to = Date.parse(`${query.dateTo}T00:00:00Z`);
    const maxTo = new Date(from);
    maxTo.setUTCFullYear(maxTo.getUTCFullYear() + 5);
    return to <= maxTo.getTime();
  }
  return true;
}, 'Rentang tanggal maksimal lima tahun.').refine((query) => {
  if (!query.dateFrom) return true;
  const from = Date.parse(`${query.dateFrom}T00:00:00Z`);
  const to = Date.parse(`${query.dateTo ?? wibToday()}T00:00:00Z`);
  const maxTo = new Date(from);
  maxTo.setUTCFullYear(maxTo.getUTCFullYear() + 5);
  return from <= to && to <= maxTo.getTime();
}, 'Rentang tanggal maksimal lima tahun.');

export const listTransactionsQuery = querySchema;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuery>;
