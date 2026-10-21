import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { getProfile, updateProfile } from './profile.service';
import { updateProfileSchema } from './profile.schema';

export async function getProfileController(req: Request, res: Response): Promise<void> {
  const data = await getProfile(authenticatedUserId(req));
  res.status(200).json({ data });
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  const userId = authenticatedUserId(req);
  const input = updateProfileSchema.parse(req.body);
  await updateProfile(userId, req.auth?.sessionId ?? '', input);
  res.status(200).json({ data: await getProfile(userId) });
}
