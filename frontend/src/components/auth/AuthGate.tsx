import React, { ReactNode } from 'react';
import { styled } from '@linaria/react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from './LoginPage';

interface AuthGateProps {
  children: ReactNode;
}

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.2rem;
  color: var(--text-color-light);
`;

/**
 * Wraps the main app and shows a loading spinner or login page
 * until the user is authenticated. Used instead of early returns
 * inside App.tsx to avoid breaking React's rules of hooks.
 */
const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingContainer>Carregant...</LoadingContainer>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default AuthGate;
