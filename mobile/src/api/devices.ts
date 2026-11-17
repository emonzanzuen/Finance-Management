import { apiClient } from './client';

export type DeviceRegistrationInput = {
  expoPushToken: string;
  locale: 'id' | 'en';
};

export async function registerDevice(input: DeviceRegistrationInput): Promise<void> {
  await apiClient.post('/devices', input);
}

export async function unregisterDevice(token: string): Promise<void> {
  await apiClient.delete(`/devices/${encodeURIComponent(token)}`);
}