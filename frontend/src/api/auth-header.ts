const AUTH_TOKEN_KEY = 'gelatari_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const getAuthHeader = (): Record<string, string> => getAuthHeaders(); // alias

/**
 * Wrapper around fetch that automatically includes the auth token.
 * Use this instead of raw fetch() in API functions.
 */
export const authFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  return fetch(input, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
};
