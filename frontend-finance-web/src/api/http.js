import axios from "axios";
import { normalizeError } from "./errors.js";
import { tokenStore } from "./tokenStore.js";

const env = import.meta.env ?? {};

/** Saat development, set VITE_API_URL=/api/v1 agar lewat proxy Vite (tanpa masalah CORS). */
export const API_BASE_URL = env.VITE_API_URL || "/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

let onUnauthorized = null;
/** Daftarkan fungsi yang dipanggil saat server membalas 401 (mis. logout dan arahkan ke Login). */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = normalizeError(error);
    if (apiError.status === 401 && apiError.code === "UNAUTHORIZED") {
      tokenStore.clear();
      if (onUnauthorized) onUnauthorized(apiError);
    }
    return Promise.reject(apiError);
  },
);
