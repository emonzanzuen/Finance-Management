import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getProfileController } from './profile.controller';

export const profileRouter = Router();
profileRouter.get('/profile', requireAuth, getProfileController);
