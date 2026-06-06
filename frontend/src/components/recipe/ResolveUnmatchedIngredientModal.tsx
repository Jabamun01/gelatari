import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { styled } from '@linaria/react';
import { PrimaryButton, SecondaryButton, TextButton } from '../common/Button';
import { Modal } from '../common/Modal';
import { addAliasToIngredient, createIngredient as createIngredientApi } from '../../api/ingredients';
import { Ingredient, CreateIngredientDto as CreateIngredientApiDto } from '../../types/ingredient';
import { SearchableSelector, SelectableItem } from '../common/SearchableSelector';
import { FormLabel, FormInput, FormGroup } from './RecipeEditorFormStyles';

interface ParsedCsvIngredient {
  name: string;
  amountGrams: number;
  originalRow: number;
}

interface ResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  unmatchedItem: ParsedCsvIngredient;
  itemNumber: number;
  totalItems: number;
  onResolveSuccess: (resolvedIngredient: Ingredient, originalCsvAmount: number) => void;
  onSkip: () => void;
  existingIngredientsQueryKeyBase: (string | undefined)[];
  fetchExistingIngredientsFn: (term: string) => Promise<SelectableItem[]>;
}

const ResolveSection = styled.div`
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color-light);
`;

const SectionSubHeading = styled.h4`
  margin: 0 0 var(--space-sm) 0;
  color: var(--text-color-strong);
  font-size: var(--font-size-sm);
`;

export const ResolveUnmatchedIngredientModal: React.FC<ResolveModalProps> = ({
  isOpen,
  onClose,
  unmatchedItem,
  itemNumber,
  totalItems,
  onResolveSuccess,
  onSkip,
  existingIngredientsQueryKeyBase,
  fetchExistingIngredientsFn,
}) => {
  const queryClient = useQueryClient();
  const [selectedDbIngredient, setSelectedDbIngredient] = useState<SelectableItem | null>(null);
  const [newIngredientName, setNewIngredientName] = useState(unmatchedItem.name);
  const [isSubmittingAlias, setIsSubmittingAlias] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDbIngredient(null);
    setNewIngredientName(unmatchedItem.name);
    setError(null);
    setIsSubmittingAlias(false);
    setIsSubmittingNew(false);
  }, [unmatchedItem]);

  const handleAddAlias = async () => {
    if (!selectedDbIngredient) return;
    setError(null);
    setIsSubmittingAlias(true);
    const dbIngredientId = selectedDbIngredient.id.substring(4);

    try {
      const updatedIngredient = await addAliasToIngredient(dbIngredientId, unmatchedItem.name);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: existingIngredientsQueryKeyBase });
      onResolveSuccess(updatedIngredient, unmatchedItem.amountGrams);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconegut';
      setError(`Error afegint àlies: ${message}`);
    } finally {
      setIsSubmittingAlias(false);
    }
  };

  const handleCreateNew = async () => {
    setError(null);
    setIsSubmittingNew(true);
    const trimmedNewName = newIngredientName.trim();
    if (!trimmedNewName) {
      setError('El nom de l\'ingredient no pot estar buit.');
      setIsSubmittingNew(false);
      return;
    }

    const createDto: CreateIngredientApiDto = {
      name: trimmedNewName,
      aliases: trimmedNewName.toLowerCase() !== unmatchedItem.name.toLowerCase() ? [unmatchedItem.name] : [],
    };

    try {
      const createdIngredient = await createIngredientApi(createDto);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: existingIngredientsQueryKeyBase });
      onResolveSuccess(createdIngredient, unmatchedItem.amountGrams);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconegut';
      setError(`Error creant ingredient: ${message}`);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const filterIngredientsOnly = useCallback(async (term: string): Promise<SelectableItem[]> => {
    const results = await fetchExistingIngredientsFn(term);
    return results.filter((item) => item.type === 'ingredient');
  }, [fetchExistingIngredientsFn]);

  const isLoading = isSubmittingAlias || isSubmittingNew;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resol Ingredient No Trobat (${itemNumber}/${totalItems})`}
      footer={
        <>
          <TextButton onClick={onSkip} disabled={isLoading}>
            Salta
          </TextButton>
          <SecondaryButton onClick={onClose} disabled={isLoading}>
            Cancel·la Tot
          </SecondaryButton>
        </>
      }
    >
      <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
        <p>
          Ingredient del CSV (Fila {unmatchedItem.originalRow}):{' '}
          <strong>{unmatchedItem.name}</strong> ({unmatchedItem.amountGrams}g)
        </p>
        <p style={{ color: 'var(--text-color-light)' }}>
          Aquest ingredient no s'ha trobat a la base de dades per nom o àlies.
        </p>
      </div>

      {error && (
        <p style={{ color: 'var(--danger-color)', fontWeight: 500, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
          Error: {error}
        </p>
      )}

      <ResolveSection>
        <SectionSubHeading>Opció 1: Afegeix com a Àlies</SectionSubHeading>
        <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
          Vincula &ldquo;<strong>{unmatchedItem.name}</strong>&rdquo; a un ingredient existent.
        </p>
        <FormGroup>
          <FormLabel>Cerca Ingredient Existent</FormLabel>
          <SearchableSelector<SelectableItem>
            queryKeyBase={[...existingIngredientsQueryKeyBase, 'aliasSearch']}
            queryFn={filterIngredientsOnly}
            onSelect={(item) => setSelectedDbIngredient(item)}
            placeholder="Cerca ingredients a la base de dades..."
            minSearchLength={2}
            disabled={isLoading}
            showAddControls={false}
          />
        </FormGroup>
        {selectedDbIngredient && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'var(--surface-color-light)', borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>
              Seleccionat: <strong>{selectedDbIngredient.name}</strong>
            </span>
            <PrimaryButton onClick={handleAddAlias} disabled={isLoading}>
              {isSubmittingAlias ? 'Afegint Àlies...' : `Afegeix com a Àlies`}
            </PrimaryButton>
          </div>
        )}
      </ResolveSection>

      <ResolveSection>
        <SectionSubHeading>Opció 2: Crea Ingredient Nou</SectionSubHeading>
        <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
          Afegeix &ldquo;<strong>{unmatchedItem.name}</strong>&rdquo; com a ingredient nou.
        </p>
        <FormGroup>
          <FormLabel htmlFor={`new-ing-name-${unmatchedItem.originalRow}`}>Nom de l'Ingredient</FormLabel>
          <FormInput
            id={`new-ing-name-${unmatchedItem.originalRow}`}
            type="text"
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            disabled={isLoading}
            aria-required="true"
          />
          {newIngredientName.toLowerCase() !== unmatchedItem.name.toLowerCase() && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)', marginTop: 'var(--space-xs)' }}>
              El nom original del CSV &ldquo;{unmatchedItem.name}&rdquo; s'afegirà com a àlies.
            </span>
          )}
        </FormGroup>
        <PrimaryButton onClick={handleCreateNew} disabled={isLoading || !newIngredientName.trim()}>
          {isSubmittingNew ? 'Creant...' : 'Crea Ingredient Nou'}
        </PrimaryButton>
      </ResolveSection>
    </Modal>
  );
};
