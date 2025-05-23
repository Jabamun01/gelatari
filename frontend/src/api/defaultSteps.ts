// API function to fetch default steps for a given category

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchDefaultSteps = async (category: 'ice cream' | 'sorbet'): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/default-steps/${category}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    throw new Error(`Failed to fetch default steps for ${category}: ${response.status} ${response.statusText} - ${errorData?.message || 'Unknown error'}`);
  }

  const data: { steps: string[] } = await response.json();
  return data.steps; // Assuming the backend returns { steps: [...] }
};

// API function to update default steps for a given category
export const updateDefaultSteps = async (category: string, steps: string[]): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/default-steps/${category}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ steps }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    throw new Error(`Failed to update default steps for ${category}: ${response.status} ${response.statusText} - ${errorData?.message || 'Unknown error'}`);
  }

  const data: { steps: string[] } = await response.json();
  return data.steps; // Assuming the backend returns { steps: [...] }
};