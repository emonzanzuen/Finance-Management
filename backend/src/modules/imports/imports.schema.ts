import { z } from 'zod';
import { isValidDateOnly, wibToday } from '../../lib/dates';
import { MAX_AMOUNT } from '../../lib/money';

export const importRowSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1).max(50),
  amount: z.number().int().min(1).max(MAX_AMOUNT),
  transactionDate: z.string().refine(isValidDateOnly, 'Tanggal tidak valid').refine((date) => date <= wibToday(), 'Tanggal tidak boleh melewati hari ini.'),
  description: z.string().max(255).nullable().optional(),
}).strict();

export const importCommitSchema = z.object({
  unknownCategoryMode: z.enum(['create', 'other']),
  skipDuplicates: z.boolean(),
  rows: z.array(importRowSchema).max(1000),
}).strict();

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportCommitInput = z.infer<typeof importCommitSchema>;
