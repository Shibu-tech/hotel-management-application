import { apiFetch, fetchCurrentSession, getApiBaseUrl, type AuthSessionUser } from '@/lib/authApi';

export type { AuthSessionUser };
export { getApiBaseUrl };

export interface HotelSummary {
  id: number;
  name: string;
  slug: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  gmName?: string;
  gmEmail?: string;
  active: boolean;
  createdAt?: string;
}

export interface HotelQrUrlInfo {
  hotelId: number;
  url: string;
}

export interface GmAssignedHotel {
  hotelId: number;
  hotelName: string;
  hotelSlug: string;
  active?: boolean;
}

export async function fetchAllHotels(): Promise<HotelSummary[]> {
  const res = await apiFetch('/admin/hotels');
  if (!res.ok) {
    throw new Error(`Failed to fetch hotels (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function fetchHotelQrDestinationUrl(hotelId: number): Promise<string> {
  const res = await apiFetch(`/hotels/${hotelId}/qr/url`);
  if (!res.ok) {
    throw new Error(`Failed to load hotel QR URL (HTTP ${res.status})`);
  }
  const data: HotelQrUrlInfo = await res.json();
  return data.url;
}

export async function fetchHotelQrCodeBlobUrl(hotelId: number): Promise<string> {
  const res = await apiFetch(`/hotels/${hotelId}/qr`, {
    headers: { Accept: 'image/png' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load QR code image (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function downloadHotelQrCode(hotelId: number): Promise<void> {
  const res = await apiFetch(`/hotels/${hotelId}/qr/download`, {
    headers: { Accept: 'image/png' },
  });
  if (!res.ok) {
    throw new Error(`Failed to download QR code (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `hotel-${hotelId}-qr.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export async function copyHotelLoginUrl(url: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

export async function getAuthenticatedGmAssignedHotel(): Promise<GmAssignedHotel | null> {
  const user = await fetchCurrentSession();
  if (!user || user.role !== 'GENERAL_MANAGER' || !user.hotelId) {
    return null;
  }

  const res = await apiFetch(`/hotels/${user.hotelId}/public`);
  if (res.ok) {
    const data = await res.json();
    return {
      hotelId: data.id,
      hotelName: data.name,
      hotelSlug: data.slug,
      active: data.active,
    };
  }

  return {
    hotelId: user.hotelId,
    hotelName: user.hotelName || 'Assigned Hotel Property',
    hotelSlug: user.hotelSlug || '',
    active: true,
  };
}
