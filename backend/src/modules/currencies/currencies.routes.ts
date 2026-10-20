import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { currenciesController } from './currencies.controller';

export const currenciesRouter = Router();
currenciesRouter.get('/currencies', requireAuth, currenciesController);
