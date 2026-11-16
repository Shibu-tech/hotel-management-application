'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  getAuthSessionUser,
  getApiBaseUrl,
  fetchHotelQrDestinationUrl,
  downloadHotelQrCode,
  copyHotelLoginUrl,
  type GmAssignedHotel,
} from '@/lib/hotelQrApi';
import { useDemo } from '@/lib/store';
import { HotelQrImage } from '@/components/shared/HotelQrImage';

export function GeneralManagerQrTab() {
  const { state } = useDemo();
  const isLight = state.theme === 'light';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedHotel, setAssignedHotel] = useState<GmAssignedHotel | null>(null);
  const [destinationUrl, setDestinationUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);

  const loadGmHotelData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQrLoaded(false);

    try {
      const user = getAuthSessionUser();

      // Check if user has an assigned hotel
      if (!user || !user.hotelId) {
        setAssignedHotel(null);
        setLoading(false);
        return;
      }

      const hotelId = Number(user.hotelId);
      const baseUrl = getApiBaseUrl();

      // Fetch verified hotel details from backend
      const res = await fetch(`${baseUrl}/hotels/${hotelId}/public`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to load hotel profile (HTTP ${res.status})`);
      }

      const hotelData = await res.json();
      setAssignedHotel({
        hotelId: hotelData.id,
        hotelName: hotelData.name,
        hotelSlug: hotelData.slug,
        active: hotelData.active,
      });

      // Fetch dynamic destination URL
      const url = await fetchHotelQrDestinationUrl(hotelId);
      setDestinationUrl(url);
    } catch (err: any) {
      setError(err.message || 'Unable to load assigned hotel QR information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGmHotelData();
  }, [loadGmHotelData]);

  const handleCopy = async () => {
    if (!destinationUrl) return;
    const ok = await copyHotelLoginUrl(destinationUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = async () => {
    if (!assignedHotel) return;
    setDownloading(true);
    try {
      await downloadHotelQrCode(assignedHotel.hotelId);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // State 1: Loading
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
          <QrCode className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Generating Property QR Code...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Retrieving assigned hotel tenant details from PostgreSQL
          </p>
        </div>
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
      </div>
    );
  }

  // State 2: No Hotel Assigned to this GM account
  if (!assignedHotel) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <div
          className={`rounded-3xl p-8 border text-center space-y-4 shadow-xl ${
            isLight
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-amber-950/20 border-amber-500/20 text-amber-100'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold">No Hotel Property Assigned</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your General Manager account does not currently have an assigned hotel property ID.
              Contact the Global Platform Administrator to link your profile to a registered hotel tenant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 3: API Error State
  if (error) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <div className="rounded-3xl p-8 border border-rose-500/20 bg-rose-500/10 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
          <h3 className="text-base font-bold text-rose-400">Failed to Load QR Information</h3>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={loadGmHotelData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const qrImageUrl = `${getApiBaseUrl()}/hotels/${assignedHotel.hotelId}/qr`;

  // State 4: Normal GM Hotel QR Code View
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-slate-900 dark:text-slate-100">
              My Hotel QR Code
            </h2>
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Unique dynamic QR code dedicated to your property. Guests scanning this code in-room or in the lobby are routed straight to your hotel&apos;s digital portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Assigned Property #{assignedHotel.hotelId}</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Card + Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Card */}
        <div className="lg:col-span-7 xl:col-span-6">
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-xl transition-all relative overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 shadow-slate-200/50'
                : 'bg-[#0b1426] border-white/10 shadow-black/60'
            }`}
          >
            {/* Header with Property Name and Badges */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                    {assignedHotel.hotelName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10">
                      ID #{assignedHotel.hotelId}
                    </span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="font-mono text-xs text-slate-400">
                      {assignedHotel.hotelSlug}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                  assignedHotel.active !== false
                    ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${assignedHotel.active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {assignedHotel.active !== false ? 'Active' : 'Suspended'}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="my-6 p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group">
              <HotelQrImage
                hotelId={assignedHotel.hotelId}
                destinationUrl={destinationUrl}
                size={220}
                showBadge={true}
              />
            </div>

            {/* Destination URL Display */}
            <div className="mb-6 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Hotel-Specific Login URL
              </label>
              <div
                className={`px-3.5 py-2.5 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-black/40 border-white/10 text-slate-200'
                }`}
              >
                <span className="truncate select-all font-medium">{destinationUrl}</span>
                <a
                  href={`/${assignedHotel.hotelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400 flex-shrink-0 flex items-center gap-1 text-xs font-sans font-semibold"
                  title="Test Scan in new tab"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Actions: Download & Copy Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-lg shadow-amber-900/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Downloading...' : 'Download QR Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm border transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Login URL'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Deployment Guides, and Security Info */}
        <div className="lg:col-span-5 xl:col-span-6 space-y-6">
          {/* Card 1: Guest Scan Workflow */}
          <div
            className={`rounded-3xl border p-6 space-y-4 shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0b1426] border-white/10'
            }`}
          >
            <div className="flex items-center gap-3 text-amber-500">
              <Smartphone className="w-5 h-5" />
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                How Guest QR Scanning Works
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              When guests arrive in their rooms or at the concierge desk, they scan your property&apos;s printed QR code with their mobile cameras.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Physical Placement</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Print the downloaded PNG on keycard holders, in-room desk placards, and lobby welcome signs.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Direct Property Binding</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    The URL permanently binds the guest browser to <strong className="text-amber-500">{assignedHotel.hotelName}</strong>.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Security & Authentication</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    The QR code identifies the property securely without embedding passwords or sensitive tokens.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Property Scope Protection */}
          <div
            className={`rounded-3xl border p-6 space-y-3 ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
              <span>Role-Based Tenant Isolation Verified</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              As General Manager, your dashboard strictly accesses only Hotel ID #{assignedHotel.hotelId}. Cross-tenant access is restricted at both the frontend and PostgreSQL row levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
