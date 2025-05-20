import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { fetchRecipeById, finalizeRecipeProductionApi } from '../../api/recipes';
import { RecipeDetails } from '../../types/recipe';
import { TabData } from '../../types/tabs';
import { IngredientList } from './IngredientList';
import { StepList } from './StepList';
import { ScalingControl } from './ScalingControl';
import { UnifiedDependencyModal } from '../common/UnifiedDependencyModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useItemDeletion, ItemToDelete } from '../../utils/useItemDeletion'; // Import the new hook and type

interface RecipeTabProps {
  recipeId: string;
  tabs: TabData[];
  handleOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  // Add props for lifted state and handlers
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: () => void; // Handler now takes no args as tabId is known in parent
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void; // Handler now takes no tabId
  // Add prop for opening the editor
  onOpenEditor: (recipeId: string, recipeName: string) => void;
  onClose: () => void; // Prop to close the tab
  // Add props for scale factor state and handler
  scaleFactor: number;
  onScaleChange: (newScaleFactor: number) => void;
}

const RecipeContainer = styled.div`
  /* --- Grid Layout (Tablet Landscape & Larger) --- */
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Two equal columns */
    grid-template-rows: auto auto 1fr auto; /* Header, Info, Ingredients (expand), Scaling */
    grid-template-areas:
      "header header"
      "info   info"
      "ingredients steps"
      "scaling steps"; /* Scaling below ingredients, steps span */
    gap: var(--space-lg) var(--space-xl); /* Row gap, Column gap */
    padding: var(--space-lg);
    /* Attempt to make it take available height - might need adjustment based on parent */
    height: calc(100vh - 150px); /* Example: Adjust 150px based on actual header/tab heights */
    overflow: hidden; /* Prevent container itself from scrolling */
    max-width: none; /* Remove max-width for grid */
    margin: 0; /* Remove margin for grid */
  }

  /* --- Flex Layout (Mobile & Smaller Tablets) --- */
  @media (max-width: 1023px) {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg); /* Keep consistent gap */
    padding: var(--space-md); /* Slightly less padding on mobile */
    max-width: 900px; /* Restore max-width */
    margin: var(--space-lg) auto; /* Restore centering */
  }
`;

const LoadingMessage = styled.div`
  grid-column: 1 / -1; /* Span full width in grid if loading */
  font-style: italic;
  color: var(--text-color-light); /* Use lighter text */
  padding: var(--space-xl) 0; /* Add padding for visual spacing */
  text-align: center;
`;

const ErrorMessage = styled.div`
  grid-column: 1 / -1; /* Span full width in grid if error */
  color: var(--danger-color); /* Use danger color */
  font-weight: 500; /* Slightly less bold */
  padding: var(--space-lg);
  background-color: rgba(239, 68, 68, 0.1); /* Light red background */
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  text-align: center;
`;

const RecipeHeader = styled.h2`
  grid-area: header; /* Assign grid area */
  margin-bottom: 0; /* Remove bottom margin, grid gap handles spacing */
  color: var(--text-color-strong);
  display: flex;
  align-items: center; /* Align items vertically */
  justify-content: space-between; /* Space out title and controls */
  gap: var(--space-md);
  flex-wrap: wrap; /* Allow wrapping on smaller screens within the header */
`;

const RecipeName = styled.span`
  flex-grow: 1; /* Allow name to take available space */
`;


// Wrappers for list components to control grid placement and scrolling
const IngredientsWrapper = styled.div`
  grid-area: ingredients;
  overflow-y: auto; /* Enable vertical scrolling */
  min-height: 0; /* Allow shrinking in flex/grid context */
  border: var(--border-width) solid var(--border-color-light); /* Optional: Add border */
  border-radius: var(--border-radius);
  padding: var(--space-md);
  background-color: var(--surface-color-raised); /* Slightly different background */

  @media (max-width: 1023px) {
    overflow-y: visible; /* Disable scrolling on mobile */
    border: none;
    padding: 0;
    background-color: transparent;
  }
`;

