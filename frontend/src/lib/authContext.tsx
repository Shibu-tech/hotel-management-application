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
  devQuickAccessEnabled: boolean;
  devQuickAccessEntries: DevQuickAccessEntry[];
  registerDevQuickAccessEntry: (entry: Omit<DevQuickAccessEntry, 'id' | 'createdAtLabel'>) => void;
  clearDevQuickAccessEntries: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [devEntries, setDevEntries] = useState<DevQuickAccessEntry[]>([]);

  const devEnabled = isDevQuickAccessEnabled();

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

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const registerDevQuickAccessEntry = useCallback(
    (entry: Omit<DevQuickAccessEntry, 'id' | 'createdAtLabel'>) => {
      if (!devEnabled) return;
      const normalizedEmail = entry.email.trim().toLowerCase();
      const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDevEntries((prev) => {
        const filtered = prev.filter((e) => e.email.toLowerCase() !== normalizedEmail);
        return [
          {
            ...entry,
            id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email: normalizedEmail,
            createdAtLabel: nowLabel,
          },
          ...filtered,
        ];
      });
    },
    [devEnabled],
  );

  const clearDevQuickAccessEntries = useCallback(() => {
    setDevEntries([]);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthSessionUser> => {
      const sessionUser = await loginWithBackend(email, password);
      setUser(sessionUser);
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
