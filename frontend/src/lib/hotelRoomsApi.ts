import type { RoomTileData } from '@/lib/inventoryRooms';

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

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
};

/**
 * Fetch inventory (rooms and floors) from Neon PostgreSQL backend
 */
export async function fetchHotelInventory(slug: string): Promise<BackendInventoryResponse | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/hotels/${encodeURIComponent(slug)}/rooms`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    // If backend is unreachable, gracefully return null
    return null;
  }
}

/**
 * Add a room to the backend database
 */
export async function addHotelRoom(slug: string, payload: CreateRoomPayload): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/hotels/${encodeURIComponent(slug)}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete a room from the backend database
 */
export async function deleteHotelRoom(slug: string, roomNo: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/hotels/${encodeURIComponent(slug)}/rooms/${encodeURIComponent(roomNo)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Add a floor to the backend database
 */
export async function addHotelFloor(slug: string, payload: CreateFloorPayload): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/hotels/${encodeURIComponent(slug)}/floors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete a floor from the backend database
 */
export async function deleteHotelFloor(slug: string, floor: number): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/hotels/${encodeURIComponent(slug)}/floors/${floor}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