const StepsWrapper = styled.div`
  grid-area: steps;
  overflow-y: auto; /* Enable vertical scrolling */
  min-height: 0; /* Allow shrinking in flex/grid context */
  border: var(--border-width) solid var(--border-color-light); /* Optional: Add border */
  border-radius: var(--border-radius);
  padding: var(--space-md);
  background-color: var(--surface-color-raised); /* Slightly different background */

  @media (max-width: 1023px) {
    overflow-y: visible; /* Disable scrolling on mobile */
    border: none;
    padding: 0;
    background-color: transparent;
  }
`;

// Wrapper for scaling control placement
const ScalingWrapper = styled.div`
  grid-area: scaling;
  /* Add margin-top if needed for spacing below ingredients */
  /* margin-top: var(--space-md); */
`;


// ControlsWrapper removed as controls are now in the header

// Style as a toggle button, using secondary color when active
// Slightly smaller padding than Edit/Delete, consistent font/border-radius
const ProductionModeToggle = styled.button<{ isActive: boolean }>`
  /* Base Styles */
  padding: var(--space-sm) var(--space-md); /* Consistent padding with other action buttons */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Conditional Styles */
  border: var(--border-width) solid ${props => (props.isActive ? 'var(--secondary-color)' : 'var(--border-color)')};
  background-color: ${props => (props.isActive ? 'var(--secondary-color)' : 'var(--surface-color)')};
  color: ${props => (props.isActive ? 'var(--text-on-secondary)' : 'var(--secondary-color)')};

  &:hover:not(:disabled) {
    background-color: ${props => (props.isActive ? 'var(--secondary-color-dark)' : 'var(--surface-color-hover)')}; /* Consistent hover background */
    border-color: ${props => (props.isActive ? 'var(--secondary-color-dark)' : 'var(--border-color-hover)')}; /* Consistent hover border */
    color: ${props => (props.isActive ? 'var(--text-on-secondary)' : 'var(--secondary-color-dark)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Style as a standard action button
// Larger padding, consistent font/border-radius
const EditButton = styled.button`
  /* Base Styles */
  padding: var(--space-sm) var(--space-md); /* Larger padding */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Specific Styles */
  background-color: var(--surface-color);
  color: var(--text-color);
  border: var(--border-width) solid var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--surface-color-hover); /* Consistent hover background */
    border-color: var(--border-color-hover); /* Consistent hover border */
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Style as a danger action button
// Larger padding, consistent font/border-radius, danger colors
const DeleteButton = styled.button`
  /* Base Styles */
  padding: var(--space-sm) var(--space-md); /* Larger padding */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Specific Styles */
  background-color: transparent;
  color: var(--danger-color);
  border: var(--border-width) solid var(--border-color); /* Consistent border definition */

  &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1); /* Subtle danger background on hover */
    color: var(--danger-color-dark);
    border-color: var(--border-color-hover); /* Consistent hover border */
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Style for the Finalize button, similar to EditButton
const FinalizeButton = styled.button`
  /* Base Styles */
  padding: var(--space-sm) var(--space-md); /* Larger padding */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Specific Styles for a "primary" action, could be green or primary color */
  background-color: var(--primary-color); /* Or a success color like var(--success-color) if defined */
  color: var(--text-on-primary); /* Or var(--text-on-success) */
  border: var(--border-width) solid var(--primary-color); /* Or var(--success-color) */

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark); /* Or var(--success-color-dark) */
    border-color: var(--primary-color-dark); /* Or var(--success-color-dark) */
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SeparatorLine = styled.hr`
  grid-column: 1 / -1; /* Span all columns in grid layout */
  border: none;
  border-top: 1px solid var(--border-color-light);
  margin: 0; /* Rely on parent container's gap (grid or flex) for spacing */
  width: 100%;
`;

