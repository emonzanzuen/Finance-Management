import type {
  ApiSuccess,
  Category,
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/api';
import { apiClient } from './client';

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  const response = await apiClient.get<ApiSuccess<Category[]>>('/categories', {
    params: type ? { type } : undefined,
  });
  return response.data.data;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const response = await apiClient.post<ApiSuccess<Category>>('/categories', input);
  return response.data.data;
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const response = await apiClient.patch<ApiSuccess<Category>>(`/categories/${id}`, input);
  return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
