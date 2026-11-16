'use client';

import { HotelNavbar } from '@/components/hotel/HotelNavbar';
import { quickLinkById } from '@/lib/roles';
import { accentVars } from '@/lib/utils';

export function HotelWebsite() {
  const link = quickLinkById.site;

  return (
    <div
      style={accentVars(link)}
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-mist-100 selection:bg-amber-400/30 selection:text-white transition-colors"
    >
      {/* Header / Navbar: Logo on left, language selector, dark/light mode, and login button on right */}
      <HotelNavbar />

      {/* Main Content Area: completely clean without welcome card or buttons */}
      <main className="flex-1" />
    </div>
  );
}
