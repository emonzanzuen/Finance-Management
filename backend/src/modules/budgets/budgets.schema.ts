import { z } from 'zod';
import { MAX_AMOUNT } from '../../lib/money';

const month = z.coerce.number().int().min(1).max(12);
const year = z.coerce.number().int().min(2000).max(2100);
const budgetAmount = z.number().int().min(1).max(MAX_AMOUNT);

export const budgetIdSchema = z.string().uuid();
export const listBudgetsQuery = z.object({ month: month.optional(), year: year.optional() }).strict();
export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month,
  year,
  budgetAmount,
}).strict();
export const updateBudgetSchema = z.object({ budgetAmount }).strict();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
