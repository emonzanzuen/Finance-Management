import { z } from 'zod';
import { getTodayWibString, MAX_AMOUNT_IDR } from '@/utils/format';

export const savingsGoalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'savings.validation.title_required')
    .max(100, 'savings.validation.title_max'),
  targetAmount: z
    .number({ invalid_type_error: 'savings.validation.target_positive' })
    .int('savings.validation.target_positive')
    .positive('savings.validation.target_positive')
    .max(MAX_AMOUNT_IDR, 'savings.validation.amount_max'),
  deadline: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
      'savings.validation.deadline_invalid',
    ),
});

export type SavingsGoalFormValues = z.infer<typeof savingsGoalFormSchema>;

export const savingsDepositFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'savings.validation.deposit_positive' })
    .int('savings.validation.deposit_positive')
    .positive('savings.validation.deposit_positive')
    .max(MAX_AMOUNT_IDR, 'savings.validation.amount_max'),
  depositDate: z
    .string()
    .min(1, 'savings.validation.date_required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'savings.validation.date_required')
    .refine((val) => val <= getTodayWibString(), 'savings.validation.date_future'),
  note: z.string().trim().max(255, 'savings.validation.note_max').optional(),
});

export type SavingsDepositFormValues = z.infer<typeof savingsDepositFormSchema>;

export const savingsWithdrawalFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'savings.validation.withdraw_positive' })
    .int('savings.validation.withdraw_positive')
    .positive('savings.validation.withdraw_positive')
    .max(MAX_AMOUNT_IDR, 'savings.validation.amount_max'),
  depositDate: z
    .string()
    .min(1, 'savings.validation.date_required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'savings.validation.date_required')
    .refine((val) => val <= getTodayWibString(), 'savings.validation.date_future'),
  note: z.string().trim().max(255, 'savings.validation.note_max').optional(),
});

export type SavingsWithdrawalFormValues = z.infer<typeof savingsWithdrawalFormSchema>;
