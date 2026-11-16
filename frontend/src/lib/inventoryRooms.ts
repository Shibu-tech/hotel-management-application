import type { DemoState, Readiness, RoomRecord, StayRecord } from '@/types/demo';

export interface RoomTileData {
  no: string;
  floor: number;
  readiness: Readiness;
  occupied: boolean;
  dnd: boolean;
  typeTag: string;
  typeFull: string;
  statusLabel: string;
  statusKind: 'ready' | 'occupied' | 'dirty' | 'cleaning' | 'dnd' | 'checkin' | 'checkout' | 'post_departure';
  badgeStatus: 'READY' | 'OCCUPIED' | 'INSPECTION PENDING' | 'CLEANING' | 'OUT_OF_ORDER';
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  bookingRef?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  guestsCount?: number;
  vipTier?: string;
  folioBalance?: string;
  preferences?: string;
  previousGuest?: string;
  checkoutTime?: string;
  cleanerAssigned?: string;
  cleaningCategory?: 'guest_request' | 'cycle' | 'post_departure';
  cycleInfo?: { dueDay: string; cycleDays: number; isOverdue: boolean; nextScheduled: string };
  vip?: boolean;
  stay?: StayRecord;
  pin: string;
}

export interface RoomInventorySeed {
  no: string;
  floor: number;
  typeTag: string;
  typeFull: string;
  readiness: Readiness;
  occupied: boolean;
  dnd?: boolean;
  badgeStatus: 'READY' | 'OCCUPIED' | 'INSPECTION PENDING' | 'CLEANING' | 'OUT_OF_ORDER';
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  bookingRef?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  guestsCount?: number;
  vipTier?: string;
  folioBalance?: string;
  preferences?: string;
  cleanerAssigned?: string;
  cleaningCategory?: 'guest_request' | 'cycle' | 'post_departure';
  vip?: boolean;
}

export const DEFAULT_FLOOR_INFO: Record<number, { name: string; wing: string }> = {
  1: { name: 'FLOOR 1', wing: 'North Garden Wing' },
  2: { name: 'FLOOR 2', wing: 'Central Atrium Wing' },
  3: { name: 'FLOOR 3', wing: 'East Garden Wing' },
  4: { name: 'FLOOR 4', wing: 'Executive Suites Wing' },
  5: { name: 'FLOOR 5', wing: 'Penthouse & Presidential Suites' },
};

