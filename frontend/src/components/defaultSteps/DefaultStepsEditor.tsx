import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { fetchDefaultSteps, updateDefaultSteps } from '../../api/defaultSteps';

interface DefaultStepsEditorProps {
  category: 'ice cream' | 'sorbet';
}

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
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
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background-color: var(--surface-color-light);
  border-radius: var(--border-radius);
`;

const StepInput = styled.textarea`
  flex-grow: 1;
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  min-height: 40px; /* Adjust as needed */
  resize: vertical; /* Allow vertical resize */
  &:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color-light);
  }
`;

const ActionButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
  }

  &:disabled {
    background-color: var(--disabled-color);
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: var(--space-xs);
  background-color: transparent;
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  line-height: 1;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    background-color: var(--danger-color);
    color: var(--text-on-primary);
  }
   &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageArea = styled.p<{ type?: 'success' | 'error' }>`
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  background-color: ${({ type }) => type === 'success' ? 'var(--success-color-light)' : type === 'error' ? 'var(--danger-color-light)' : 'transparent'};
  color: ${({ type }) => type === 'success' ? 'var(--success-color-dark)' : type === 'error' ? 'var(--danger-color-dark)' : 'var(--text-color)'};
  border: 1px solid ${({ type }) => type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'transparent'};
  margin-top: var(--space-sm);
  text-align: center;
`;

const LoadingIndicator = styled.p`
    font-style: italic;
    color: var(--text-color-light);
`;

const DefaultStepsEditor: React.FC<DefaultStepsEditorProps> = ({ category }) => {
  const [steps, setSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSteps = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const fetchedSteps = await fetchDefaultSteps(category);
      setSteps(fetchedSteps);
    } catch (error) {
      console.error(`Error fetching default steps for ${category}:`, error);
      setMessage({ text: `Error en carregar els passos per defecte per a ${category === 'ice cream' ? 'Gelat' : 'Sorbet'}.`, type: 'error' });
      setSteps([]); // Clear steps on error
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
    setMessage(null); // Clear message on edit
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
    return <LoadingIndicator>Carregant passos per defecte...</LoadingIndicator>;
  }

  return (
    <EditorContainer>
      <h3>{`Editant Passos per Defecte: ${category === 'ice cream' ? 'Gelat' : 'Sorbet'}`}</h3>
      <StepListContainer>
        {steps.map((step, index) => (
          <StepItem key={index}>
            <StepInput
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              placeholder="Descripció del pas"
              rows={2}
            />
            <DeleteButton onClick={() => handleDeleteStep(index)} disabled={isSaving} title="Elimina Pas">
              ✕
            </DeleteButton>
          </StepItem>
        ))}
      </StepListContainer>
      <ActionButton onClick={handleAddStep} disabled={isSaving}>
        Afegeix Pas
      </ActionButton>
      <ActionButton onClick={handleSaveChanges} disabled={isSaving || steps.length === 0}>
        {isSaving ? 'Guardant...' : 'Guarda Canvis'}
      </ActionButton>
      {message && <MessageArea type={message.type}>{message.text}</MessageArea>}
    </EditorContainer>
  );
};

export default DefaultStepsEditor;