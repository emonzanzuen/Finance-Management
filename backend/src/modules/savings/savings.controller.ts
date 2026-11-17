import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { createGoalSchema, depositSchema, goalIdSchema, updateGoalSchema, withdrawalSchema } from './savings.schema';
import { addDeposit, createGoal, deleteDeposit, deleteGoal, getGoal, listGoals, updateGoal, withdrawSavings } from './savings.service';

export async function listGoalsController(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await listGoals(authenticatedUserId(req)) });
}

export async function getGoalController(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await getGoal(authenticatedUserId(req), goalIdSchema.parse(req.params.id)) });
}

export async function createGoalController(req: Request, res: Response): Promise<void> {
  const input = createGoalSchema.parse(req.body);
  res.status(201).json({ data: await createGoal(authenticatedUserId(req), input) });
}

export async function updateGoalController(req: Request, res: Response): Promise<void> {
  const id = goalIdSchema.parse(req.params.id);
  const input = updateGoalSchema.parse(req.body);
  res.status(200).json({ data: await updateGoal(authenticatedUserId(req), id, input) });
}

export async function deleteGoalController(req: Request, res: Response): Promise<void> {
  await deleteGoal(authenticatedUserId(req), goalIdSchema.parse(req.params.id));
  res.status(204).end();
}

export async function addDepositController(req: Request, res: Response): Promise<void> {
  const id = goalIdSchema.parse(req.params.id);
  const input = depositSchema.parse(req.body);
  res.status(201).json({ data: await addDeposit(authenticatedUserId(req), id, input) });
}

export async function withdrawSavingsController(req: Request, res: Response): Promise<void> {
  const id = goalIdSchema.parse(req.params.id);
  const input = withdrawalSchema.parse(req.body);
  res.status(201).json({ data: await withdrawSavings(authenticatedUserId(req), id, input) });
}

export async function deleteDepositController(req: Request, res: Response): Promise<void> {
  const goalId = goalIdSchema.parse(req.params.id);
  const entryId = goalIdSchema.parse(req.params.entryId);
  await deleteDeposit(authenticatedUserId(req), goalId, entryId);
  res.status(204).end();
}
