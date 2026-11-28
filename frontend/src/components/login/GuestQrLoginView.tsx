'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './portal-login.css';
import {
  Building2,
  Sun,
  Moon,
  QrCode,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Smartphone,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { ApiError } from '@/lib/authApi';
import {
  fetchGuestSession,
  loginGuestWithIdentifier,
  type GuestSessionInfo,
} from '@/lib/guestAuthApi';
import type { LockedHotelInfo } from '@/components/login/PortalLoginView';

export interface GuestQrLoginViewProps {
  hotel: LockedHotelInfo;
}

export function GuestQrLoginView({ hotel }: GuestQrLoginViewProps) {
  const router = useRouter();
  const { state, setTheme, setCurrentHotelSlug } = useDemo();
  const isLight = state.theme === 'light';

  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorTone, setErrorTone] = useState<'error' | 'warning'>('error');
  const [existingSession, setExistingSession] = useState<GuestSessionInfo | null>(null);

  useEffect(() => {
    let active = true;
    fetchGuestSession().then((res) => {
      if (!active) return;
      if (res.status === 'active' && res.session.hotelId === hotel.id) {
        setExistingSession(res.session);
      } else {
        setExistingSession(null);
      }
    });
    return () => {
      active = false;
    };
  }, [hotel.id]);

  const handleToggleTheme = useCallback(() => {
    setTheme(isLight ? 'dark' : 'light');
  }, [isLight, setTheme]);

  const handleResumeSession = useCallback(() => {
    if (!existingSession) return;
    setCurrentHotelSlug(existingSession.hotelSlug, existingSession.hotelName);
    router.replace(existingSession.redirectUrl);
  }, [existingSession, router, setCurrentHotelSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorTone('error');

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMsg('Please enter the phone number or email registered at Front Desk.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginGuestWithIdentifier(hotel.id, trimmed);
      setCurrentHotelSlug(session.hotelSlug, session.hotelName);
      router.replace(session.redirectUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setErrorTone('warning');
          setErrorMsg(
            err.message ||
              'Your stay has not been checked in yet. Please visit Front Desk to activate room access.',
          );
        } else {
          setErrorTone('error');
          setErrorMsg(
            err.message ||
              'No active checked-in room matches this phone number or email. Access ends automatically at checkout.',
          );
        }
      } else {
        setErrorTone('error');
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Unable to verify stay details right now. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#E5C378] selection:text-slate-900 transition-colors duration-300 relative overflow-x-hidden portal-login-root ${
        isLight ? 'bg-slate-100 text-slate-900 light-mode' : 'bg-[#080d1a] text-slate-100 dark-mode'
      }`}
      data-theme={state.theme}
    >
      <div className="glow-sphere-1" />
      <div className="glow-sphere-2" />

      {/* Minimal Property Header */}
      <header
        className={`relative z-20 px-5 sm:px-10 py-3.5 sm:py-4 flex items-center justify-between portal-login-header ${
          isLight
            ? 'border-b border-slate-200/70 bg-[#ffffff]/80 backdrop-blur-md'
            : 'border-b border-white/10 bg-[#070c17]/80 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfb96c] to-[#a47b31] text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-900/20 ring-1 ring-amber-300/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className={`font-bold text-[15px] tracking-wide block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {hotel.name}
            </span>
            <span className={`text-[11px] block -mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Guest QR Access · Property #{hotel.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageSelector isLight={isLight} />
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer portal-header-btn ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-300 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
            }`}
          >
            {isLight ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Centered Minimal Guest Login Card */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto px-5 py-10 flex flex-col justify-center">
        <div
          className={`rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all portal-card-left ${
            isLight
              ? 'bg-[#ffffff]/95 border border-slate-200/85 shadow-xl shadow-slate-900/10'
              : 'bg-[#0c1424]/90 border border-white/10 shadow-2xl shadow-black/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-5">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isLight
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-400/25'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Room Check-In
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              No password needed
            </span>
          </div>

          <h1
            className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            Welcome to {hotel.name}
          </h1>
          <p
            className={`mt-2 text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            Enter the phone number or email address registered with Front Desk to open your room portal.
          </p>

          {existingSession && (
            <div
              className={`mt-5 rounded-2xl p-3.5 border flex items-center justify-between gap-3 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-100'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Active Room Session</span>
                </div>
                <p className="text-xs font-medium truncate mt-0.5">
                  {existingSession.guestName} · Room {existingSession.roomNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={handleResumeSession}
                className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-3 py-2 transition-colors cursor-pointer"
              >
                Open Room {existingSession.roomNumber}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="guest-qr-identifier"
                className={`block text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Email or Phone Number
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  id="guest-qr-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="+91 98765 43210 or guest@email.com"
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm border outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-slate-950/70 border-white/15 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                  }`}
                />
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className={`rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2.5 border ${
                  errorTone === 'warning'
                    ? isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-500/10 border-amber-400/30 text-amber-200'
                    : isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
                }`}
              >
                {errorTone === 'warning' ? (
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                ) : errorMsg.toLowerCase().includes('checkout') ? (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#E5C378] via-[#d4af5e] to-[#c29743] hover:brightness-105 text-slate-950 font-bold text-sm shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{submitting ? 'Verifying Room Access...' : 'Continue to Room Portal'}</span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div
            className={`mt-6 pt-5 border-t flex items-center justify-between text-[11px] ${
              isLight ? 'border-slate-200/80 text-slate-500' : 'border-white/10 text-slate-400'
            }`}
          >
            <span>Access ends automatically at checkout</span>
            <Link
              href="/login"
              className={`font-semibold hover:underline ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
