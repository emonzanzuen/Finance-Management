import { z } from 'zod';
import { isValidDateOnly } from '../../lib/dates';
import { MAX_AMOUNT } from '../../lib/money';

const dateOnly = z.string().refine(isValidDateOnly, 'Tanggal tidak valid.');
const amount = z.number().int().min(1).max(MAX_AMOUNT);
export const goalIdSchema = z.string().uuid();

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(100),
  targetAmount: amount,
  deadline: dateOnly.nullable().optional(),
}).strict();

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  targetAmount: amount.optional(),
  deadline: dateOnly.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export const depositSchema = z.object({
  amount,
  depositDate: dateOnly,
  note: z.string().trim().max(255).nullable().optional(),
}).strict();

export const withdrawalSchema = depositSchema;

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
