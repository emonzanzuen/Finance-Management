import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { getProfile } from './profile.service';

export async function getProfileController(req: Request, res: Response): Promise<void> {
  const data = await getProfile(authenticatedUserId(req));
  res.status(200).json({ data });
}
