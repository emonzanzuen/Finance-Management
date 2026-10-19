import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { dateOnly } from '../../lib/dates';
import { amountToDecimal, decimalToAmount, ratioPercent } from '../../lib/money';
import { prisma } from '../../lib/prisma';
import type { CreateGoalInput, DepositInput, UpdateGoalInput } from './savings.schema';

const notFound = () => new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');

function goalStatus(saved: Prisma.Decimal, target: Prisma.Decimal): 'in_progress' | 'almost_done' | 'completed' {
  const pct = saved.div(target).mul(100);
  if (pct.gte(100)) return 'completed';
  if (pct.gte(80)) return 'almost_done';
  return 'in_progress';
}

function summarizeGoal<T extends { targetAmount: Prisma.Decimal; deadline: Date | null; completedAt: Date | null }>(goal: T, saved: Prisma.Decimal) {
  const remaining = Prisma.Decimal.max(goal.targetAmount.sub(saved), 0);
  return {
    ...goal,
    targetAmount: decimalToAmount(goal.targetAmount),
    currentAmount: decimalToAmount(saved),
    remaining: decimalToAmount(remaining),
    percentage: ratioPercent(saved, goal.targetAmount),
    status: goalStatus(saved, goal.targetAmount),
    deadline: goal.deadline ? dateOnly(goal.deadline) : null,
  };
}

function savedFromGroups(groups: Array<{ entryType: 'deposit' | 'withdrawal'; _sum: { amount: Prisma.Decimal | null } }>): Prisma.Decimal {
  return groups.reduce((total, group) => {
    const amount = group._sum.amount ?? new Prisma.Decimal(0);
    return group.entryType === 'deposit' ? total.add(amount) : total.sub(amount);
  }, new Prisma.Decimal(0));
}

export async function listGoals(userId: string) {
  const [goals, aggregates] = await Promise.all([
    prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.savingsDeposit.groupBy({ by: ['goalId', 'entryType'], where: { userId }, _sum: { amount: true } }),
  ]);
  const savedByGoal = new Map<string, Prisma.Decimal>();
  for (const group of aggregates) {
    const previous = savedByGoal.get(group.goalId) ?? new Prisma.Decimal(0);
    const amount = group._sum.amount ?? new Prisma.Decimal(0);
    savedByGoal.set(group.goalId, group.entryType === 'deposit' ? previous.add(amount) : previous.sub(amount));
  }
  const items = goals.map((goal) => summarizeGoal(goal, savedByGoal.get(goal.id) ?? new Prisma.Decimal(0)));
  const totalTarget = goals.reduce((total, goal) => total.add(goal.targetAmount), new Prisma.Decimal(0));
  const totalSaved = [...savedByGoal.values()].reduce((total, amount) => total.add(amount), new Prisma.Decimal(0));
  return {
    items,
    summary: {
      totalTarget: decimalToAmount(totalTarget),
      totalSaved: decimalToAmount(totalSaved),
      percentage: ratioPercent(totalSaved, totalTarget),
    },
  };
}

export async function getGoal(userId: string, id: string) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw notFound();
  const groups = await prisma.savingsDeposit.groupBy({
    by: ['entryType'],
    where: { goalId: id, userId },
    _sum: { amount: true },
  });
  const saved = savedFromGroups(groups);
  const entries = await prisma.savingsDeposit.findMany({
    where: { goalId: id, userId },
    orderBy: [{ depositDate: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, entryType: true, amount: true, depositDate: true, note: true },
  });
  return {
    ...summarizeGoal(goal, saved),
    entries: entries.map((entry) => ({ ...entry, amount: decimalToAmount(entry.amount), depositDate: dateOnly(entry.depositDate) })),
  };
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const goal = await prisma.savingsGoal.create({
    data: {
      userId,
      title: input.title,
      targetAmount: amountToDecimal(input.targetAmount),
      deadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
    },
  });
  return summarizeGoal(goal, new Prisma.Decimal(0));
}

