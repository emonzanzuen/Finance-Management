import type {
  ApiSuccess,
  AuthSessionResponse,
  LoginInput,
  RegisterInput,
  UserProfile,
} from '@/types/api';
import { apiClient } from './client';

export async function registerUser(input: RegisterInput): Promise<AuthSessionResponse> {
  const response = await apiClient.post<ApiSuccess<AuthSessionResponse>>('/auth/register', input);
  return response.data.data;
}

export async function loginUser(input: LoginInput): Promise<AuthSessionResponse> {
  const response = await apiClient.post<ApiSuccess<AuthSessionResponse>>('/auth/login', input);
  return response.data.data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.get<ApiSuccess<UserProfile>>('/profile');
  return response.data.data;
}