// --- Component ---
export const RecipeTab = ({
  recipeId,
  // tabs, // No longer needed here
  handleOpenRecipeTab,
  isProductionMode, // Destructure new props
  trackedAmounts,
  onToggleProductionMode,
  onAmountTracked,
  onOpenEditor, // Destructure the new prop
  onClose, // Destructure the close handler
  scaleFactor, // Destructure scale factor props
  onScaleChange,
}: RecipeTabProps) => {
  // Removed local scaleFactor state
  // Removed local isProductionMode state
  // Removed local trackedAmounts state
  // REMOVED Timer State (useState, useRef) - Now managed in App.tsx

  const handleDeletionCycleComplete = useCallback((status: 'deleted' | 'cancelled' | 'error', itemId?: string) => {
    if (status === 'deleted' && itemId === recipeId) {
      onClose();
    }
    // Potentially handle other statuses or refresh data if needed,
    // though query invalidation in the hook should cover most data refresh.
    console.log(`Deletion cycle completed for item ${itemId} with status: ${status}`);
  }, [recipeId, onClose]);

  const itemDeletionHook = useItemDeletion({ onDeletionCycleComplete: handleDeletionCycleComplete });

  // --- Fetch Recipe Data ---
  const {
    data: recipe,
    isLoading,
    isError,
    error,
  } = useQuery<RecipeDetails, Error>({
    queryKey: ['recipe', recipeId], // Unique key for this recipe query
    queryFn: () => fetchRecipeById(recipeId), // Function to fetch data
  });

  const queryClient = useQueryClient();

  // Effect to handle errors from the itemDeletionHook.error state
  useEffect(() => {
    if (itemDeletionHook.error) {
      // The error from useItemDeletion is already a string or null
      const errorMessage = itemDeletionHook.error;
      console.error("Error during deletion process (from itemDeletionHook.error):", errorMessage);
      alert(`An error occurred: ${errorMessage}`);
      // itemDeletionHook.clearError(); // Assuming a method to clear the error exists in the hook
      // Consider if clearError should be called or if the error should persist until a new action.
    }
  }, [itemDeletionHook.error]);

  // --- Finalize Production Mutation ---
  const finalizeProductionMutation = useMutation({
    mutationFn: (id: string) => finalizeRecipeProductionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      onClose();
      alert('Producció finalitzada i ingredients gastats correctament.');
      console.log(`Recipe ${recipeId} production finalized.`);
    },
    onError: (error: Error) => {
      console.error("Error finalizing recipe production:", error);
      alert(`Error en finalitzar la producció: ${error.message || 'Error desconegut'}.`);
    },
  });

  // --- Delete Handler ---
  const handleDeleteRecipe = () => {
    if (!recipe) return;
    const itemToDelete: ItemToDelete = {
      id: recipe._id,
      name: recipe.name,
      type: 'recipe',
    };
    itemDeletionHook.startDeletionProcess(itemToDelete);
  };

  // Handler for editing a dependent recipe from the modal
  const handleEditItemFromModal = (item: { id: string; name: string; type: 'recipe' | 'ingredient' }) => {
    if (item.type === 'recipe') {
      onOpenEditor(item.id, item.name);
    } else {
      // Handle ingredient editing if necessary, or log a warning if not expected here
      console.warn(`Editing for item type '${item.type}' from modal not implemented in RecipeTab.`);
    }
  };

  if (isLoading) {
    return <RecipeContainer><LoadingMessage>Carregant detalls de la recepta...</LoadingMessage></RecipeContainer>;
  }

  if (isError) {
    return (
      <RecipeContainer>
        <ErrorMessage>Error en carregar la recepta: {error?.message || 'Error desconegut'}</ErrorMessage>
      </RecipeContainer>
    );
  }

  if (recipe) {
    return (
      <RecipeContainer>
        <RecipeHeader>
          <RecipeName>{recipe.name}</RecipeName>
          <EditButton
            onClick={() => onOpenEditor(recipeId, recipe.name)}
            disabled={itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
          >
            Editar
          </EditButton>
          <DeleteButton
            onClick={handleDeleteRecipe}
            disabled={!recipe || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
          >
            {itemDeletionHook.isProcessingDelete ? 'Eliminant...' : (itemDeletionHook.isLoadingDependencies ? 'Comprovant...' : 'Eliminar recepta')}
          </DeleteButton>
          <ProductionModeToggle
            isActive={isProductionMode}
            onClick={onToggleProductionMode}
          >
            {isProductionMode ? 'Mode producció: ACTIU' : 'Mode producció: INACTIU'}
          </ProductionModeToggle>
          {isProductionMode && (
            <FinalizeButton
              onClick={() => finalizeProductionMutation.mutate(recipeId)}
              disabled={finalizeProductionMutation.isPending || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
            >
              {finalizeProductionMutation.isPending ? 'Finalitzant...' : 'Finalitzar (gastar ingredients)'}
            </FinalizeButton>
          )}
        </RecipeHeader>

        <SeparatorLine />

        <IngredientsWrapper>
          <IngredientList
            ingredients={recipe.ingredients}
            linkedRecipes={recipe.linkedRecipes}
            scaleFactor={scaleFactor}
            onOpenRecipeTab={handleOpenRecipeTab}
            isProductionMode={isProductionMode}
            trackedAmounts={trackedAmounts}
            onAmountTracked={onAmountTracked}
          />
        </IngredientsWrapper>

        <StepsWrapper>
          <StepList steps={recipe.steps} />
        </StepsWrapper>

        <ScalingWrapper>
           <ScalingControl
             scaleFactor={scaleFactor}
             onScaleChange={onScaleChange}
             baseYieldGrams={recipe.baseYieldGrams}
             disabled={isProductionMode}
           />
        </ScalingWrapper>
  
        {/* Unified Dependency Modal */}
        <UnifiedDependencyModal
          isOuterModalOpen={itemDeletionHook.isDependencyModalOpen}
          onOuterModalClose={itemDeletionHook.cancelDeletionProcess}
          outerItemName={itemDeletionHook.currentItem?.name || ''}
          outerItemType={itemDeletionHook.currentItem?.type || 'recipe'}
          outerItemDependentRecipes={itemDeletionHook.dependentItems.map(item => ({ id: item._id, name: item.name, type: 'recipe' }))}
          isLoadingOuterItemDependencies={itemDeletionHook.isLoadingDependencies}
          onRefreshOuterItemDependencies={itemDeletionHook.refreshDependencies}
          outerItemError={itemDeletionHook.error} // Pass error from the hook
          onEditRecipeInOuterModal={(recipeOrId: RecipeDetails | string) => {
            let id: string;
            let name: string;
            if (typeof recipeOrId === 'string') {
              id = recipeOrId;
              // Attempt to find the name from the dependent items, or use a placeholder
              const foundRecipe = itemDeletionHook.dependentItems.find(r => r._id === id);
              name = foundRecipe ? foundRecipe.name : 'Recipe';
            } else {
              id = recipeOrId._id;
              name = recipeOrId.name;
            }
            handleEditItemFromModal({ id, name, type: 'recipe' });
          }}
          // onEditIngredientInOuterModal prop would be needed if ingredients could be edited from here
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={itemDeletionHook.isConfirmationModalOpen}
          onClose={itemDeletionHook.confirmationModalProps?.onCancel || itemDeletionHook.cancelDeletionProcess}
          title={itemDeletionHook.confirmationModalProps?.title || "Confirm Deletion"}
          message={itemDeletionHook.confirmationModalProps?.message || "Are you sure?"}
          onConfirm={itemDeletionHook.confirmationModalProps?.onConfirm || (() => {})}
          confirmButtonText={itemDeletionHook.confirmationModalProps?.confirmText || "Confirm"}
          cancelButtonText={itemDeletionHook.confirmationModalProps?.cancelText || "Cancel"}
          // Spread any other specific props if necessary, but ensure required ones are met.
          // For example, if confirmButtonVariant is part of confirmationModalProps:
          // confirmButtonVariant={itemDeletionHook.confirmationModalProps?.confirmButtonVariant || 'danger'}
        />
      </RecipeContainer>
    );
  }

  return <RecipeContainer>No hi ha dades de la recepta disponibles.</RecipeContainer>;
};