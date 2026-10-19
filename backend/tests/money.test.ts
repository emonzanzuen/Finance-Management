import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { decimalSum } from '../src/lib/money';

describe('financial amount precision', () => {
  it('sums 10,000 transaction amounts exactly with Decimal arithmetic', () => {
    const amounts = Array.from({ length: 10_000 }, (_, index) => new Prisma.Decimal((index % 9) + 1));
    expect(decimalSum(amounts).toFixed(0)).toBe('49996');
  });
});
