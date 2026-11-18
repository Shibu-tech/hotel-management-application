'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { ApiError, type BackendRole } from '@/lib/authApi';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: BackendRole[];
  requiredHotelSlug?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredHotelSlug,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, logout, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040810] text-slate-200 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
          <p className="text-sm font-medium text-slate-300">Verifying authenticated session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040810] text-slate-200 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Lock className="w-7 h-7 text-amber-400" />
          <p className="text-sm text-slate-300">Redirecting to portal login...</p>
        </div>
      </div>
    );
  }

  const roleAllowed = allowedRoles.includes(user.role);
  const tenantAllowed =
    !requiredHotelSlug ||
    user.role === 'ADMIN' ||
    (user.hotelSlug !== null &&
      user.hotelSlug !== undefined &&
      user.hotelSlug.toLowerCase() === requiredHotelSlug.toLowerCase());

  if (!roleAllowed || !tenantAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040810] text-slate-100 p-6">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-[#0b1326] p-8 text-center shadow-2xl space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-white">Access Denied</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {!tenantAllowed
                ? 'You are not authorized to access another hotel property.'
                : 'Your role does not have permission to view this dashboard.'}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-slate-300 space-y-1">
            <div>
              Signed in as: <strong className="text-white">{user.email}</strong>
            </div>
            <div>
              Role: <strong className="text-amber-400">{user.role}</strong>
              {user.hotelSlug ? ` · Hotel: ${user.hotelSlug}` : ''}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
            <Link
              href={user.redirectUrl || '/login'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to My Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forced password change gate on first login or after password reset
  if (user.mustChangePassword) {
    const handleForcedChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setPwError(null);
      if (newPassword.length < 8) {
        setPwError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwError('New password and confirmation do not match.');
        return;
      }
      setPwSubmitting(true);
      try {
        await changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: unknown) {
        setPwError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to change password.');
      } finally {
        setPwSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040810] text-slate-100 p-6">
        <div className="max-w-md w-full rounded-3xl border border-amber-500/30 bg-[#0b1326] p-8 shadow-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-white">Password Change Required</h1>
              <p className="text-xs text-slate-400">
                Set a new personal password before accessing your workspace.
              </p>
            </div>
          </div>

          {pwError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handleForcedChange} className="space-y-4">
            <div>
              <label htmlFor="forcedCurrentPw" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current / Temporary Password
              </label>
              <input
                id="forcedCurrentPw"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c1a] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label htmlFor="forcedNewPw" className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password (min 8 characters)
              </label>
              <input
                id="forcedNewPw"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c1a] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label htmlFor="forcedConfirmPw" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                id="forcedConfirmPw"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c1a] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace('/login');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={pwSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition disabled:opacity-50 cursor-pointer"
              >
                {pwSubmitting ? 'Updating...' : 'Update Password & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
