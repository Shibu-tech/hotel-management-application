import { apiFetch, parseApiJson, type BackendRole } from './authApi';

export interface DepartmentRecord {
  id: number;
  hotelId: number;
  name: string;
  active: boolean;
  createdAt?: string;
}

export interface EmployeeRecord {
  id: number;
  employeeCode: string | null;
  fullName: string;
  email: string;
  role: BackendRole;
  hotelId: number;
  hotelSlug: string;
  departmentId: number | null;
  departmentName: string | null;
  active: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
}

export interface EmployeeCredentialResult {
  employee: EmployeeRecord;
  temporaryPassword: string;
}

export interface CreateEmployeePayload {
  fullName: string;
  email: string;
  role: 'FRONT_DESK' | 'SUPERVISOR' | 'FULFILLER';
  departmentId?: number | null;
  employeeCode?: string;
  initialPassword?: string;
}

export interface UpdateEmployeePayload {
  fullName: string;
  role: 'FRONT_DESK' | 'SUPERVISOR' | 'FULFILLER';
  departmentId?: number | null;
}

export async function fetchHotelDepartments(slug: string): Promise<DepartmentRecord[]> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/departments`);
  return parseApiJson<DepartmentRecord[]>(res);
}

export async function createHotelDepartment(slug: string, name: string): Promise<DepartmentRecord> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/departments`, {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
  });
  return parseApiJson<DepartmentRecord>(res);
}

export async function updateHotelDepartment(
  slug: string,
  departmentId: number,
  name: string,
): Promise<DepartmentRecord> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/departments/${departmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: name.trim() }),
  });
  return parseApiJson<DepartmentRecord>(res);
}

export async function toggleHotelDepartmentStatus(
  slug: string,
  departmentId: number,
): Promise<DepartmentRecord> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/departments/${departmentId}/status`, {
    method: 'PATCH',
  });
  return parseApiJson<DepartmentRecord>(res);
}

export async function fetchHotelEmployees(slug: string): Promise<EmployeeRecord[]> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/employees`);
  return parseApiJson<EmployeeRecord[]>(res);
}

export async function createHotelEmployee(
  slug: string,
  payload: CreateEmployeePayload,
): Promise<EmployeeCredentialResult> {
  const body: Record<string, unknown> = {
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    departmentId: payload.departmentId ?? null,
  };
  if (payload.employeeCode && payload.employeeCode.trim()) {
    body.employeeCode = payload.employeeCode.trim();
  }
  if (payload.initialPassword && payload.initialPassword.trim()) {
    body.initialPassword = payload.initialPassword.trim();
  }

  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/employees`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseApiJson<EmployeeCredentialResult>(res);
}

export async function updateHotelEmployee(
  slug: string,
  employeeId: number,
  payload: UpdateEmployeePayload,
): Promise<EmployeeRecord> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify({
      fullName: payload.fullName.trim(),
      role: payload.role,
      departmentId: payload.departmentId ?? null,
    }),
  });
  return parseApiJson<EmployeeRecord>(res);
}

export async function toggleHotelEmployeeStatus(
  slug: string,
  employeeId: number,
): Promise<EmployeeRecord> {
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/employees/${employeeId}/status`, {
    method: 'PATCH',
  });
  return parseApiJson<EmployeeRecord>(res);
}

export async function resetHotelEmployeePassword(
  slug: string,
  employeeId: number,
  temporaryPassword?: string,
): Promise<EmployeeCredentialResult> {
  const body = temporaryPassword && temporaryPassword.trim()
    ? { temporaryPassword: temporaryPassword.trim() }
    : {};
  const res = await apiFetch(`/hotels/${encodeURIComponent(slug)}/employees/${employeeId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseApiJson<EmployeeCredentialResult>(res);
}
