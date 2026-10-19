import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.validation.email_required')
    .email('auth.validation.email_invalid')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'auth.validation.password_required'),
});

export type LoginFormValues = z.input<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'auth.validation.name_required')
    .max(100, 'auth.validation.name_max'),
  email: z
    .string()
    .trim()
    .min(1, 'auth.validation.email_required')
    .email('auth.validation.email_invalid')
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, 'auth.validation.password_min')
    .max(128, 'auth.validation.password_max')
    .refine(
      (val) => /[a-zA-Z]/.test(val) && /\d/.test(val),
      'auth.validation.password_alphanumeric',
    ),
});

export type RegisterFormValues = z.input<typeof registerSchema>;
