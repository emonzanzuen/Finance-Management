import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerDevice, unregisterDevice, type DeviceRegistrationInput } from '@/api/devices';

export const DEVICES_QUERY_KEY = ['devices'] as const;

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeviceRegistrationInput) => registerDevice(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}

export function useUnregisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => unregisterDevice(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}