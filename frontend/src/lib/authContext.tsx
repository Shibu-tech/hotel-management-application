'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type AuthSessionUser,
  type BackendRole,
  changePasswordWithBackend,
  fetchCurrentSession,
  isDevQuickAccessEnabled,
  loginWithBackend,
  logoutFromBackend,
} from '@/lib/authApi';

/**
 * Strictly development-only, in-memory temporary credential entry.
 * NEVER persisted to localStorage, sessionStorage, cookies, URLs, or database.
 * Automatically cleared on page refresh or session end.
 */
export interface DevQuickAccessEntry {
  id: string;
  fullName: string;
  email: string;
  initialPassword: string;
  role: BackendRole;
  hotelName?: string | null;
  hotelSlug?: string | null;
  departmentName?: string | null;
  createdAtLabel: string;
}

interface AuthContextValue {
  user: AuthSessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthSessionUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthSessionUser>;
  refreshSession: () => Promise<AuthSessionUser | null>;
  revalidateSession: () => Promise<AuthSessionUser | null>;
  devQuickAccessEnabled: boolean;
  devQuickAccessEntries: DevQuickAccessEntry[];
  registerDevQuickAccessEntry: (entry: Omit<DevQuickAccessEntry, 'id' | 'createdAtLabel'>) => void;
  clearDevQuickAccessEntries: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_BROADCAST_CHANNEL = 'hotel-auth-session';
const DEV_QUICK_ACCESS_STORAGE_KEY = 'hotel_dev_quick_access_accounts_v1';

function readStoredDevEntries(): DevQuickAccessEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEV_QUICK_ACCESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredDevEntries(entries: DevQuickAccessEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (!entries || entries.length === 0) {
      window.localStorage.removeItem(DEV_QUICK_ACCESS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DEV_QUICK_ACCESS_STORAGE_KEY, JSON.stringify(entries));
    }
  } catch {
    // Ignore environments with restricted storage or quota limits
  }
}

function broadcastAuthEvent(type: 'LOGIN' | 'LOGOUT') {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.postMessage({ type });
    channel.close();
  } catch {
    // Ignore environments where BroadcastChannel is restricted
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const devEnabled = isDevQuickAccessEnabled();
  const [devEntries, setDevEntries] = useState<DevQuickAccessEntry[]>(() => {
    return devEnabled ? readStoredDevEntries() : [];
  });

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const current = await fetchCurrentSession();
      setUser(current);
      return current;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Silent session revalidation against backend /api/auth/me without flashing a full-screen spinner.
   * Immediately clears user state if the HttpOnly cookie was cleared or revoked (e.g. logout/back navigation).
   */
  const revalidateSession = useCallback(async () => {
    const current = await fetchCurrentSession();
    setUser(current);
    return current;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Re-verify session on browser bfcache restore (Back/Forward), tab focus, and cross-tab logout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void refreshSession();
      }
    };

    const handlePopState = () => {
      void revalidateSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void revalidateSession();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (devEnabled && e.key === DEV_QUICK_ACCESS_STORAGE_KEY) {
        setDevEntries(readStoredDevEntries());
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
        channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
          if (event.data?.type === 'LOGOUT') {
            setUser(null);
          } else if (event.data?.type === 'LOGIN') {
            void revalidateSession();
          }
        };
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) {
        channel.close();
      }
    };
  }, [devEnabled, refreshSession, revalidateSession]);

  const registerDevQuickAccessEntry = useCallback(
    (entry: Omit<DevQuickAccessEntry, 'id' | 'createdAtLabel'>) => {
      if (!devEnabled) return;
      const normalizedEmail = entry.email.trim().toLowerCase();
      const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDevEntries((prev) => {
        const filtered = prev.filter((e) => e.email.toLowerCase() !== normalizedEmail);
        const updated: DevQuickAccessEntry[] = [
          {
            ...entry,
            id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email: normalizedEmail,
            createdAtLabel: nowLabel,
          },
          ...filtered,
        ];
        writeStoredDevEntries(updated);
        return updated;
      });
    },
    [devEnabled],
  );

  const clearDevQuickAccessEntries = useCallback(() => {
    setDevEntries([]);
    writeStoredDevEntries([]);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthSessionUser> => {
      const sessionUser = await loginWithBackend(email, password);
      setUser(sessionUser);
      broadcastAuthEvent('LOGIN');
      // In development mode, record successfully authenticated session accounts in memory only
      // so developers can switch back to Admin/GM/Staff during the same tab session without storing anything permanently.
      if (devEnabled) {
        registerDevQuickAccessEntry({
          fullName: sessionUser.fullName,
          email: sessionUser.email,
          initialPassword: password,
          role: sessionUser.role,
          hotelName: sessionUser.hotelName,
          hotelSlug: sessionUser.hotelSlug,
          departmentName: sessionUser.departmentName,
        });
      }
      return sessionUser;
    },
    [devEnabled, registerDevQuickAccessEntry],
  );

  const logout = useCallback(async () => {
    await logoutFromBackend();
    setUser(null);
    broadcastAuthEvent('LOGOUT');
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthSessionUser> => {
      const updated = await changePasswordWithBackend(currentPassword, newPassword);
      setUser(updated);
      if (devEnabled) {
        registerDevQuickAccessEntry({
          fullName: updated.fullName,
          email: updated.email,
          initialPassword: newPassword,
          role: updated.role,
          hotelName: updated.hotelName,
          hotelSlug: updated.hotelSlug,
          departmentName: updated.departmentName,
        });
      }
      return updated;
    },
    [devEnabled, registerDevQuickAccessEntry],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      changePassword,
      refreshSession,
      revalidateSession,
      devQuickAccessEnabled: devEnabled,
      devQuickAccessEntries: devEnabled ? devEntries : [],
      registerDevQuickAccessEntry,
      clearDevQuickAccessEntries,
    }),
    [
      user,
      loading,
      login,
      logout,
      changePassword,
      refreshSession,
      revalidateSession,
      devEnabled,
      devEntries,
      registerDevQuickAccessEntry,
      clearDevQuickAccessEntries,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
