import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { styled } from '@linaria/react';
import {
  getAllIngredients,
  updateIngredient,
  // deleteIngredient, // Handled by the new hook
  addStockToIngredientApi,
  PaginatedIngredientsResponse,
  // isIngredientInUseError, // Handled by the new hook
  // getIngredientDependencies, // Handled by the new hook
} from '../../api/ingredients';
// deleteRecipeApi import removed as recipe deletion is handled by the hook
import { Ingredient, UpdateIngredientDto } from '../../types/ingredient';
import { RecipeDetails } from '../../types/recipe';
import { useDebounce } from '../../utils/hooks';
import { formatAmount } from '../../utils/formatting';
import { UnifiedDependencyModal } from '../common/UnifiedDependencyModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useItemDeletion, ItemToDelete, DeletionCycleStatus } from '../../utils/useItemDeletion'; // Import new hook


// --- Styled Components (remain unchanged) ---

const PageTitle = styled.h2`
  text-align: center;
  margin-bottom: var(--space-lg);
`;
 
const IngredientsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 900px;
  margin: var(--space-lg) auto;
`;

const LeftColumnWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
`;


const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
`;

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
      background-color: var(--surface-color-light);
  }
`;

const BaseIngredientName = styled.span`
  flex-grow: 1;
  margin-right: var(--space-md);
  color: var(--text-color);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StockInfo = styled.span`
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  margin-left: var(--space-sm);
`;

const IngredientDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin-right: var(--space-md);
`;

const AddStockForm = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: var(--space-md);

  input[type="number"] {
    width: 70px;
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--border-radius);
    text-align: right;
  }
`;


const StatusMessage = styled.div`
  padding: var(--space-md) var(--space-lg);
  color: var(--text-color-light);
  font-style: italic;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--space-sm);
  margin-left: var(--space-md);
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: var(--border-width) solid var(--border-color);
  background-color: var(--surface-color);
  color: var(--text-color);
  box-shadow: none;

  &:hover:not(:disabled) {
    background-color: var(--background-color);
    border-color: var(--border-color);
  }
`;

const DeleteButton = styled(ActionButton)`
  border: var(--border-width) solid var(--border-color);
  color: var(--danger-color);
  background-color: transparent;

   &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1); // var(--danger-bg-hover) or similar could be a token
    color: var(--danger-color-dark);
    border-color: var(--border-color-hover);
  }
`;

const EditButton = styled(ActionButton)`
  color: var(--info-color);

  &:hover:not(:disabled) {
    background-color: var(--info-color);
    color: var(--text-on-primary);
    border-color: var(--info-color);
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  margin-bottom: var(--space-lg);

  button {
    padding: var(--space-sm) var(--space-md);
  }

  span {
    font-size: var(--font-size-sm);
    color: var(--text-color-light);
  }
`;

const ControlsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    margin-bottom: var(--space-lg);
`;

const SearchInput = styled.input`
  flex-grow: 1;
  font-size: var(--font-size-md);
  padding-top: var(--space-sm);
  padding-bottom: var(--space-sm);
  box-shadow: var(--shadow-sm);
`;


const LimitSelector = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;

    label {
        font-size: var(--font-size-sm);
        color: var(--text-color-light);
        white-space: nowrap;
    }

    select {
        padding: var(--space-xs) var(--space-sm);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--surface-color);
        color: var(--text-color);
        font-size: var(--font-size-sm);
    }
