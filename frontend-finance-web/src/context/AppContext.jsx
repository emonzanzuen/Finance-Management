import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCurrencies } from "../hooks/queries.js";
import { useAuth } from "./AuthContext.jsx";

const AppContext = createContext(null);
const FALLBACK_CURRENCIES = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rate: 1 },
  { code: "USD", name: "US Dollar", symbol: "$", rate: 0.000055 },
  { code: "EUR", name: "Euro", symbol: "€", rate: 0.000049 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 0.000071 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rate: 0.000226 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 0.008761 },
  { code: "GBP", name: "British Pound", symbol: "£", rate: 0.000042 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 0.00008 },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", rate: 0.000208 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 0.000373 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", rate: 0.073875 },
  { code: "THB", name: "Thai Baht", symbol: "฿", rate: 0.001854 },
];
const FALLBACK_RATES = Object.fromEntries(FALLBACK_CURRENCIES.map(({ code, rate }) => [code, rate > 0 ? 1 / rate : 1]));

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currency, setCurrencyState] = useState(() => localStorage.getItem("currency") || "IDR");
  const [language, setLanguageState] = useState(() => localStorage.getItem("language") || "id");
  const { data, isFetching, error, refetch } = useCurrencies(isAuthenticated);

  useEffect(() => { localStorage.setItem("currency", currency); }, [currency]);
  useEffect(() => { localStorage.setItem("language", language); }, [language]);

  // API rates are currency units per IDR; this inverse preserves the website formatter contract.
  const exchangeRates = useMemo(() => {
    const rates = { ...FALLBACK_RATES };
    for (const item of data?.currencies ?? []) {
      if (item.code === "IDR") rates.IDR = 1;
      else if (Number(item.rate) > 0) rates[item.code] = 1 / Number(item.rate);
    }
    return rates;
  }, [data]);

  const setCurrency = (value) => setCurrencyState(value);
  const setLanguage = (value) => setLanguageState(value);
  const convertCurrency = (amountInIDR, targetCurrency) => {
    const value = Number(amountInIDR) || 0;
    if (targetCurrency === "IDR") return value;
    return value / (exchangeRates[targetCurrency] || 1);
  };
  const refreshRates = async () => {
    try {
      const result = await refetch();
      if (result.isError) throw result.error;
      toast.success("Kurs berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui kurs");
    }
  };

  const value = {
    currency, setCurrency, language, setLanguage, exchangeRates, convertCurrency,
    ratesLastUpdated: data?.updatedAt ? new Date(data.updatedAt).getTime() : null,
    isLoadingRates: isFetching, ratesError: error?.message ?? null,
    ratesSource: data?.source ?? "fallback", currencies: data?.currencies?.length ? data.currencies : FALLBACK_CURRENCIES, refreshRates,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
