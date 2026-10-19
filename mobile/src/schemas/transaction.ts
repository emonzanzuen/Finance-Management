import { z } from 'zod';
import { getTodayWibString, MAX_AMOUNT_IDR } from '@/utils/format';

export const transactionFormSchema = z.object({
  type: z.enum(['expense', 'income']),
  categoryId: z.string().trim().min(1, 'transactions.validation.category_required'),
  amount: z
    .number({ message: 'transactions.validation.amount_positive' })
    .int('transactions.validation.amount_positive')
    .min(1, 'transactions.validation.amount_positive')
    .max(MAX_AMOUNT_IDR, 'transactions.validation.amount_max'),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'transactions.validation.date_required')
    .refine((val) => val <= getTodayWibString(), 'transactions.validation.date_future'),
  description: z.string().max(255, 'transactions.validation.description_max').optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
