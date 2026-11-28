import { apiFetch, parseApiJson } from './authApi.ts';

export interface UpsertStayPayload {
  roomNumber: string;
  floor?: number;
  typeTag?: string;
  typeFull?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  category: 'arriving' | 'in_house' | 'departing';
  readiness?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  bookingRef?: string;
  folioBalance?: string;
  vip?: boolean;
}

export interface MoveStayPayload {
  fromRoomNumber: string;
  toRoomNumber: string;
  toFloor?: number;
  toTypeTag?: string;
  toTypeFull?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  vip?: boolean;
}

export async function syncHotelStay(slug: string, payload: UpsertStayPayload): Promise<unknown> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/stays`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res);
}

export async function checkInHotelStay(slug: string, roomNumber: string): Promise<unknown> {
  const res = await apiFetch(
    `/hotels/${encodeURIComponent(slug)}/stays/${encodeURIComponent(roomNumber)}/check-in`,
    { method: 'POST' },
  );
  return parseApiJson(res);
}

export async function checkOutHotelStay(slug: string, roomNumber: string): Promise<unknown> {
  const res = await apiFetch(
    `/hotels/${encodeURIComponent(slug)}/stays/${encodeURIComponent(roomNumber)}/check-out`,
    { method: 'POST' },
  );
  return parseApiJson(res);
}

export async function moveHotelStay(slug: string, payload: MoveStayPayload): Promise<unknown> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/stays/move`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res);
}
