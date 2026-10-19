import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/api/categories';
import type {
  ApiError,
  Category,
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/api';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

async function invalidateCategoryDependents(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  ]);
}

export function useCategories(type?: CategoryType) {
  return useQuery<Category[], ApiError>({
    queryKey: type ? [...CATEGORIES_QUERY_KEY, type] : CATEGORIES_QUERY_KEY,
    queryFn: () => getCategories(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, CreateCategoryInput>({
    mutationFn: (input) => createCategory(input),
    onSuccess: async () => {
      await invalidateCategoryDependents(queryClient);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, { id: string; input: UpdateCategoryInput }>({
    mutationFn: ({ id, input }) => updateCategory(id, input),
    onSuccess: async () => {
      await invalidateCategoryDependents(queryClient);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: async () => {
      await invalidateCategoryDependents(queryClient);
    },
  });
}
