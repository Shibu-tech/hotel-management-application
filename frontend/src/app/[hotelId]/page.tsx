'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Home,
} from 'lucide-react';
import { PortalLoginView, LockedHotelInfo } from '@/components/login/PortalLoginView';
import { getApiBaseUrl } from '@/lib/authApi';

export default function HotelGuestScanPage() {
  const params = useParams();
  const router = useRouter();
  const rawHotelId = params?.hotelId as string;

  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'invalid_id' | 'not_found' | 'inactive' | 'network' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hotel, setHotel] = useState<LockedHotelInfo | null>(null);

  useEffect(() => {
    if (!rawHotelId) return;

    // 1. Validate ID format (must be a positive integer)
    const parsedId = Number(rawHotelId);
    if (isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
      setErrorType('invalid_id');
      setErrorMessage(`The scanned hotel identifier "${rawHotelId}" is invalid. Expected a positive numeric hotel ID.`);
      setLoading(false);
      return;
    }

    // 2. Call backend to verify hotel exists and is active
    let isMounted = true;
    const verifyHotel = async () => {
      setLoading(true);
      setErrorType(null);

      try {
        const res = await fetch(`${getApiBaseUrl()}/hotels/${parsedId}/public`, {
          headers: { Accept: 'application/json' },
        });

        if (res.status === 404) {
          if (isMounted) {
            setErrorType('not_found');
            setErrorMessage(`Hotel ID #${parsedId} was not found in our directory. Please confirm the QR code with hotel staff.`);
          }
          return;
        }

        if (!res.ok) {
          if (isMounted) {
            setErrorType('network');
            setErrorMessage(`Unable to verify hotel property (Server responded with HTTP ${res.status}).`);
          }
          return;
        }

        const data: LockedHotelInfo = await res.json();

        if (isMounted) {
          // 3. Check if hotel is active
          if (!data.active) {
            setHotel(data);
            setErrorType('inactive');
            setErrorMessage(`The hotel property "${data.name}" (ID #${data.id}) is currently suspended or inactive.`);
            return;
          }

          // Verified & Active
          setHotel(data);
          setErrorType(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorType('network');
          setErrorMessage('Could not connect to the hotel backend verification service. Please verify your connection.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyHotel();

    return () => {
      isMounted = false;
    };
  }, [rawHotelId]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#040810] text-slate-100">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-amber-100">
            Verifying Hotel Property...
          </h2>
          <p className="text-xs text-slate-400">
            Validating Hotel ID #{rawHotelId} with Neon database records.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-amber-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Connecting to verified guest portal</span>
          </div>
        </div>
      </div>
    );
  }

  // Error States (Invalid ID, 404 Not Found, Inactive Hotel, Network failure)
  if (errorType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#040810] text-slate-100">
        <div className="max-w-lg w-full rounded-3xl p-8 border border-white/10 bg-[#091122]/90 shadow-2xl backdrop-blur-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border shadow-lg">
            {errorType === 'inactive' ? (
              <div className="w-full h-full rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 mb-1">
              QR Verification Notice
            </div>
            <h1 className="text-2xl font-serif font-bold text-white">
              {errorType === 'inactive'
                ? 'Hotel Property Inactive'
                : errorType === 'not_found'
                ? 'Hotel Not Found'
                : errorType === 'invalid_id'
                ? 'Invalid Hotel Code'
                : 'Connection Error'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {hotel && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs space-y-1">
              <div className="text-slate-400">Property: <strong className="text-white">{hotel.name}</strong></div>
              <div className="text-slate-400">Hotel ID: <strong className="font-mono text-amber-400">#{hotel.id}</strong></div>
              <div className="text-slate-400">Status: <span className="text-rose-400 font-semibold">Suspended</span></div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shadow-md shadow-amber-900/20"
            >
              <Building2 className="w-4 h-4" />
              <span>General Portal Login</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Valid & Active Hotel: render hotel-specific login portal
  return <PortalLoginView lockedHotel={hotel!} />;
}
