import { authFetch } from './auth-header';
import { API_BASE_URL } from './config';
import { FlavorCostRow } from '../types/costs';

const BASE = `${API_BASE_URL}/costs`;

/**
 * Fetches computed cost data for all ice cream / sorbet flavors.
 */
export const fetchFlavorCosts = async (): Promise<FlavorCostRow[]> => {
  const res = await authFetch(`${BASE}/flavors`);
  if (!res.ok) throw new Error('Failed to fetch flavor costs.');
  return res.json();
};
