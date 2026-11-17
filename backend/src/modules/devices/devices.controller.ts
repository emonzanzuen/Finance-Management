import type { Request, Response } from 'express';
import { authenticatedUserId } from '../../middleware/auth';
import { deleteDevice, registerDevice } from './devices.service';
import { deviceTokenParamSchema, registerDeviceSchema } from './devices.schema';

export async function registerDeviceController(req: Request, res: Response): Promise<void> {
  await registerDevice(authenticatedUserId(req), registerDeviceSchema.parse(req.body));
  res.status(204).end();
}

export async function deleteDeviceController(req: Request, res: Response): Promise<void> {
  await deleteDevice(authenticatedUserId(req), deviceTokenParamSchema.parse(req.params.token));
  res.status(204).end();
}
