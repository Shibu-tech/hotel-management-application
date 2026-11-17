'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  BedDouble,
  ShieldAlert,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { getComputedRoomsAndFloors } from '@/lib/inventoryRooms';
import type { Readiness, CustomRoomSpec } from '@/types/demo';

const ROOM_TYPE_OPTIONS = [
  { tag: 'KNG', label: 'Grand Deluxe Ocean King' },
  { tag: 'TWN', label: 'Deluxe Twin' },
  { tag: 'STE', label: 'Executive Suite' },
  { tag: 'STE', label: 'Suite' },
  { tag: 'PRS', label: 'Penthouse Grand Suite' },
  { tag: 'PRZ', label: 'Presidential Ocean Villa' },
  { tag: 'SGL', label: 'Standard Single Room' },
];

interface ManageRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function ManageRoomsModal({ isOpen, onClose, isLight }: ManageRoomsModalProps) {
  const { state, currentHotelSlug, addFloor, removeFloor, addRoom, removeRoom } = useDemo();

  const [activeTab, setActiveTab] = useState<'rooms' | 'floors'>('rooms');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Floor form state
  const [newFloorNumber, setNewFloorNumber] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorWing, setNewFloorWing] = useState('');
  const [floorError, setFloorError] = useState<string | null>(null);

  // Add Room form state
  const [newRoomNo, setNewRoomNo] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState<string>('');
  const [newRoomTypeIdx, setNewRoomTypeIdx] = useState('0');
  const [newRoomReadiness, setNewRoomReadiness] = useState<Readiness>('ready');
  const [newRoomOccupied, setNewRoomOccupied] = useState<'vacant' | 'occupied'>('vacant');
  const [roomError, setRoomError] = useState<string | null>(null);

  // Room search / filter in modal
  const [searchFilter, setSearchFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  // Confirmation state for deleting
  const [confirmDeleteFloor, setConfirmDeleteFloor] = useState<number | null>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<string | null>(null);

  const { allRooms, floors, floorInfo } = useMemo(() => {
    return getComputedRoomsAndFloors(state, undefined, currentHotelSlug);
  }, [state, currentHotelSlug]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!isOpen) return null;

  // Handle Add Floor
  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    setFloorError(null);
    const fNum = parseInt(newFloorNumber.trim(), 10);
    if (isNaN(fNum) || fNum <= 0) {
      setFloorError('Please enter a valid positive floor number.');
      return;
    }
    if (floors.includes(fNum)) {
      setFloorError(`Floor ${fNum} already exists in the inventory.`);
      return;
    }

    const name = newFloorName.trim() || `FLOOR ${fNum}`;
    const wing = newFloorWing.trim() || `Floor ${fNum} Wing`;
    addFloor(fNum, name, wing);
    showToast(`Floor ${fNum} added successfully.`);
    setNewFloorNumber('');
    setNewFloorName('');
    setNewFloorWing('');
  };

  // Handle Delete Floor
  const handleDeleteFloor = (fNum: number) => {
    removeFloor(fNum);
    setConfirmDeleteFloor(null);
    showToast(`Floor ${fNum} removed.`);
  };

  // Handle Add Room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError(null);
    const cleanNo = newRoomNo.trim();
    if (!cleanNo) {
      setRoomError('Room number is required.');
      return;
    }

    if (allRooms.some((r) => r.no.toLowerCase() === cleanNo.toLowerCase())) {
      setRoomError(`Room ${cleanNo} already exists in the inventory.`);
      return;
    }

    const selectedFloorNum = newRoomFloor ? parseInt(newRoomFloor, 10) : (floors[0] || 1);
    const selectedType = ROOM_TYPE_OPTIONS[parseInt(newRoomTypeIdx, 10)] || ROOM_TYPE_OPTIONS[0];

    const roomPayload: CustomRoomSpec = {
      no: cleanNo,
      floor: selectedFloorNum,
      typeTag: selectedType.tag,
      typeFull: selectedType.label,
      readiness: newRoomReadiness,
      occupied: newRoomOccupied === 'occupied',
      badgeStatus: newRoomOccupied === 'occupied' ? 'OCCUPIED' : newRoomReadiness === 'out_of_order' ? 'OUT_OF_ORDER' : 'READY',
    };

    addRoom(roomPayload);
    showToast(`Room ${cleanNo} (${selectedType.label}) added to Floor ${selectedFloorNum}.`);
    setNewRoomNo('');
    setNewRoomReadiness('ready');
    setNewRoomOccupied('vacant');
  };

  // Handle Delete Room
  const handleDeleteRoom = (no: string) => {
    removeRoom(no);
    setConfirmDeleteRoom(null);
    showToast(`Room ${no} removed from inventory.`);
  };

  // Filtered rooms in the management list
  const filteredRooms = allRooms.filter((r) => {
    const matchesSearch = r.no.toLowerCase().includes(searchFilter.toLowerCase()) || r.typeFull.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFloor = floorFilter === 'all' || r.floor.toString() === floorFilter;
    return matchesSearch && matchesFloor;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl transition-all relative flex flex-col max-h-[90vh] overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0b1426] border-white/10 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Room &amp; Floor Inventory Manager</h2>
              <p className="text-xs text-slate-400">Add, configure, or remove hotel floors and guest rooms.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 pb-2 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              Rooms ({allRooms.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('floors')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'floors'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              Floors ({floors.length})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Active Tenant &middot; Synchronized State
          </span>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: FLOORS MANAGEMENT                                  */}
          {/* ========================================================= */}
          {activeTab === 'floors' && (
            <div className="space-y-6">
              {/* Add Floor Form */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Add New Floor
                  </span>
                </div>

                {floorError && (
                  <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{floorError}</span>
                  </div>
                )}

                <form onSubmit={handleAddFloor} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Floor Number *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      required
                      placeholder="e.g. 6"
                      value={newFloorNumber}
                      onChange={(e) => setNewFloorNumber(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Floor Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FLOOR 6 or Penthouse"
                      value={newFloorName}
                      onChange={(e) => setNewFloorName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Wing / Section
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sky Terrace Wing"
                      value={newFloorWing}
                      onChange={(e) => setNewFloorWing(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Floors Directory */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Current Hotel Floors ({floors.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {floors.map((fNum) => {
                    const info = floorInfo[fNum] || { name: `FLOOR ${fNum}`, wing: 'Standard Wing' };
                    const roomCount = allRooms.filter((r) => r.floor === fNum).length;
                    const isConfirming = confirmDeleteFloor === fNum;

                    return (
                      <div
                        key={fNum}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm shrink-0">
                            {fNum}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-xs sm:text-sm block truncate">
                              {info.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {info.wing} &middot; <strong className="text-amber-500">{roomCount}</strong> rooms
                            </span>
                          </div>
                        </div>

                        {isConfirming ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteFloor(fNum)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteFloor(null)}
                              className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteFloor(fNum)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                            title={`Delete Floor ${fNum}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ROOMS MANAGEMENT                                   */}
          {/* ========================================================= */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {/* Add Room Form */}
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BedDouble className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Add New Room to Inventory
                  </span>
                </div>

                {roomError && (
                  <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{roomError}</span>
                  </div>
                )}

                <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Floor Selector */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Floor *
                    </label>
                    <select
                      value={newRoomFloor || (floors[0]?.toString() ?? '1')}
                      onChange={(e) => setNewRoomFloor(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    >
                      {floors.map((fl) => (
                        <option key={fl} value={fl}>
                          Floor {fl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Number */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Room # *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 601"
                      value={newRoomNo}
                      onChange={(e) => setNewRoomNo(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  {/* Room Type */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Room Type *
                    </label>
                    <select
                      value={newRoomTypeIdx}
                      onChange={(e) => setNewRoomTypeIdx(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    >
                      {ROOM_TYPE_OPTIONS.map((opt, i) => (
                        <option key={i} value={i}>
                          {opt.label} ({opt.tag})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Readiness */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Readiness
                    </label>
                    <select
                      value={newRoomReadiness}
                      onChange={(e) => setNewRoomReadiness(e.target.value as Readiness)}
                      className={`w-full px-2.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    >
                      <option value="ready">Ready</option>
                      <option value="clean">Clean</option>
                      <option value="dirty">Needs Clean</option>
                      <option value="inspecting">Inspecting</option>
                      <option value="out_of_order">Out of Order</option>
                    </select>
                  </div>

                  {/* Occupied */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Occupancy
                    </label>
                    <select
                      value={newRoomOccupied}
                      onChange={(e) => setNewRoomOccupied(e.target.value as 'vacant' | 'occupied')}
                      className={`w-full px-2.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    >
                      <option value="vacant">Vacant</option>
                      <option value="occupied">Occupied</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div className="sm:col-span-1">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-sm transition-all cursor-pointer flex items-center justify-center"
                      title="Add Room"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Rooms List Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search room no. or type..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                      }`}
                    />
                  </div>

                  <select
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                    className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#080e1b] border-white/10 text-white'
                    }`}
                  >
                    <option value="all">All Floors</option>
                    {floors.map((fl) => (
                      <option key={fl} value={fl}>
                        Floor {fl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-slate-400 self-end sm:self-center">
                  Showing <strong>{filteredRooms.length}</strong> of {allRooms.length} rooms
                </div>
              </div>

              {/* Rooms Table */}
              <div
                className={`rounded-xl border overflow-hidden ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#080e1b]'
                }`}
              >
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr
                        className={`border-b text-[10px] font-semibold uppercase tracking-wider ${
                          isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10'
                        }`}
                      >
                        <th className="py-2.5 px-4">Room #</th>
                        <th className="py-2.5 px-4">Floor</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Occupancy</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRooms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No rooms found.
                          </td>
                        </tr>
                      ) : (
                        filteredRooms.map((room) => {
                          const isConfirming = confirmDeleteRoom === room.no;

                          return (
                            <tr
                              key={room.no}
                              className={`transition-colors ${
                                isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-amber-500">
                                {room.no}
                              </td>

                              <td className="py-2.5 px-4 text-slate-400">
                                Floor {room.floor}
                              </td>

                              <td className="py-2.5 px-4 font-medium">
                                <span>{room.typeFull}</span>
                                <span className="ml-1.5 text-[10px] font-mono px-1 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                                  {room.typeTag}
                                </span>
                              </td>

                              <td className="py-2.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                    room.readiness === 'ready'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                      : room.readiness === 'cleaning'
                                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                                      : room.readiness === 'inspection_pending'
                                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                      : room.readiness === 'dirty'
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {room.readiness.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-2.5 px-4">
                                <span
                                  className={`text-xs ${
                                    room.occupied ? 'text-amber-400 font-medium' : 'text-slate-400'
                                  }`}
                                >
                                  {room.occupied ? 'Occupied' : 'Vacant'}
                                </span>
                              </td>

                              <td className="py-2.5 px-4 text-right">
                                {isConfirming ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRoom(room.no)}
                                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteRoom(null)}
                                      className="px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRoom(room.no)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title={`Delete Room ${room.no}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 text-xs ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Total: <strong>{floors.length}</strong> Floors &middot; <strong>{allRooms.length}</strong> Rooms
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="absolute bottom-16 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
            <div className="bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-white/10 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
