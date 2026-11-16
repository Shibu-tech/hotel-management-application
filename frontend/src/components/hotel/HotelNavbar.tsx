'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hotel, Loader2, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { HOTEL_NAME } from '@/lib/hotelCatalog';

interface HotelNavbarProps {
  onOpenBooking?: () => void;
  onOpenManage?: () => void;
  activeSection?: string;
}

export function HotelNavbar({ onOpenBooking, onOpenManage, activeSection }: HotelNavbarProps) {
  const { t } = useI18n();
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/login');
  }, [router]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-ink-950/85 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Hotel Page Logo on the left */}
        <Link href="/" className="group flex items-center gap-3" aria-label={`${HOTEL_NAME} Public Website`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-300/10 to-transparent border border-amber-500/30 dark:border-amber-300/30 text-amber-600 dark:text-amber-300 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Hotel className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-200 transition-colors">
              {HOTEL_NAME}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200/70 font-semibold">
              Resort & Residences
            </span>
          </div>
        </Link>

        {/* Actions on the right: Language Selection, Dark/Light Mode, Login Page Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector />
          <ThemeToggle />

          <Link
            href="/login"
            prefetch={true}
            onClick={() => setIsNavigatingToLogin(true)}
            onMouseEnter={() => router.prefetch('/login')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 dark:border-amber-300/30 bg-amber-500/10 dark:bg-amber-300/10 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:text-white hover:bg-amber-500 dark:hover:bg-amber-300/20 transition shadow-sm active:scale-95 cursor-pointer"
            title="Open Staff Portals & Simulated Demo Login"
          >
            {isNavigatingToLogin ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-300" aria-hidden />
                <span>Opening...</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" aria-hidden />
                <span>{t('nav.staffLogin')}</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
