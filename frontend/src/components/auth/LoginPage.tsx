import React, { useState } from 'react';
import { styled } from '@linaria/react';
import { useAuth } from '../../contexts/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color-xlight) 0%, var(--surface-color) 50%, var(--primary-color-xlight) 100%);
  padding: var(--space-lg);

  @media (max-width: 640px) {
    padding: var(--space-md);
  }
`;

const LoginCard = styled.div`
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-2xl) var(--space-xl);
  width: 100%;
  max-width: 400px;
  text-align: center;

  @media (max-width: 640px) {
    padding: var(--space-xl) var(--space-lg);
  }
`;

const Logo = styled.div`
  font-size: 3rem;
  margin-bottom: var(--space-md);
`;

const Title = styled.h1`
  margin-bottom: var(--space-xs);
  font-size: 1.75rem;
  color: var(--text-color-strong);
`;

const Subtitle = styled.p`
  color: var(--text-color-light);
  margin-bottom: var(--space-xl);
  font-size: var(--font-size-sm);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const Input = styled.input`
  width: 100%;
  padding: var(--space-md);
  font-size: var(--font-size-base);
`;

const LoginButton = styled.button`
  width: 100%;
  padding: var(--space-md);
  font-size: var(--font-size-base);
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  min-height: 48px;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ForgotHelp = styled.p`
  margin-top: var(--space-lg);
  font-size: var(--font-size-xs);
  color: var(--text-color-lighter);
`;

const ErrorMessage = styled.div`
  padding: var(--space-md);
  background-color: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  color: var(--danger-color-dark);
  font-size: var(--font-size-sm);
  text-align: center;
`;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error d\'inici de sessió');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>🍦</Logo>
        <Title>El Gelatari</Title>
        <Subtitle>Inicia sessió per continuar</Subtitle>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}

          <Input
            type="text"
            placeholder="Usuari"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            disabled={isSubmitting}
          />

          <Input
            type="password"
            placeholder="Contrasenya"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <LoginButton type="submit" disabled={isSubmitting || !username || !password}>
            {isSubmitting ? 'Entrant...' : 'Entrar'}
          </LoginButton>
        </Form>

        <ForgotHelp>Gelateria artesana — gestió de receptes i ingredients</ForgotHelp>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
