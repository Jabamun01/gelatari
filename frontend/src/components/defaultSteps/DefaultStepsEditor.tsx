import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { fetchDefaultSteps, updateDefaultSteps } from '../../api/defaultSteps';
import { PrimaryButton, DangerButton } from '../common/Button';

interface DefaultStepsEditorProps {
  category: 'ice cream' | 'sorbet';
}

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
`;

const SectionTitle = styled.h3`
  margin: 0 0 var(--space-md) 0;
  color: var(--text-color-strong);
`;

const StepListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const StepItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background-color: var(--surface-color-light);
  border-radius: var(--border-radius);
  border: var(--border-width) solid var(--border-color-light);
`;

const StepNumber = styled.span`
  font-weight: 600;
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  padding-top: var(--space-sm);
  min-width: 24px;
  text-align: center;
`;

const StepInput = styled.textarea`
  flex-grow: 1;
  padding: var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  min-height: 60px;
  resize: vertical;
  background-color: var(--surface-color);

  &:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  align-items: center;
`;

const MessageArea = styled.p<{ type?: 'success' | 'error' }>`
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  background-color: ${({ type }) =>
    type === 'success'
      ? 'var(--success-color-light)'
      : type === 'error'
        ? 'var(--danger-color-light)'
        : 'transparent'};
  color: ${({ type }) =>
    type === 'success'
      ? 'var(--success-color-dark)'
      : type === 'error'
        ? 'var(--danger-color-dark)'
        : 'var(--text-color)'};
  border: 1px solid
    ${({ type }) =>
      type === 'success'
        ? 'var(--success-color)'
        : type === 'error'
          ? 'var(--danger-color)'
          : 'transparent'};
  margin: 0;
  text-align: center;
  font-size: var(--font-size-sm);
`;

const LoadingIndicator = styled.p`
  font-style: italic;
  color: var(--text-color-light);
  text-align: center;
  padding: var(--space-xl);
`;

const DefaultStepsEditor: React.FC<DefaultStepsEditorProps> = ({ category }) => {
  const [steps, setSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const loadSteps = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const fetchedSteps = await fetchDefaultSteps(category);
      setSteps(fetchedSteps);
    } catch (error) {
      console.error(`Error fetching default steps for ${category}:`, error);
      setMessage({
        text: `Error en carregar els passos per defecte per a ${
          category === 'ice cream' ? 'Gelat' : 'Sorbet'
        }.`,
        type: 'error',
      });
      setSteps([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadSteps();
  }, [loadSteps]);

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
    setMessage(null);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
    setMessage(null);
  };

  const handleDeleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    setMessage(null);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateDefaultSteps(category, steps);
      setMessage({ text: 'Canvis guardats correctament!', type: 'success' });
    } catch (error) {
      console.error(`Error saving default steps for ${category}:`, error);
      setMessage({ text: 'Error en guardar els canvis.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingIndicator aria-live="polite">
        Carregant passos per defecte...
      </LoadingIndicator>
    );
  }

  const categoryDisplayName = category === 'ice cream' ? 'Gelat' : 'Sorbet';

  return (
    <EditorContainer>
      <SectionTitle>{`Editant Passos per Defecte: ${categoryDisplayName}`}</SectionTitle>
      <StepListContainer>
        {steps.length === 0 && (
          <p
            style={{
              color: 'var(--text-color-light)',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: 'var(--space-lg)',
            }}
          >
            No hi ha passos per defecte per a {categoryDisplayName}.
          </p>
        )}
        {steps.map((step, index) => (
          <StepItem key={index}>
            <StepNumber>{index + 1}</StepNumber>
            <StepInput
              aria-label={`Pas ${index + 1} per a ${categoryDisplayName}`}
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              placeholder="Descripció del pas"
              rows={2}
            />
            <DangerButton
              onClick={() => handleDeleteStep(index)}
              disabled={isSaving}
              title={`Elimina el pas ${index + 1}`}
              style={{ flexShrink: 0 }}
            >
              ✕
            </DangerButton>
          </StepItem>
        ))}
      </StepListContainer>
      <ButtonRow>
        <PrimaryButton onClick={handleAddStep} disabled={isSaving}>
          Afegeix Pas
        </PrimaryButton>
        <PrimaryButton
          onClick={handleSaveChanges}
          disabled={isSaving}
          style={{ backgroundColor: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
        >
          {isSaving ? 'Guardant...' : 'Guarda Canvis'}
        </PrimaryButton>
      </ButtonRow>
      {message && (
        <MessageArea
          type={message.type}
          role={message.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message.text}
        </MessageArea>
      )}
    </EditorContainer>
  );
};

export default DefaultStepsEditor;