export const BASE_ROOM_INVENTORY_27: RoomInventorySeed[] = [
  // Floor 1 (1 room)
  {
    no: '127',
    floor: 1,
    typeTag: 'TWN',
    typeFull: 'Deluxe Twin',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Hannah Weiss',
    guestPhone: '+1 (555) 349-8821',
    guestEmail: 'hannah.weiss@voyageur.com',
    bookingRef: 'BK-127-9481',
    checkInDate: 'Nov 05, 2026 · 14:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Gold Member',
    folioBalance: '₹4,250.00',
    preferences: 'Extra feather pillows, quiet courtyard view',
  },
  // Floor 2 (1 room)
  {
    no: '210',
    floor: 2,
    typeTag: 'STE',
    typeFull: 'Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Aarav Patel',
    guestPhone: '+91 98200 12345',
    guestEmail: 'aarav.patel@horizon-tech.in',
    bookingRef: 'BK-210-4412',
    checkInDate: 'Nov 06, 2026 · 15:30',
    checkOutDate: 'Nov 11, 2026 · 12:00',
    duration: '5 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Silver Member',
    folioBalance: '₹12,800.00',
    preferences: 'Sparkling mineral water upon arrival',
  },
  // Floor 3 (8 rooms)
  {
    no: '301',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Elena Rostova',
    guestPhone: '+44 7700 900123',
    guestEmail: 'elena.rostova@avalon.co.uk',
    bookingRef: 'BK-301-8820',
    checkInDate: 'Nov 04, 2026 · 13:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Platinum VIP',
    vip: true,
    folioBalance: '₹18,450.00',
    preferences: 'High floor, firm mattress, morning newspaper',
  },
  {
    no: '302',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'dirty',
    occupied: false,
    badgeStatus: 'CLEANING',
    cleanerAssigned: 'Vikram Singh (Housekeeping)',
    cleaningCategory: 'post_departure',
  },
  {
    no: '303',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '304',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'out_of_order',
    occupied: false,
    badgeStatus: 'OUT_OF_ORDER',
  },
  {
    no: '305',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Kavita Menon',
    guestPhone: '+91 97112 88491',
    guestEmail: 'kavita.m@apexventures.in',
    bookingRef: 'BK-305-6129',
    checkInDate: 'Nov 03, 2026 · 16:00',
    checkOutDate: 'Nov 07, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Gold Member',
    folioBalance: '₹6,100.00',
    preferences: 'Near elevator, extra bathrobes',
  },
  {
    no: '306',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'dirty',
    occupied: true,
    badgeStatus: 'CLEANING',
    guestName: 'Marcus Vance',
    guestPhone: '+1 (415) 890-2341',
    guestEmail: 'm.vance@solaris-capital.com',
    bookingRef: 'BK-306-1184',
    checkInDate: 'Nov 06, 2026 · 12:00',
    checkOutDate: 'Nov 12, 2026 · 11:00',
    duration: '6 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Diamond Elite VIP',
    vip: true,
    folioBalance: '₹28,900.00',
    cleanerAssigned: 'Meera Nambiar (Housekeeping)',
    cleaningCategory: 'guest_request',
    preferences: 'Fresh linen daily at 11 AM, green tea sachets',
  },
  {
    no: '307',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'inspection_pending',
    occupied: false,
    badgeStatus: 'INSPECTION PENDING',
    cleanerAssigned: 'Arun Patel (Supervisor)',
  },
  {
    no: '308',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  // Floor 4 (8 rooms)
  {
    no: '401',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Sarah Jenkins',
    guestPhone: '+61 412 345 678',
    guestEmail: 's.jenkins@pacific-design.au',
    bookingRef: 'BK-401-7731',
    checkInDate: 'Nov 02, 2026 · 15:00',
    checkOutDate: 'Nov 08, 2026 · 10:00',
    duration: '6 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Gold Member',
    folioBalance: '₹9,450.00',
    preferences: 'High floor corner view, soy milk',
  },
  {
    no: '402',
    floor: 4,
    typeTag: 'KNG',
    typeFull: 'Grand Deluxe Ocean King',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'David Chen',
    guestPhone: '+65 9123 4567',
    guestEmail: 'david.chen@sing-ventures.sg',
    bookingRef: 'BK-402-0923',
    checkInDate: 'Nov 05, 2026 · 14:00',
    checkOutDate: 'Nov 10, 2026 · 12:00',
    duration: '5 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Platinum VIP',
    vip: true,
    folioBalance: '₹15,200.00',
    preferences: 'Ocean front view, extra large bath towels',
  },
  {
    no: '403',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'dirty',
    occupied: true,
    badgeStatus: 'CLEANING',
    guestName: 'Rohan Deshmukh',
    guestPhone: '+91 99887 66554',
    guestEmail: 'r.deshmukh@mumbai-law.in',
    bookingRef: 'BK-403-4490',
    checkInDate: 'Nov 04, 2026 · 18:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '5 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Silver Member',
    folioBalance: '₹8,700.00',
    cleanerAssigned: 'Sunita Rao (Housekeeping)',
    cleaningCategory: 'cycle',
    preferences: 'Quiet room away from ice machine',
  },
  {
    no: '404',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '405',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'dirty',
    occupied: false,
    badgeStatus: 'CLEANING',
    cleanerAssigned: 'Vikram Singh (Housekeeping)',
    cleaningCategory: 'post_departure',
  },
  {
    no: '406',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '407',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'inspection_pending',
    occupied: false,
    badgeStatus: 'INSPECTION PENDING',
    cleanerAssigned: 'Arun Patel (Supervisor)',
  },
  {
    no: '408',
    floor: 4,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  // Floor 5 (9 rooms)
  {
    no: '501',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Vikram Malhotra',
    guestPhone: '+91 98199 55432',
    guestEmail: 'v.malhotra@malhotra-group.com',
    bookingRef: 'BK-501-1102',
    checkInDate: 'Nov 01, 2026 · 12:00',
    checkOutDate: 'Nov 08, 2026 · 12:00',
    duration: '7 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Ambassador VIP',
    vip: true,
    folioBalance: '₹42,000.00',
    preferences: 'VIP airport transfer, personal butler on call',
  },
  {
    no: '502',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'dirty',
    occupied: true,
    badgeStatus: 'CLEANING',
    guestName: 'Ananya Roy',
    guestPhone: '+91 98300 22119',
    guestEmail: 'ananya.roy@calcutta-arts.org',
    bookingRef: 'BK-502-3981',
    checkInDate: 'Nov 06, 2026 · 14:00',
    checkOutDate: 'Nov 10, 2026 · 11:00',
    duration: '4 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Gold Member',
    folioBalance: '₹14,500.00',
    cleanerAssigned: 'Meera Nambiar (Housekeeping)',
    cleaningCategory: 'guest_request',
    preferences: 'Hypoallergenic bedding, herbal tea selection',
  },
  {
    no: '503',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '504',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '505',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'dirty',
    occupied: false,
    badgeStatus: 'CLEANING',
    cleanerAssigned: 'Sunita Rao (Housekeeping)',
    cleaningCategory: 'post_departure',
  },
  {
    no: '506',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'inspection_pending',
    occupied: false,
    badgeStatus: 'INSPECTION PENDING',
    cleanerAssigned: 'Arun Patel (Supervisor)',
  },
  {
    no: '507',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '508',
    floor: 5,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'out_of_order',
    occupied: false,
    badgeStatus: 'OUT_OF_ORDER',
  },
  {
    no: '518',
    floor: 5,
    typeTag: 'PRS',
    typeFull: 'Penthouse Grand Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Priya Nair',
    guestPhone: '+91 98201 44921',
    guestEmail: 'priya.nair@nair-enterprises.in',
    bookingRef: 'BK-518-0001',
    checkInDate: 'Nov 02, 2026 · 12:00',
    checkOutDate: 'Nov 10, 2026 · 12:00',
    duration: '8 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Ambassador VIP',
    vip: true,
    folioBalance: '₹0.00 (House Account)',
    preferences: 'Aromatherapy lavender turn-down, organic coconut water',
  },
];

function generateRoomPin(roomNo: string): string {
  const n = parseInt(roomNo.replace(/\D/g, '') || '101', 10);
  const code = ((n * 137 + 49) % 9000) + 1000;
  return `${code}#`;
}

/**
 * Computes the unified dynamic list of rooms, active floors, and floor metadata
 * based on state, custom rooms/floors added, and removed rooms/floors.
 */
export function getComputedRoomsAndFloors(
  state: DemoState,
  roomOverrides?: Record<string, Partial<RoomTileData>>
): {
  allRooms: RoomTileData[];
  floors: number[];
  floorInfo: Record<number, { name: string; wing: string }>;
} {
  const stateRooms: RoomRecord[] = state.frontDesk?.rooms ?? [];
  const stays: StayRecord[] = state.frontDesk?.stays ?? [];

  const removedRoomNos = new Set(state.removedRoomNos ?? []);
  const removedFloors = new Set(state.removedFloors ?? []);

  // 1. Merge Floor Information
  const floorInfo: Record<number, { name: string; wing: string }> = { ...DEFAULT_FLOOR_INFO };
  (state.customFloors ?? []).forEach((cf) => {
    floorInfo[cf.floor] = {
      name: cf.name || `FLOOR ${cf.floor}`,
      wing: cf.wing || `Floor ${cf.floor} Wing`,
    };
  });

  // 2. Build Base Specs combining default template and custom rooms
  const combinedSpecs: RoomInventorySeed[] = [];

  // Default rooms not removed
  BASE_ROOM_INVENTORY_27.forEach((base) => {
    if (!removedRoomNos.has(base.no) && !removedFloors.has(base.floor)) {
      combinedSpecs.push(base);
    }
  });

  // Custom added rooms
  (state.customRooms ?? []).forEach((cr) => {
    if (!removedRoomNos.has(cr.no) && !removedFloors.has(cr.floor)) {
      // Prevent duplicates if already in list
      if (!combinedSpecs.some((s) => s.no === cr.no)) {
        combinedSpecs.push({
          no: cr.no,
          floor: cr.floor,
          typeTag: cr.typeTag || 'DLX',
          typeFull: cr.typeFull || 'Deluxe Room',
          readiness: cr.readiness || 'ready',
          occupied: cr.occupied || false,
          dnd: cr.dnd || false,
          badgeStatus: cr.badgeStatus || (cr.occupied ? 'OCCUPIED' : 'READY'),
          guestName: cr.guestName,
          guestPhone: cr.guestPhone,
          guestEmail: cr.guestEmail,
          bookingRef: cr.bookingRef,
          vip: cr.vip,
          vipTier: cr.vipTier,
          preferences: cr.preferences,
        });
      }
    }
  });

  // 3. Map into full RoomTileData objects with live state
  const allRooms: RoomTileData[] = combinedSpecs.map((spec) => {
    const no = spec.no;
    const floor = spec.floor;

    const existingStateRoom = stateRooms.find((r) => r.no === no);
    const override = roomOverrides ? roomOverrides[no] : undefined;
    const stay = stays.find((s) => s.room === no && s.status === 'in_house');
    const expectedStay = stays.find((s) => s.room === no && s.status === 'expected');
    const checkedOutStay = stays.find((s) => s.room === no && s.status === 'checked_out');

    let readiness: Readiness = existingStateRoom?.readiness ?? spec.readiness;
    let occupied = existingStateRoom?.occupied ?? spec.occupied;
    let dnd = Boolean(state.guestPreferences?.[no]?.dnd ?? existingStateRoom?.dnd ?? spec.dnd);
    let badgeStatus = spec.badgeStatus;

    if (override) {
      if (override.readiness !== undefined) readiness = override.readiness;
      if (override.occupied !== undefined) occupied = override.occupied;
      if (override.dnd !== undefined) dnd = override.dnd;
    }

    let statusKind: RoomTileData['statusKind'] = 'ready';
    let statusLabel = 'Ready';
    let previousGuest = checkedOutStay?.guest ?? (spec.cleaningCategory === 'post_departure' ? 'Clara Dupont' : undefined);
    let checkoutTime = checkedOutStay?.departure ?? (spec.cleaningCategory === 'post_departure' ? 'Today · 09:15 AM' : undefined);
    let cleanerAssigned = spec.cleanerAssigned;
    let cleaningCategory: RoomTileData['cleaningCategory'] = spec.cleaningCategory;
    let cycleInfo: RoomTileData['cycleInfo'] = spec.cleaningCategory === 'cycle' ? {
      dueDay: 'Due Today',
      cycleDays: 3,
      isOverdue: false,
      nextScheduled: 'Today 11:30 (Day 3 of 4)',
    } : undefined;

    if (dnd) {
      statusKind = 'dnd';
      statusLabel = 'DND';
      badgeStatus = 'OCCUPIED';
    } else if (stay && stay.status === 'in_house') {
      occupied = true;
      badgeStatus = 'OCCUPIED';
      if (stay.departsToday) {
        statusKind = 'checkout';
        statusLabel = `Check-Out · ${stay.guest.split(' ')[0]}`;
      } else {
        statusKind = 'occupied';
        statusLabel = stay.guest.split(' ')[0];
      }
    } else if (expectedStay) {
      statusKind = 'checkin';
      statusLabel = `Check-In · ${expectedStay.guest.split(' ')[0]}`;
    } else if (cleaningCategory === 'post_departure' || checkedOutStay) {
      statusKind = 'post_departure';
      statusLabel = readiness === 'ready' ? 'Turnover Ready' : 'Post-Departure';
      badgeStatus = readiness === 'ready' ? 'READY' : 'CLEANING';
    } else if (readiness === 'cleaning' || readiness === 'inspection_pending') {
      statusKind = 'cleaning';
      statusLabel = readiness === 'inspection_pending' ? 'Inspection' : 'Cleaning';
      badgeStatus = readiness === 'inspection_pending' ? 'INSPECTION PENDING' : 'CLEANING';
    } else if (readiness === 'dirty' || readiness === 'out_of_order') {
      statusKind = 'dirty';
      statusLabel = readiness === 'out_of_order' ? 'Out of Order' : 'Dirty';
      badgeStatus = readiness === 'out_of_order' ? 'OUT_OF_ORDER' : 'CLEANING';
    } else if (occupied) {
      statusKind = 'occupied';
      statusLabel = spec.guestName ? spec.guestName.split(' ')[0] : 'Occupied';
      badgeStatus = 'OCCUPIED';
    } else {
      statusKind = 'ready';
      statusLabel = 'Ready';
      badgeStatus = 'READY';
    }

    return {
      no,
      floor,
      readiness,
      occupied,
      dnd,
      typeTag: spec.typeTag,
      typeFull: spec.typeFull,
      statusLabel,
      statusKind,
      badgeStatus,
      guestName: stay?.guest ?? expectedStay?.guest ?? spec.guestName,
      guestPhone: spec.guestPhone,
      guestEmail: spec.guestEmail,
      bookingRef: stay?.id ?? spec.bookingRef,
      checkInDate: stay?.arrival ?? spec.checkInDate,
      checkOutDate: stay?.departure ?? spec.checkOutDate,
      duration: spec.duration,
      guestsCount: spec.guestsCount ?? 2,
      vipTier: stay?.vipTier ?? spec.vipTier,
      folioBalance: spec.folioBalance,
      preferences: stay?.preferencesSummary ?? spec.preferences,
      previousGuest,
      checkoutTime,
      cleanerAssigned,
      cleaningCategory,
      cycleInfo,
      vip: stay?.vip ?? expectedStay?.vip ?? spec.vip,
      stay: stay ?? expectedStay ?? checkedOutStay,
      pin: generateRoomPin(no),
    };
  });

  // Sort rooms by floor then room number
  allRooms.sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor;
    return a.no.localeCompare(b.no, undefined, { numeric: true });
  });

  // 4. Compute unique floor list
  const floorSet = new Set<number>();
  allRooms.forEach((r) => floorSet.add(r.floor));
  Object.keys(floorInfo).forEach((fStr) => {
    const fNum = parseInt(fStr, 10);
    if (!removedFloors.has(fNum)) {
      floorSet.add(fNum);
    }
  });

  const floors = Array.from(floorSet).sort((a, b) => a - b);

  return { allRooms, floors, floorInfo };
}
