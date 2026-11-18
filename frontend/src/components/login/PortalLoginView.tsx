'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './portal-login.css';
import {
  Building2,
  RotateCcw,
  Sun,
  Moon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Check,
  Crown,
  Radio,
  BellRing,
  ClipboardCheck,
  FlaskConical,
  Trash2,
  Sparkles,
  HeartPulse,
  Wrench,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { DispatcherDepartment } from '@/types/demo';
import { useI18n } from '@/lib/i18n';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import {
  ApiError,
  getApiBaseUrl,
  requestForgotPassword,
  type BackendRole,
} from '@/lib/authApi';
import { useAuth, type DevQuickAccessEntry } from '@/lib/authContext';

export interface LockedHotelInfo {
  id: number;
  name: string;
  slug: string;
  active: boolean;
}

export interface PortalLoginViewProps {
  lockedHotel?: LockedHotelInfo;
}

export interface HotelOption {
  id: number;
  name: string;
  slug: string;
}

interface QuickFillItem {
  id: string;
  name: string;
  role: BackendRole;
  email: string;
  pass: string;
  hotelSlug: string | null; // null = global platform ADMIN
  departmentName?: string | null;
  icon: LucideIcon;
  accent: string;
  isSessionCreated?: boolean;
}

const DEFAULT_PUBLIC_HOTELS: HotelOption[] = [
  { id: 1, name: 'The Grand ADP', slug: 'grand-adp' },
  { id: 2, name: 'The Grand Palace Mumbai', slug: 'palace-mumbai' },
];

/**
 * Baseline autofill entries for testing/demo Quick Access panel.
 * Stripped when NEXT_PUBLIC_DEV_QUICK_ACCESS === 'false' (for live hotel rollout).
 * Strictly populates email & password inputs — NEVER bypasses backend BCrypt/JWT authentication.
 */
const DEV_BASELINE_ACCOUNTS: QuickFillItem[] =
  process.env.NEXT_PUBLIC_DEV_QUICK_ACCESS === 'false'
    ? []
    : [
      {
        id: 'dev-admin',
        name: 'Admin',
        role: 'ADMIN',
        email: 'admin@thegrandadp.com',
        pass: 'admin123',
        hotelSlug: null,
        icon: ShieldAlert,
        accent: 'from-purple-500 to-indigo-600',
      },
      {
        id: 'dev-grand-adp-gm',
        name: 'General Manager',
        role: 'GENERAL_MANAGER',
        email: 'gm@thegrandadp.com',
        pass: 'gm123',
        hotelSlug: 'grand-adp',
        icon: Crown,
        accent: 'from-amber-500 to-orange-600',
      },
      {
        id: 'dev-grand-adp-sup',
        name: 'Supervisor',
        role: 'SUPERVISOR',
        email: 'dispatcher@thegrandadp.com',
        pass: 'dispatch123',
        hotelSlug: 'grand-adp',
        icon: Radio,
        accent: 'from-sky-500 to-blue-600',
      },
      {
        id: 'dev-grand-adp-fd',
        name: 'Front Desk',
        role: 'FRONT_DESK',
        email: 'frontdesk@thegrandadp.com',
        pass: 'desk123',
        hotelSlug: 'grand-adp',
        icon: BellRing,
        accent: 'from-pink-500 to-rose-600',
      },
      {
        id: 'dev-grand-adp-ful',
        name: 'Fulfiller',
        role: 'FULFILLER',
        email: 'fulfiller@thegrandadp.com',
        pass: 'task123',
        hotelSlug: 'grand-adp',
        icon: ClipboardCheck,
        accent: 'from-emerald-500 to-teal-600',
      },
      {
        id: 'dev-mumbai-gm',
        name: 'General Manager',
        role: 'GENERAL_MANAGER',
        email: 'gm.mumbai@thegrandadp.com',
        pass: 'gm123',
        hotelSlug: 'palace-mumbai',
        icon: Crown,
        accent: 'from-amber-500 to-orange-600',
      },
    ];

function roleIcon(role: BackendRole): LucideIcon {
  switch (role) {
    case 'ADMIN':
      return ShieldAlert;
    case 'GENERAL_MANAGER':
      return Crown;
    case 'SUPERVISOR':
      return Radio;
    case 'FRONT_DESK':
      return BellRing;
    case 'FULFILLER':
    default:
      return ClipboardCheck;
  }
}

function roleAccent(role: BackendRole): string {
  switch (role) {
    case 'ADMIN':
      return 'from-purple-500 to-indigo-600';
    case 'GENERAL_MANAGER':
      return 'from-amber-500 to-orange-600';
    case 'SUPERVISOR':
      return 'from-sky-500 to-blue-600';
    case 'FRONT_DESK':
      return 'from-pink-500 to-rose-600';
    case 'FULFILLER':
    default:
      return 'from-emerald-500 to-teal-600';
  }
}

const ROLE_LABELS: Record<BackendRole, string> = {
  ADMIN: 'Admin',
  GENERAL_MANAGER: 'General Manager',
  SUPERVISOR: 'Supervisor',
  FRONT_DESK: 'Front Desk',
  FULFILLER: 'Fulfiller',
  GUEST: 'Guest',
};

const QUICK_DEPT_OPTIONS: Array<{
  slug: 'housekeeping' | 'wellness' | 'maintenance' | 'fnb';
  label: string;
  dispatcherDept: DispatcherDepartment;
  icon: LucideIcon;
}> = [
    { slug: 'housekeeping', label: 'Housekeeping', dispatcherDept: 'Housekeeping', icon: Sparkles },
    { slug: 'wellness', label: 'Spa & Wellness', dispatcherDept: 'Wellness', icon: HeartPulse },
    { slug: 'maintenance', label: 'Maintenance', dispatcherDept: 'Maintenance & Engineering', icon: Wrench },
    { slug: 'fnb', label: 'Food & Beverages', dispatcherDept: 'Food & Beverages', icon: UtensilsCrossed },
  ];

function deptSlugFromName(name?: string | null): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('well') || n.includes('spa')) return 'wellness';
  if (n.includes('maint') || n.includes('eng')) return 'maintenance';
  if (n.includes('food') || n.includes('bev') || n.includes('f&b') || n.includes('dining')) return 'fnb';
  if (n.includes('house')) return 'housekeeping';
  return null;
}

