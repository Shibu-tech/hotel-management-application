'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Filter,
  History,
  Lock,
  MessageSquareWarning,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { taskDepartment, managerDepartment } from '@/lib/departments';
import type { ComplaintCase, WorkItem } from '@/types/demo';

function getTaskDepartmentDisplay(item: WorkItem): string {
  if (item.department) {
    if (/spa\s*(&|and)\s*wellness/i.test(item.department) || item.department.trim().toLowerCase() === 'spa') {
      return 'Wellness';
    }
    return item.department;
  }
  const deptId = taskDepartment(item);
  if (deptId) {
    return deptId === 'wellness' ? 'Wellness' : managerDepartment(deptId).name;
  }
  return 'Property Operations';
}

function formatTaskMeta(meta?: string): string {
  if (!meta) return '';
  return meta
    .replace(/\bSpa\s*(&|and)\s*Wellness\b/gi, 'Wellness')
    .replace(/\bSpa\b(\s*·)/g, 'Wellness$1');
}

/**
 * Extracts the room number from a complaint or task.
 */
export function extractItemRoom(item?: { room?: string; title?: string; meta?: string; description?: string } | null): string {
  if (!item) return '502';
  if (item.room) {
    const digits = item.room.match(/\d+/);
    if (digits) return digits[0];
    const cleaned = item.room.replace(/^Room\s*/i, '').trim();
    if (cleaned) return cleaned;
  }
  const titleRoomDigits = (item.title || '').match(/Room\s*(\d+)/i);
  if (titleRoomDigits) return titleRoomDigits[1];

  const metaRoomDigits = (item.meta || '').match(/Room\s*(\d+)/i);
  if (metaRoomDigits) return metaRoomDigits[1];

  const descRoomDigits = (item.description || '').match(/Room\s*(\d+)/i);
  if (descRoomDigits) return descRoomDigits[1];

  const generalMatch = (item.title || '').match(/(?:Suite|Pavilion|Floor)\s*([A-Za-z0-9-]+)/i);
  if (generalMatch) return generalMatch[1];

  if ((item.title || '').includes('Presidential')) return '518';

  return '502';
}

/**
 * Extracts DDMMYY (or DDMMYYYY) from date/time string, defaulting to 081126 / 08112026.
 */
export function extractItemDateDigits(createdAt?: string, fourDigitYear: boolean = false): string {
  if (createdAt) {
    const iso = createdAt.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const dd = iso[3];
      const mm = iso[2];
      const yy = fourDigitYear ? iso[1] : iso[1].slice(-2);
      return `${dd}${mm}${yy}`;
    }

    const dmy = createdAt.match(/(\d{2})[-/.](\d{2})[-/.](\d{2,4})/);
    if (dmy) {
      const dd = dmy[1];
      const mm = dmy[2];
      let yy = dmy[3];
      if (fourDigitYear && yy.length === 2) yy = `20${yy}`;
      if (!fourDigitYear && yy.length === 4) yy = yy.slice(-2);
      return `${dd}${mm}${yy}`;
    }

    if (createdAt.toLowerCase().includes('yesterday')) {
      return fourDigitYear ? '08112026' : '081126';
    }
  }

  return fourDigitYear ? '08112026' : '081126';
}

/**
 * Formats a Guest Complaint ref ID to (Sidebar name-Room no.-DD/MM/YY)
 * e.g. "GC-502-081126"
 */
export function formatComplaintRef(complaint?: { ref?: string; room?: string; createdAt?: string; summary?: string; description?: string } | null): string {
  if (!complaint) return 'GC-502-081126';
  if (complaint.ref && /^GC-[A-Za-z0-9]+-\d{6,8}$/.test(complaint.ref)) {
    return complaint.ref;
  }
  const room = extractItemRoom(complaint);
  const dateStr = extractItemDateDigits(complaint.createdAt, false);
  return `GC-${room}-${dateStr}`;
}

/**
 * Formats an Escalated Task ID to (Sidebar name-Room no.-DD/MM/YYYY or DD/MM/YY)
 * e.g. "ES-502-08112026"
 */
export function formatEscalatedTaskId(task?: { id?: string; ref?: string; room?: string; title?: string; meta?: string; createdAt?: string; description?: string } | null): string {
  if (!task) return 'ES-502-08112026';
  const existing = task.ref || task.id;
  if (existing && /^ES-[A-Za-z0-9]+-\d{6,8}$/.test(existing)) {
    return existing;
  }
  const room = extractItemRoom(task);
  const dateStr = extractItemDateDigits(task.createdAt, true);
  return `ES-${room}-${dateStr}`;
}


