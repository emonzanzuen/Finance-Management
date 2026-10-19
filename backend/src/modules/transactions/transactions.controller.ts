import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { createTransactionSchema, listTransactionsQuery, transactionIdSchema, updateTransactionSchema } from './transactions.schema';
import { createTransaction, deleteTransaction, getTransaction, listTransactions, updateTransaction } from './transactions.service';

export async function listTransactionsController(req: Request, res: Response): Promise<void> {
  const query = listTransactionsQuery.parse(req.query);
  const result = await listTransactions(authenticatedUserId(req), query);
  res.status(200).json({ data: result.data, meta: result.meta });
}

export async function getTransactionController(req: Request, res: Response): Promise<void> {
  const id = transactionIdSchema.parse(req.params.id);
  res.status(200).json({ data: await getTransaction(authenticatedUserId(req), id) });
}

export async function createTransactionController(req: Request, res: Response): Promise<void> {
  const input = createTransactionSchema.parse(req.body);
  res.status(201).json({ data: await createTransaction(authenticatedUserId(req), input) });
}

export async function updateTransactionController(req: Request, res: Response): Promise<void> {
  const id = transactionIdSchema.parse(req.params.id);
  const input = updateTransactionSchema.parse(req.body);
  res.status(200).json({ data: await updateTransaction(authenticatedUserId(req), id, input) });
}

export async function deleteTransactionController(req: Request, res: Response): Promise<void> {
  const id = transactionIdSchema.parse(req.params.id);
  await deleteTransaction(authenticatedUserId(req), id);
  res.status(204).end();
}
