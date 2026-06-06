import { authFetch } from './auth-header';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AUTH_URL = `${API_BASE_URL}/auth`;

export interface LoginResponse {
  token: string;
  username: string;
}

export interface VerifyResponse {
  valid: boolean;
  userId?: string;
  username?: string;
}

export interface ChangePasswordResponse {
  message: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorBody = await response.text();
    let message: string;
    try {
      message = JSON.parse(errorBody).message || errorBody;
    } catch {
      message = errorBody || `HTTP ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json();
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<LoginResponse>(response);
};

export const verifyToken = async (): Promise<VerifyResponse> => {
  const response = await authFetch(`${AUTH_URL}/verify`);
  return handleResponse<VerifyResponse>(response);
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> => {
  const response = await authFetch(`${AUTH_URL}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse<ChangePasswordResponse>(response);
};
