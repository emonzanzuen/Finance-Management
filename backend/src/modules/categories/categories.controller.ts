import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { categoryIdSchema, createCategorySchema, listCategoriesQuery, updateCategorySchema } from './categories.schema';
import { createCategory, deleteCategory, listCategories, updateCategory } from './categories.service';

export async function listCategoriesController(req: Request, res: Response): Promise<void> {
  const query = listCategoriesQuery.parse(req.query);
  res.status(200).json({ data: await listCategories(authenticatedUserId(req), query.type) });
}

export async function createCategoryController(req: Request, res: Response): Promise<void> {
  const input = createCategorySchema.parse(req.body);
  res.status(201).json({ data: await createCategory(authenticatedUserId(req), input) });
}

export async function updateCategoryController(req: Request, res: Response): Promise<void> {
  const id = categoryIdSchema.parse(req.params.id);
  const input = updateCategorySchema.parse(req.body);
  res.status(200).json({ data: await updateCategory(authenticatedUserId(req), id, input) });
}

export async function deleteCategoryController(req: Request, res: Response): Promise<void> {
  const id = categoryIdSchema.parse(req.params.id);
  await deleteCategory(authenticatedUserId(req), id);
  res.status(204).end();
}
