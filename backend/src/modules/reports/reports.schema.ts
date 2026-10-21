import { z } from 'zod';

const month = z.coerce.number().int().min(1).max(12);
const year = z.coerce.number().int().min(2000).max(2100);
export const monthlyReportQuery = z.object({ month: month.optional(), year: year.optional() }).strict();
export const trendReportQuery = z.object({ year }).strict();
export const exportReportQuery = z.object({ format: z.enum(['pdf', 'xlsx']), month, year }).strict();
