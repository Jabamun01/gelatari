import { apiFetch } from './auth-header';
import { API_BASE_URL } from './config';

interface StepsResponse {
  steps: string[];
}

// API function to fetch default steps for a given category
export const fetchDefaultSteps = async (category: 'ice cream' | 'sorbet'): Promise<string[]> => {
  const data = await apiFetch<StepsResponse>(`${API_BASE_URL}/default-steps/${category}`);
  return data.steps;
};

// API function to update default steps for a given category
export const updateDefaultSteps = async (category: string, steps: string[]): Promise<string[]> => {
  const data = await apiFetch<StepsResponse>(`${API_BASE_URL}/default-steps/${category}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steps }),
  });
  return data.steps;
};