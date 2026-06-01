import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as loginApi, verifyToken } from '../api/auth';
import { setAuthToken, clearAuthToken, getAuthToken } from '../api/auth-header';

interface AuthState {
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

  // On mount, check if there's an existing valid token
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await verifyToken();
        if (result.valid && result.username) {
          setIsAuthenticated(true);
          setUsername(result.username);
        } else {
          clearAuthToken();
        }
      } catch {
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, username, login, logout }}>
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
