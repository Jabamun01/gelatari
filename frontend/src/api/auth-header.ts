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

/**
 * Generic API fetch helper that wraps authFetch with consistent error handling.
 * Parses JSON responses and throws meaningful Error objects on non-OK status.
 */
export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  try {
    const response = await authFetch(input, init);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || `HTTP ${response.status}: ${response.statusText}`;
      // Attach the raw error response for consumers that need custom error fields
      const error = new Error(message) as Error & { status?: number; body?: unknown };
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // Re-throw errors that are already our Error instances
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected network error occurred.');
  }
}
