import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../api/services/auth.js";
import { setUnauthorizedHandler } from "../api/http.js";
import { tokenStore } from "../api/tokenStore.js";
import { healthService } from "../api/services/health.js";

const AuthContext = createContext(null);

/**
 * Status sesi: loading (memeriksa token), signedOut, signedIn, error (server tidak terjangkau saat start).
 * Token JWT disimpan lewat tokenStore; identitas pengguna selalu berasal dari GET /profile.
 */
export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(() => (tokenStore.get() ? "loading" : "signedOut"));
  const [user, setUser] = useState(null);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    setUser(null);
    setStatus("signedOut");
  }, [queryClient]);

  // 401 dari server di mana pun: keluar dan kembali ke Login.
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Verifikasi token saat aplikasi dibuka.
  useEffect(() => {
    if (status !== "loading") return undefined;
    let cancelled = false;
    authService
      .profile()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus("signedIn");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 401) clearSession();
        else setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [status, clearSession]);

  useEffect(() => { healthService.check().catch(() => undefined); }, []);

  const establish = useCallback((result) => {
    tokenStore.set(result.token);
    setUser(result.user);
    setStatus("signedIn");
    return result.user;
  }, []);

  const login = useCallback(async (email, password) => establish(await authService.login({ email, password })), [establish]);
  const register = useCallback(async (body) => establish(await authService.register(body)), [establish]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* tetap keluar di sisi klien walau panggilan gagal */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try { await authService.logoutAll(); } finally { clearSession(); }
  }, [clearSession]);

  const updateProfile = useCallback(async (body) => {
    const profile = await authService.updateProfile(body);
    setUser(profile);
    queryClient.setQueryData(["profile"], profile);
    return profile;
  }, [queryClient]);

  const changePassword = useCallback(async (body) => {
    const result = await authService.changePassword(body);
    if (result?.token) tokenStore.set(result.token);
    return result;
  }, []);

  const retry = useCallback(() => setStatus("loading"), []);

  const value = useMemo(
    () => ({ status, user, isAuthenticated: status === "signedIn", login, register, logout, logoutAll, updateProfile, changePassword, retry }),
    [status, user, login, register, logout, logoutAll, updateProfile, changePassword, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
