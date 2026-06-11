import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { PrimaryButton, SecondaryButton, DangerButton, ActionButton } from '../common/Button';
import { fetchRecipeById, finalizeRecipeProductionApi, duplicateRecipe } from '../../api/recipes';
import { RecipeDetails } from '../../types/recipe';
import { TabData } from '../../types/tabs';
import { IngredientList } from './IngredientList';
import { StepList } from './StepList';
import { ScalingControl } from './ScalingControl';
import { UnifiedDependencyModal } from '../common/UnifiedDependencyModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useItemDeletion, ItemToDelete } from '../../utils/useItemDeletion';

interface RecipeTabProps {
  recipeId: string;
  tabs: TabData[];
  handleOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: () => void;
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void;
  onOpenEditor: (recipeId: string, recipeName: string) => void;
  onClose: () => void;
  scaleFactor: number;
  onScaleChange: (newScaleFactor: number) => void;
}

const RecipeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
  overflow-y: auto;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto minmax(300px, 1fr) auto;
    grid-template-areas:
      "header header"
      "info   info"
      "ingredients steps"
      "scaling steps";
    gap: var(--space-lg) var(--space-xl);
    padding: var(--space-lg) 0;
  }

  @media (max-width: 1023px) and (min-width: 769px) {
    padding: var(--space-md) var(--space-lg);
  }

  @media (max-width: 768px) {
    padding: var(--space-md) 0;
    gap: var(--space-md);
  }
`;

const LoadingMessage = styled.div`
  grid-column: 1 / -1;
  font-style: italic;
  color: var(--text-color-light);
  padding: var(--space-2xl) 0;
  text-align: center;
`;

const ErrorMessage = styled.div`
  grid-column: 1 / -1;
  color: var(--danger-color-dark);
  font-weight: 500;
  padding: var(--space-lg);
  background-color: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  text-align: center;
`;

const RecipeHeader = styled.div`
  grid-area: header;
  color: var(--text-color-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  padding-bottom: var(--space-md);
  border-bottom: var(--border-width) solid var(--border-color-light);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const RecipeName = styled.h2`
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--text-color-strong);
`;

const HeaderActions = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 900px) {
    button {
      font-size: var(--font-size-xs);
      padding: var(--space-xs) var(--space-sm);
      min-height: 36px;
    }
  }

  @media (max-width: 640px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
`;

const ContentSection = styled.div<{ area: string }>`
  grid-area: ${({ area }) => area};
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-xs);
  overflow-y: auto;
  min-height: 200px;

  @media (max-width: 1023px) and (min-width: 769px) {
    min-height: 0;
  }

  @media (max-width: 768px) {
    border: none;
    padding: 0;
    background-color: transparent;
    box-shadow: none;
    min-height: 0;
  }
`;

const ScalingSection = styled.div<{ area: string }>`
  grid-area: ${({ area }) => area};
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-xs);

  @media (max-width: 1023px) and (min-width: 769px) {
    /* Keep card styling on tablet */
  }

  @media (max-width: 768px) {
    border: none;
    padding: 0;
    background-color: transparent;
    box-shadow: none;
  }
