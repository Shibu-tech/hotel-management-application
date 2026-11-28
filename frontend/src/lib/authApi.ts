/**
 * Centralized API client using HttpOnly cookie sessions + Double-Submit Cookie CSRF protection.
 * NEVER stores authentication tokens or passwords in localStorage or sessionStorage.
 */

export type BackendRole =
  | 'ADMIN'
  | 'GENERAL_MANAGER'
  | 'SUPERVISOR'
  | 'FRONT_DESK'
  | 'FULFILLER'
  | 'GUEST';

export interface AuthSessionUser {
  userId: number;
  email: string;
  fullName: string;
  role: BackendRole;
  employeeCode?: string | null;
  hotelId?: number | null;
  hotelName?: string | null;
  hotelSlug?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  mustChangePassword: boolean;
  redirectUrl: string;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/**
 * Strictly development-only feature flag.
 * Guaranteed false in production builds (NODE_ENV === 'production').
 * Enabled by default in local development unless NEXT_PUBLIC_DEV_QUICK_ACCESS === 'false'.
 */
export function isDevQuickAccessEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.NEXT_PUBLIC_DEV_QUICK_ACCESS !== 'false';
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach CSRF header for cookie-authenticated mutating requests
  if (MUTATING_METHODS.has(method)) {
    const xsrf = readCookie('XSRF-TOKEN');
    if (xsrf && !headers.has('X-XSRF-TOKEN')) {
      headers.set('X-XSRF-TOKEN', xsrf);
    }
  }

  return fetch(url, {
    ...init,
    method,
    headers,
    credentials: 'include',
    cache: init.cache ?? 'no-store',
  });
}

export async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const errObj = (parsed && typeof parsed === 'object') ? (parsed as Record<string, unknown>) : null;
    const message =
      (errObj && typeof errObj.message === 'string' && errObj.message) ||
      `Request failed (HTTP ${res.status})`;
    const fieldErrors =
      errObj && errObj.fieldErrors && typeof errObj.fieldErrors === 'object'
        ? (errObj.fieldErrors as Record<string, string>)
        : undefined;
    throw new ApiError(res.status, message, fieldErrors);
  }

  return parsed as T;
}

export async function loginWithBackend(email: string, password: string): Promise<AuthSessionUser> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  return parseApiJson<AuthSessionUser>(res);
}

export async function fetchCurrentSession(): Promise<AuthSessionUser | null> {
  try {
    const res = await apiFetch('/auth/me', { method: 'GET' });
    if (res.status === 401 || res.status === 403) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await parseApiJson<AuthSessionUser>(res);
  } catch {
    return null;
  }
}

export async function logoutFromBackend(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Even if network fails, client clears in-memory session state
  }
}

export async function changePasswordWithBackend(
  currentPassword: string,
  newPassword: string,
): Promise<AuthSessionUser> {
  const res = await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return parseApiJson<AuthSessionUser>(res);
}

export async function requestForgotPassword(email: string): Promise<{ message: string }> {
  const res = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  return parseApiJson<{ message: string }>(res);
}
