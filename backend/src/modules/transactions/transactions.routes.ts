import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createTransactionController, deleteTransactionController, getTransactionController, listTransactionsController, updateTransactionController } from './transactions.controller';

export const transactionsRouter = Router();
transactionsRouter.get('/transactions', requireAuth, listTransactionsController);
transactionsRouter.get('/transactions/:id', requireAuth, getTransactionController);
transactionsRouter.post('/transactions', requireAuth, createTransactionController);
transactionsRouter.patch('/transactions/:id', requireAuth, updateTransactionController);
transactionsRouter.delete('/transactions/:id', requireAuth, deleteTransactionController);
