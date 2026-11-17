import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { deleteDeviceController, registerDeviceController } from './devices.controller';

export const devicesRouter = Router();
devicesRouter.post('/devices', requireAuth, registerDeviceController);
devicesRouter.delete('/devices/:token', requireAuth, deleteDeviceController);
