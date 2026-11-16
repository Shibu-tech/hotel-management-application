'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Mail,
  ExternalLink,
  LogOut,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Trash2,
  Database,
  Radio,
  BellRing,
  ClipboardCheck,
  Smartphone,
  ChevronDown,
  QrCode,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { HotelQrImage } from '@/components/shared/HotelQrImage';

interface HotelRecord {
  id: number;
  name: string;
  slug: string;
  gmName: string;
  gmEmail: string;
  active: boolean;
  createdAt: string;
}

const DEFAULT_HOTELS: HotelRecord[] = [
  {
    id: 1,
    name: 'The Grand ADP (Flagship)',
    slug: 'grand-adp',
    gmName: 'Alexander Wright',
    gmEmail: 'gm@thegrandadp.com',
    active: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 2,
    name: 'The Grand Palace Mumbai',
    slug: 'palace-mumbai',
    gmName: 'Rajesh Singhania',
    gmEmail: 'gm.mumbai@thegrandadp.com',
    active: true,
    createdAt: '2026-03-01T10:30:00Z',
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { state, setTheme } = useDemo();
  const isLight = state.theme === 'light';

  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: true,
    message: 'Neon PostgreSQL Connected (AWS ap-southeast-1)',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Hotel Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [hotelToDelete, setHotelToDelete] = useState<HotelRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [hotelName, setHotelName] = useState('');
  const [hotelSlug, setHotelSlug] = useState('');
  const [gmName, setGmName] = useState('');
  const [gmEmail, setGmEmail] = useState('');
  const [password, setPassword] = useState('gm123');

  // Quick Role Launch Dropdown State
  const [activeDropdownHotelId, setActiveDropdownHotelId] = useState<number | null>(null);

  // Auth User check
  const [adminUser, setAdminUser] = useState<{ email: string; fullName: string; role: string } | null>(null);

  // QR Code States & Handlers
  const [copiedHotelId, setCopiedHotelId] = useState<number | null>(null);
  const [qrModalHotel, setQrModalHotel] = useState<HotelRecord | null>(null);

  const getDestinationUrl = (hotelId: number) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${hotelId}`;
    }
    return `http://localhost:3000/${hotelId}`;
  };

  const handleCopyUrl = async (hotelId: number) => {
    const url = getDestinationUrl(hotelId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedHotelId(hotelId);
      showToast(`Copied QR destination URL: ${url}`);
      setTimeout(() => setCopiedHotelId(null), 2500);
    } catch {
      showToast(`Failed to copy: ${url}`);
    }
  };

  const handleDownloadQr = async (hotel: HotelRecord) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/hotels/${hotel.id}/qr/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to download (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `hotel-${hotel.id}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      showToast(`Downloaded QR Code: hotel-${hotel.id}-qr.png`);
    } catch (err: any) {
      showToast(err.message || 'Download failed');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  };

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchHotels = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/admin/hotels`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: HotelRecord[] = await res.json();
      setHotels(data);
      setDbStatus({
        connected: true,
        message: 'Neon PostgreSQL Connected (Tables: hotels, users)',
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_cached_hotels', JSON.stringify(data));
      }
    } catch {
      // Fallback to local storage or defaults for smooth local dev / offline preview
      setDbStatus({
        connected: false,
        message: 'Local Cache Mode (Start Spring Boot backend on 8080 to sync Neon)',
      });
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('admin_cached_hotels');
        if (cached) {
          try {
            setHotels(JSON.parse(cached));
          } catch {
            setHotels(DEFAULT_HOTELS);
          }
        } else {
          setHotels(DEFAULT_HOTELS);
        }
      } else {
        setHotels(DEFAULT_HOTELS);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('authUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAdminUser(parsed);
        } catch {
          setAdminUser({ email: 'admin@thegrandadp.com', fullName: 'Global Administrator', role: 'ADMIN' });
        }
      } else {
        setAdminUser({ email: 'admin@thegrandadp.com', fullName: 'Global Administrator', role: 'ADMIN' });
      }
    }
    fetchHotels();
  }, [fetchHotels]);

  // Auto-slugify when hotel name changes if user hasn't typed a custom slug
  const handleNameChange = (name: string) => {
    setHotelName(name);
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setHotelSlug(generated);
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = hotelSlug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setFormError('Slug must contain only lowercase letters, numbers, and hyphens (e.g. azure-resort)');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: hotelName.trim(),
      slug: cleanSlug,
      gmName: gmName.trim(),
      gmEmail: gmEmail.trim().toLowerCase(),
      password: password.trim(),
    };

    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/admin/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to create hotel (HTTP ${res.status})`);
      }

      const created: HotelRecord = await res.json();
      setHotels((prev) => [created, ...prev]);
      if (typeof window !== 'undefined') {
        const updated = [created, ...hotels];
        localStorage.setItem('admin_cached_hotels', JSON.stringify(updated));
        // Remove old tenant local storage if any, so it starts fresh!
        localStorage.removeItem(`hotel_tenant_${cleanSlug}_v1`);
      }

      showToast(`Fresh Hotel Tenant "${created.name}" created dynamically in Neon DB!`);
      setIsModalOpen(false);
      resetForm();
      fetchHotels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating hotel tenant';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        const mockCreated: HotelRecord = {
          id: Date.now(),
          name: payload.name,
          slug: payload.slug,
          gmName: payload.gmName,
          gmEmail: payload.gmEmail,
          active: true,
          createdAt: new Date().toISOString(),
        };
        const updated = [mockCreated, ...hotels];
        setHotels(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_cached_hotels', JSON.stringify(updated));
          localStorage.removeItem(`hotel_tenant_${payload.slug}_v1`);
        }
        showToast(`[Local Mode] Hotel "${mockCreated.name}" registered cleanly!`);
        setIsModalOpen(false);
        resetForm();
      } else {
        setFormError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Dynamically delete a hotel tenant and its staff users from Neon DB
   */
  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;
    setIsDeleting(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/admin/hotels/${hotelToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to delete hotel (HTTP ${res.status})`);
      }

      // Remove from state and local caches
      setHotels((prev) => prev.filter((h) => h.id !== hotelToDelete.id));
      if (typeof window !== 'undefined') {
        const updated = hotels.filter((h) => h.id !== hotelToDelete.id);
        localStorage.setItem('admin_cached_hotels', JSON.stringify(updated));
        localStorage.removeItem(`hotel_tenant_${hotelToDelete.slug}_v1`);
      }

      showToast(`Hotel "${hotelToDelete.name}" permanently deleted from database.`);
      setHotelToDelete(null);
      fetchHotels();
    } catch {
      // Local fallback
      setHotels((prev) => prev.filter((h) => h.id !== hotelToDelete.id));
      if (typeof window !== 'undefined') {
        const updated = hotels.filter((h) => h.id !== hotelToDelete.id);
        localStorage.setItem('admin_cached_hotels', JSON.stringify(updated));
        localStorage.removeItem(`hotel_tenant_${hotelToDelete.slug}_v1`);
      }
      showToast(`Hotel "${hotelToDelete.name}" removed.`);
      setHotelToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Dynamically toggle hotel active status
   */
  const handleToggleActive = async (hotel: HotelRecord) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/admin/hotels/${hotel.id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const updated: HotelRecord = await res.json();
        setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, active: updated.active } : h)));
        showToast(`Hotel "${hotel.name}" status updated to ${updated.active ? 'Active' : 'Suspended'}`);
      } else {
        // Local toggle fallback
        setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, active: !h.active } : h)));
        showToast(`Hotel "${hotel.name}" status updated.`);
      }
    } catch {
      setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, active: !h.active } : h)));
      showToast(`Hotel "${hotel.name}" status toggled.`);
    }
  };

  const resetForm = () => {
    setHotelName('');
    setHotelSlug('');
    setGmName('');
    setGmEmail('');
    setPassword('gm123');
    setFormError(null);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    router.push('/login');
  };

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.gmEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.gmName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#E5C378] selection:text-slate-900 transition-colors duration-300 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#070c18] text-slate-100'
        }`}
    >
      {/* Top Admin Header */}
      <header
        className={`sticky top-0 z-30 px-6 sm:px-10 py-4 flex items-center justify-between border-b backdrop-blur-md ${isLight
            ? 'border-slate-200 bg-white/80 shadow-xs'
            : 'border-white/10 bg-[#091122]/85 shadow-lg'
          }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 ring-1 ring-amber-300/40">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base tracking-tight">The Grand ADP</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                Global Platform Admin
              </span>
            </div>
            <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Multi-Tenant Hotel Architecture &middot; <code className="font-mono text-[11px] text-amber-500">hotel_id = NULL</code>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            title="Toggle Theme"
          >
            {isLight ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-300" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-2 text-xs sm:text-[13px] font-medium px-3.5 py-2 rounded-xl transition-all border cursor-pointer ${isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50'
              }`}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-[1340px] mx-auto px-5 sm:px-8 py-8 sm:py-10">
        {/* Welcome & Stats Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              Tenant & Hotel Directory
            </h1>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Manage active properties, provision new hotel tenants with clean operational slates, and remove hotels dynamically from Neon DB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#hotel-qr-section"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border border-amber-500/30 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Hotel QR Codes</span>
            </a>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-md shadow-amber-900/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hotel</span>
            </button>
          </div>
        </div>

        {/* Database Status & Global Admin Details Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Admin User Card */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${isLight
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm">
                  Admin: <span className="font-mono">{adminUser?.email || 'admin@thegrandadp.com'}</span>
                </div>
                <div className="text-[11px] opacity-80">
                  Global Tenant Scope &bull; <code className="font-mono">hotel_id = NULL</code>
                </div>
              </div>
            </div>

            <div className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-medium">
              Hotels: <strong>{hotels.length}</strong>
            </div>
          </div>

          {/* Neon Database Status Card */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${isLight
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>Neon Database Status</span>
                </div>
                <div className="text-[11px] opacity-80">
                  {dbStatus.message}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchHotels}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isLight ? 'border-emerald-300 bg-white hover:bg-emerald-100' : 'border-emerald-500/30 bg-black/30 hover:bg-black/50'
                }`}
              title="Sync & Refresh Database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Controls: Search and Refresh */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by hotel, slug, or GM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#091122] border-white/10 text-white placeholder-slate-500'
                }`}
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong>{filteredHotels.length}</strong> of {hotels.length} hotels
          </div>
        </div>

        {/* Hotels Table */}
        <div
          className={`rounded-2xl border overflow-visible transition-all shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-[#0b1426] border-white/10'
            }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/5 text-slate-400'
                    }`}
                >
                  <th className="py-3.5 px-5">Hotel Property</th>
                  <th className="py-3.5 px-5">Tenant Slug</th>
                  <th className="py-3.5 px-5">General Manager</th>
                  <th className="py-3.5 px-5">GM Email</th>
                  <th className="py-3.5 px-5">QR Code</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Data Mode</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      Loading active hotel tenants from Neon PostgreSQL...
                    </td>
                  </tr>
                ) : filteredHotels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No hotel tenants found matching &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredHotels.map((hotel) => {
                    const isFlagship = hotel.slug === 'grand-adp';
                    const isMenuOpen = activeDropdownHotelId === hotel.id;

                    return (
                      <tr
                        key={hotel.id}
                        className={`transition-colors ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.02]'
                          }`}
                      >
                        <td className="py-4 px-5 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                {hotel.name}
                              </span>
                              <span className="text-[10px] text-slate-400">ID #{hotel.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                            {hotel.slug}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{hotel.gmName}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono text-xs">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{hotel.gmEmail}</span>
                          </div>
                        </td>

                        {/* Inline QR Code Column */}
                        <td className="py-3 px-5">
                          <button
                            type="button"
                            onClick={() => setQrModalHotel(hotel)}
                            className="p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer flex items-center gap-2 group"
                            title="Click to view full QR code and destination details"
                          >
                            <HotelQrImage
                              hotelId={hotel.id}
                              destinationUrl={getDestinationUrl(hotel.id)}
                              size={44}
                              showBadge={false}
                            />
                            <div className="text-left hidden lg:block pr-1">
                              <span className="text-[11px] font-mono text-amber-500 font-bold block group-hover:underline">
                                /{hotel.id}
                              </span>
                              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">
                                View QR
                              </span>
                            </div>
                          </button>
                        </td>

                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(hotel)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${hotel.active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/25'
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${hotel.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {hotel.active ? 'Active' : 'Suspended'}
                          </button>
                        </td>

                        <td className="py-4 px-5 text-xs">
                          {isFlagship ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20 text-[11px] font-medium">
                              Showcase Demo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-medium">
                              Fresh Clean Slate
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right relative">
                          <div className="inline-flex items-center gap-2">
                            {/* Role Consoles Dropdown Launch Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveDropdownHotelId(isMenuOpen ? null : hotel.id)}
                                className={`p-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${isLight
                                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                  }`}
                              >
                                <span>Launch Console</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isMenuOpen && (
                                <div
                                  className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl p-1.5 shadow-2xl border z-50 text-left animate-in fade-in zoom-in-95 duration-150 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0d1629] border-white/15 text-slate-100'
                                    }`}
                                >
                                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-white/5 mb-1">
                                    Hotel Role Views
                                  </div>
                                  <Link
                                    href={`/hotel/${hotel.slug}/gm`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-500/15 hover:text-amber-500 transition-colors"
                                  >
                                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                                    <span>GM Command Center</span>
                                  </Link>
                                  <Link
                                    href={`/hotel/${hotel.slug}/supervisor`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-sky-500/15 hover:text-sky-500 transition-colors"
                                  >
                                    <Radio className="w-3.5 h-3.5 text-sky-500" />
                                    <span>Supervisor Console</span>
                                  </Link>
                                  <Link
                                    href={`/hotel/${hotel.slug}/front-desk`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-pink-500/15 hover:text-pink-500 transition-colors"
                                  >
                                    <BellRing className="w-3.5 h-3.5 text-pink-500" />
                                    <span>Front Desk Console</span>
                                  </Link>
                                  <Link
                                    href={`/hotel/${hotel.slug}/fulfiller`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-500/15 hover:text-emerald-500 transition-colors"
                                  >
                                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Fulfiller App</span>
                                  </Link>
                                  <Link
                                    href={`/hotel/${hotel.slug}/guest`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-cyan-500/15 hover:text-cyan-500 transition-colors"
                                  >
                                    <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>Guest Portal</span>
                                  </Link>
                                </div>
                              )}
                            </div>

                            {/* View QR Code Button */}
                            <button
                              type="button"
                              onClick={() => setQrModalHotel(hotel)}
                              className={`p-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${isLight
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
                                }`}
                              title="View & Download Hotel QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5 text-amber-500" />
                              <span className="hidden sm:inline">QR Code</span>
                            </button>

                            {/* Delete / Remove Hotel Button */}
                            <button
                              type="button"
                              onClick={() => setHotelToDelete(hotel)}
                              className={`p-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${isLight
                                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                  : 'bg-rose-950/30 border-rose-800/40 text-rose-400 hover:bg-rose-900/50'
                                }`}
                              title="Delete hotel tenant from database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Hotel QR Codes Management Section */}
        <section id="hotel-qr-section" className="mt-12 mb-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                  Hotel QR Code Management
                </h2>
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Every hotel registered in PostgreSQL has a unique dynamic QR code generated via ZXing. Scanning routes directly to the hotel&apos;s verified guest portal.
              </p>
            </div>

            <div className="text-xs px-3 py-1.5 rounded-xl border font-mono flex items-center gap-2 text-slate-400 bg-white/5 border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pattern: <code>{'{BASE_URL}'}/{'{hotelId}'}</code></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 border rounded-2xl border-dashed border-white/10">
                No registered hotels to display QR codes for.
              </div>
            ) : (
              filteredHotels.map((hotel) => {
                const destinationUrl = getDestinationUrl(hotel.id);
                const qrImageUrl = `${getApiUrl()}/hotels/${hotel.id}/qr`;
                const isCopied = copiedHotelId === hotel.id;

                return (
                  <div
                    key={hotel.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-xl ${isLight
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-[#0b1426] border-white/10 shadow-black/40'
                      }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-base sm:text-lg leading-snug text-slate-900 dark:text-slate-100">
                            {hotel.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                              Hotel ID: {hotel.id}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${hotel.active ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${hotel.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {hotel.active ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10">
                          {hotel.slug}
                        </span>
                      </div>

                      {/* QR Code Image Preview */}
                      <div className="relative my-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group">
                        <HotelQrImage
                          hotelId={hotel.id}
                          destinationUrl={destinationUrl}
                          size={168}
                          showBadge={true}
                        />
                      </div>

                      {/* QR Destination URL Display */}
                      <div className="mb-4">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          QR Destination
                        </label>
                        <div
                          className={`px-3 py-2 rounded-xl border font-mono text-xs truncate flex items-center justify-between gap-2 ${isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : 'bg-black/30 border-white/10 text-slate-300'
                            }`}
                          title={destinationUrl}
                        >
                          <span className="truncate">{destinationUrl}</span>
                          <a
                            href={`/${hotel.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex-shrink-0"
                            title="Open scanned page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Download QR & Copy URL */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => handleDownloadQr(hotel)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isLight
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600'
                            : 'bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] text-slate-950 border-amber-500/40 shadow-sm'
                          }`}
                        title="Download high-resolution PNG QR file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyUrl(hotel.id)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isCopied
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                              : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                          }`}
                        title="Copy QR destination URL to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Provision New Hotel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 border shadow-2xl transition-all relative ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0d1629] border-white/15 text-slate-100'
              }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Provision New Fresh Hotel Tenant</h2>
                <p className="text-xs text-slate-400">
                  Creates hotel tenant with clean slate &amp; provisions its General Manager atomically in Neon DB.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateHotel} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                  Hotel Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Grand Azure Goa"
                  value={hotelName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#070c18] border-white/10 text-white'
                    }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                  Hotel Slug (Tenant Identifier) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-xs">
                    /hotel/
                  </span>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9-]+$"
                    placeholder="azure-goa"
                    value={hotelSlug}
                    onChange={(e) => setHotelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className={`w-full pl-16 pr-3.5 py-2.5 font-mono text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#070c18] border-white/10 text-white'
                      }`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 block mb-3">
                  Initial General Manager Account
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                      GM Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Singhania"
                      value={gmName}
                      onChange={(e) => setGmName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#070c18] border-white/10 text-white'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                      GM Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="gm.goa@thegrandadp.com"
                      value={gmEmail}
                      onChange={(e) => setGmEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#070c18] border-white/10 text-white'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#070c18] border-white/10 text-white'
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium border cursor-pointer ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Fresh Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {hotelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl p-6 sm:p-7 border shadow-2xl transition-all relative ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0d1629] border-white/15 text-slate-100'
              }`}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-500">Delete Hotel Tenant</h3>
                <p className="text-xs text-slate-400">Permanent removal from Neon Database</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm mb-6 leading-relaxed text-slate-400">
              Are you sure you want to permanently delete <strong className="text-slate-100">{hotelToDelete.name}</strong> (<code className="font-mono text-xs">{hotelToDelete.slug}</code>)?
              <br /><br />
              This action will remove the hotel record and all associated staff accounts from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-white/5">
              <button
                type="button"
                onClick={() => setHotelToDelete(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium border cursor-pointer ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotel QR Code Focus Modal */}
      {qrModalHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl p-6 sm:p-7 border shadow-2xl transition-all relative ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0d1629] border-white/15 text-slate-100'
              }`}
          >
            <button
              type="button"
              onClick={() => setQrModalHotel(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {qrModalHotel.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-amber-500 font-semibold">
                    Hotel ID #{qrModalHotel.id}
                  </span>
                  <span className="text-slate-400 text-xs">&bull;</span>
                  <span className="font-mono text-xs text-slate-400">
                    {qrModalHotel.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Centered QR Image */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center">
              <HotelQrImage
                hotelId={qrModalHotel.id}
                destinationUrl={getDestinationUrl(qrModalHotel.id)}
                size={210}
                showBadge={true}
              />
            </div>

            {/* Destination URL */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Destination URL
              </label>
              <div
                className={`p-2.5 rounded-xl border font-mono text-xs flex items-center justify-between gap-2 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/30 border-white/10 text-slate-200'
                  }`}
              >
                <span className="truncate">{getDestinationUrl(qrModalHotel.id)}</span>
                <a
                  href={`/${qrModalHotel.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400"
                  title="Test Scan / Open"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 dark:border-white/5">
              <button
                type="button"
                onClick={() => handleDownloadQr(qrModalHotel)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyUrl(qrModalHotel.id)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${copiedHotelId === qrModalHotel.id
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
              >
                {copiedHotelId === qrModalHotel.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHotelId === qrModalHotel.id ? 'Copied URL!' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
