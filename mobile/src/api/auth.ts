import type {
  ApiSuccess,
  AuthSessionResponse,
  ChangePasswordInput,
  ChangePasswordResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
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

export async function logoutAllUsers(): Promise<void> {
  await apiClient.post('/auth/logout-all');
}

export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResponse> {
  const response = await apiClient.post<ApiSuccess<ChangePasswordResponse>>(
    '/auth/change-password',
    input,
  );
  return response.data.data;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await apiClient.post('/auth/forgot-password', input);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiClient.post('/auth/reset-password', input);
}

export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.get<ApiSuccess<UserProfile>>('/profile');
  return response.data.data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await apiClient.patch<ApiSuccess<UserProfile>>('/profile', input);
  return response.data.data;
}