export async function updateGoal(userId: string, id: string, input: UpdateGoalInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM savings_goals WHERE id = ${id}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
    const goal = await tx.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) throw notFound();
    const aggregates = await tx.savingsDeposit.groupBy({
      by: ['entryType'], where: { goalId: id, userId }, _sum: { amount: true },
    });
    const saved = savedFromGroups(aggregates);
    const targetAmount = input.targetAmount === undefined ? goal.targetAmount : amountToDecimal(input.targetAmount);
    if (targetAmount.lt(saved)) {
      throw new AppError('TARGET_BELOW_SAVED', 400, 'Target tidak boleh lebih kecil dari jumlah terkumpul.');
    }
    const completedAt = saved.gte(targetAmount) ? (goal.completedAt ?? new Date()) : null;
    const updated = await tx.savingsGoal.updateMany({
      where: { id, userId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.targetAmount !== undefined ? { targetAmount } : {}),
        ...(input.deadline !== undefined ? { deadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null } : {}),
        completedAt,
      },
    });
    if (updated.count !== 1) throw notFound();
    const current = await tx.savingsGoal.findFirstOrThrow({ where: { id, userId } });
    return summarizeGoal(current, saved);
  });
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  const result = await prisma.savingsGoal.deleteMany({ where: { id, userId } });
  if (result.count !== 1) throw notFound();
}

export async function addDeposit(userId: string, id: string, input: DepositInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM savings_goals WHERE id = ${id}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
    const goal = await tx.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) throw notFound();
    if (goal.completedAt) throw new AppError('GOAL_COMPLETED', 400, 'Target tabungan sudah selesai.');
    const groups = await tx.savingsDeposit.groupBy({
      by: ['entryType'], where: { goalId: id, userId }, _sum: { amount: true },
    });
    const saved = savedFromGroups(groups);
    const amount = amountToDecimal(input.amount);
    const remaining = goal.targetAmount.sub(saved);
    if (amount.gt(remaining)) {
      throw new AppError('DEPOSIT_EXCEEDS_TARGET', 400, 'Setoran melebihi sisa target.', { remaining: decimalToAmount(remaining) });
    }
    const entry = await tx.savingsDeposit.create({
      data: {
        goalId: id,
        userId,
        entryType: 'deposit',
        amount,
        depositDate: new Date(`${input.depositDate}T00:00:00.000Z`),
        note: input.note ?? null,
      },
    });
    const nextSaved = saved.add(amount);
    const completedAt = nextSaved.gte(goal.targetAmount) ? new Date() : null;
    const updatedGoal = await tx.savingsGoal.update({
      where: { id },
      data: { completedAt },
    });
    if (completedAt) {
      await tx.notification.createMany({
        data: [{
          userId,
          type: 'goal_completed',
          data: { goalId: goal.id, title: goal.title },
          dedupeKey: `goal:${goal.id}:completed`,
        }],
        skipDuplicates: true,
      });
    }
    return {
      entry: { id: entry.id, entryType: entry.entryType, amount: decimalToAmount(entry.amount), depositDate: dateOnly(entry.depositDate), note: entry.note },
      goal: summarizeGoal(updatedGoal, nextSaved),
    };
  });
}

export async function deleteDeposit(userId: string, goalId: string, entryId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM savings_goals WHERE id = ${goalId}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
    const goal = await tx.savingsGoal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw notFound();
    const entry = await tx.savingsDeposit.findFirst({
      where: { id: entryId, goalId, userId, entryType: 'deposit' },
      select: { id: true },
    });
    if (!entry) throw notFound();
    const result = await tx.savingsDeposit.deleteMany({ where: { id: entryId, goalId, userId } });
    if (result.count !== 1) throw notFound();
    const groups = await tx.savingsDeposit.groupBy({
      by: ['entryType'], where: { goalId, userId }, _sum: { amount: true },
    });
    const saved = savedFromGroups(groups);
    await tx.savingsGoal.updateMany({
      where: { id: goalId, userId },
      data: { completedAt: saved.gte(goal.targetAmount) ? (goal.completedAt ?? new Date()) : null },
    });
  });
}
