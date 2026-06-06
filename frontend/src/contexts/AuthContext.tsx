import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { login as loginApi, verifyToken } from '../api/auth';
import { setAuthToken, clearAuthToken, getAuthToken } from '../api/auth-header';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // On mount, check if there's an existing valid token.
  // Uses cancelled flag for StrictMode safety (prevents state updates after unmount).
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const result = await verifyToken();
        if (cancelled) return;
        if (result.valid && result.username) {
          setIsAuthenticated(true);
          setUsername(result.username);
        } else {
          clearAuthToken();
        }
      } catch {
        if (!cancelled) clearAuthToken();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (inputUsername: string, password: string) => {
    const result = await loginApi(inputUsername, password);
    setAuthToken(result.token);
    setIsAuthenticated(true);
    setUsername(result.username);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUsername(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthState>(
    () => ({ isAuthenticated, isLoading, username, login, logout }),
    [isAuthenticated, isLoading, username, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