`;


// --- Component Implementation ---

const DEFAULT_LIMIT = 5;
const LIMIT_OPTIONS = [5, 10, 20, 50];

interface IngredientsTabProps {
  onOpenIngredientEditTab: (ingredientName: string, ingredientId?: string) => void;
  onOpenRecipeEditTab: (recipeId: string, recipeName: string) => void; // Added recipeName
}
 
export const IngredientsTab = ({ onOpenIngredientEditTab, onOpenRecipeEditTab }: IngredientsTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [addStockQuantities, setAddStockQuantities] = useState<Record<string, number>>({});
  
  // State related to old modal system removed

  const queryClient = useQueryClient(); // Moved up for use in callback

  const handleDeletionCycleComplete = useCallback((status: DeletionCycleStatus, itemId?: string) => {
    console.log(`IngredientsTab: Deletion cycle completed for item ${itemId} (type: ingredient) with status: ${status}`);
    // The hook itself handles query invalidation on successful deletion.
    // This callback is for any parent-specific actions post-deletion cycle.
    if (status === 'deleted') {
      // If any additional specific re-fetching for ingredients list is needed beyond what the hook does.
      // queryClient.invalidateQueries({ queryKey: ['ingredients'] }); // Likely already covered
    }
  }, []); // Removed queryClient dependency as it's not used directly here now

  const itemDeletionHook = useItemDeletion({ onDeletionCycleComplete: handleDeletionCycleComplete });
  
  const { data, isLoading, isFetching, isError, error } = useQuery<PaginatedIngredientsResponse, Error, PaginatedIngredientsResponse, readonly (string | number)[]>({
    queryKey: ['ingredients', currentPage, limit, debouncedSearchTerm],
    queryFn: () => getAllIngredients(currentPage, limit, debouncedSearchTerm),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, limit, currentPage]); // Added currentPage

  const ingredients: Ingredient[] | undefined = data?.data;
  const pagination = data?.pagination;
 
  // queryClient already defined above
 
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateIngredientDto }) =>
      updateIngredient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error) => {
      console.error("Error updating ingredient:", error);
      alert(`Error en actualitzar l'ingredient: ${(error as Error).message || 'Error desconegut'}`);
    },
  });

  // deleteMutation removed, handled by itemDeletionHook

  const addStockMutation = useMutation({
    mutationFn: ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) =>
      addStockToIngredientApi(ingredientId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error: Error, variables) => {
      console.error(`Error adding stock to ingredient ${variables.ingredientId}:`, error);
      alert(`Error en afegir stock: ${(error as Error).message || 'Error desconegut'}`);
    },
  });

  // Removed deleteListedRecipeDependencyMutation

  const handleStockQuantityChange = (ingredientId: string, value: string) => {
    const quantity = parseInt(value, 10);
    setAddStockQuantities(prev => ({
      ...prev,
      [ingredientId]: isNaN(quantity) || quantity < 0 ? 0 : quantity,
    }));
  };

  const handleAddStock = (ingredientId: string, name: string) => {
    const quantityToAdd = addStockQuantities[ingredientId];
    if (typeof quantityToAdd !== 'number' || quantityToAdd <= 0) {
      alert(`Si us plau, introduïu una quantitat vàlida per afegir a "${name}".`);
      return;
    }
    addStockMutation.mutate(
      { ingredientId, quantity: quantityToAdd },
      {
        onSuccess: () => {
          setAddStockQuantities(prev => ({ ...prev, [ingredientId]: 0 }));
          console.log(`Stock added successfully to ${name}.`);
        },
      }
    );
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    // Disable if other mutations are pending or if a deletion process is already active
    if (updateMutation.isPending ||
        (addStockMutation.isPending && addStockMutation.variables?.ingredientId === id) ||
        itemDeletionHook.isProcessingDelete ||
        itemDeletionHook.isLoadingDependencies) {
      return;
    }

    const itemToStartDelete: ItemToDelete = {
      id,
      name,
      type: 'ingredient',
    };
    itemDeletionHook.startDeletionProcess(itemToStartDelete);
  };

  const handleEditIngredient = (id: string, name: string) => {
    if (updateMutation.isPending ||
        (addStockMutation.isPending && addStockMutation.variables?.ingredientId === id) ||
        itemDeletionHook.isProcessingDelete ||
        itemDeletionHook.isLoadingDependencies) {
      return;
    }
    onOpenIngredientEditTab(name, id);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setCurrentPage(1);
  };

  // Old modal handlers (handleCloseIngredientModal, handleRefreshIngredientDependencies, handleDeleteRecipeFromIngredientDependencyModal) removed.
  // Old useEffect for recipeDeletionHook removed.

  const handleEditRecipeFromModal = (recipeOrId: RecipeDetails | string) => {
    let id: string;
    let name: string;
    if (typeof recipeOrId === 'string') {
      id = recipeOrId;
      const recipeDetails = itemDeletionHook.dependentItems?.find(r => r._id === id);
      name = recipeDetails ? recipeDetails.name : 'Recipe'; // Fallback name
    } else {
      id = recipeOrId._id;
      name = recipeOrId.name;
    }
    onOpenRecipeEditTab(id, name);
  };
  
  // useEffect to display errors from itemDeletionHook
  useEffect(() => {
    if (itemDeletionHook.error) {
      const errorMessage = itemDeletionHook.error; // Already a string
      console.error("IngredientsTab: Error from itemDeletionHook:", errorMessage);
      alert(`An error occurred: ${errorMessage}`);
      // Optionally, call a clearError function from the hook if available and desired
      // itemDeletionHook.clearError?.();
    }
  }, [itemDeletionHook.error]);


  return (
    <>
      <IngredientsContainer>
        <PageTitle>Gestió d'Ingredients</PageTitle>
   
      <LeftColumnWrapper>
 
        <ControlsContainer>
            <SearchInput
                type="search"
                placeholder="Cerca ingredients..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search Ingredients"
                disabled={isLoading || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
            />
            <LimitSelector>
                <label htmlFor="items-per-page">Per pàgina:</label>
                <select
                    id="items-per-page"
                    value={limit}
                    onChange={handleLimitChange}
                    disabled={isLoading || isFetching || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
                >
                    {LIMIT_OPTIONS.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </LimitSelector>
            <ActionButton
                onClick={() => onOpenIngredientEditTab("Nou Ingredient")}
                title="Afegir nou ingredient"
                style={{ flexShrink: 0 }}
                disabled={isLoading || isFetching || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
            >
                + Afegir
            </ActionButton>
        </ControlsContainer>
 
        {isLoading && <StatusMessage>Carregant ingredients...</StatusMessage>}
        {isError && (
          <StatusMessage>
            Error al carregar ingredients: {error?.message || 'Error desconegut'}
          </StatusMessage>
        )}

        {!isLoading && !isError && ingredients && pagination && (
           <>
              <IngredientList aria-live="polite">
              {ingredients.length === 0 ? (
                  <IngredientItem>
                      {debouncedSearchTerm
                          ? `No s'han trobat ingredients que coincideixin amb "${debouncedSearchTerm}"`
                          : "No s'han trobat ingredients"}
                  </IngredientItem>
              ) : (
                  ingredients.map((ingredient: Ingredient) => {
                  const quantityForThisIngredient = addStockQuantities[ingredient._id] || 0;
                  return (
                      <IngredientItem key={ingredient._id}>
                        <IngredientDetails>
                          <BaseIngredientName>
                            {ingredient.name}
                          </BaseIngredientName>
                          {typeof ingredient.quantityInStock === 'number' && (
                            <StockInfo>
                              Stock: {formatAmount(ingredient.quantityInStock)}
                            </StockInfo>
                          )}
                        </IngredientDetails>
                        <AddStockForm>
                          <input
                            type="number"
                            value={quantityForThisIngredient === 0 ? '' : quantityForThisIngredient}
                            onChange={(e) => handleStockQuantityChange(ingredient._id, e.target.value)}
                            placeholder="Quant."
                            min="0"
                            aria-label={`Quantitat a afegir per ${ingredient.name}`}
                            disabled={(addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
                          />
                          <ActionButton
                            onClick={() => handleAddStock(ingredient._id, ingredient.name)}
                            disabled={(addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) || quantityForThisIngredient <= 0 || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
                          >
                            Afegeix
                          </ActionButton>
                        </AddStockForm>
                        <ButtonContainer>
                            <EditButton
                                onClick={() => handleEditIngredient(ingredient._id, ingredient.name)}
                                disabled={updateMutation.isPending || (addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
                                title={`Edita ${ingredient.name}`}
                            >
                                Editar
                            </EditButton>
                            <DeleteButton
                                onClick={() => handleDeleteIngredient(ingredient._id, ingredient.name)}
                                disabled={
                                  updateMutation.isPending ||
                                  (addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) ||
                                  itemDeletionHook.isProcessingDelete ||
                                  itemDeletionHook.isLoadingDependencies
                                }
                            >
                                {itemDeletionHook.currentItem?.id === ingredient._id && (itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies)
                                  ? (itemDeletionHook.isProcessingDelete ? 'Eliminant...' : 'Comprovant...')
                                  : 'Eliminar'}
                            </DeleteButton>
                        </ButtonContainer>
                      </IngredientItem>
                  );
                  })
              )}
              </IngredientList>

              {pagination.totalPages > 1 && (
                  <PaginationControls>
                      <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || isLoading || isFetching}
                      >
                          Anterior
                      </button>
                      <span>
                          Pàgina {pagination.currentPage} de {pagination.totalPages}
                      </span>
                      <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                          disabled={currentPage === pagination.totalPages || isLoading || isFetching}
                      >
                          Següent
                      </button>
                  </PaginationControls>
              )}
           </>
        )}
      </LeftColumnWrapper>
 
    </IngredientsContainer>

    {/* Unified Dependency Modal (for ingredients) */}
    <UnifiedDependencyModal
      isOuterModalOpen={itemDeletionHook.isDependencyModalOpen && itemDeletionHook.currentItem?.type === 'ingredient'}
      onOuterModalClose={itemDeletionHook.cancelDeletionProcess}
      outerItemName={itemDeletionHook.currentItem?.name || ''}
      outerItemType={itemDeletionHook.currentItem?.type || 'ingredient'} // Should be 'ingredient' if this modal is open
      outerItemDependentRecipes={itemDeletionHook.dependentItems.map(item => ({ id: item._id, name: item.name, type: 'recipe' }))} // These are recipes dependent on the ingredient
      isLoadingOuterItemDependencies={itemDeletionHook.isLoadingDependencies}
      onRefreshOuterItemDependencies={itemDeletionHook.refreshDependencies}
      outerItemError={itemDeletionHook.error}
      onEditRecipeInOuterModal={handleEditRecipeFromModal}
      // No onEditIngredientInOuterModal as dependencies are recipes
    />

    {/* Confirmation Modal (for ingredients) */}
    <ConfirmationModal
      isOpen={itemDeletionHook.isConfirmationModalOpen && itemDeletionHook.currentItem?.type === 'ingredient'}
      onClose={itemDeletionHook.confirmationModalProps?.onCancel || itemDeletionHook.cancelDeletionProcess}
      title={itemDeletionHook.confirmationModalProps?.title || "Confirm Deletion"}
      message={itemDeletionHook.confirmationModalProps?.message || "Are you sure?"}
      onConfirm={itemDeletionHook.confirmationModalProps?.onConfirm || (() => {})}
      confirmButtonText={itemDeletionHook.confirmationModalProps?.confirmText || "Confirm"}
      cancelButtonText={itemDeletionHook.confirmationModalProps?.cancelText || "Cancel"}
    />
    </>
  );
};