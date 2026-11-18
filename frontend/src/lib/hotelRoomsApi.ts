import type { RoomTileData } from '@/lib/inventoryRooms';
import { apiFetch } from '@/lib/authApi';

export interface BackendFloorDto {
  floor: number;
  name: string;
  wing: string;
}

export interface BackendInventoryResponse {
  hotelSlug: string;
  hotelName: string;
  allRooms: RoomTileData[];
  floors: number[];
  floorInfo: Record<number, BackendFloorDto>;
}

export interface CreateRoomPayload {
  roomNumber: string;
  floor: number;
  typeTag?: string;
  typeFull?: string;
  readiness?: string;
  occupied?: boolean;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  pin?: string;
}

export interface CreateFloorPayload {
  floor: number;
  name?: string;
  wing?: string;
}

/**
 * Fetch inventory (rooms and floors) from authenticated backend endpoint.
 */
export async function fetchHotelInventory(slug: string): Promise<BackendInventoryResponse | null> {
  try {
    const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/rooms`, {
      method: 'GET',
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export async function addHotelRoom(slug: string, payload: CreateRoomPayload): Promise<boolean> {
  try {
    const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/rooms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteHotelRoom(slug: string, roomNo: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/rooms/${encodeURIComponent(roomNo)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function addHotelFloor(slug: string, payload: CreateFloorPayload): Promise<boolean> {
  try {
    const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/floors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteHotelFloor(slug: string, floor: number): Promise<boolean> {
  try {
    const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/floors/${floor}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
