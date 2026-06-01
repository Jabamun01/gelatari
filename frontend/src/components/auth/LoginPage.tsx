import React, { useState } from 'react';
import { styled } from '@linaria/react';
import { useAuth } from '../../contexts/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--background-color);
`;

const LoginCard = styled.div`
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-2xl) var(--space-xl);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h1`
  margin-bottom: var(--space-xs);
  font-size: 2rem;
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

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: var(--space-md);
  background-color: rgba(239, 68, 68, 0.1);
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
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>🍦 El Gelatari</Title>
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
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
