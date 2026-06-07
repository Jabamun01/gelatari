import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { Modal } from '../common/Modal';
import { useQueryClient } from '@tanstack/react-query';
import {
  getFlavorById,
  createFlavor,
  updateFlavor,
} from '../../api/iceCreamFlavors';
import { getAllIngredients } from '../../api/ingredients';
import { IceCreamFlavor } from '../../types/iceCreamFlavor';
import { Ingredient } from '../../types/ingredient';
import { SearchableSelector, SelectableItem } from '../common/SearchableSelector';

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

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
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-color-light);
  font-style: italic;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color-light);
  margin-top: var(--space-lg);
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: var(--space-sm) var(--space-lg);
  border: ${({ variant }) =>
    variant === 'secondary' || variant === 'danger'
      ? 'var(--border-width) solid var(--border-color)'
      : 'none'};
  border-radius: var(--border-radius);
  background: ${({ variant }) =>
    variant === 'secondary' ? 'var(--surface-color)'
    : variant === 'danger' ? 'var(--danger-color)'
    : 'var(--primary-color)'};
  color: ${({ variant }) =>
    variant === 'secondary' ? 'var(--text-color)'
    : 'var(--text-on-primary)'};
  font-size: var(--font-size-sm);
  cursor: pointer;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SectionTitle = styled.h4`
  margin: var(--space-md) 0 var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-color-strong);
  border-top: var(--border-width) solid var(--border-color-light);
  padding-top: var(--space-md);
`;

const MixInRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  align-items: flex-end;
  margin-bottom: var(--space-sm);
`;

const MixInIngredientName = styled.span`
  flex: 1;
  font-size: var(--font-size-sm);
  padding: var(--space-sm) 0;
`;

const MixInAmountInput = styled.input`
  max-width: 100px;
`;

const InfoText = styled.p`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin: var(--space-xs) 0;
  font-style: italic;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IceCreamFlavorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  flavorId?: string;       // set when editing an existing flavor
  flavorName?: string;     // display name / initial name
  sourceRecipeId?: string; // set when creating a variant from a recipe
  sourceRecipeName?: string;
}

