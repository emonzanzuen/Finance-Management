import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(255);

export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128),
}).strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
