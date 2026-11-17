import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import { currentWibMonth, wibToday } from '../../lib/dates';
import { AppError } from '../../lib/errors';
import { DEFAULT_CATEGORIES } from '../../lib/defaultCategories';
import { prisma } from '../../lib/prisma';
import { schedulePushNotifications, type PushEvent } from '../../lib/pushNotifications';
import { refreshBudgetNotifications } from '../transactions/transactions.service';
import type { ImportCommitInput, ImportRow } from './imports.schema';
import { previewImport } from './imports.parser';

export const importSpec = {
  columns: [
    { name: 'Tanggal', required: true, format: 'Tanggal lengkap, atau angka hari 1-31 bila Bulan dan Tahun dipakai' },
    { name: 'Bulan', required: false, format: 'Angka 1-12 atau nama bulan; wajib bersama Tahun' },
    { name: 'Tahun', required: false, format: '4 digit; wajib bersama Bulan' },
    { name: 'Tipe', required: true, allowed: ['Pemasukan', 'Pengeluaran'] },
    { name: 'Kategori', required: true },
    { name: 'Deskripsi', required: true, maxLength: 255, emptyCellAllowed: true },
    { name: 'Nominal', required: true, format: 'Bilangan bulat rupiah lebih dari 0' },
  ],
  ignoredColumns: ['No', 'Hari'],
  limits: { maxFileBytes: 2_097_152, maxRows: 1000 },
} as const;

export async function makeImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinManage';
  workbook.subject = 'Template import transaksi IDR';
  const sheet = workbook.addWorksheet('Transaksi');
  const period = currentWibMonth();
  const day = Number(wibToday().slice(8, 10));
  sheet.addRow(['Tanggal', 'Bulan', 'Tahun', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal']);
  sheet.addRow([day, period.month, period.year, 'Pengeluaran', 'Food', 'Contoh makan siang', 25_000]);
  sheet.addRow([Math.max(1, day - 1), period.month, period.year, 'Pemasukan', 'Salary', 'Contoh pemasukan', 5_000_000]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 18 },
    { width: 24 }, { width: 34 }, { width: 18 },
  ];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function previewTransactionsImport(userId: string, buffer: Buffer) {
  return previewImport(userId, buffer);
}

function duplicateKey(row: Pick<ImportRow, 'type' | 'amount' | 'transactionDate' | 'description'>): string {
  return `${row.transactionDate}|${row.type}|${row.amount}|${row.description ?? ''}`;
}

export async function commitTransactionsImport(userId: string, input: ImportCommitInput) {
  const result = await prisma.$transaction(async (tx) => {
    const duplicateCandidates = input.rows.map((row) => ({
      userId,
      type: row.type,
      amount: new Prisma.Decimal(row.amount),
      transactionDate: new Date(`${row.transactionDate}T00:00:00.000Z`),
      description: row.description ?? null,
    }));
    const existing = duplicateCandidates.length ? await tx.transaction.findMany({
      where: {
        userId,
        OR: duplicateCandidates.map((row) => ({
          type: row.type, amount: row.amount, transactionDate: row.transactionDate,
          description: row.description,
        })),
      },
      select: { type: true, amount: true, transactionDate: true, description: true },
    }) : [];
    const seen = new Set(existing.map((row) => duplicateKey({
      type: row.type,
      amount: Number(row.amount.toString()),
      transactionDate: row.transactionDate.toISOString().slice(0, 10),
      description: row.description,
    })));
    const rowsToImport: ImportRow[] = [];
    let skipped = 0;
    for (const row of input.rows) {
      const key = duplicateKey(row);
      if (input.skipDuplicates && seen.has(key)) { skipped += 1; continue; }
      seen.add(key);
      rowsToImport.push(row);
    }

    const knownCategories = await tx.category.findMany({ where: { userId }, select: { id: true, name: true, nameKey: true, type: true } });
    const categoryByKey = new Map(knownCategories.map((category) => [`${category.type}:${category.nameKey}`, category]));
    const otherCategory = (type: 'income' | 'expense') => DEFAULT_CATEGORIES.find((category) => category.type === type && category.name === 'Other')!;
    const resolvedCategoryByName = new Map<string, { id: string; name: string; nameKey: string; type: 'income' | 'expense' }>();
    const createdCategories = new Set<string>();

    for (const row of rowsToImport) {
      const nameKey = row.category.trim().toLowerCase();
      const key = `${row.type}:${nameKey}`;
      if (categoryByKey.has(key) || resolvedCategoryByName.has(key)) continue;
      if (input.unknownCategoryMode === 'other') {
        const fallback = otherCategory(row.type);
        const saved = categoryByKey.get(`${row.type}:other`) ?? await tx.category.create({
          data: { userId, name: fallback.name, nameKey: 'other', type: row.type, color: fallback.color },
          select: { id: true, name: true, nameKey: true, type: true },
        });
        categoryByKey.set(`${row.type}:other`, saved);
        resolvedCategoryByName.set(key, saved);
      } else {
        const saved = await tx.category.create({
          data: { userId, name: row.category.trim(), nameKey, type: row.type, color: otherCategory(row.type).color },
          select: { id: true, name: true, nameKey: true, type: true },
        });
        categoryByKey.set(key, saved);
        resolvedCategoryByName.set(key, saved);
        createdCategories.add(saved.name);
      }
    }

    const rowsToCreate: Array<Prisma.TransactionCreateManyInput> = [];
    const refresh = new Map<string, { categoryId: string; date: Date }>();
    for (const row of rowsToImport) {
      const key = `${row.type}:${row.category.trim().toLowerCase()}`;
      const category = resolvedCategoryByName.get(key) ?? categoryByKey.get(key);
      if (!category) throw new AppError('VALIDATION_ERROR', 400, 'Kategori transaksi tidak valid.');
      const transactionDate = new Date(`${row.transactionDate}T00:00:00.000Z`);
      rowsToCreate.push({
        userId,
        categoryId: category.id,
        type: row.type,
        amount: new Prisma.Decimal(row.amount),
        transactionDate,
        description: row.description ?? null,
        source: 'import',
      });
      if (row.type === 'expense') refresh.set(`${category.id}:${row.transactionDate.slice(0, 7)}`, { categoryId: category.id, date: transactionDate });
    }
    if (rowsToCreate.length) await tx.transaction.createMany({ data: rowsToCreate });
    const pushEvents: PushEvent[] = [];
    for (const item of refresh.values()) pushEvents.push(...await refreshBudgetNotifications(tx, userId, item.categoryId, item.date));
    return {
      data: { imported: rowsToCreate.length, skipped, createdCategories: [...createdCategories].sort((a, b) => a.localeCompare(b)) },
      pushEvents,
    };
  });
  schedulePushNotifications(result.pushEvents);
  return result.data;
}