export const IceCreamFlavorEditModal: React.FC<IceCreamFlavorEditModalProps> = ({
  isOpen,
  onClose,
  flavorId,
  flavorName,
  sourceRecipeId,
  sourceRecipeName,
}) => {
  const isEditMode = !!flavorId;
  const isCreateVariantMode = !!sourceRecipeId && !flavorId;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [essentialLarge, setEssentialLarge] = useState(false);
  const [essentialSmall, setEssentialSmall] = useState(false);
  const [mixIns, setMixIns] = useState<Array<{ ingredient: string; ingredientName: string; amountPerKg: number }>>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEssentialLarge(false);
      setEssentialSmall(false);
      setMixIns([]);
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
      return;
    }

    if (isEditMode && flavorId) {
      // Load existing flavor data for editing
      setIsLoading(true);
      setError(null);

      getFlavorById(flavorId)
        .then((data: IceCreamFlavor) => {
          setName(data.name);
          setEssentialLarge(data.essentialLarge);
          setEssentialSmall(data.essentialSmall);
          // Populate mix-ins from existing flavor
          setMixIns(
            (data.mixIns || []).map(m => ({
              ingredient: m.ingredient._id,
              ingredientName: m.ingredient.name,
              amountPerKg: m.amountPerKg,
            })),
          );
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Error loading flavor.');
          setIsLoading(false);
        });
    } else {
      // Create mode: initialize with defaults
      setName(flavorName || '');
      setEssentialLarge(false);
      setEssentialSmall(false);
      setMixIns([]);
      setError(null);
      setIsLoading(false);
    }
  }, [flavorId, isEditMode, isCreateVariantMode, isOpen, flavorName, sourceRecipeId]);

  // ── Mix-in ingredient search ────────────────────────────────────────

  const fetchIngredientCandidates = useCallback(async (term: string): Promise<SelectableItem[]> => {
    if (term.length < 2) return [];
    try {
      const res = await getAllIngredients(1, 20, term);
      return res.data.map((ing: Ingredient): SelectableItem => ({
        id: ing._id,
        name: ing.name,
        type: 'ingredient' as const,
      }));
    } catch {
      return [];
    }
  }, []);

  const handleAddMixIn = (item: SelectableItem) => {
    // Check if already added
    if (mixIns.some(m => m.ingredient === item.id)) {
      setError(`"${item.name}" ja és a la llista de mix-ins.`);
      return;
    }
    setMixIns(prev => [...prev, { ingredient: item.id, ingredientName: item.name, amountPerKg: 0 }]);
    setError(null);
  };

  const handleRemoveMixIn = (ingredientId: string) => {
    setMixIns(prev => prev.filter(m => m.ingredient !== ingredientId));
  };

  const handleMixInAmountChange = (ingredientId: string, amount: number) => {
    setMixIns(prev => prev.map(m => m.ingredient === ingredientId ? { ...m, amountPerKg: amount } : m));
  };

  // ── Save ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nom del gust no pot estar buit.');
      return;
    }

    // Validate mix-in amounts if any mix-ins exist
    const invalidMixIn = mixIns.find(m => m.amountPerKg <= 0);
    if (mixIns.length > 0 && invalidMixIn) {
      setError(`La quantitat per kg del mix-in "${invalidMixIn.ingredientName}" ha de ser superior a 0.`);
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
          mixIns: mixIns.map(m => ({ ingredient: m.ingredient, amountPerKg: m.amountPerKg })),
        });
      } else if (isCreateVariantMode && sourceRecipeId) {
        await createFlavor({
          name: trimmedName,
          sourceRecipeId,
          mixIns: mixIns.map(m => ({ ingredient: m.ingredient, amountPerKg: m.amountPerKg })),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desant el gust.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? `Editar: ${flavorName || 'Gust'}` : 'Nou Gust'}
      >
        <LoadingMsg>Carregant...</LoadingMsg>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? `Editar: ${flavorName || 'Gust'}`
          : isCreateVariantMode
            ? `Nova variant: ${sourceRecipeName || 'Gust'}`
            : 'Nou Gust'
      }
    >
      {error && <ErrorMsg>{error}</ErrorMsg>}

      <Form onSubmit={(e) => e.preventDefault()}>
        <FormGroup>
          <Label htmlFor="flavorName">Nom del gust</Label>
          <Input
            id="flavorName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Xocolata + ametlles, ..."
            disabled={isSaving}
            required
          />
        </FormGroup>

        {isCreateVariantMode && sourceRecipeName && (
          <InfoText>Recepta base: {sourceRecipeName}</InfoText>
        )}

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
          </CheckboxRow>
          <CheckboxRow>
            <input
              type="checkbox"
              checked={essentialSmall}
              onChange={(e) => setEssentialSmall(e.target.checked)}
              disabled={isSaving}
            />
            Essencial per a envasos <strong>petits</strong>
          </CheckboxRow>
        </FormGroup>

        {/* ── Mix-ins section ────────────────────────────────────── */}
        <SectionTitle>Mix-ins (addicions al churn)</SectionTitle>
        <InfoText>
          Ingredients que s'incorporen al gelat durant la mantecació.
          S&apos;expressen en grams per kg de mix.
        </InfoText>

        <SearchableSelector
          queryKeyBase={['mixInIngredientSearch']}
          queryFn={fetchIngredientCandidates}
          onAdd={handleAddMixIn}
          placeholder="Cerca ingredient per afegir com a mix-in..."
          minSearchLength={2}
          disabled={isSaving}
          showAddControls={true}
        />

        {mixIns.length === 0 && (
          <InfoText style={{ marginTop: 'var(--space-sm)' }}>
            Aquest gust no té mix-ins (base sense inclusions).
          </InfoText>
        )}

        {mixIns.map((m) => (
          <MixInRow key={m.ingredient}>
            <MixInIngredientName>{m.ingredientName}</MixInIngredientName>
            <MixInAmountInput
              type="number"
              min={0}
              step={1}
              value={m.amountPerKg || ''}
              onChange={(e) => handleMixInAmountChange(m.ingredient, parseFloat(e.target.value) || 0)}
              placeholder="g/kg"
              disabled={isSaving}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>g/kg</span>
            <Button
              variant="danger"
              onClick={() => handleRemoveMixIn(m.ingredient)}
              disabled={isSaving}
              style={{ padding: '2px 8px', fontSize: 'var(--font-size-xs)' }}
            >
              ✕
            </Button>
          </MixInRow>
        ))}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel·lar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving
              ? 'Desant...'
              : isEditMode
                ? 'Desa Canvis'
                : 'Crear Gust'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};
