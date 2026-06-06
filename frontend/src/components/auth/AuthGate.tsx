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
  font-size: var(--font-size-lg);
  color: var(--text-color-light);
  gap: var(--space-md);
`;

const Spinner = styled.span`
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
        Carregant...
      </LoadingContainer>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default AuthGate;
