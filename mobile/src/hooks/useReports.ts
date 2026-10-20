import { useQuery } from '@tanstack/react-query';
import { getMonthlyReport, getYearlyTrend } from '@/api/reports';

export const REPORTS_QUERY_KEY = ['reports'] as const;

export function useMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'monthly', month, year],
    queryFn: () => getMonthlyReport(month, year),
  });
}

export function useYearlyTrend(year: number) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'trend', year],
    queryFn: () => getYearlyTrend(year),
  });
}
