import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createCategoryController, deleteCategoryController, listCategoriesController, updateCategoryController } from './categories.controller';

export const categoriesRouter = Router();
categoriesRouter.get('/categories', requireAuth, listCategoriesController);
categoriesRouter.post('/categories', requireAuth, createCategoryController);
categoriesRouter.patch('/categories/:id', requireAuth, updateCategoryController);
categoriesRouter.delete('/categories/:id', requireAuth, deleteCategoryController);
