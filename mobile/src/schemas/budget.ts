import { z } from 'zod';
import { MAX_AMOUNT_IDR } from '@/utils/format';

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'budget.validation.category_required'),
  budgetAmount: z
    .number({ invalid_type_error: 'budget.validation.amount_positive' })
    .int('budget.validation.amount_positive')
    .positive('budget.validation.amount_positive')
    .max(MAX_AMOUNT_IDR, 'budget.validation.amount_max'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export const topUpBudgetFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'budget.validation.amount_positive' })
    .int('budget.validation.amount_positive')
    .positive('budget.validation.amount_positive')
    .max(MAX_AMOUNT_IDR, 'budget.validation.amount_max'),
});

export type TopUpBudgetFormValues = z.infer<typeof topUpBudgetFormSchema>;

