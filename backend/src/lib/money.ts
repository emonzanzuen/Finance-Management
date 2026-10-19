import { Prisma } from '@prisma/client';
import { AppError } from './errors';

export const MAX_AMOUNT = 999_999_999_999;

export function amountToDecimal(amount: number): Prisma.Decimal {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
    throw new AppError('VALIDATION_ERROR', 400, 'Nominal harus berupa bilangan bulat rupiah yang valid.');
  }
  return new Prisma.Decimal(amount);
}

export function decimalToAmount(amount: Prisma.Decimal): number {
  return amount.toNumber();
}

export function ratioPercent(amount: Prisma.Decimal | number, base: Prisma.Decimal | number): number {
  const amountDecimal = new Prisma.Decimal(amount);
  const baseDecimal = new Prisma.Decimal(base);
  if (baseDecimal.isZero()) return 0;
  return Number(amountDecimal.div(baseDecimal).mul(100).toDecimalPlaces(1).toString());
}

export function decimalSum(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce((total, value) => total.add(value), new Prisma.Decimal(0));
}