interface ExecutiveIncidentsTabProps {
  permissionMode: 'viewer' | 'approver';
  initialView?: 'complaints' | 'escalations';
  selectedTaskIdFromParent?: string | null;
}

export function ExecutiveIncidentsTab({
  permissionMode,
  initialView = 'complaints',
  selectedTaskIdFromParent,
}: ExecutiveIncidentsTabProps) {
  const { state, requestExecutiveDirective } = useDemo();
  const activeView = initialView;
  const [complaintSearchQuery, setComplaintSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintCase | null>(null);
  const [selectedEscalatedTask, setSelectedEscalatedTask] = useState<WorkItem | null>(null);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEscalatedTask(null);
        setSelectedComplaint(null);
      }
    };
    if (selectedEscalatedTask || selectedComplaint) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedEscalatedTask, selectedComplaint]);

  // Executive Directive Modal
  const [directiveModalTarget, setDirectiveModalTarget] = useState<{ id: string; title: string; type: 'incident' | 'complaint' } | null>(null);
  const [directiveText, setDirectiveText] = useState('');
  const [directiveDepartment, setDirectiveDepartment] = useState('All departments');

  // Complaints
  const complaints = state.frontDesk?.complaints ?? [];
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (complaintSearchQuery.trim()) {
        const q = complaintSearchQuery.toLowerCase().trim();
        const formattedRef = formatComplaintRef(c).toLowerCase();
        const rawRef = (c.ref || '').toLowerCase();
        const matchesRef = formattedRef.includes(q) || rawRef.includes(q);
        const matchesGuest = (c.guest || c.guestName || '').toLowerCase().includes(q);
        const matchesRoom = (c.room || '').toLowerCase().includes(q) || `room ${c.room}`.toLowerCase().includes(q);
        const matchesSummary = (c.summary || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesDept = (c.department || c.category || '').toLowerCase().includes(q);
        const matchesSeverity = (c.severity || '').toLowerCase().includes(q);
        const matchesAssigned = (c.assignedTo || '').toLowerCase().includes(q);
        const matchesRemarks = (c.responseRemarks || '').toLowerCase().includes(q);
        const matchesStatus = (c.status || '').toLowerCase().includes(q);
        if (
          !matchesRef &&
          !matchesGuest &&
          !matchesRoom &&
          !matchesSummary &&
          !matchesDesc &&
          !matchesDept &&
          !matchesSeverity &&
          !matchesAssigned &&
          !matchesRemarks &&
          !matchesStatus
        ) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, complaintSearchQuery]);

  // Escalated tasks from other departments
  const escalatedTasks: WorkItem[] = useMemo(() => {
    const list: WorkItem[] = [];
    const roles = ['department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'] as const;
    const seen = new Set<string>();
    roles.forEach((r) => {
      (state.items[r] ?? []).forEach((item) => {
        if (item.status === 'Escalated' || item.priority === 'critical' || item.priority === 'vip') {
          const key = item.ref || item.id;
          if (!seen.has(key)) {
            seen.add(key);
            list.push(item);
          }
        }
      });
    });
    return list;
  }, [state.items]);

  // Sync selectedTaskIdFromParent to open elaborated details
  useEffect(() => {
    if (selectedTaskIdFromParent) {
      const match = escalatedTasks.find(
        (t) =>
          t.id === selectedTaskIdFromParent ||
          t.ref === selectedTaskIdFromParent ||
          formatEscalatedTaskId(t) === selectedTaskIdFromParent
      );
      if (match) {
        setSelectedEscalatedTask(match);
      }
    }
  }, [selectedTaskIdFromParent, escalatedTasks]);

  const handleDispatchDirective = () => {
    if (!directiveModalTarget || !directiveText.trim() || permissionMode === 'viewer') return;
    const finalDirectiveText =
      directiveDepartment && directiveDepartment !== 'All departments'
        ? `[Direct to ${directiveDepartment} Supervisor] ${directiveText.trim()}`
        : directiveText.trim();
    requestExecutiveDirective(directiveModalTarget.id, directiveModalTarget.type, finalDirectiveText);
    setDirectiveModalTarget(null);
    setDirectiveText('');
    setDirectiveDepartment('All departments');
  };

  const viewMetadata = useMemo(() => {
    switch (activeView) {
      case 'escalations':
        return {
          title: 'Escalations',
          subtitle: 'Cross-department operational bottlenecks, urgent task fulfiller issues, and manager escalations.',
          icon: Siren,
          iconColor: 'text-purple-500 dark:text-purple-400',
          badgeText: `${escalatedTasks.length} Escalated Tasks`,
          badgeTone: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/20',
          countLabel: `${escalatedTasks.length} ${escalatedTasks.length === 1 ? 'task' : 'tasks'}`,
        };
      case 'complaints':
      default:
        return {
          title: 'Guest Complaints',
          subtitle: 'Duty Manager escalations, unresolved service recovery cases, and goodwill gestures.',
          icon: MessageSquareWarning,
          iconColor: 'text-amber-500',
          badgeText: `${complaints.filter((c) => !c.compApplied).length} Unresolved`,
          badgeTone: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20',
          countLabel: `${complaints.length} ${complaints.length === 1 ? 'case' : 'cases'}`,
        };
    }
  }, [activeView, complaints, escalatedTasks.length]);

  const CurrentViewIcon = viewMetadata.icon;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <CurrentViewIcon className={`h-5 w-5 ${viewMetadata.iconColor}`} />
              {viewMetadata.title}
            </h2>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${viewMetadata.badgeTone}`}>
              {viewMetadata.badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            {viewMetadata.subtitle}
          </p>
        </div>

        {/* Page Opened Name Display (replaces the removed navbar) */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80 text-xs font-bold text-navy-950 dark:text-white shadow-sm self-start md:self-auto">
          <CurrentViewIcon className={`h-4 w-4 ${viewMetadata.iconColor}`} />
          <span>{viewMetadata.title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-slate-600 dark:text-mist-300">
            {viewMetadata.countLabel}
          </span>
        </div>
      </div>

      {/* Issue Executive Directive Modal */}
      {directiveModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-500 grid place-items-center">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white">
                  Issue Executive Directive
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Target: {directiveModalTarget.title}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="directive-department-select" className="text-xs font-bold text-slate-700 dark:text-mist-300">
                Target Department
              </label>
              <select
                id="directive-department-select"
                value={directiveDepartment}
                onChange={(e) => setDirectiveDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <option value="All departments">All departments</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Wellness">Wellness</option>
                <option value="Maintenance & Engineering">Maintenance & Engineering</option>
                <option value="Food & Beverages">Food & Beverages</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              {directiveDepartment === 'All departments'
                ? 'Directives from the Executive Office take top operational precedence and notify all department supervisors immediately.'
                : `Directives from the Executive Office take top operational precedence and will be routed to the ${directiveDepartment} supervisor.`}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-mist-300">
                Executive Instruction
              </label>
              <textarea
                rows={4}
                value={directiveText}
                onChange={(e) => setDirectiveText(e.target.value)}
                placeholder="E.g., Prioritize vacuum drying of Rooms 305–309. Relocate affected guests to Floor 5 Presidential suites with complimentary dinner vouchers..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDirectiveModalTarget(null);
                  setDirectiveText('');
                  setDirectiveDepartment('All departments');
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!directiveText.trim()}
                onClick={handleDispatchDirective}
                className="px-5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-md"
              >
                Dispatch Directive
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Elaborated Escalated Task Detail Modal */}
      {selectedEscalatedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedEscalatedTask(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 grid place-items-center border border-purple-500/30">
                  <Siren className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {selectedEscalatedTask.title}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-mist-300">
                      {formatEscalatedTaskId(selectedEscalatedTask)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Department: <span className="font-semibold text-navy-950 dark:text-white">{getTaskDepartmentDisplay(selectedEscalatedTask)}</span> · Priority: <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedEscalatedTask.priority || 'VIP / Escalated'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEscalatedTask(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Elaborated Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 4 Quick Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Department</span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5">{getTaskDepartmentDisplay(selectedEscalatedTask)}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Status</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{selectedEscalatedTask.status}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Priority</span>
                  <div className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">{selectedEscalatedTask.priority || 'Critical / VIP'}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Assigned Lead</span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5">{selectedEscalatedTask.owner || selectedEscalatedTask.assignee || 'Duty Supervisor'}</div>
                </div>
              </div>

              {/* Elaborated Details & Scope */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Elaborated Task Scope & Operational Meta
                </h4>
                <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                  {formatTaskMeta(selectedEscalatedTask.meta) || selectedEscalatedTask.description || selectedEscalatedTask.notes || 'Full operational escalation logged under executive surveillance. Requires supervisor and general manager coordination.'}
                </p>
                {selectedEscalatedTask.room && (
                  <div className="pt-2 text-xs text-slate-500 dark:text-mist-400 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-amber-500" />
                    <span>Room / Suite Location: <strong>Room {selectedEscalatedTask.room}</strong></span>
                  </div>
                )}
                {selectedEscalatedTask.repairCategory && (
                  <div className="text-xs text-slate-500 dark:text-mist-400 flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-amber-500" />
                    <span>Repair Category: <strong>{selectedEscalatedTask.repairCategory}</strong></span>
                  </div>
                )}
              </div>

              {/* Chronological Audit / Escalation Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-amber-500" />
                  Escalation Audit Trail & Timeline
                </h4>

                {/* Complete Workflow Chain Visual Progression */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-rose-500/10 border border-purple-500/20 dark:border-purple-500/30">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400 mb-2 flex items-center justify-between">
                    <span>Complete Escalation Workflow Progression</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Active Oversight</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 whitespace-nowrap">
                      <UserCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Department Supervisor / Dispatcher</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Department Manager</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 whitespace-nowrap font-bold">
                      <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>General Manager</span>
                    </div>
                  </div>
                </div>

                {/* Audit Trail Timeline Stages */}
                <div className="space-y-3.5 border-l-2 border-purple-500/30 dark:border-purple-500/20 pl-4 ml-2 mt-4">
                  {/* Stage 1: Department Supervisor / Dispatcher */}
                  <div className="relative text-xs space-y-1">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-500 border-2 border-white dark:border-ink-900" />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-mono text-[11px] text-slate-400">
                        {selectedEscalatedTask.createdAt || '08:30'}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                        Stage 1 · Department Supervisor / Dispatcher
                      </span>
                    </div>
                    <div className="text-navy-950 dark:text-mist-200 font-bold">
                      Intake, Triage & Blocker Flagged
                    </div>
                    <div className="text-slate-600 dark:text-mist-400 leading-relaxed">
                      {selectedEscalatedTask.escalationReason ||
                        (selectedEscalatedTask.history?.[0]?.note ??
                          `Task initiated and triaged by ${getTaskDepartmentDisplay(selectedEscalatedTask)} Dispatcher. Field supervisor flagged an operational blocker requiring department manager attention.`)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 dark:text-mist-500">
                      Assigned: {selectedEscalatedTask.fulfillerName || selectedEscalatedTask.owner || 'Department Field Team'}
                    </div>
                  </div>

                  {/* Stage 2: Department Manager */}
                  <div className="relative text-xs space-y-1">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-mono text-[11px] text-slate-400">
                        {selectedEscalatedTask.createdAt ? `${selectedEscalatedTask.createdAt} (+30m)` : '09:15'}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                        Stage 2 · Department Manager
                      </span>
                    </div>
                    <div className="text-navy-950 dark:text-mist-200 font-bold">
                      Operational Review & Executive Escalation
                    </div>
                    <div className="text-slate-600 dark:text-mist-400 leading-relaxed">
                      {selectedEscalatedTask.requestedAction ||
                        'Department Manager evaluated capacity and resolution thresholds. Local resolution constraints exceeded, escalating directly to the General Manager for executive oversight.'}
                    </div>
                    {selectedEscalatedTask.internalNotes && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300/80 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <strong>Manager Note:</strong> {selectedEscalatedTask.internalNotes}
                      </div>
                    )}
                  </div>

                  {/* Stage 3: General Manager */}
                  <div className="relative text-xs space-y-1">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-ink-900 ring-2 ring-rose-500/20" />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                        Active · Executive Command
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20">
                        Stage 3 · General Manager
                      </span>
                    </div>
                    <div className="text-navy-950 dark:text-mist-200 font-bold">
                      General Manager Executive Governance & Directives
                    </div>
                    <div className="text-slate-600 dark:text-mist-400 leading-relaxed">
                      Under direct General Manager surveillance. Executive directive authority and cross-department resource mobilization active.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Ref: <strong className="font-mono text-navy-950 dark:text-white">{formatEscalatedTaskId(selectedEscalatedTask)}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={permissionMode === 'viewer'}
                  onClick={() => {
                    const t = selectedEscalatedTask;
                    setSelectedEscalatedTask(null);
                    setDirectiveModalTarget({
                      id: formatEscalatedTaskId(t),
                      title: t.title,
                      type: 'incident',
                    });
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    permissionMode === 'viewer'
                      ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Issue Directive
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEscalatedTask(null)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Guest Complaint Modal */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedComplaint(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center border border-amber-500/30">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {selectedComplaint.summary}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-mist-300">
                      {formatComplaintRef(selectedComplaint)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Room {selectedComplaint.room} · Guest: <span className="font-semibold text-navy-950 dark:text-white">{selectedComplaint.guest}</span> · Logged: <span className="font-semibold text-navy-950 dark:text-white">{selectedComplaint.createdAt}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Elaborated Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 4 Quick Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-amber-500" /> Room / Guest
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={`Room ${selectedComplaint.room} - ${selectedComplaint.guest}`}>
                    Room {selectedComplaint.room} · {selectedComplaint.guest}
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <Users className="h-3 w-3 text-purple-500" /> Department
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={selectedComplaint.department || selectedComplaint.category || 'Duty / Guest Services'}>
                    {selectedComplaint.department || selectedComplaint.category || 'Duty / Guest Services'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-rose-500" /> Severity
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5 uppercase">
                    {selectedComplaint.severity}
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <Clock className="h-3 w-3 text-sky-500" /> Logged Time
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                    {selectedComplaint.createdAt}
                  </div>
                </div>
              </div>

              {/* Financial Compensation & Service Recovery Overview */}
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                    Proposed Service Recovery Compensation
                  </span>
                  <div className="text-lg font-mono font-black text-amber-600 dark:text-amber-300 mt-0.5">
                    ₹{selectedComplaint.comp ? (selectedComplaint.comp * 80).toLocaleString('en-IN') : '₹4,000'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-mist-400">Recovery Status:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                    selectedComplaint.compApplied
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    {selectedComplaint.compApplied ? 'Credit Applied / Resolved' : 'Pending Review'}
                  </span>
                </div>
              </div>

              {/* Elaborated Complaint Description */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Elaborated Guest Complaint Details
                </h4>
                <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                  {selectedComplaint.description || selectedComplaint.summary || 'Guest reported service dissatisfaction during stay. Service recovery dispatched under Duty Manager coordination.'}
                </p>
                {selectedComplaint.assignedTo && (
                  <div className="pt-2 text-xs text-slate-500 dark:text-mist-400 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-sky-500" />
                    <span>Assigned Lead: <strong className="text-navy-950 dark:text-white">{selectedComplaint.assignedTo}</strong></span>
                  </div>
                )}
              </div>

              {/* Response Remarks / Manager Notes */}
              {(selectedComplaint.responseRemarks || selectedComplaint.managerNotes) && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Duty Manager Action & Response Remarks
                  </h4>
                  <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                    {selectedComplaint.responseRemarks || selectedComplaint.managerNotes}
                  </p>
                </div>
              )}

              {/* Chronological Audit / Escalation Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-amber-500" />
                  Service Recovery Timeline & Log
                </h4>
                <div className="space-y-2.5 border-l-2 border-amber-500/30 dark:border-amber-500/20 pl-4 ml-2">
                  {selectedComplaint.history && selectedComplaint.history.length > 0 ? (
                    selectedComplaint.history.map((h, i) => (
                      <div key={i} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{h.at}</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">{h.status}</div>
                        {h.note && <div className="text-slate-500 dark:text-mist-400 mt-0.5">{h.note}</div>}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{selectedComplaint.createdAt}</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">Incident Reported by Guest</div>
                        <div className="text-slate-500 dark:text-mist-400 mt-0.5">Logged via Front Desk Coordinator for Room {selectedComplaint.room} ({selectedComplaint.guest}).</div>
                      </div>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">Review In Progress</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">Duty Manager & Department Review</div>
                        <div className="text-slate-500 dark:text-mist-400 mt-0.5">Service recovery action dispatched. Goodwill comp of ₹{selectedComplaint.comp ? (selectedComplaint.comp * 80).toLocaleString('en-IN') : '₹4,000'} queued for executive sign-off.</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Ref: <strong className="font-mono text-navy-950 dark:text-white">{formatComplaintRef(selectedComplaint)}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={permissionMode === 'viewer'}
                  onClick={() => {
                    const c = selectedComplaint;
                    setSelectedComplaint(null);
                    setDirectiveModalTarget({
                      id: formatComplaintRef(c),
                      title: `Room ${c.room} Complaint (${c.guest})`,
                      type: 'complaint',
                    });
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    permissionMode === 'viewer'
                      ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Issue Directive
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
