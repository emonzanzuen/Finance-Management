import { QueryClient } from "@tanstack/react-query";

/** Cache data server hanya di memori; data keuangan tidak disimpan ke disk. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Jangan mengulang kesalahan klien (4xx); ulang kegagalan jaringan maksimal 1 kali.
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
