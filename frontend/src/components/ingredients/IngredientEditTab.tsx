import React, { useState, useEffect } from 'react';
import { styled } from '@linaria/react';
import { IngredientEditTabData } from '../../types/tabs';
import { PrimaryButton as ReusablePrimaryButton, SecondaryButton as ReusableSecondaryButton, DangerButton as ReusableDangerButton } from '../common/Button';
import { updateIngredient, getIngredientById, createIngredient } from '../../api/ingredients';
import { UpdateIngredientDto, CreateIngredientDto, Ingredient } from '../../types/ingredient';
import { useQueryClient } from '@tanstack/react-query';

// --- Styled Components ---
const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 700px;
  margin: var(--space-lg) auto;
  padding: var(--space-xl);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
`;

const PageTitle = styled.h2`
  text-align: center;
  margin-bottom: var(--space-lg);
  color: var(--text-color-strong);
  font-size: var(--font-size-xl);
`;

const Subtitle = styled.h3`
  text-align: center;
  margin-bottom: var(--space-md);
  color: var(--text-color);
  font-size: var(--font-size-lg);
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  color: var(--danger-color-dark); // Darker text for better readability on light bg
  background-color: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-lg);
  text-align: center;
`;

const LoadingMessage = styled.div`
  padding: var(--space-xl);
  text-align: center;
  font-size: var(--font-size-lg);
  color: var(--text-color-light);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: var(--text-color);
  font-size: var(--font-size-base);
`;

const FormInput = styled.input`
  /* Base styles are inherited from global.ts */
  width: 100%;

  &[type="number"] {
    max-width: 150px;
  }
`;

const AliasInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
`;

const AliasInput = styled(FormInput)`
  flex-grow: 1;
`;

const ActionButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: var(--border-width) solid var(--border-color-light);
`;

// --- Component Props ---
interface IngredientEditTabProps {
  tab: IngredientEditTabData;
  onCloseTab: (tabId: string) => void;
}

// --- Component ---
const IngredientEditTab: React.FC<IngredientEditTabProps> = ({ tab, onCloseTab }) => {
  const { id: tabId, ingredientId } = tab;
  const isEditMode = !!ingredientId;
  const queryClient = useQueryClient();

  const [ingredientName, setIngredientName] = useState<string>('');
  const [aliases, setAliases] = useState<string[]>(['']);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && ingredientId) {
      setIsLoading(true);
      setError(null);

      getIngredientById(ingredientId)
        .then((data: Ingredient) => {
          setIngredientName(data.name);
          setAliases(data.aliases && data.aliases.length > 0 ? data.aliases : ['']);
          setStockQuantity(data.quantityInStock || 0);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch ingredient details:', err);
          setError(err instanceof Error ? err.message : "Error en carregar les dades de l'ingredient.");
          setIngredientName('Error en carregar'); // Placeholder on error
          setAliases(['']);
          setStockQuantity(0);
          setIsLoading(false);
        });
    } else {
      setIngredientName('');
      setAliases(['']);
      setStockQuantity(0);
      setIsLoading(false);
      setError(null);
    }
  }, [ingredientId, isEditMode]);

  const handleAddAlias = () => {
    setAliases([...aliases, '']);
  };

  const handleRemoveAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  const handleAliasChange = (index: number, value: string) => {
    const newAliases = [...aliases];
    newAliases[index] = value;
    setAliases(newAliases);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);

    const commonData = {
      name: ingredientName.trim(),
      aliases: aliases.filter(alias => alias.trim() !== '').map(alias => alias.trim()),
      quantityInStock: stockQuantity,
    };

    if (!commonData.name) {
        setError("El nom de l'ingredient no pot estar buit.");
        setIsSaving(false);
        return;
    }

    try {
      if (isEditMode && ingredientId) {
        const payload: UpdateIngredientDto = commonData;
        await updateIngredient(ingredientId, payload);
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        queryClient.invalidateQueries({ queryKey: ['ingredient', ingredientId] });
        queryClient.invalidateQueries({ queryKey: ['recipeDependencies'] });
        queryClient.invalidateQueries({ queryKey: ['ingredientDependencies'] });
        onCloseTab(tabId);
      } else {
        const payload: CreateIngredientDto = commonData;
        await createIngredient(payload);
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        queryClient.invalidateQueries({ queryKey: ['recipeDependencies'] });
        queryClient.invalidateQueries({ queryKey: ['ingredientDependencies'] });
        onCloseTab(tabId);
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} ingredient:`, err);
      const errorMessage = err instanceof Error ? err.message : `S'ha produït un error desconegut durant ${isEditMode ? "l'actualització" : "la creació"}.`;
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCloseTab(tabId);
  };

  if (isLoading) {
    return <LoadingMessage aria-live="polite">Carregant detalls de l'ingredient...</LoadingMessage>;
  }

  return (
    <EditContainer>
      <PageTitle>{isEditMode ? 'Edita Ingredient' : 'Crea Ingredient Nou'}</PageTitle>
      {isEditMode && ingredientName && !error && <Subtitle>Editant: {ingredientName}</Subtitle>}
      {error && <ErrorMessage aria-live="polite" role="alert">Error: {error}</ErrorMessage>}

      <Form onSubmit={(e) => e.preventDefault()}>
        <FormGroup>
          <FormLabel htmlFor="ingredientName">Nom de l'ingredient:</FormLabel>
          <FormInput
            type="text"
            id="ingredientName"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            placeholder="Introdueix el nom de l'ingredient"
            disabled={isSaving}
            required
            aria-required="true"
          />
        </FormGroup>

        <FormGroup>
          <FormLabel id="aliases-label">Àlies:</FormLabel> {/* Added id for aria-labelledby */}
          {aliases.map((alias, index) => (
            <AliasInputContainer key={index}>
              <AliasInput
                type="text"
                value={alias}
                onChange={(e) => handleAliasChange(index, e.target.value)}
                placeholder="Introdueix àlies (opcional)"
                disabled={isSaving}
                aria-label={`Àlies ${index + 1}`} // Using aria-label for individual alias inputs
                // aria-labelledby="aliases-label" // Can also be used if preferred
              />
              {aliases.length > 0 && (
                <ReusableDangerButton type="button" onClick={() => handleRemoveAlias(index)} disabled={isSaving}>
                  Elimina
                </ReusableDangerButton>
              )}
            </AliasInputContainer>
          ))}
          <ReusableSecondaryButton type="button" onClick={handleAddAlias} disabled={isSaving} style={{ alignSelf: 'flex-start' }}>
            Afegeix Àlies
          </ReusableSecondaryButton>
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="stockQuantity">Quantitat en Stock:</FormLabel>
          <FormInput
            type="number"
            id="stockQuantity"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value)))}
            min="0"
            disabled={isSaving}
          />
        </FormGroup>

        <ActionButtonContainer>
          <ReusableSecondaryButton type="button" onClick={handleCancel} disabled={isSaving}>
            Cancel·la
          </ReusableSecondaryButton>
          <ReusablePrimaryButton type="button" onClick={handleSaveChanges} disabled={isSaving || (!isEditMode && !ingredientName.trim())}>
            {isSaving ? 'Desant...' : (isEditMode ? 'Desa Canvis' : 'Crea Ingredient')}
          </ReusablePrimaryButton>
        </ActionButtonContainer>
      </Form>
    </EditContainer>
  );
};

export default IngredientEditTab;