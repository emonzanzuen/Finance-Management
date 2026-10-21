import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getProfileController, updateProfileController } from './profile.controller';

export const profileRouter = Router();
profileRouter.get('/profile', requireAuth, getProfileController);
profileRouter.patch('/profile', requireAuth, updateProfileController);
