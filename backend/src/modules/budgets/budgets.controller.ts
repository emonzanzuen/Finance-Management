import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { budgetIdSchema, createBudgetSchema, listBudgetsQuery, topUpBudgetSchema, updateBudgetSchema } from './budgets.schema';
import { createBudget, deleteBudget, listBudgets, topUpBudget, updateBudget } from './budgets.service';

export async function listBudgetsController(req: Request, res: Response): Promise<void> {
  const query = listBudgetsQuery.parse(req.query);
  res.status(200).json({ data: await listBudgets(authenticatedUserId(req), query.month, query.year) });
}

export async function createBudgetController(req: Request, res: Response): Promise<void> {
  const input = createBudgetSchema.parse(req.body);
  res.status(201).json({ data: await createBudget(authenticatedUserId(req), input) });
}

export async function updateBudgetController(req: Request, res: Response): Promise<void> {
  const id = budgetIdSchema.parse(req.params.id);
  const input = updateBudgetSchema.parse(req.body);
  res.status(200).json({ data: await updateBudget(authenticatedUserId(req), id, input.budgetAmount) });
}

export async function deleteBudgetController(req: Request, res: Response): Promise<void> {
  const id = budgetIdSchema.parse(req.params.id);
  await deleteBudget(authenticatedUserId(req), id);
  res.status(204).end();
}

export async function topUpBudgetController(req: Request, res: Response): Promise<void> {
  const id = budgetIdSchema.parse(req.params.id);
  const input = topUpBudgetSchema.parse(req.body);
  res.status(200).json({ data: await topUpBudget(authenticatedUserId(req), id, input.amount) });
}
