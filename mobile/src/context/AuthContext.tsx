import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getProfile, loginUser, logoutUser, registerUser } from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/client';
import { getHealth } from '@/api/health';
import { clearToken, loadToken, saveToken } from '@/api/tokenStore';
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  UserProfile,
} from '@/types/api';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthValue = {
  status: AuthStatus;
  warmingUp: boolean;
  user: AuthUser | null;
  profile: UserProfile | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const WARMING_UP_DELAY_MS = 3000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [warmingUp, setWarmingUp] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const clearLocalSession = useCallback(async () => {
    await clearToken();
    queryClient.clear();
    setUser(null);
    setProfile(null);
    setStatus('signedOut');
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    const slowTimer = setTimeout(() => {
      if (active) setWarmingUp(true);
    }, WARMING_UP_DELAY_MS);

    // Wake up free-tier server on app start (best-effort)
    void getHealth().catch(() => undefined);

    loadToken()
      .then(async (token) => {
        if (!active) return;
        if (!token) {
          setStatus('signedOut');
          return;
        }
        try {
          const prof = await getProfile();
          if (!active) return;
          setProfile(prof);
          setUser({
            id: prof.id,
            name: prof.name,
            email: prof.email,
            avatar: prof.avatar,
          });
          setStatus('signedIn');
        } catch {
          if (!active) return;
          await clearLocalSession();
        }
      })
      .catch(() => {
        if (active) setStatus('signedOut');
      })
      .finally(() => {
        clearTimeout(slowTimer);
        if (active) setWarmingUp(false);
      });

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [clearLocalSession]);

  const signIn = useCallback(async (token: string, nextUser: AuthUser) => {
    await saveToken(token);
    setUser(nextUser);
    setStatus('signedIn');
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await loginUser(input);
      await saveToken(session.token);
      setUser(session.user);
      setStatus('signedIn');
      try {
        const prof = await getProfile();
        setProfile(prof);
      } catch {
        // Profile fetch is non-blocking after login
      }
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await registerUser(input);
      await saveToken(session.token);
      setUser(session.user);
      setStatus('signedIn');
      try {
        const prof = await getProfile();
        setProfile(prof);
      } catch {
        // Profile fetch is non-blocking after registration
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Best-effort server session revocation; local cleanup always runs
    } finally {
      await clearLocalSession();
    }
  }, [clearLocalSession]);

  const refreshProfile = useCallback(async () => {
    const prof = await getProfile();
    setProfile(prof);
    setUser({
      id: prof.id,
      name: prof.name,
      email: prof.email,
      avatar: prof.avatar,
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearLocalSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      warmingUp,
      user,
      profile,
      login,
      register,
      logout,
      signIn,
      signOut: logout,
      refreshProfile,
    }),
    [status, warmingUp, user, profile, login, register, logout, signIn, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
