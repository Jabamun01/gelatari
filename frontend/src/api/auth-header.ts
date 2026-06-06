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

/**
 * Wrapper around fetch that automatically includes the auth token.
 * Use this instead of raw fetch() in API functions.
 * Note: init.headers can be a plain object or Headers instance.
 */
export const authFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  // Merge auth headers with provided headers, supporting Headers objects
  const authHeaders = getAuthHeaders();
  const mergedHeaders = new Headers(init?.headers);
  for (const [key, value] of Object.entries(authHeaders)) {
    mergedHeaders.set(key, value);
  }

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
  });
};
