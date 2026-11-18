'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Mail,
  LogOut,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Trash2,
  Database,
  QrCode,
  Download,
  Copy,
  Check,
  Edit3,
  KeyRound,
  Phone,
  MapPin,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { apiFetch, ApiError, parseApiJson } from '@/lib/authApi';
import { useAuth } from '@/lib/authContext';
import { downloadHotelQrCode, copyHotelLoginUrl, fetchHotelQrDestinationUrl } from '@/lib/hotelQrApi';
import { HotelQrImage } from '@/components/shared/HotelQrImage';

interface HotelRecord {
  id: number;
  name: string;
  slug: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  gmName: string;
  gmEmail: string;
  active: boolean;
  createdAt?: string;
}

interface OneTimeCredentialNotice {
  title: string;
  hotelName: string;
  hotelSlug: string;
  gmName: string;
  gmEmail: string;
  temporaryPassword: string;
}

function AdminDashboardContent() {
  const router = useRouter();
  const { state, setTheme } = useDemo();
  const { user, logout, registerDevQuickAccessEntry } = useAuth();
  const isLight = state.theme === 'light';

  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Hotel Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Hotel Modal State
  const [editingHotel, setEditingHotel] = useState<HotelRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation Modal State
  const [hotelToDelete, setHotelToDelete] = useState<HotelRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Modal State
  const [qrModalHotel, setQrModalHotel] = useState<HotelRecord | null>(null);
  const [qrDestinationUrl, setQrDestinationUrl] = useState('');
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);

  // One-time Initial/Reset Credentials Modal
  const [credentialNotice, setCredentialNotice] = useState<OneTimeCredentialNotice | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Add Hotel Form Fields (no weak hardcoded default password!)
  const [hotelName, setHotelName] = useState('');
  const [hotelSlug, setHotelSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gmName, setGmName] = useState('');
  const [gmEmail, setGmEmail] = useState('');
  const [password, setPassword] = useState('');

  const showToast = (msg: string) => setToastMessage(msg);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const fetchHotels = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const res = await apiFetch('/admin/hotels');
      const data = await parseApiJson<HotelRecord[]>(res);
      setHotels(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Unable to load hotels from server.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleNameChange = (name: string) => {
    setHotelName(name);
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setHotelSlug(generated);
  };

  const resetCreateForm = () => {
    setHotelName('');
    setHotelSlug('');
    setContactEmail('');
    setContactPhone('');
    setAddress('');
    setGmName('');
    setGmEmail('');
    setPassword('');
    setFormError(null);
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = hotelSlug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setFormError('Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (password.length < 8) {
      setFormError('Initial GM password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    const submittedPassword = password;
    const payload = {
      name: hotelName.trim(),
      slug: cleanSlug,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      address: address.trim() || undefined,
      gmName: gmName.trim(),
      gmEmail: gmEmail.trim().toLowerCase(),
      password: submittedPassword,
    };

    try {
      const res = await apiFetch('/admin/hotels', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const created = await parseApiJson<HotelRecord>(res);

      // Register in dev-only in-memory Quick Access (no-op in production)
      registerDevQuickAccessEntry({
        fullName: created.gmName,
        email: created.gmEmail,
        initialPassword: submittedPassword,
        role: 'GENERAL_MANAGER',
        hotelName: created.name,
        hotelSlug: created.slug,
      });

      setCredentialNotice({
        title: 'Hotel & Initial General Manager Created',
        hotelName: created.name,
        hotelSlug: created.slug,
        gmName: created.gmName,
        gmEmail: created.gmEmail,
        temporaryPassword: submittedPassword,
      });

      setIsModalOpen(false);
      resetCreateForm();
      showToast(`Hotel "${created.name}" provisioned successfully.`);
      await fetchHotels();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to create hotel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (hotel: HotelRecord) => {
    setEditingHotel(hotel);
    setEditName(hotel.name);
    setEditContactEmail(hotel.contactEmail || '');
    setEditContactPhone(hotel.contactPhone || '');
    setEditAddress(hotel.address || '');
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/admin/hotels/${editingHotel.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          contactEmail: editContactEmail.trim() || undefined,
          contactPhone: editContactPhone.trim() || undefined,
          address: editAddress.trim() || undefined,
        }),
      });
      const updated = await parseApiJson<HotelRecord>(res);
      setHotels((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      setEditingHotel(null);
      showToast(`Updated hotel "${updated.name}".`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update hotel.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (hotel: HotelRecord) => {
    try {
      const res = await apiFetch(`/admin/hotels/${hotel.id}/toggle-active`, {
        method: 'PATCH',
      });
      const updated = await parseApiJson<HotelRecord>(res);
      setHotels((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      showToast(
        updated.active
          ? `Hotel "${updated.name}" is now ACTIVE.`
          : `Hotel "${updated.name}" SUSPENDED. Staff sessions revoked.`,
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Unable to toggle hotel status.');
    }
  };

  const handleResetGmPassword = async (hotel: HotelRecord) => {
    try {
      const res = await apiFetch(`/admin/hotels/${hotel.id}/reset-gm-password`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data = await parseApiJson<{
        employee: { fullName: string; email: string };
        temporaryPassword: string;
      }>(res);

      registerDevQuickAccessEntry({
        fullName: data.employee.fullName,
        email: data.employee.email,
        initialPassword: data.temporaryPassword,
        role: 'GENERAL_MANAGER',
        hotelName: hotel.name,
        hotelSlug: hotel.slug,
      });

      setCredentialNotice({
        title: 'General Manager Password Reset',
        hotelName: hotel.name,
        hotelSlug: hotel.slug,
        gmName: data.employee.fullName,
        gmEmail: data.employee.email,
        temporaryPassword: data.temporaryPassword,
      });
      showToast(`Issued one-time temporary password for ${data.employee.email}.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reset GM password.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/admin/hotels/${hotelToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        await parseApiJson(res);
      }
      setHotels((prev) => prev.filter((h) => h.id !== hotelToDelete.id));
      showToast(`Deleted hotel "${hotelToDelete.name}".`);
      setHotelToDelete(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete hotel.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openQrModal = async (hotel: HotelRecord) => {
    setQrModalHotel(hotel);
    setCopiedQrUrl(false);
    try {
      const url = await fetchHotelQrDestinationUrl(hotel.id);
      setQrDestinationUrl(url);
    } catch {
      setQrDestinationUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}/${hotel.id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const filteredHotels = hotels.filter((h) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.slug.toLowerCase().includes(q) ||
      h.gmName.toLowerCase().includes(q) ||
      h.gmEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`min-h-screen transition-colors ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#060b16] text-slate-100'
      }`}
    >
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-5 sm:px-8 py-3.5 flex items-center justify-between ${
          isLight ? 'bg-white/90 border-slate-200' : 'bg-[#080f1e]/90 border-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-base sm:text-lg leading-tight">
              Platform Admin Dashboard
            </h1>
            <p className="text-[11px] text-slate-400">
              {user?.fullName} ({user?.email}) · Global Multi-Tenant Authority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className={`rounded-2xl p-5 border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1426] border-white/10'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Registered Hotels
            </div>
            <div className="text-3xl font-bold mt-1">{hotels.length}</div>
          </div>

          <div
            className={`rounded-2xl p-5 border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1426] border-white/10'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Active Properties
            </div>
            <div className="text-3xl font-bold mt-1 text-emerald-400">
              {hotels.filter((h) => h.active).length}
            </div>
          </div>

          <div
            className={`rounded-2xl p-5 border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0c1426] border-white/10'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Suspended Properties
            </div>
            <div className="text-3xl font-bold mt-1 text-rose-400">
              {hotels.filter((h) => !h.active).length}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hotels, slugs, or General Manager..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:border-amber-400 ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0c1426] border-white/10 text-white'
              }`}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchHotels}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hotel</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {loadError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={fetchHotels}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hotels Table */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0c1426] border-white/10'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className={`border-b text-[11px] uppercase tracking-wider ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/10 text-slate-400'}`}>
                  <th className="p-4 font-semibold">Hotel Property</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold">General Manager</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Created</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                      Loading registered hotels from PostgreSQL...
                    </td>
                  </tr>
                ) : filteredHotels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      No hotels found. Click &ldquo;Add New Hotel&rdquo; to provision a property tenant.
                    </td>
                  </tr>
                ) : (
                  filteredHotels.map((hotel) => (
                    <tr key={hotel.id} className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.02]'}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold">{hotel.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">/{hotel.slug} · ID #{hotel.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-400 space-y-0.5">
                        {hotel.contactEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            <span>{hotel.contactEmail}</span>
                          </div>
                        )}
                        {hotel.contactPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            <span>{hotel.contactPhone}</span>
                          </div>
                        )}
                        {!hotel.contactEmail && !hotel.contactPhone && <span>—</span>}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>{hotel.gmName}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-400">{hotel.gmEmail}</div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            hotel.active
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {hotel.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-slate-400">
                        {hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openQrModal(hotel)}
                            title="View Property QR"
                            className="p-2 rounded-lg border border-white/10 hover:border-amber-400/50 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(hotel)}
                            title="Edit Hotel Info"
                            className="p-2 rounded-lg border border-white/10 hover:border-sky-400/50 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetGmPassword(hotel)}
                            title="Reset GM Password"
                            className="p-2 rounded-lg border border-white/10 hover:border-purple-400/50 text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(hotel)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                              hotel.active
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {hotel.active ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setHotelToDelete(hotel)}
                            title="Delete Hotel"
                            className="p-2 rounded-lg border border-rose-500/25 text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Backed by authenticated PostgreSQL APIs. Stored passwords are BCrypt-hashed and never displayed.</span>
        </div>
      </main>

      {/* Add New Hotel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0b1325] border-white/15'
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div>
                <h2 className="text-lg font-serif font-bold">Add New Hotel Tenant</h2>
                <p className="text-xs text-slate-400">
                  Creates the hotel property and provisions its initial General Manager atomically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateHotel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={hotelName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Azure Grand Resort"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hotel Slug *</label>
                  <input
                    type="text"
                    required
                    value={hotelSlug}
                    onChange={(e) => setHotelSlug(e.target.value.toLowerCase())}
                    placeholder="azure-grand-resort"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email (Optional)</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="frontdesk@hotel.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone (Optional)</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 555-0100"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Address (Optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Oceanfront Blvd"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Initial General Manager Account
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">General Manager Name *</label>
                    <input
                      type="text"
                      required
                      value={gmName}
                      onChange={(e) => setGmName(e.target.value)}
                      placeholder="Priya Deshmukh"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">General Manager Email *</label>
                    <input
                      type="email"
                      required
                      value={gmEmail}
                      onChange={(e) => setGmEmail(e.target.value)}
                      placeholder="gm@azuregrand.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Initial Temporary Password * (min 8 chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter initial temporary password"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      GM will be required to change this temporary password on first sign-in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Provisioning...' : 'Create Hotel & Provision GM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hotel Modal */}
      {editingHotel && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#0b1325] border-white/15'}`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <h2 className="text-base font-serif font-bold">Edit Hotel Information</h2>
              <button type="button" onClick={() => setEditingHotel(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateHotel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hotel Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060c18] border-white/10 text-white'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingHotel(null)} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time Temporary Credentials Notice Modal */}
      {credentialNotice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0b1325] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-white">{credentialNotice.title}</h2>
                <p className="text-[11px] text-amber-300">
                  Shown ONCE only. Stored hashed with BCrypt — cannot be retrieved again.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#060c18] border border-white/10 p-4 space-y-2 text-xs">
              <div><span className="text-slate-400">Hotel:</span> <strong className="text-white">{credentialNotice.hotelName}</strong> ({credentialNotice.hotelSlug})</div>
              <div><span className="text-slate-400">GM Name:</span> <strong className="text-white">{credentialNotice.gmName}</strong></div>
              <div><span className="text-slate-400">GM Email:</span> <strong className="font-mono text-amber-300">{credentialNotice.gmEmail}</strong></div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400 block">Temporary Password:</span>
                  <code className="text-sm font-mono font-bold text-emerald-400">{credentialNotice.temporaryPassword}</code>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await copyHotelLoginUrl(credentialNotice.temporaryPassword);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCredentialNotice(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property QR Modal */}
      {qrModalHotel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b1325] p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold">{qrModalHotel.name}</h2>
                <p className="text-xs text-slate-400">Property QR Code · ID #{qrModalHotel.id}</p>
              </div>
              <button type="button" onClick={() => setQrModalHotel(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <HotelQrImage hotelId={qrModalHotel.id} destinationUrl={qrDestinationUrl} size={190} />

            <div className="rounded-xl bg-[#060c18] border border-white/10 p-3 text-xs font-mono text-amber-300 truncate">
              {qrDestinationUrl}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await copyHotelLoginUrl(qrDestinationUrl);
                  setCopiedQrUrl(true);
                  setTimeout(() => setCopiedQrUrl(false), 2000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 cursor-pointer"
              >
                {copiedQrUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedQrUrl ? 'Copied URL' : 'Copy URL'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadHotelQrCode(qrModalHotel.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {hotelToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0b1325] p-6 shadow-2xl space-y-4 text-slate-100">
            <h2 className="text-lg font-serif font-bold text-rose-400">Delete Hotel Tenant?</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently remove <strong>{hotelToDelete.name}</strong> ({hotelToDelete.slug}) along with its staff accounts, departments, floors, and rooms from PostgreSQL.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setHotelToDelete(null)} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-slate-300 cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0c1424]/95 border border-amber-500/30 text-amber-200 text-xs font-medium shadow-2xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
