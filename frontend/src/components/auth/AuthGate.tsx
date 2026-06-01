import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from './LoginPage';

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Wraps the main app and shows a loading spinner or login page
 * until the user is authenticated. Used instead of early returns
 * inside App.tsx to avoid breaking React's rules of hooks.
 */
const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: '#6B7280',
        }}
      >
        Carregant...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default AuthGate;