`;

const SeparatorLine = styled.hr`
  grid-column: 1 / -1;
  border: none;
  border-top: 1px solid var(--border-color-light);
  margin: 0;
  width: 100%;

  @media (max-width: 1023px) and (min-width: 769px) {
    display: block;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ProductionModeButton = styled(SecondaryButton)<{ isActive?: boolean }>`
  ${(props) =>
    props.isActive
      ? `
    background-color: var(--secondary-color);
    color: var(--text-on-secondary);
    border-color: var(--secondary-color);

    &:hover:not(:disabled) {
      background-color: var(--secondary-color-dark);
      border-color: var(--secondary-color-dark);
    }
  `
      : ''}

  @media (max-width: 900px) {
    font-size: var(--font-size-xs);
    padding: var(--space-xs) var(--space-sm);
    min-height: 36px;
  }

  @media (max-width: 640px) {
    flex: 1;
  }
`;

export const RecipeTab = ({
  recipeId,
  handleOpenRecipeTab,
  isProductionMode,
  trackedAmounts,
  onToggleProductionMode,
  onAmountTracked,
  onOpenEditor,
  onClose,
  scaleFactor,
  onScaleChange,
}: RecipeTabProps) => {
  const handleDeletionCycleComplete = useCallback(
    (status: 'deleted' | 'cancelled' | 'error', itemId?: string) => {
      if (status === 'deleted' && itemId === recipeId) {
        onClose();
      }
    },
    [recipeId, onClose]
  );

  const itemDeletionHook = useItemDeletion({ onDeletionCycleComplete: handleDeletionCycleComplete });

  const {
    data: recipe,
    isLoading,
    isError,
    error,
  } = useQuery<RecipeDetails, Error>({
    queryKey: ['recipe', recipeId],
    queryFn: () => fetchRecipeById(recipeId),
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (itemDeletionHook.error) {
      console.error('Error during deletion process:', itemDeletionHook.error);
    }
  }, [itemDeletionHook.error]);

  const duplicateMutation = useMutation({
    mutationFn: (recipeId: string) => duplicateRecipe(recipeId),
    onSuccess: (newRecipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      onOpenEditor(newRecipe._id, newRecipe.name);
    },
    onError: (err: Error) => {
      console.error('Error duplicating recipe:', err);
      alert(`Error en duplicar la recepta: ${err.message || 'Error desconegut'}.`);
    },
  });

  const finalizeProductionMutation = useMutation({
    mutationFn: ({ recipeId, scaleFactor }: { recipeId: string; scaleFactor: number }) =>
      finalizeRecipeProductionApi(recipeId, scaleFactor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      onClose();
    },
    onError: (err: Error) => {
      console.error('Error finalizing recipe production:', err);
      alert(`Error en finalitzar la producció: ${err.message || 'Error desconegut'}.`);
    },
  });

  const handleDeleteRecipe = () => {
    if (!recipe) return;
    const itemToDelete: ItemToDelete = {
      id: recipe._id,
      name: recipe.name,
      type: 'recipe',
    };
    itemDeletionHook.startDeletionProcess(itemToDelete);
  };

  const handleEditItemFromModal = (item: { id: string; name: string; type: 'recipe' | 'ingredient' }) => {
    if (item.type === 'recipe') {
      onOpenEditor(item.id, item.name);
    }
  };

  if (isLoading) {
    return (
      <RecipeContainer>
        <LoadingMessage aria-live="polite">
          Carregant detalls de la recepta...
        </LoadingMessage>
      </RecipeContainer>
    );
  }

  if (isError) {
    return (
      <RecipeContainer>
        <ErrorMessage aria-live="polite">
          Error en carregar la recepta:{' '}
          {error?.message || 'Error desconegut'}
        </ErrorMessage>
      </RecipeContainer>
    );
  }

  if (recipe) {
    return (
      <RecipeContainer>
        <RecipeHeader>
          <div>
            <RecipeName>{recipe.name}</RecipeName>
            {recipe.productionLossPercent > 0 && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--warning-color-dark)', marginLeft: 'var(--space-sm)' }}>
                Pèrdua de producció: {recipe.productionLossPercent}%
              </span>
            )}
          </div>
          <HeaderActions>
            <ActionButton
              onClick={() => onOpenEditor(recipeId, recipe.name)}
              disabled={
                itemDeletionHook.isProcessingDelete ||
                itemDeletionHook.isLoadingDependencies
              }
            >
              Editar
            </ActionButton>
            <SecondaryButton
              onClick={() => duplicateMutation.mutate(recipeId)}
              disabled={
                duplicateMutation.isPending ||
                itemDeletionHook.isProcessingDelete ||
                itemDeletionHook.isLoadingDependencies
              }
            >
              {duplicateMutation.isPending ? 'Duplicant...' : 'Duplicar'}
            </SecondaryButton>
            <DangerButton
              onClick={handleDeleteRecipe}
              disabled={
                !recipe ||
                itemDeletionHook.isProcessingDelete ||
                itemDeletionHook.isLoadingDependencies
              }
            >
              {itemDeletionHook.isProcessingDelete
                ? 'Eliminant...'
                : itemDeletionHook.isLoadingDependencies
                  ? 'Comprovant...'
                  : 'Eliminar'}
            </DangerButton>
            <ProductionModeButton
              isActive={isProductionMode}
              onClick={onToggleProductionMode}
              aria-pressed={isProductionMode}
              title={
                isProductionMode
                  ? 'Desactivar mode producció'
                  : 'Activar mode producció'
              }
            >
              {isProductionMode
                ? 'Mode producció: ACTIU'
                : 'Mode producció: INACTIU'}
            </ProductionModeButton>
            {isProductionMode && (
              <PrimaryButton
                onClick={() =>
                  finalizeProductionMutation.mutate({ recipeId, scaleFactor })
                }
                disabled={
                  finalizeProductionMutation.isPending ||
                  itemDeletionHook.isProcessingDelete ||
                  itemDeletionHook.isLoadingDependencies
                }
              >
                {finalizeProductionMutation.isPending
                  ? 'Finalitzant...'
                  : 'Finalitzar (gastar ingredients)'}
              </PrimaryButton>
            )}
          </HeaderActions>
        </RecipeHeader>

        <SeparatorLine />

        <ContentSection area="ingredients">
          <IngredientList
            ingredients={recipe.ingredients}
            linkedRecipes={recipe.linkedRecipes}
            scaleFactor={scaleFactor}
            onOpenRecipeTab={handleOpenRecipeTab}
            isProductionMode={isProductionMode}
            trackedAmounts={trackedAmounts}
            onAmountTracked={onAmountTracked}
          />
        </ContentSection>

        <ContentSection area="steps">
          <StepList steps={recipe.steps} />
        </ContentSection>

        <ScalingSection area="scaling">
          <ScalingControl
            scaleFactor={scaleFactor}
            onScaleChange={onScaleChange}
            baseYieldGrams={recipe.baseYieldGrams}
            disabled={isProductionMode}
          />
        </ScalingSection>

        <UnifiedDependencyModal
          isOuterModalOpen={itemDeletionHook.isDependencyModalOpen}
          onOuterModalClose={itemDeletionHook.cancelDeletionProcess}
          outerItemName={itemDeletionHook.currentItem?.name || ''}
          outerItemType={itemDeletionHook.currentItem?.type || 'recipe'}
          outerItemDependentRecipes={itemDeletionHook.dependentItems.map(
            (item) => ({ id: item._id, name: item.name, type: 'recipe' as const })
          )}
          isLoadingOuterItemDependencies={itemDeletionHook.isLoadingDependencies}
          onRefreshOuterItemDependencies={itemDeletionHook.refreshDependencies}
          outerItemError={itemDeletionHook.error}
          onEditRecipeInOuterModal={(
            recipeOrId: RecipeDetails | string
          ) => {
            let id: string;
            let name: string;
            if (typeof recipeOrId === 'string') {
              id = recipeOrId;
              const foundRecipe = itemDeletionHook.dependentItems.find(
                (r) => r._id === id
              );
              name = foundRecipe ? foundRecipe.name : 'Recipe';
            } else {
              id = recipeOrId._id;
              name = recipeOrId.name;
            }
            handleEditItemFromModal({ id, name, type: 'recipe' });
          }}
        />

        <ConfirmationModal
          isOpen={itemDeletionHook.isConfirmationModalOpen}
          onClose={
            itemDeletionHook.confirmationModalProps?.onCancel ||
            itemDeletionHook.cancelDeletionProcess
          }
          title={
            itemDeletionHook.confirmationModalProps?.title || 'Confirm Deletion'
          }
          message={
            itemDeletionHook.confirmationModalProps?.message || 'Are you sure?'
          }
          onConfirm={
            itemDeletionHook.confirmationModalProps?.onConfirm || (() => {})
          }
          confirmButtonText={
            itemDeletionHook.confirmationModalProps?.confirmText || 'Confirm'
          }
          cancelButtonText={
            itemDeletionHook.confirmationModalProps?.cancelText || 'Cancel'
          }
        />
      </RecipeContainer>
    );
  }

  return (
    <RecipeContainer>
      <p style={{ textAlign: 'center', color: 'var(--text-color-light)' }}>
        No hi ha dades de la recepta disponibles.
      </p>
    </RecipeContainer>
  );
};
