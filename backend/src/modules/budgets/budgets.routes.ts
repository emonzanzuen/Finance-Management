import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createBudgetController, deleteBudgetController, listBudgetsController, topUpBudgetController, updateBudgetController } from './budgets.controller';

export const budgetsRouter = Router();
budgetsRouter.get('/budgets', requireAuth, listBudgetsController);
budgetsRouter.post('/budgets', requireAuth, createBudgetController);
budgetsRouter.patch('/budgets/:id', requireAuth, updateBudgetController);
budgetsRouter.delete('/budgets/:id', requireAuth, deleteBudgetController);
budgetsRouter.post('/budgets/:id/top-up', requireAuth, topUpBudgetController);
