import { useMutation } from '@tanstack/react-query';
import { getHealth } from '@/api/health';
import type { ApiError } from '@/types/api';

export type HealthResult = { ms: number };

/** Mutation (manual trigger) that measures the round trip of GET /health. */
export function useHealthCheck() {
  return useMutation<HealthResult, ApiError>({
    mutationFn: async () => {
      const started = Date.now();
      await getHealth();
      return { ms: Date.now() - started };
    },
  });
}
