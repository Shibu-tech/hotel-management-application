'use client';

import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BedDouble,
  Users,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type {
  RoomRecord,
  StaffAccount,
  WorkItem,
  IncidentRecord,
} from '@/types/demo';

interface SupervisorOverviewTabProps {
  rooms?: RoomRecord[];
  staffList?: StaffAccount[];
  tasks?: WorkItem[];
  incidents?: IncidentRecord[];
  onNavigateTab?: (tab: string) => void;
  onOpenEscalate?: () => void;
}

export function SupervisorOverviewTab({
  rooms = [],
  staffList = [],
  tasks = [],
  incidents = [],
  onNavigateTab,
  onOpenEscalate,
}: SupervisorOverviewTabProps) {
  const hkAttendants = (staffList ?? []).filter(
    (s) =>
      s.department === 'Housekeeping' ||
      s.roleId === 'task_fulfiller' ||
      ['Vikram Singh', 'Wayne Chen', 'Kabir Sen', 'Sana Sheikh', 'Rohan Verma'].includes(s.name),
  );
  const onDutyCount = hkAttendants.filter((s) => s.availability !== 'off_duty').length;

  const readyRoomsCount = (rooms ?? []).filter((r) => r.readiness === 'ready').length;
  const inspectionPendingRooms = (rooms ?? []).filter((r) => r.readiness === 'inspection_pending').length;
  const cleaningRooms = rooms.filter((r) => r.readiness === 'cleaning').length;
  const dirtyRooms = rooms.filter((r) => r.readiness === 'dirty').length;

  // Pending reassignment requests from attendants
  const reassignRequests = tasks.filter((t) => t.reassignPending);

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Turnover Rooms */}
        <div
          onClick={() => onNavigateTab?.('rooms')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] to-ink-900/90 p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-amber-400/40 hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Rooms in Turnover
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20 group-hover:scale-110 transition">
              <BedDouble className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {dirtyRooms + cleaningRooms}
            </span>
            <span className="text-xs font-medium text-amber-300">
              {cleaningRooms} cleaning
            </span>
          </div>
          <p className="mt-1 text-[11px] text-mist-400">
            Rooms cleaned and staged for turnover
          </p>
        </div>

        {/* Ready for Check-In */}
        <div
          onClick={() => onNavigateTab?.('rooms')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] to-ink-900/90 p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-emerald-400/40 hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              Ready for Check-In
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 group-hover:scale-110 transition">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {readyRoomsCount}
            </span>
            <span className="text-xs font-medium text-emerald-300 flex items-center gap-0.5">
              <Check className="h-3 w-3" /> Rooms certified
            </span>
          </div>
          <p className="mt-1 text-[11px] text-mist-400">
            Available for immediate Front Desk assignment
          </p>
        </div>

        {/* Active Tasks */}
        <div
          onClick={() => onNavigateTab?.('tasks')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.08] to-ink-900/90 p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-sky-400/40 hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300/90">
              Active Department Tasks
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-400/10 text-sky-300 border border-sky-400/20 group-hover:scale-110 transition">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {tasks.filter((t) => t.status !== 'completed').length}
            </span>
            <span className="text-xs font-medium text-sky-300">In-progress & assigned</span>
          </div>
          <p className="mt-1 text-[11px] text-mist-400">
            Live task dispatch across team fulfillers
          </p>
        </div>

        {/* Team On Duty */}
        <div
          onClick={() => onNavigateTab?.('team')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.08] to-ink-900/90 p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-sky-400/40 hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300/90">
              Housekeeping Roster
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-400/10 text-sky-300 border border-sky-400/20 group-hover:scale-110 transition">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {onDutyCount}/{hkAttendants.length}
            </span>
            <span className="text-xs font-medium text-sky-300">Floor 1–5 Zones</span>
          </div>
          <p className="mt-1 text-[11px] text-mist-400">
            Attendants actively on duty across day shift
          </p>
        </div>
      </div>

      {/* Attendant Reassignment Notice Banner if any */}
      {reassignRequests.length > 0 && (
        <div className="p-4 rounded-3xl border border-amber-400/30 bg-amber-500/[0.08] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-400/20 text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-200">
                {reassignRequests.length} Attendant Reassignment Request Pending
              </p>
              <p className="text-[11px] text-amber-200/80">
                Task fulfillers flagged blockers requiring supervisor replacement approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.('tasks')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
          >
            Review Reassignments
          </button>
        </div>
      )}

      {/* Room Readiness Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-white">
              Property Room Readiness Pipeline
            </h3>
            <p className="text-xs text-mist-400">
              Real-time synchronization with Front Desk check-in inventory
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.('rooms')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <span>Open Room Board</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20">
            <p className="text-[10px] uppercase font-bold text-rose-300">Dirty / Turnover</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{dirtyRooms} Rooms</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
            <p className="text-[10px] uppercase font-bold text-amber-300">Cleaning In Progress</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{cleaningRooms} Rooms</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/[0.06] border border-sky-500/20">
            <p className="text-[10px] uppercase font-bold text-sky-300">Pending Turnover</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              {dirtyRooms + cleaningRooms} Rooms
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20">
            <p className="text-[10px] uppercase font-bold text-emerald-300">Ready for Check-In</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{readyRoomsCount} Rooms</p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Room Turnover Queue & Quick Supervisor Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Room Turnover Queue (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-bold font-display text-white">
                Turnover & Cleaning Queue ({dirtyRooms + cleaningRooms})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.('rooms')}
              className="text-xs text-mist-400 hover:text-white transition"
            >
              View Room Board →
            </button>
          </div>

          <div className="space-y-3">
            {rooms.filter((r) => r.readiness === 'cleaning' || r.readiness === 'dirty').length === 0 ? (
              <div className="p-8 rounded-3xl border border-white/10 bg-ink-900/60 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto" />
                <p className="text-sm font-bold text-white">All Rooms Clean & Ready!</p>
                <p className="text-xs text-mist-400">
                  No rooms are currently dirty or in turnover.
                </p>
              </div>
            ) : (
              rooms
                .filter((r) => r.readiness === 'cleaning' || r.readiness === 'dirty')
                .slice(0, 5)
                .map((rm) => (
                  <div
                    key={rm.no}
                    onClick={() => onNavigateTab?.('rooms')}
                    className="group cursor-pointer p-4 rounded-3xl border border-white/10 bg-ink-900/90 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold font-mono text-sm">
                        {rm.no}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            Room {rm.no}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rm.readiness === 'cleaning'
                              ? 'bg-sky-400/20 border border-sky-400/30 text-sky-300'
                              : 'bg-rose-400/20 border border-rose-400/30 text-rose-300'
                              }`}
                          >
                            {rm.readiness}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist-300 text-[10px]">
                            Floor {rm.floor}
                          </span>
                        </div>
                        <p className="text-xs text-mist-400 mt-0.5 truncate">
                          Status: {rm.occupied ? 'Occupied' : 'Vacant'} {rm.note ? `· ${rm.note}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab?.('rooms');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Column: Supervisor Actions & Team Snapshot */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <h3 className="text-sm font-bold font-display text-white">Supervisor Actions</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab?.('rooms')}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/30 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <BedDouble className="h-4 w-4 text-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-white">Room Readiness Board</p>
                    <p className="text-[11px] text-mist-400">View turnover status across floors</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-mist-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab?.('tasks')}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-sky-400/30 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-sky-300" />
                  <div>
                    <p className="text-xs font-bold text-white">Task Dispatch Queue</p>
                    <p className="text-[11px] text-mist-400">Manage fulfiller workload & reassignments</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-mist-400" />
              </button>

              <button
                type="button"
                onClick={onOpenEscalate}
                className="w-full p-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08] hover:border-rose-500/40 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-rose-300" />
                  <div>
                    <p className="text-xs font-bold text-rose-200">Escalate to General Manager</p>
                    <p className="text-[11px] text-rose-300/70">Report maintenance blocker or incident</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Attendant Quality Snapshot */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-white">Attendant Quality Roster</h3>
              <button
                type="button"
                onClick={() => onNavigateTab?.('team')}
                className="text-xs text-amber-400 hover:text-amber-300 transition"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {hkAttendants.slice(0, 4).map((att) => {
                const passRate =
                  att.name === 'Vikram Singh'
                    ? 94
                    : att.name === 'Wayne Chen'
                      ? 89
                      : att.name === 'Kabir Sen'
                        ? 96
                        : 92;

                return (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{att.name}</p>
                      <p className="text-[11px] text-mist-400">
                        {att.floorZone || 'Floor 1-3'} · {att.shift} Shift
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-300">{passRate}%</span>
                      <p className="text-[10px] text-mist-400">Pass Rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
