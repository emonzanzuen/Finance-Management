import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { getCurrencies } from '@/api/currencies';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { CurrenciesResponse } from '@/types/api';
import { DEFAULT_FALLBACK_RATES, formatCurrency } from '@/utils/format';

const CURRENCIES_CACHE_KEY = 'finmanage.currencies.cache';
const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour (BR-18)

export const CURRENCIES_QUERY_KEY = ['currencies'] as const;

export function useCurrencies() {
  const { status } = useAuth();
  const { currency, language } = usePreferences();
  const [cachedData, setCachedData] = useState<CurrenciesResponse | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CURRENCIES_CACHE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw) as CurrenciesResponse;
        if (parsed && Array.isArray(parsed.currencies)) {
          setCachedData(parsed);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const query = useQuery({
    queryKey: CURRENCIES_QUERY_KEY,
    queryFn: async () => {
      const data = await getCurrencies();
      await AsyncStorage.setItem(CURRENCIES_CACHE_KEY, JSON.stringify(data)).catch(() => undefined);
      return data;
    },
    enabled: status === 'signedIn',
    staleTime: STALE_TIME_MS,
    retry: 1,
  });

  const activePayload = query.data ?? cachedData;

  const rates = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = { ...DEFAULT_FALLBACK_RATES };
    if (activePayload?.currencies) {
      for (const item of activePayload.currencies) {
        if (item.code && typeof item.rate === 'number' && item.rate > 0) {
          map[item.code] = item.rate;
        }
      }
    }
    map.IDR = 1;
    return map;
  }, [activePayload]);

  const formatAmount = useCallback(
    (amountInIdr: number) => formatCurrency(amountInIdr, currency, rates, language),
    [currency, rates, language],
  );

  return {
    rates,
    currencies: activePayload?.currencies ?? [],
    updatedAt: activePayload?.updatedAt ?? null,
    source: activePayload?.source ?? 'fallback',
    isLoading: query.isLoading && !cachedData,
    isFetching: query.isFetching,
    refetch: query.refetch,
    formatAmount,
  };
}
