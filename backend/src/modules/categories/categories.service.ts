import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

function categoryInUse(): AppError {
  return new AppError('CATEGORY_IN_USE', 409, 'Kategori masih dipakai.');
}

function mapUnique(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new AppError('CATEGORY_DUPLICATE', 409, 'Nama kategori sudah digunakan.');
  }
  throw error;
}

export async function listCategories(userId: string, type?: 'income' | 'expense') {
  const categories = await prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, type: true, color: true },
  });
  return categories;
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  try {
    return await prisma.category.create({
      data: { userId, ...input, nameKey: nameKey(input.name) },
      select: { id: true, name: true, type: true, color: true },
    });
  } catch (error) {
    return mapUnique(error);
  }
}

export async function updateCategory(userId: string, id: string, input: UpdateCategoryInput) {
  const current = await prisma.category.findFirst({ where: { id, userId } });
  if (!current) throw new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');
  try {
    const updated = await prisma.category.updateMany({
      where: { id, userId },
      data: { ...input, ...(input.name ? { nameKey: nameKey(input.name) } : {}) },
    });
    if (updated.count !== 1) throw new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');
    return await prisma.category.findFirstOrThrow({
      where: { id, userId },
      select: { id: true, name: true, type: true, color: true },
    });
  } catch (error) {
    return mapUnique(error);
  }
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  const category = await prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
  if (!category) throw new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');
  const [transactionCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id, userId } }),
    prisma.budget.count({ where: { categoryId: id, userId } }),
  ]);
  if (transactionCount || budgetCount) {
    throw new AppError('CATEGORY_IN_USE', 409, 'Kategori masih dipakai.', { transactionCount, budgetCount });
  }
  try {
    const result = await prisma.category.deleteMany({ where: { id, userId } });
    if (result.count !== 1) throw new AppError('NOT_FOUND', 404, 'Sumber daya tidak ditemukan.');
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw categoryInUse();
    }
    throw error;
  }
}
