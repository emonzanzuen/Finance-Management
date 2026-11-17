import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { addDepositController, createGoalController, deleteDepositController, deleteGoalController, getGoalController, listGoalsController, updateGoalController, withdrawSavingsController } from './savings.controller';

export const savingsRouter = Router();
savingsRouter.get('/savings-goals', requireAuth, listGoalsController);
savingsRouter.get('/savings-goals/:id', requireAuth, getGoalController);
savingsRouter.post('/savings-goals', requireAuth, createGoalController);
savingsRouter.patch('/savings-goals/:id', requireAuth, updateGoalController);
savingsRouter.delete('/savings-goals/:id', requireAuth, deleteGoalController);
savingsRouter.post('/savings-goals/:id/deposits', requireAuth, addDepositController);
savingsRouter.post('/savings-goals/:id/withdrawals', requireAuth, withdrawSavingsController);
savingsRouter.delete('/savings-goals/:id/deposits/:entryId', requireAuth, deleteDepositController);
