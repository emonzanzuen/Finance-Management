import { z } from 'zod';

const name = z.string().trim().min(1).max(50);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const categoryIdSchema = z.string().uuid();
export const listCategoriesQuery = z.object({ type: z.enum(['income', 'expense']).optional() }).strict();
export const createCategorySchema = z.object({ name, type: z.enum(['income', 'expense']), color }).strict();
export const updateCategorySchema = z.object({ name: name.optional(), color: color.optional() }).strict().refine((value) => Object.keys(value).length > 0);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
