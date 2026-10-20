import type { ApiSuccess, CurrenciesResponse } from '@/types/api';
import { apiClient } from './client';

export async function getCurrencies(): Promise<CurrenciesResponse> {
  const response = await apiClient.get<ApiSuccess<CurrenciesResponse>>('/currencies');
  return response.data.data;
}
