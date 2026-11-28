import { apiFetch, parseApiJson } from './authApi.ts';

export interface GuestSessionInfo {
  hotelId: number;
  hotelName: string;
  hotelSlug: string;
  roomNumber: string;
  roomType?: string | null;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  bookingRef?: string | null;
  vip?: boolean;
  redirectUrl: string;
}

export type GuestSessionCheckResult =
  | { status: 'active'; session: GuestSessionInfo }
  | { status: 'revoked'; message: string }
  | { status: 'error' };

export async function loginGuestWithIdentifier(
  hotelId: number,
  identifier: string,
): Promise<GuestSessionInfo> {
  const res = await apiFetch('/guest-auth/login', {
    method: 'POST',
    body: JSON.stringify({
      hotelId,
      identifier: identifier.trim(),
    }),
  });
  return parseApiJson<GuestSessionInfo>(res);
}

export async function fetchGuestSession(): Promise<GuestSessionCheckResult> {
  try {
    const res = await apiFetch('/guest-auth/session', { method: 'GET' });
    if (res.ok) {
      const session = await parseApiJson<GuestSessionInfo>(res);
      return { status: 'active', session };
    }
    if (res.status === 401 || res.status === 403) {
      let msg = 'Your stay has ended. Room portal access has been revoked.';
      try {
        const data = await res.json();
        if (data && typeof data.message === 'string' && data.message) {
          msg = data.message;
        }
      } catch {
        // Use default revocation message
      }
      return { status: 'revoked', message: msg };
    }
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export async function checkoutGuestPortalSession(): Promise<void> {
  const res = await apiFetch('/guest-auth/checkout', { method: 'POST' });
  await parseApiJson(res);
}

export async function logoutGuestPortalSession(): Promise<void> {
  try {
    await apiFetch('/guest-auth/logout', { method: 'POST' });
  } catch {
    // Ignore transient network errors on logout
  }
}
