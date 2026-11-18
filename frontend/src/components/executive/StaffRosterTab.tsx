'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  FolderPlus,
  KeyRound,
  Layers,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/authContext';
import { ApiError, type BackendRole } from '@/lib/authApi';
import {
  createHotelDepartment,
  createHotelEmployee,
  fetchHotelDepartments,
  fetchHotelEmployees,
  resetHotelEmployeePassword,
  toggleHotelDepartmentStatus,
  toggleHotelEmployeeStatus,
  updateHotelDepartment,
  updateHotelEmployee,
  type DepartmentRecord,
  type EmployeeRecord,
} from '@/lib/hotelEmployeesApi';
import { copyHotelLoginUrl } from '@/lib/hotelQrApi';
import { useDemo } from '@/lib/store';

type AssignableRole = 'FRONT_DESK' | 'SUPERVISOR' | 'FULFILLER';

const ASSIGNABLE_ROLES: Array<{ value: AssignableRole; label: string; needsDept: boolean }> = [
  { value: 'FRONT_DESK', label: 'Front Desk', needsDept: false },
  { value: 'SUPERVISOR', label: 'Supervisor', needsDept: true },
  { value: 'FULFILLER', label: 'Task Fulfiller', needsDept: true },
];

const ROLE_DISPLAY: Record<BackendRole, string> = {
  ADMIN: 'Platform Admin',
  GENERAL_MANAGER: 'General Manager',
  SUPERVISOR: 'Supervisor',
  FRONT_DESK: 'Front Desk',
  FULFILLER: 'Task Fulfiller',
  GUEST: 'Guest',
};

interface TempCredentialModalState {
  title: string;
  employee: EmployeeRecord;
  temporaryPassword: string;
}

