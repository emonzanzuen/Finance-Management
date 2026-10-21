import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(255);
const avatar = z.string().max(140_000).nullable();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: email.optional(),
  currentPassword: z.string().min(8).max(128).optional(),
  avatar: avatar.optional(),
}).strict().refine((value) => value.name !== undefined || value.email !== undefined || value.avatar !== undefined, {
  message: 'Minimal satu perubahan profil harus diisi.',
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
