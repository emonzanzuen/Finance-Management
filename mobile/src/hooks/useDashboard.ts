import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/api/dashboard';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

export function useDashboardSummary(month: number, year: number) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, month, year],
    queryFn: () => getDashboardSummary(month, year),
  });
}