export function StaffRosterTab() {
  const { user, registerDevQuickAccessEntry } = useAuth();
  const { currentHotelSlug, currentHotelName } = useDemo();

  // Authoritative hotel slug from authenticated backend session (fallback to current route slug for ADMIN)
  const hotelSlug = (user?.role === 'ADMIN' ? currentHotelSlug : user?.hotelSlug) || currentHotelSlug;
  const hotelLabel = user?.hotelName || currentHotelName || hotelSlug;

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [tempCredModal, setTempCredModal] = useState<TempCredentialModalState | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Create Employee Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AssignableRole>('FRONT_DESK');
  const [newDeptId, setNewDeptId] = useState<string>('');
  const [newInitialPass, setNewInitialPass] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Employee Form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AssignableRole>('FRONT_DESK');
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Department Manager Form
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptBusy, setDeptBusy] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3500);
  }, []);

  const loadData = useCallback(async () => {
    if (!hotelSlug) return;
    setRefreshing(true);
    setError(null);
    try {
      const [empList, deptList] = await Promise.all([
        fetchHotelEmployees(hotelSlug),
        fetchHotelDepartments(hotelSlug),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load staff roster.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hotelSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeDepartments = useMemo(() => departments.filter((d) => d.active), [departments]);

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((emp) => {
      if (q) {
        const hay = `${emp.fullName} ${emp.email} ${emp.employeeCode ?? ''} ${emp.departmentName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (deptFilter !== 'all') {
        if (deptFilter === 'none' && emp.departmentId !== null) return false;
        if (deptFilter !== 'none' && String(emp.departmentId) !== deptFilter) return false;
      }
      if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
      if (statusFilter === 'active' && !emp.active) return false;
      if (statusFilter === 'inactive' && emp.active) return false;
      return true;
    });
  }, [employees, query, deptFilter, roleFilter, statusFilter]);

  const roleNeedsDepartment = (role: AssignableRole) => role === 'SUPERVISOR' || role === 'FULFILLER';

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newName.trim() || !newEmail.trim()) {
      setCreateError('Full name and email are required.');
      return;
    }
    if (roleNeedsDepartment(newRole) && !newDeptId) {
      setCreateError(`Please select an active department for ${ROLE_DISPLAY[newRole]}. Create a department first if none exist.`);
      return;
    }
    if (newInitialPass.trim() && newInitialPass.trim().length < 8) {
      setCreateError('Initial password must be at least 8 characters (or leave blank to auto-generate).');
      return;
    }

    setSubmittingCreate(true);
    try {
      const result = await createHotelEmployee(hotelSlug, {
        fullName: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        departmentId: newDeptId ? Number(newDeptId) : null,
        initialPassword: newInitialPass.trim() || undefined,
      });

      setEmployees((prev) => [result.employee, ...prev]);

      // Populate dev-only in-memory Quick Access (complete no-op in production)
      registerDevQuickAccessEntry({
        fullName: result.employee.fullName,
        email: result.employee.email,
        initialPassword: result.temporaryPassword,
        role: result.employee.role,
        hotelName: hotelLabel,
        hotelSlug,
        departmentName: result.employee.departmentName,
      });

      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('FRONT_DESK');
      setNewDeptId('');
      setNewInitialPass('');

      setTempCredModal({
        title: 'Employee Account Provisioned',
        employee: result.employee,
        temporaryPassword: result.temporaryPassword,
      });
      showToast(`Created account for ${result.employee.fullName}.`);
    } catch (err: unknown) {
      setCreateError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to create employee.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openEditModal = (emp: EmployeeRecord) => {
    if (emp.role === 'GENERAL_MANAGER' || emp.role === 'ADMIN') return;
    setEditingEmployee(emp);
    setEditName(emp.fullName);
    setEditRole(emp.role as AssignableRole);
    setEditDeptId(emp.departmentId ? String(emp.departmentId) : '');
    setEditError(null);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError(null);

    if (roleNeedsDepartment(editRole) && !editDeptId) {
      setEditError(`A department is required for ${ROLE_DISPLAY[editRole]}.`);
      return;
    }

    setSubmittingEdit(true);
    try {
      const updated = await updateHotelEmployee(hotelSlug, editingEmployee.id, {
        fullName: editName.trim(),
        role: editRole,
        departmentId: editDeptId ? Number(editDeptId) : null,
      });
      setEmployees((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingEmployee(null);
      showToast(`Updated ${updated.fullName}.`);
    } catch (err: unknown) {
      setEditError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to update employee.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleEmployeeStatus = async (emp: EmployeeRecord) => {
    try {
      const updated = await toggleHotelEmployeeStatus(hotelSlug, emp.id);
      setEmployees((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        updated.active
          ? `Reactivated ${updated.fullName}.`
          : `Deactivated ${updated.fullName} and revoked active sessions.`,
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Unable to update employee status.');
    }
  };

  const handleResetPassword = async (emp: EmployeeRecord) => {
    try {
      const res = await resetHotelEmployeePassword(hotelSlug, emp.id);
      setEmployees((prev) => prev.map((item) => (item.id === res.employee.id ? res.employee : item)));

      registerDevQuickAccessEntry({
        fullName: res.employee.fullName,
        email: res.employee.email,
        initialPassword: res.temporaryPassword,
        role: res.employee.role,
        hotelName: hotelLabel,
        hotelSlug,
        departmentName: res.employee.departmentName,
      });

      setTempCredModal({
        title: 'Employee Password Reset',
        employee: res.employee,
        temporaryPassword: res.temporaryPassword,
      });
      showToast(`Reset temporary password for ${res.employee.fullName}.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Unable to reset employee password.');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setDeptError(null);
    setDeptBusy(true);
    try {
      const created = await createHotelDepartment(hotelSlug, newDeptName.trim());
      setDepartments((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewDeptName('');
      showToast(`Created department "${created.name}".`);
    } catch (err: unknown) {
      setDeptError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to create department.');
    } finally {
      setDeptBusy(false);
    }
  };

  const handleRenameDepartment = async (deptId: number) => {
    if (!editingDeptName.trim()) return;
    setDeptError(null);
    setDeptBusy(true);
    try {
      const updated = await updateHotelDepartment(hotelSlug, deptId, editingDeptName.trim());
      setDepartments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingDeptId(null);
      setEditingDeptName('');
      showToast(`Renamed department to "${updated.name}".`);
      await loadData();
    } catch (err: unknown) {
      setDeptError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to rename department.');
    } finally {
      setDeptBusy(false);
    }
  };

  const handleToggleDepartmentStatus = async (dept: DepartmentRecord) => {
    setDeptError(null);
    setDeptBusy(true);
    try {
      const updated = await toggleHotelDepartmentStatus(hotelSlug, dept.id);
      setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      showToast(
        updated.active ? `Activated department "${updated.name}".` : `Deactivated department "${updated.name}".`,
      );
    } catch (err: unknown) {
      setDeptError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to toggle department.');
    } finally {
      setDeptBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-400" />
            Staff Accounts & Department Governance
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Manage real PostgreSQL employee accounts and dynamic departments for{' '}
            <strong className="text-amber-300">{hotelLabel}</strong>. Newly created employees can sign in immediately via the shared login portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            iconLeft={RefreshCw}
            onClick={loadData}
            disabled={refreshing}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="subtle"
            iconLeft={Layers}
            onClick={() => {
              setDeptError(null);
              setDeptModalOpen(true);
            }}
          >
            Manage Departments ({departments.length})
          </Button>

          <Button
            size="sm"
            variant="accent"
            iconLeft={UserPlus}
            onClick={() => {
              setCreateError(null);
              setAddModalOpen(true);
            }}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Department Quick Pills */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-ink-900/50 px-4 py-3 text-xs">
        <span className="font-semibold text-mist-400 flex items-center gap-1.5 mr-1">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          Departments:
        </span>
        {departments.length === 0 ? (
          <span className="text-amber-300">
            No departments configured yet. Click &ldquo;Manage Departments&rdquo; to add Housekeeping, Maintenance, Food &amp; Beverage, etc.
          </span>
        ) : (
          departments.map((d) => (
            <span
              key={d.id}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                d.active
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                  : 'bg-white/5 border-white/10 text-mist-500 line-through'
              }`}
            >
              {d.name}
            </span>
          ))
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, employee code, email, or department..."
            className="w-full rounded-xl border border-white/10 bg-ink-950/70 py-2 pl-10 pr-4 text-xs text-white placeholder:text-mist-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Departments</option>
            <option value="none">No Department (Front Desk / GM)</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Roles</option>
            <option value="GENERAL_MANAGER">General Manager</option>
            <option value="FRONT_DESK">Front Desk</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="FULFILLER">Task Fulfiller</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-mist-400">
                <th className="p-4 font-semibold">Employee ID</th>
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-mist-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-mist-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Loading employee directory from PostgreSQL...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-mist-400">
                    No employees found for this hotel. Click &ldquo;Add Employee&rdquo; to create Front Desk, Supervisor, or Fulfiller accounts.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isProtectedRole = emp.role === 'GENERAL_MANAGER' || emp.role === 'ADMIN';
                  return (
                    <tr key={emp.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 font-mono font-bold text-amber-300">
                        {emp.employeeCode || `USR-${emp.id}`}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white block text-sm">{emp.fullName}</span>
                        <span className="text-[11px] font-mono text-mist-400 block">{emp.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white">
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                          <span>{ROLE_DISPLAY[emp.role] || emp.role}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        {emp.departmentName ? (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-200 font-medium">
                            {emp.departmentName}
                          </span>
                        ) : (
                          <span className="text-mist-500">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            emp.active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {emp.active ? 'Active' : 'Disabled'}
                        </span>
                        {emp.mustChangePassword && (
                          <span className="block text-[10px] text-amber-300 mt-1">
                            Password change pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isProtectedRole ? (
                          <div className="text-right text-[11px] text-mist-500">Hotel Owner / GM</div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(emp)}
                              title="Edit Employee"
                              className="p-2 rounded-lg border border-white/10 hover:border-sky-400/50 text-sky-300 hover:bg-sky-500/10 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(emp)}
                              title="Reset Temporary Password"
                              className="p-2 rounded-lg border border-white/10 hover:border-amber-400/50 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleEmployeeStatus(emp)}
                              title={emp.active ? 'Disable Account' : 'Enable Account'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                                emp.active
                                  ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/15'
                                  : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              <span>{emp.active ? 'Disable' : 'Enable'}</span>
                            </button>
                          </div>
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

      {/* Add Employee Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b1326] p-6 sm:p-7 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Add Hotel Employee</h3>
                <p className="text-xs text-slate-400">
                  Creates a verified PostgreSQL login account scoped strictly to {hotelLabel}.
                </p>
              </div>
              <button type="button" onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Rohan Mehta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rohan.mehta@hotel.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Permitted Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as AssignableRole;
                      setNewRole(nextRole);
                      if (!roleNeedsDepartment(nextRole)) {
                        setNewDeptId('');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department {roleNeedsDepartment(newRole) ? '*' : '(Optional)'}
                  </label>
                  <select
                    value={newDeptId}
                    required={roleNeedsDepartment(newRole)}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                  >
                    <option value="">
                      {roleNeedsDepartment(newRole) ? 'Select department...' : 'None (Front Desk)'}
                    </option>
                    {activeDepartments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Temporary Password (Optional — leave blank to auto-generate)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={newInitialPass}
                  onChange={(e) => setNewInitialPass(e.target.value)}
                  placeholder="Min 8 chars, or leave blank for random password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Stored with BCrypt hashing. Employee will be required to set a personal password on first login.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs border border-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCreate ? 'Creating...' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b1326] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-serif font-bold text-white">Edit Employee</h3>
              <button type="button" onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AssignableRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department {roleNeedsDepartment(editRole) ? '*' : '(Optional)'}
                </label>
                <select
                  value={editDeptId}
                  required={roleNeedsDepartment(editRole)}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-sm text-white"
                >
                  <option value="">{roleNeedsDepartment(editRole) ? 'Select department...' : 'None'}</option>
                  {activeDepartments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingEmployee(null)} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Departments Manager Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b1326] p-6 shadow-2xl space-y-4 text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Hotel Departments</h3>
                <p className="text-xs text-slate-400">
                  Create and manage dynamic operational departments for {hotelLabel}.
                </p>
              </div>
              <button type="button" onClick={() => setDeptModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {deptError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {deptError}
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="flex gap-2">
              <input
                type="text"
                required
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Housekeeping, Maintenance, Food & Beverage"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-white/10 text-xs sm:text-sm text-white"
              />
              <button
                type="submit"
                disabled={deptBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer disabled:opacity-50"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {departments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No departments created yet.
                </p>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#060c18] border border-white/10"
                  >
                    {editingDeptId === dept.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingDeptName}
                          onChange={(e) => setEditingDeptName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0b1326] border border-amber-400/50 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameDepartment(dept.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDeptId(null)}
                          className="px-2 py-1.5 rounded-lg text-xs text-slate-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <span className={`font-semibold text-xs sm:text-sm ${dept.active ? 'text-white' : 'text-slate-500 line-through'}`}>
                            {dept.name}
                          </span>
                          <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${dept.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                            {dept.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeptId(dept.id);
                              setEditingDeptName(dept.name);
                            }}
                            className="p-1.5 rounded-lg border border-white/10 text-sky-300 hover:bg-sky-500/10 cursor-pointer"
                            title="Rename Department"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDepartmentStatus(dept)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                              dept.active
                                ? 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                                : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                          >
                            {dept.active ? 'Disable' : 'Activate'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeptModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-Time Temporary Password Modal */}
      {tempCredModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0b1326] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">{tempCredModal.title}</h3>
                <p className="text-[11px] text-amber-300">
                  Displayed ONCE only. Stored as a BCrypt hash — cannot be retrieved later.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#060c18] border border-white/10 p-4 space-y-2 text-xs">
              <div><span className="text-slate-400">Name:</span> <strong className="text-white">{tempCredModal.employee.fullName}</strong></div>
              <div><span className="text-slate-400">Employee ID:</span> <strong className="font-mono text-amber-300">{tempCredModal.employee.employeeCode}</strong></div>
              <div><span className="text-slate-400">Role:</span> <strong className="text-white">{ROLE_DISPLAY[tempCredModal.employee.role]}</strong></div>
              {tempCredModal.employee.departmentName && (
                <div><span className="text-slate-400">Department:</span> <strong className="text-sky-300">{tempCredModal.employee.departmentName}</strong></div>
              )}
              <div><span className="text-slate-400">Email:</span> <strong className="font-mono text-white">{tempCredModal.employee.email}</strong></div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400 block">Temporary Password:</span>
                  <code className="text-sm font-mono font-bold text-emerald-400">{tempCredModal.temporaryPassword}</code>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await copyHotelLoginUrl(tempCredModal.temporaryPassword);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setTempCredModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0c1424]/95 border border-amber-500/30 text-amber-200 text-xs font-medium shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
