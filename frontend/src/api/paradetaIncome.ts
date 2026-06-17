import { authFetch } from './auth-header';
import { API_BASE_URL } from './config';
import {
  DailyIncomeRecord,
  CreateIncomeDto,
  UpdateIncomeDto,
  IncomeStats,
  GroupedStat,
  IncomeExportRecord,
} from '../types/paradetaIncome';

const BASE = `${API_BASE_URL}/paradeta-income`;

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export interface IncomeListResponse {
  records: DailyIncomeRecord[];
  total: number;
}

export const fetchIncomes = async (params?: {
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  limit?: number;
  offset?: number;
}): Promise<IncomeListResponse> => {
  const url = new URL(`${BASE}/`, window.location.origin);
  if (params?.fromDate) url.searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) url.searchParams.set('toDate', params.toDate);
  if (params?.year) url.searchParams.set('year', String(params.year));
  if (params?.month) url.searchParams.set('month', String(params.month));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));

  const res = await authFetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch paradeta income records.');
  return res.json();
};

export const fetchIncomeById = async (id: string): Promise<DailyIncomeRecord> => {
  const res = await authFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Record not found.');
  return res.json();
};

export const createIncome = async (dto: CreateIncomeDto): Promise<DailyIncomeRecord> => {
  const res = await authFetch(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create record.');
  }
  return res.json();
};

export const updateIncome = async (id: string, dto: UpdateIncomeDto): Promise<DailyIncomeRecord> => {
  const res = await authFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update record.');
  }
  return res.json();
};

export const deleteIncome = async (id: string): Promise<void> => {
  const res = await authFetch(`${BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete record.');
  }
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const fetchStats = async (params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<IncomeStats> => {
  const url = new URL(`${BASE}/stats`, window.location.origin);
  if (params?.fromDate) url.searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) url.searchParams.set('toDate', params.toDate);

  const res = await authFetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch stats.');
  return res.json();
};

export const fetchGroupedStats = async (params?: {
  groupBy?: 'month' | 'week' | 'year';
  fromDate?: string;
  toDate?: string;
}): Promise<GroupedStat[]> => {
  const url = new URL(`${BASE}/grouped-stats`, window.location.origin);
  url.searchParams.set('groupBy', params?.groupBy || 'month');
  if (params?.fromDate) url.searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) url.searchParams.set('toDate', params.toDate);

  const res = await authFetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch grouped stats.');
  return res.json();
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const fetchExportData = async (): Promise<IncomeExportRecord[]> => {
  const url = new URL(`${BASE}/export`, window.location.origin);
  const res = await authFetch(url.toString());
  if (!res.ok) throw new Error('Failed to export data.');
  return res.json();
};
