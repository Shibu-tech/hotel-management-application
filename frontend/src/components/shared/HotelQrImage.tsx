'use client';

import React, { useState, useEffect } from 'react';
import { QrCode as SvgQrCode } from '@/components/shared/QrCode';
import { fetchHotelQrCodeBlobUrl } from '@/lib/hotelQrApi';

interface HotelQrImageProps {
  hotelId: number;
  destinationUrl: string;
  size?: number;
  className?: string;
  showBadge?: boolean;
}

/**
 * Loads dynamic ZXing PNG from authenticated backend endpoint via HttpOnly cookie fetch.
 * Falls back cleanly to local SVG preview if backend image fetch fails.
 */
export function HotelQrImage({
  hotelId,
  destinationUrl,
  size = 180,
  className = '',
  showBadge = true,
}: HotelQrImageProps) {
  const [sourceStatus, setSourceStatus] = useState<'loading' | 'backend' | 'fallback'>('loading');
  const [backendImgUrl, setBackendImgUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    fetchHotelQrCodeBlobUrl(hotelId)
      .then((url) => {
        if (isMounted) {
          objectUrl = url;
          setBackendImgUrl(url);
          setSourceStatus('backend');
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSourceStatus('fallback');
        }
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hotelId]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="rounded-xl bg-white p-2 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden"
        style={{ width: size + 16, height: size + 16 }}
      >
        {sourceStatus === 'backend' ? (
          <img
            src={backendImgUrl}
            alt={`QR Code for Hotel ${hotelId}`}
            width={size}
            height={size}
            className="rounded-lg object-contain"
          />
        ) : (
          <SvgQrCode value={destinationUrl || `http://localhost:3000/${hotelId}`} size={size} />
        )}
      </div>

      {showBadge && (
        <div className="mt-2 text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              sourceStatus === 'backend' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>
            {sourceStatus === 'backend' ? 'ZXing PNG (Backend)' : 'Local Preview'}
          </span>
        </div>
      )}
    </div>
  );
}
