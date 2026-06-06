import React, { useState, useEffect } from 'react';
import { styled } from '@linaria/react';
import { useQueryClient } from '@tanstack/react-query';
import { IceCreamFlavorEditTabData } from '../../types/tabs';
import {
  getFlavorById,
  createFlavor,
  updateFlavor,
} from '../../api/iceCreamFlavors';
import {
  IceCreamFlavor,
} from '../../types/iceCreamFlavor';

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Container = styled.div`
  max-width: 600px;
  margin: var(--space-lg) auto;
  padding: var(--space-xl);
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: var(--space-sm);
`;

const Subtitle = styled.p`
  text-align: center;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-lg);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const Label = styled.label`
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--text-color);
`;

const Input = styled.input`
  width: 100%;

  &[type='number'] {
    max-width: 150px;
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: var(--space-sm) 0;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const ErrorMsg = styled.div`
  color: var(--danger-color-dark);
  background: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  text-align: center;
  font-size: var(--font-size-sm);
`;

const LoadingMsg = styled.div`
  padding: var(--space-2xl);
  text-align: center;
  color: var(--text-color-light);
  font-style: italic;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-md);
  padding-top: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color-light);
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: var(--space-sm) var(--space-lg);
  border: ${({ variant }) =>
    variant === 'secondary'
      ? 'var(--border-width) solid var(--border-color)'
      : 'none'};
  border-radius: var(--border-radius);
  background: ${({ variant }) =>
    variant === 'secondary' ? 'var(--surface-color)' : 'var(--primary-color)'};
  color: ${({ variant }) =>
    variant === 'secondary' ? 'var(--text-color)' : 'var(--text-on-primary)'};
  font-size: var(--font-size-sm);
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IceCreamFlavorEditTabProps {
  tab: IceCreamFlavorEditTabData;
  onCloseTab: (tabId: string) => void;
}

export const IceCreamFlavorEditTab: React.FC<IceCreamFlavorEditTabProps> = ({
  tab,
  onCloseTab,
}) => {
  const { id: tabId, flavorId } = tab;
  const isEditMode = !!flavorId;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [essentialLarge, setEssentialLarge] = useState(false);
  const [essentialSmall, setEssentialSmall] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && flavorId) {
      setIsLoading(true);
      setError(null);

      getFlavorById(flavorId)
        .then((data: IceCreamFlavor) => {
          setName(data.name);
          setEssentialLarge(data.essentialLarge);
          setEssentialSmall(data.essentialSmall);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Error loading flavor.');
          setIsLoading(false);
        });
    } else {
      setName('');
      setEssentialLarge(false);
      setEssentialSmall(false);
      setError(null);
      setIsLoading(false);
    }
  }, [flavorId, isEditMode]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nom del gust no pot estar buit.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode && flavorId) {
        await updateFlavor(flavorId, {
          name: trimmedName,
          essentialLarge,
          essentialSmall,
        });
      } else {
        await createFlavor({ name: trimmedName });
      }

      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      onCloseTab(tabId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error desant el gust.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Container><LoadingMsg>Carregant...</LoadingMsg></Container>;
  }

  return (
    <Container>
      <Title>{isEditMode ? 'Editar Gust' : 'Nou Gust'}</Title>
      {isEditMode && name && !error && (
        <Subtitle>Editant: {name}</Subtitle>
      )}

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <Form onSubmit={(e) => e.preventDefault()}>
        <FormGroup>
          <Label htmlFor="flavorName">Nom del gust</Label>
          <Input
            id="flavorName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Xocolata, Maduixa, ..."
            disabled={isSaving}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Marcar com a essencial</Label>
          <CheckboxRow>
            <input
              type="checkbox"
              checked={essentialLarge}
              onChange={(e) => setEssentialLarge(e.target.checked)}
              disabled={isSaving}
            />
            Essencial per a envasos <strong>grans</strong>
            {' — '}s&apos;alertarà quan l&apos;estoc baixi
          </CheckboxRow>
          <CheckboxRow>
            <input
              type="checkbox"
              checked={essentialSmall}
              onChange={(e) => setEssentialSmall(e.target.checked)}
              disabled={isSaving}
            />
            Essencial per a envasos <strong>petits</strong>
            {' — '}s&apos;alertarà quan l&apos;estoc baixi
          </CheckboxRow>
        </FormGroup>

        <Actions>
          <Button
            variant="secondary"
            onClick={() => onCloseTab(tabId)}
            disabled={isSaving}
          >
            Cancel·lar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? 'Desant...' : isEditMode ? 'Desa Canvis' : 'Crear Gust'}
          </Button>
        </Actions>
      </Form>
    </Container>
  );
};
