import React, { useState, useEffect } from 'react';
import { styled } from '@linaria/react';
import { Modal } from '../common/Modal';
import { PrimaryButton, SecondaryButton, DangerButton } from '../common/Button';
import { updateIngredient, getIngredientById, createIngredient } from '../../api/ingredients';
import { UpdateIngredientDto, CreateIngredientDto, Ingredient } from '../../types/ingredient';
import { useQueryClient } from '@tanstack/react-query';

const ErrorMessage = styled.div`
  color: var(--danger-color-dark);
  background-color: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-lg);
  text-align: center;
  font-size: var(--font-size-sm);
`;

const LoadingMessage = styled.div`
  padding: var(--space-xl);
  text-align: center;
  font-size: var(--font-size-base);
  color: var(--text-color-light);
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

const FormLabel = styled.label`
  font-weight: 500;
  color: var(--text-color);
  font-size: var(--font-size-sm);
`;

const FormInput = styled.input`
  width: 100%;

  &[type='number'] {
    max-width: 150px;
  }
`;

const AliasInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);

  @media (max-width: 640px) {
    flex-wrap: wrap;

    button {
      flex-shrink: 0;
    }
  }
`;

const AddAliasButton = styled(SecondaryButton)`
  align-self: flex-start;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color-light);
  margin-top: var(--space-lg);
  flex-wrap: wrap;

  @media (max-width: 640px) {
    button {
      flex: 1;
    }
  }
`;

interface IngredientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientId?: string;
  ingredientName?: string;
}

export const IngredientEditModal: React.FC<IngredientEditModalProps> = ({
  isOpen,
  onClose,
  ingredientId,
  ingredientName,
}) => {
  const isEditMode = !!ingredientId;
  const queryClient = useQueryClient();

  const [name, setName] = useState<string>('');
  const [aliases, setAliases] = useState<string[]>(['']);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [mermaPercent, setMermaPercent] = useState<number>(0);
  const [costPerKg, setCostPerKg] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setAliases(['']);
      setStockQuantity(0);
      setMermaPercent(0);
      setCostPerKg(null);
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
      return;
    }

    if (isEditMode && ingredientId) {
      setIsLoading(true);
      setError(null);

      getIngredientById(ingredientId)
        .then((data: Ingredient) => {
          setName(data.name);
          setAliases(data.aliases && data.aliases.length > 0 ? data.aliases : ['']);
          setStockQuantity(data.quantityInStock || 0);
          setMermaPercent(data.mermaPercent || 0);
          setCostPerKg(data.costPerKg ?? null);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch ingredient details:', err);
          setError(err instanceof Error ? err.message : "Error en carregar les dades de l'ingredient.");
          setName('');
          setAliases(['']);
          setStockQuantity(0);
          setIsLoading(false);
        });
    } else {
      setName(ingredientName || '');
      setAliases(['']);
      setStockQuantity(0);
      setMermaPercent(0);
      setCostPerKg(null);
      setIsLoading(false);
      setError(null);
    }
  }, [ingredientId, isEditMode, isOpen]);

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
      name: name.trim(),
      aliases: aliases.filter((alias) => alias.trim() !== '').map((alias) => alias.trim()),
      quantityInStock: stockQuantity,
      mermaPercent: mermaPercent,
      costPerKg: costPerKg, // null = clear the price
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
        onClose();
      } else {
        const payload: CreateIngredientDto = commonData;
        await createIngredient(payload);
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        queryClient.invalidateQueries({ queryKey: ['recipeDependencies'] });
        queryClient.invalidateQueries({ queryKey: ['ingredientDependencies'] });
        onClose();
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} ingredient:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : `S'ha produït un error desconegut durant ${isEditMode ? "l'actualització" : 'la creació'}.`;
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edita Ingredient' : 'Crea Ingredient Nou'}>
        <LoadingMessage aria-live="polite">
          Carregant detalls de l'ingredient...
        </LoadingMessage>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edita: ${ingredientName || 'Ingredient'}` : 'Crea Ingredient Nou'}
    >
      {error && (
        <ErrorMessage aria-live="polite" role="alert">
          Error: {error}
        </ErrorMessage>
      )}

      <Form onSubmit={(e) => e.preventDefault()}>
        <FormGroup>
          <FormLabel htmlFor="ingredientName">Nom de l'ingredient:</FormLabel>
          <FormInput
            type="text"
            id="ingredientName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Introdueix el nom de l'ingredient"
            disabled={isSaving}
            required
            aria-required="true"
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Àlies:</FormLabel>
          {aliases.map((alias, index) => (
            <AliasInputContainer key={index}>
              <FormInput
                type="text"
                value={alias}
                onChange={(e) => handleAliasChange(index, e.target.value)}
                placeholder="Introdueix àlies (opcional)"
                disabled={isSaving}
                aria-label={`Àlies ${index + 1}`}
              />
              {aliases.length > 0 && (
                <DangerButton
                  type="button"
                  onClick={() => handleRemoveAlias(index)}
                  disabled={isSaving}
                >
                  Elimina
                </DangerButton>
              )}
            </AliasInputContainer>
          ))}
          <AddAliasButton
            type="button"
            onClick={handleAddAlias}
            disabled={isSaving}
          >
            Afegeix Àlies
          </AddAliasButton>
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

        <FormGroup>
          <FormLabel htmlFor="mermaPercent">Merma (%):</FormLabel>
          <FormInput
            type="number"
            id="mermaPercent"
            value={mermaPercent}
            onChange={(e) => setMermaPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
            min="0"
            max="100"
            step="0.1"
            disabled={isSaving}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="costPerKg">Cost per kg (€):</FormLabel>
          <FormInput
            type="number"
            id="costPerKg"
            value={costPerKg === null ? '' : costPerKg}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                setCostPerKg(null);
              } else {
                setCostPerKg(Math.max(0, Number(raw)));
              }
            }}
            min="0"
            step="0.01"
            disabled={isSaving}
            placeholder="—"
          />
        </FormGroup>

        <ModalFooter>
          <SecondaryButton type="button" onClick={handleCancel} disabled={isSaving}>
            Cancel·la
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving || (!isEditMode && !name.trim())}
          >
            {isSaving
              ? 'Desant...'
              : isEditMode
                ? 'Desa Canvis'
                : 'Crea Ingredient'}
          </PrimaryButton>
        </ModalFooter>
      </Form>
    </Modal>
  );
};
