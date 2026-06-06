import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { styled } from '@linaria/react';
import { ActionButton, DangerButton, SecondaryButton } from '../common/Button';
import { PaginationControls } from '../common/PaginationControls';
import {
  getAllIngredients,
  updateIngredient,
  addStockToIngredientApi,
  PaginatedIngredientsResponse,
} from '../../api/ingredients';
import { Ingredient, UpdateIngredientDto } from '../../types/ingredient';
import { RecipeDetails } from '../../types/recipe';
import { useDebounce } from '../../utils/hooks';
import { formatAmount } from '../../utils/formatting';
import { UnifiedDependencyModal } from '../common/UnifiedDependencyModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useItemDeletion, ItemToDelete, DeletionCycleStatus } from '../../utils/useItemDeletion';

const DEFAULT_LIMIT = 5;
const LIMIT_OPTIONS = [5, 10, 20, 50];

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

const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-lg);
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
  gap: var(--space-sm);
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--surface-color-light);
  }
`;

const IngredientDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 120px;
`;

const BaseIngredientName = styled.span`
  color: var(--text-color);
  font-weight: 500;
  font-size: var(--font-size-sm);
`;

const StockInfo = styled.span`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin-top: 2px;
`;

const AddStockForm = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;

  input[type='number'] {
    width: 72px;
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--border-radius);
    text-align: right;
    min-height: 36px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const StatusMessage = styled.div`
  padding: var(--space-md) var(--space-lg);
  color: var(--text-color-light);
  font-style: italic;
  text-align: center;
`;

const ErrorMessage = styled.div`
  padding: var(--space-lg);
  color: var(--danger-color-dark);
  background-color: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  font-size: var(--font-size-base);
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
    min-height: 36px;
  }
`;

interface IngredientsTabProps {
  onOpenIngredientEditTab: (ingredientName: string, ingredientId?: string) => void;
  onOpenRecipeEditTab: (recipeId: string, recipeName: string) => void;
}

