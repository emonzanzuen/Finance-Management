import { useMutation, useQuery } from '@tanstack/react-query';
import { exportReportFile, getMonthlyReport, getYearlyTrend } from '@/api/reports';
import type { ReportExportFormat } from '@/types/api';

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

export function useExportReport() {
  return useMutation({
    mutationFn: ({
      format,
      month,
      year,
    }: {
      format: ReportExportFormat;
      month: number;
      year: number;
    }) => exportReportFile(format, month, year),
  });
}

