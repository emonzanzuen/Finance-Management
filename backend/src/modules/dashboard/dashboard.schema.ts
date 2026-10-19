import { z } from 'zod';

const month = z.coerce.number().int().min(1).max(12);
const year = z.coerce.number().int().min(2000).max(2100);
export const dashboardQuery = z.object({ month: month.optional(), year: year.optional() }).strict();