export const IngredientsTab = ({ onOpenIngredientEditTab, onOpenRecipeEditTab }: IngredientsTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [addStockQuantities, setAddStockQuantities] = useState<Record<string, number>>({});

  const queryClient = useQueryClient();

  const handleDeletionCycleComplete = useCallback(
    (_status: DeletionCycleStatus, _itemId?: string) => {
      // handled by the hook
    },
    []
  );

  const itemDeletionHook = useItemDeletion({ onDeletionCycleComplete: handleDeletionCycleComplete });

  const { data, isLoading, isFetching, isError, error } = useQuery<
    PaginatedIngredientsResponse,
    Error,
    PaginatedIngredientsResponse,
    readonly (string | number)[]
  >({
    queryKey: ['ingredients', currentPage, limit, debouncedSearchTerm],
    queryFn: () => getAllIngredients(currentPage, limit, debouncedSearchTerm),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, limit]);

  const ingredients: Ingredient[] | undefined = data?.data;
  const pagination = data?.pagination;

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateIngredientDto }) =>
      updateIngredient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error) => {
      console.error('Error updating ingredient:', error);
      alert(`Error en actualitzar l'ingredient: ${(error as Error).message || 'Error desconegut'}`);
    },
  });

  const addStockMutation = useMutation({
    mutationFn: ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) =>
      addStockToIngredientApi(ingredientId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error: Error) => {
      console.error(`Error adding stock:`, error);
      alert(`Error en afegir stock: ${error.message || 'Error desconegut'}`);
    },
  });

  const handleStockQuantityChange = (ingredientId: string, value: string) => {
    const quantity = parseFloat(value);
    setAddStockQuantities((prev) => ({
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
          setAddStockQuantities((prev) => ({ ...prev, [ingredientId]: 0 }));
        },
      }
    );
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (updateMutation.isPending || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies) {
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
    if (updateMutation.isPending || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies) {
      return;
    }
    onOpenIngredientEditTab(name, id);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleEditRecipeFromModal = (recipeOrId: RecipeDetails | string) => {
    let id: string;
    let name: string;
    if (typeof recipeOrId === 'string') {
      id = recipeOrId;
      const recipeDetails = itemDeletionHook.dependentItems?.find((r) => r._id === id);
      name = recipeDetails ? recipeDetails.name : 'Recepta';
    } else {
      id = recipeOrId._id;
      name = recipeOrId.name;
    }
    onOpenRecipeEditTab(id, name);
  };

  useEffect(() => {
    if (itemDeletionHook.error) {
      console.error('IngredientsTab: Error from itemDeletionHook:', itemDeletionHook.error);
    }
  }, [itemDeletionHook.error]);

  return (
    <>
      <IngredientsContainer>
        <PageTitle>Gestió d'Ingredients</PageTitle>

        <ControlsContainer>
          <SearchInput
            type="search"
            placeholder="Cerca ingredients..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Cerca Ingredients"
            disabled={isLoading || itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies}
          />
          <LimitSelector>
            <label htmlFor="items-per-page">Per pàgina:</label>
            <select
              id="items-per-page"
              value={limit}
              onChange={handleLimitChange}
              disabled={isLoading || isFetching}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </LimitSelector>
          <ActionButton
            onClick={() => onOpenIngredientEditTab('Nou Ingredient')}
            title="Afegir nou ingredient"
            style={{ flexShrink: 0 }}
            disabled={isLoading || isFetching}
          >
            + Afegir
          </ActionButton>
        </ControlsContainer>

        {isLoading && <StatusMessage aria-live="polite">Carregant ingredients...</StatusMessage>}
        {isError && (
          <ErrorMessage aria-live="polite" role="alert">
            Error al carregar ingredients: {error?.message || 'Error desconegut'}
          </ErrorMessage>
        )}

        {!isLoading && !isError && ingredients && pagination && (
          <>
            <IngredientList aria-label="Llista d'ingredients">
              {ingredients.length === 0 ? (
                <IngredientItem>
                  <span style={{ fontStyle: 'italic', color: 'var(--text-color-light)', fontSize: 'var(--font-size-sm)' }}>
                    {debouncedSearchTerm
                      ? `No s'han trobat ingredients que coincideixin amb "${debouncedSearchTerm}"`
                      : "No s'han trobat ingredients"}
                  </span>
                </IngredientItem>
              ) : (
                ingredients.map((ingredient: Ingredient) => {
                  const quantityForThisIngredient = addStockQuantities[ingredient._id] || 0;
                  return (
                    <IngredientItem key={ingredient._id}>
                      <IngredientDetails>
                        <BaseIngredientName>{ingredient.name}</BaseIngredientName>
                        {typeof ingredient.quantityInStock === 'number' && (
                          <StockInfo>Stock: {formatAmount(ingredient.quantityInStock)}</StockInfo>
                        )}
                      </IngredientDetails>
                      <AddStockForm>
                        <input
                          type="number"
                          value={quantityForThisIngredient === 0 ? '' : quantityForThisIngredient}
                          onChange={(e) => handleStockQuantityChange(ingredient._id, e.target.value)}
                          placeholder="Quant."
                          min="0"
                          step="any"
                          aria-label={`Quantitat a afegir per ${ingredient.name}`}
                          disabled={
                            (addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) ||
                            itemDeletionHook.isProcessingDelete ||
                            itemDeletionHook.isLoadingDependencies
                          }
                        />
                        <ActionButton
                          onClick={() => handleAddStock(ingredient._id, ingredient.name)}
                          aria-label={`Afegeix stock per ${ingredient.name}`}
                          disabled={
                            (addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) ||
                            quantityForThisIngredient <= 0 ||
                            itemDeletionHook.isProcessingDelete ||
                            itemDeletionHook.isLoadingDependencies
                          }
                        >
                          Afegeix
                        </ActionButton>
                      </AddStockForm>
                      <ButtonContainer>
                        <SecondaryButton
                          onClick={() => handleEditIngredient(ingredient._id, ingredient.name)}
                          disabled={
                            updateMutation.isPending ||
                            (addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) ||
                            itemDeletionHook.isProcessingDelete ||
                            itemDeletionHook.isLoadingDependencies
                          }
                          title={`Edita ${ingredient.name}`}
                        >
                          Editar
                        </SecondaryButton>
                        <DangerButton
                          onClick={() => handleDeleteIngredient(ingredient._id, ingredient.name)}
                          disabled={
                            updateMutation.isPending ||
                            (addStockMutation.isPending && addStockMutation.variables?.ingredientId === ingredient._id) ||
                            itemDeletionHook.isProcessingDelete ||
                            itemDeletionHook.isLoadingDependencies
                          }
                        >
                          {itemDeletionHook.currentItem?.id === ingredient._id &&
                          (itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies)
                            ? itemDeletionHook.isProcessingDelete
                              ? 'Eliminant...'
                              : 'Comprovant...'
                            : 'Eliminar'}
                        </DangerButton>
                      </ButtonContainer>
                    </IngredientItem>
                  );
                })
              )}
            </IngredientList>

            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              isLoading={isLoading || isFetching}
            />
          </>
        )}
      </IngredientsContainer>

      <UnifiedDependencyModal
        isOuterModalOpen={
          itemDeletionHook.isDependencyModalOpen &&
          itemDeletionHook.currentItem?.type === 'ingredient'
        }
        onOuterModalClose={itemDeletionHook.cancelDeletionProcess}
        outerItemName={itemDeletionHook.currentItem?.name || ''}
        outerItemType={itemDeletionHook.currentItem?.type || 'ingredient'}
        outerItemDependentRecipes={itemDeletionHook.dependentItems.map((item) => ({
          id: item._id,
          name: item.name,
          type: 'recipe' as const,
        }))}
        isLoadingOuterItemDependencies={itemDeletionHook.isLoadingDependencies}
        onRefreshOuterItemDependencies={itemDeletionHook.refreshDependencies}
        outerItemError={itemDeletionHook.error}
        onEditRecipeInOuterModal={handleEditRecipeFromModal}
      />

      <ConfirmationModal
        isOpen={
          itemDeletionHook.isConfirmationModalOpen &&
          itemDeletionHook.currentItem?.type === 'ingredient'
        }
        onClose={
          itemDeletionHook.confirmationModalProps?.onCancel ||
          itemDeletionHook.cancelDeletionProcess
        }
        title={itemDeletionHook.confirmationModalProps?.title || 'Confirm Deletion'}
        message={itemDeletionHook.confirmationModalProps?.message || 'Are you sure?'}
        onConfirm={itemDeletionHook.confirmationModalProps?.onConfirm || (() => {})}
        confirmButtonText={itemDeletionHook.confirmationModalProps?.confirmText || 'Confirm'}
        cancelButtonText={itemDeletionHook.confirmationModalProps?.cancelText || 'Cancel'}
      />
    </>
  );
};
