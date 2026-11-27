import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "../src/context/ThemeContext";
import { AppProvider } from "../src/context/AppContext";
import { AuthProvider } from "../src/context/AuthContext";

export function renderWithProviders(ui, { route = "/" } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <QueryClientProvider client={client}>
          <AuthProvider>
            <AppProvider>{ui}<Toaster /></AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
  return { ...utils, client };
}

export const cat = (id, name, type, color = "#22c55e") => ({ id, name, type, color });
export const tx = (id, over = {}) => ({
  id, type: "expense", amount: 45000, transactionDate: "2026-10-16", description: "Makan siang",
  source: "manual", category: { id: "c-food", name: "Food", color: "#ef4444" }, createdAt: "2026-10-16T05:12:00Z", ...over,
});
