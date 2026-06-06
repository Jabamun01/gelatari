import { authFetch } from './auth-header';
import { API_BASE_URL } from './config';
import {
  IceCreamFlavor,
  DashboardFlavor,
  CreateFlavorDto,
  UpdateFlavorDto,
  ConvertMixDto,
  SellContainerDto,
  MoveContainersDto,
} from '../types/iceCreamFlavor';

const BASE = `${API_BASE_URL}/ice-cream`;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const fetchDashboard = async (): Promise<DashboardFlavor[]> => {
  const res = await authFetch(`${BASE}/dashboard`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.statusText}`);
  }
  return res.json();
};

// ---------------------------------------------------------------------------
// CRUD – paths match the router mounted at /api/ice-cream
// ---------------------------------------------------------------------------

export const createFlavor = async (
  dto: CreateFlavorDto,
): Promise<IceCreamFlavor> => {
  const res = await authFetch(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create flavor.');
  }
  return res.json();
};

export const getAllFlavors = async (): Promise<IceCreamFlavor[]> => {
  const res = await authFetch(`${BASE}/`);
  if (!res.ok) throw new Error('Failed to fetch flavors.');
  return res.json();
};

export const getFlavorById = async (
  id: string,
): Promise<IceCreamFlavor> => {
  const res = await authFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Flavor not found.');
  return res.json();
};

export const updateFlavor = async (
  id: string,
  dto: UpdateFlavorDto,
): Promise<IceCreamFlavor> => {
  const res = await authFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update flavor.');
  }
  return res.json();
};

export const deleteFlavor = async (id: string): Promise<void> => {
  const res = await authFetch(`${BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete flavor.');
  }
};

// ---------------------------------------------------------------------------
// Business operations
// ---------------------------------------------------------------------------

export const convertMixToFrozen = async (
  flavorId: string,
  dto: ConvertMixDto,
): Promise<IceCreamFlavor> => {
  const res = await authFetch(`${BASE}/${flavorId}/convert-mix`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to convert mix.');
  }
  return res.json();
};

export const sellContainer = async (
  flavorId: string,
  dto: SellContainerDto,
): Promise<IceCreamFlavor> => {
  const res = await authFetch(`${BASE}/${flavorId}/sell-container`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to sell container.');
  }
  return res.json();
};

export const moveContainers = async (
  flavorId: string,
  dto: MoveContainersDto,
): Promise<IceCreamFlavor> => {
  const res = await authFetch(`${BASE}/${flavorId}/move-containers`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to move containers.');
  }
  return res.json();
};

// ---------------------------------------------------------------------------
// Event history
// ---------------------------------------------------------------------------

export interface IceCreamEventItem {
  _id: string;
  flavorId: string;
  flavorName: string;
  type: 'production' | 'conversion' | 'sale' | 'movement';
  timestamp: string;
  recipeId?: string;
  recipeName?: string;
  mixKgAdded?: number;
  mixKgConverted?: number;
  frozenLitersProduced?: number;
  largeContainersAdded?: number;
  smallContainersAdded?: number;
  batchOverrunPercent?: number;
  soldContainerType?: 'large' | 'small';
  soldLocation?: 'warehouse' | 'paradeta';
  movedCount?: number;
  movedFrom?: 'warehouse' | 'paradeta';
  movedTo?: 'warehouse' | 'paradeta';
  movedContainerType?: 'large' | 'small';
  snapshot: {
    iceCreamMixKg: number;
    largeWarehouseContainers: number;
    largeWarehouseLiters: number;
    largeParadetaContainers: number;
    largeParadetaLiters: number;
    smallWarehouseCount: number;
    smallParadetaCount: number;
    totalMixConvertedKg: number;
    totalFrozenProducedL: number;
  };
}

export interface EventsResponse {
  events: IceCreamEventItem[];
  total: number;
}

export const fetchEvents = async (params: {
  flavorId?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<EventsResponse> => {
  const url = new URL(`${BASE}/events`);
  if (params.flavorId) url.searchParams.set('flavorId', params.flavorId);
  if (params.type) url.searchParams.set('type', params.type);
  if (params.fromDate) url.searchParams.set('fromDate', params.fromDate);
  if (params.toDate) url.searchParams.set('toDate', params.toDate);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.offset) url.searchParams.set('offset', String(params.offset));

  const res = await authFetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch events.');
  return res.json();
};
