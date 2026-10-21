import { z } from 'zod';

export const editProfileFormSchema = z.object({
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
  currentPassword: z.string().optional(),
});

export type EditProfileFormValues = z.input<typeof editProfileFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'auth.validation.password_required'),
    newPassword: z
      .string()
      .min(8, 'auth.validation.password_min')
      .max(128, 'auth.validation.password_max')
      .refine(
        (val) => /[a-zA-Z]/.test(val) && /\d/.test(val),
        'auth.validation.password_alphanumeric',
      ),
    confirmPassword: z.string().min(1, 'profile.validation.confirm_password_required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'profile.validation.password_mismatch',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
