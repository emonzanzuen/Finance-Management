import { z } from 'zod';

export const categoryFormSchema = z.object({
  type: z.enum(['expense', 'income']),
  name: z
    .string()
    .trim()
    .min(1, 'categories.validation.name_required')
    .max(50, 'categories.validation.name_max'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'categories.validation.color_required'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
