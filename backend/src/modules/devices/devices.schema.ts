import { Expo } from 'expo-server-sdk';
import { z } from 'zod';

export const registerDeviceSchema = z.object({
  expoPushToken: z.string().trim().min(1).max(255).refine((token) => Expo.isExpoPushToken(token), 'Token Expo tidak valid.'),
  locale: z.enum(['id', 'en']).optional(),
}).strict();

export const deviceTokenParamSchema = z.string().min(1).max(255).refine((token) => Expo.isExpoPushToken(token));
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