export function PortalLoginView({ lockedHotel }: PortalLoginViewProps = {}) {
  const router = useRouter();
  const { state, setTheme, setPersona, setCurrentHotelSlug, setActiveDispatcherDept } = useDemo();
  const { t } = useI18n();
  const {
    user: authenticatedUser,
    loading: authLoading,
    login,
    devQuickAccessEnabled,
    devQuickAccessEntries,
    clearDevQuickAccessEntries,
  } = useAuth();

  // Top Hotel Selector State (always shown in header; reflects dynamically added hotels)
  const [availableHotels, setAvailableHotels] = useState<HotelOption[]>(DEFAULT_PUBLIC_HOTELS);
  const [selectedHotelSlug, setSelectedHotelSlug] = useState<string>(
    lockedHotel?.slug || 'grand-adp',
  );

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedQuickId, setSelectedQuickId] = useState<string | null>(null);
  const [selectedQuickRole, setSelectedQuickRole] = useState<BackendRole | null>(null);
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<'housekeeping' | 'wellness' | 'maintenance' | 'fnb'>('housekeeping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  const isLight = state.theme === 'light';

  useEffect(() => {
    if (lockedHotel?.slug) {
      setSelectedHotelSlug(lockedHotel.slug);
    }
  }, [lockedHotel?.slug]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const htmlEl = document.documentElement;
    htmlEl.dataset.theme = state.theme;
    if (isLight) {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
    } else {
      htmlEl.classList.remove('light');
      htmlEl.classList.add('dark');
    }
  }, [isLight, state.theme]);

  const fetchPublicHotels = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/hotels/public-list`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data: HotelOption[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAvailableHotels(data);
          if (!lockedHotel && !data.some((h) => h.slug === selectedHotelSlug)) {
            setSelectedHotelSlug(data[0].slug);
          }
        }
      }
    } catch {
      // Keep default list when backend is temporarily unreachable
    }
  }, [lockedHotel, selectedHotelSlug]);

  useEffect(() => {
    fetchPublicHotels();
  }, [fetchPublicHotels]);

  // Combine session-created dev accounts + baseline dev accounts scoped to selected hotel (+ Global Admin)
  const visibleQuickAccounts = useMemo<QuickFillItem[]>(() => {
    if (!devQuickAccessEnabled) return [];

    const byEmail = new Map<string, QuickFillItem>();

    // 1. Add baseline dev accounts matching global ADMIN or selected hotel
    for (const item of DEV_BASELINE_ACCOUNTS) {
      if (item.hotelSlug === null || item.hotelSlug.toLowerCase() === selectedHotelSlug.toLowerCase()) {
        byEmail.set(item.email.toLowerCase(), item);
      }
    }

    // 2. Overlay any in-memory session-created/updated accounts (Admin/GM/Supervisor/Front Desk/Fulfiller)
    for (const entry of devQuickAccessEntries as DevQuickAccessEntry[]) {
      const matchesHotel =
        entry.role === 'ADMIN' ||
        !entry.hotelSlug ||
        entry.hotelSlug.toLowerCase() === selectedHotelSlug.toLowerCase();
      if (!matchesHotel) continue;

      byEmail.set(entry.email.toLowerCase(), {
        id: entry.id,
        name: entry.fullName || ROLE_LABELS[entry.role],
        role: entry.role,
        email: entry.email,
        pass: entry.initialPassword,
        hotelSlug: entry.hotelSlug ?? null,
        departmentName: entry.departmentName ?? null,
        icon: roleIcon(entry.role),
        accent: roleAccent(entry.role),
        isSessionCreated: true,
      });
    }

    const order: Record<BackendRole, number> = {
      ADMIN: 0,
      GENERAL_MANAGER: 1,
      SUPERVISOR: 2,
      FRONT_DESK: 3,
      FULFILLER: 4,
      GUEST: 5,
    };

    return Array.from(byEmail.values()).sort((a, b) => order[a.role] - order[b.role]);
  }, [devQuickAccessEnabled, devQuickAccessEntries, selectedHotelSlug]);

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setSelectedQuickId(null);
    setAuthError(null);
    setForgotNotice(null);
    setToastMessage('Form cleared');
  };

  const handleToggleTheme = () => {
    setTheme(isLight ? 'dark' : 'light');
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setForgotNotice(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setAuthError('Enter your email address first to request password reset guidance.');
      return;
    }
    try {
      const res = await requestForgotPassword(trimmed);
      setForgotNotice(res.message);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Unable to process password reset request.');
    }
  };

  /**
   * Quick Role Fill (Development Stage Helper).
   * ONLY puts Email & Password into the form inputs — NEVER auto-submits and NEVER bypasses backend auth.
   */
  const handleQuickFill = (item: QuickFillItem) => {
    if (!devQuickAccessEnabled) return;
    setAuthError(null);
    setForgotNotice(null);
    setSelectedQuickId(item.id);
    setSelectedQuickRole(item.role);
    setEmail(item.email);
    setPassword(item.pass);
    const derived = deptSlugFromName(item.departmentName);
    if (derived && (derived === 'housekeeping' || derived === 'wellness' || derived === 'maintenance' || derived === 'fnb')) {
      setSelectedDeptSlug(derived);
      const matched = QUICK_DEPT_OPTIONS.find((d) => d.slug === derived);
      if (matched) setActiveDispatcherDept(matched.dispatcherDept);
    }
    setToastMessage(`${ROLE_LABELS[item.role]} email & password filled — click Sign In.`);
  };

  const handleSelectQuickDept = (dept: (typeof QUICK_DEPT_OPTIONS)[number]) => {
    setSelectedDeptSlug(dept.slug);
    setActiveDispatcherDept(dept.dispatcherDept);
    setToastMessage(`Department set to ${dept.label} — click Sign In.`);
  };

  /**
   * Real backend authentication ONLY.
   * No offline fallback, no substring role inference, no client-side bypass.
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setAuthError(null);
    setForgotNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authUser = await login(cleanEmail, password);

      if (authUser.hotelSlug) {
        setCurrentHotelSlug(authUser.hotelSlug, authUser.hotelName || undefined);
      }

      if (authUser.role === 'GENERAL_MANAGER') {
        setPersona('general_manager');
      } else if (authUser.role === 'SUPERVISOR') {
        setPersona('department_dispatcher_supervisor');
      } else if (authUser.role === 'FRONT_DESK') {
        setPersona('front_desk_coordinator');
      } else if (authUser.role === 'FULFILLER') {
        setPersona('task_fulfiller');
      }

      let targetUrl = authUser.redirectUrl || '/login';
      if (authUser.role === 'SUPERVISOR' || authUser.role === 'FULFILLER') {
        const effectiveDept = deptSlugFromName(authUser.departmentName) || selectedDeptSlug;
        const matchedOpt = QUICK_DEPT_OPTIONS.find((d) => d.slug === effectiveDept);
        if (matchedOpt) {
          setActiveDispatcherDept(matchedOpt.dispatcherDept);
        }
        if (effectiveDept && !targetUrl.includes('dept=')) {
          targetUrl = `${targetUrl}?dept=${encodeURIComponent(effectiveDept)}`;
        }
      }

      setToastMessage(`Authenticated as ${authUser.fullName}. Redirecting...`);
      router.replace(targetUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else if (err instanceof TypeError) {
        setAuthError('Authentication server is unreachable. Please ensure the Spring Boot backend is running on port 8080.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent already-authenticated users from landing back on /login via browser Back/URL navigation.
  // Users must explicitly Sign Out from their dashboard to end their session.
  useEffect(() => {
    if (authLoading || isSubmitting || !authenticatedUser) return;
    let target = authenticatedUser.redirectUrl || '/';
    if (authenticatedUser.role === 'SUPERVISOR' || authenticatedUser.role === 'FULFILLER') {
      const derivedDept = deptSlugFromName(authenticatedUser.departmentName);
      if (derivedDept && !target.includes('dept=')) {
        target = `${target}?dept=${encodeURIComponent(derivedDept)}`;
      }
    }
    router.replace(target);
  }, [authLoading, isSubmitting, authenticatedUser, router]);

  const activeHotelName =
    availableHotels.find((h) => h.slug === selectedHotelSlug)?.name || selectedHotelSlug;

  if (!authLoading && authenticatedUser && !isSubmitting) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-6 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#080d1a] text-slate-100'}`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Lock className="w-7 h-7 text-amber-400" />
          <p className="text-sm font-medium">
            Active session detected ({authenticatedUser.email}). Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#E5C378] selection:text-slate-900 transition-colors duration-300 relative overflow-x-hidden portal-login-root ${isLight ? 'bg-slate-100 text-slate-900 light-mode' : 'bg-[#080d1a] text-slate-100 dark-mode'
        }`}
      data-theme={state.theme}
    >
      <div className="glow-sphere-1" />
      <div className="glow-sphere-2" />

      {/* Top Navigation Header */}
      <header
        className={`relative z-20 px-5 sm:px-10 py-3.5 sm:py-4 flex items-center justify-between portal-login-header ${isLight
            ? 'border-b border-slate-200/70 bg-[#ffffff]/80 backdrop-blur-md'
            : 'border-b border-white/10 bg-[#070c17]/80 backdrop-blur-md'
          }`}
      >
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfb96c] to-[#a47b31] text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-900/20 ring-1 ring-amber-300/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className={`font-bold text-[15px] tracking-wide block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              The Grand ADP
            </span>
            <span className={`text-[11px] block -mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Multi-Tenant Hospitality Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className={`hidden sm:inline-flex items-center gap-2 text-xs sm:text-[13px] px-3.5 py-2 rounded-xl transition-all portal-header-btn ${isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-400 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
              }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t('nav.publicSite')}</span>
          </Link>

          <LanguageSelector isLight={isLight} />

          <button
            type="button"
            id="resetDemoBtn"
            onClick={handleReset}
            title="Clear form"
            className={`inline-flex items-center gap-2 text-xs sm:text-[13px] px-3.5 py-2 rounded-xl transition-all cursor-pointer portal-header-btn ${isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-400 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
              }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('common.clear')}</span>
          </button>

          <button
            type="button"
            id="themeToggleBtn"
            onClick={handleToggleTheme}
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer portal-header-btn ${isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-300 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
              }`}
          >
            {isLight ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-[1140px] w-full mx-auto px-5 sm:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {/* Title & Minimal Top Hotel Selector Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1
              className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'
                }`}
            >
              Unified Portal Login
            </h1>
          </div>

          {/* Minimal Hotel Property Toggle Bar (Always visible, reflects newly added hotels) */}
          <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-amber-500">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hotel</span>
            </div>
            <div
              className={`flex flex-wrap items-center gap-1 p-1 rounded-2xl border backdrop-blur-md transition-all shadow-xs ${isLight ? 'bg-white border-slate-200/90' : 'bg-[#0c1424]/90 border-white/10'
                }`}
            >
              {availableHotels.map((hotel) => {
                const isSelected = selectedHotelSlug === hotel.slug;
                return (
                  <button
                    key={hotel.slug}
                    type="button"
                    onClick={() => {
                      setSelectedHotelSlug(hotel.slug);
                      setSelectedQuickId(null);
                    }}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-xs'
                        : isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <span>{hotel.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div
          className={
            devQuickAccessEnabled
              ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start'
              : 'max-w-md w-full mx-auto'
          }
        >
          {/* LEFT: Clean Login Form Card */}
          <section className={devQuickAccessEnabled ? 'lg:col-span-5 w-full' : 'w-full'}>
            <div
              className={`rounded-2xl p-6 sm:p-7 backdrop-blur-xl transition-all portal-card-left ${isLight
                  ? 'bg-[#ffffff]/95 border border-slate-200/80 shadow-xl shadow-slate-900/10'
                  : 'bg-[#0c1424]/90 border border-white/10 shadow-2xl shadow-black/50'
                }`}
            >
              <div
                className={`flex items-center justify-between pb-3.5 mb-5 border-b ${isLight ? 'border-slate-200/60' : 'border-white/5'
                  }`}
              >
                <h2
                  className={`text-xs sm:text-sm font-semibold tracking-wide uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                >
                  Sign In
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${isLight
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Backend Verified</span>
                </span>
              </div>

              {lockedHotel && (
                <div
                  className={`mb-4 p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                    }`}
                >
                  <span className="font-semibold">{lockedHotel.name}</span>
                  <span className="font-mono text-[11px]">ID #{lockedHotel.id}</span>
                </div>
              )}

              {authError && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {forgotNotice && (
                <div
                  role="status"
                  className="mb-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotNotice}</span>
                </div>
              )}

              <form id="loginForm" onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="emailInput"
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      id="emailInput"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@hotel-domain.com"
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400/70 focus:border-amber-400 transition-all portal-input ${isLight
                          ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200'
                          : 'bg-[#070d18] text-white placeholder-slate-500 border border-white/10'
                        }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="passwordInput"
                      className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="passwordInput"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400/70 focus:border-amber-400 transition-all portal-input ${isLight
                          ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200'
                          : 'bg-[#070d18] text-white placeholder-slate-500 border border-white/10'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="submitBtn"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-[#e2bc6b] via-[#d3a74d] to-[#c29136] text-slate-950 hover:from-[#ebd088] hover:to-[#d3a243] shadow-lg shadow-amber-900/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT: Minimal Quick Role Fill Panel (Dev Stage Only — Autofill Inputs Only, Never Bypasses Auth) */}
          {devQuickAccessEnabled && (
            <section className="lg:col-span-7 w-full" data-testid="dev-quick-access-panel">
              <div
                className={`rounded-2xl p-6 backdrop-blur-xl border transition-all portal-card-right ${isLight
                    ? 'bg-[#ffffff]/90 border-slate-200/80 shadow-sm'
                    : 'bg-[#0c1424]/75 border-white/10 shadow-sm'
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-200'
                        }`}
                    >
                      Quick Access (Dev) · {activeHotelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Fills inputs only &bull; Click Sign In
                    </span>
                    {devQuickAccessEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={clearDevQuickAccessEntries}
                        title="Clear session-created entries"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {visibleQuickAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 p-5 text-center text-xs text-slate-400">
                    No dev accounts cached for <strong>{activeHotelName}</strong> yet. Accounts created by Admin or GM during this session will appear here automatically.
                  </div>
                ) : (
                  <div id="roleGrid" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {visibleQuickAccounts.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedQuickId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleQuickFill(item)}
                          className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                              ? isLight
                                ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/50'
                                : 'bg-amber-500/10 border-amber-400/60 ring-1 ring-amber-400/30'
                              : isLight
                                ? 'bg-slate-50/90 hover:bg-white border-slate-200 hover:border-amber-300'
                                : 'bg-[#070d18]/80 hover:bg-white/[0.04] border-white/10 hover:border-amber-500/40'
                            }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.accent} text-white flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`font-semibold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'
                                  }`}
                              >
                                {item.name}
                              </span>
                              <span className="text-[10px] font-medium text-amber-400 shrink-0">
                                {ROLE_LABELS[item.role]}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                              {item.email}
                            </div>
                            {item.departmentName && (
                              <div className="text-[10px] text-sky-400 truncate">
                                {item.departmentName}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Minimal Department Selector when Supervisor or Fulfiller is chosen */}
                {(selectedQuickRole === 'SUPERVISOR' || selectedQuickRole === 'FULFILLER') && (
                  <div className="mt-3.5 pt-3.5 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                        Select Department ({ROLE_LABELS[selectedQuickRole]})
                      </span>
                      <span className="text-[10px] text-slate-400">Applies on Sign In</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {QUICK_DEPT_OPTIONS.map((dept) => {
                        const DeptIcon = dept.icon;
                        const active = selectedDeptSlug === dept.slug;
                        return (
                          <button
                            key={dept.slug}
                            type="button"
                            onClick={() => handleSelectQuickDept(dept)}
                            className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${active
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                                : isLight
                                  ? 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                                  : 'bg-[#070d18] hover:bg-white/[0.05] border-white/10 text-slate-300'
                              }`}
                          >
                            <DeptIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{dept.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0c1424]/95 border border-amber-500/30 text-amber-200 text-xs font-medium shadow-2xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
