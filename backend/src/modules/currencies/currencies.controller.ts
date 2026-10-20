import type { Request, Response } from 'express';
import { getCurrencies } from './currencies.service';

export async function currenciesController(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await getCurrencies() });
}
