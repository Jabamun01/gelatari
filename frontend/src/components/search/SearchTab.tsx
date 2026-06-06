import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ActionButton, DangerButton, SecondaryButton } from '../common/Button';
import { fetchRecipes, RecipeApiResponse, RecipeSearchResult } from '../../api/recipes';
import { RecipeDetails } from '../../types/recipe';
import { useDebounce } from '../../utils/hooks';
import { UnifiedDependencyModal } from '../common/UnifiedDependencyModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useItemDeletion, ItemToDelete, DeletionCycleStatus } from '../../utils/useItemDeletion';

const DEFAULT_LIMIT = 10;
const LIMIT_OPTIONS = [5, 10, 20, 50];

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 800px;
  margin: var(--space-lg) auto;

  @media (max-width: 640px) {
    margin: var(--space-md) auto;
    gap: var(--space-md);
  }
`;

const SearchInput = styled.input`
  flex-grow: 1;
  font-size: var(--font-size-lg);
  padding-top: var(--space-md);
  padding-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
  border-radius: var(--border-radius-lg);

  @media (max-width: 900px) {
    font-size: var(--font-size-base);
  }

  @media (max-width: 640px) {
    padding-top: var(--space-sm);
    padding-bottom: var(--space-sm);
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: var(--space-md);
  }
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

const ResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
`;

const ResultItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  font-weight: 500;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--surface-color-light);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
  }
`;

const RecipeName = styled.span`
  cursor: pointer;
  flex-grow: 1;
  padding: var(--space-sm) 0;
  font-weight: 600;
  color: var(--text-color-strong);
  transition: color 0.15s ease;

  &:hover {
    color: var(--primary-color);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--space-sm);
  margin-left: var(--space-md);
  flex-shrink: 0;

  @media (max-width: 640px) {
    margin-left: 0;
    width: 100%;

    button {
      flex: 1;
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
  margin-top: var(--space-lg);
  margin-bottom: var(--space-lg);
`;

const NoResultsItem = styled.li`
  padding: var(--space-xl) var(--space-lg);
  font-style: italic;
  color: var(--text-color-light);
  cursor: default;
  text-align: center;
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;

  span {
    font-size: var(--font-size-sm);
    color: var(--text-color-light);
  }
`;

interface SearchTabProps {
  onOpenRecipeTab: (recipeId: string, recipeName: string) => void;
  onOpenRecipeEditor: (recipeId: string, recipeName: string) => void;
}

export const SearchTab = ({ onOpenRecipeTab, onOpenRecipeEditor }: SearchTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const handleDeletionCycleComplete = useCallback(
    (_status: DeletionCycleStatus, _itemId?: string) => {
      // handled by the hook
    },
    []
  );

  const itemDeletionHook = useItemDeletion({ onDeletionCycleComplete: handleDeletionCycleComplete });

  const { data, isLoading, isError, error, isFetching } = useQuery<
    RecipeApiResponse,
    Error,
    RecipeApiResponse,
    readonly (string | number)[]
  >({
    queryKey: ['recipes', debouncedSearchTerm, currentPage, limit],
    queryFn: () => fetchRecipes(currentPage, limit, debouncedSearchTerm),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (itemDeletionHook.error) {
      console.error('SearchTab: Error from itemDeletionHook:', itemDeletionHook.error);
    }
  }, [itemDeletionHook.error]);

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
    onOpenRecipeEditor(id, name);
  };

  const handleDeleteRecipe = (recipe: RecipeSearchResult) => {
    if (itemDeletionHook.isProcessingDelete || itemDeletionHook.isLoadingDependencies) return;

    const itemToStartDelete: ItemToDelete = {
      id: recipe._id,
      name: recipe.name,
      type: 'recipe',
    };
    itemDeletionHook.startDeletionProcess(itemToStartDelete);
  };

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, limit]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
  };

  const recipes = data?.recipes || [];
  const pagination = data;

  return (
    <SearchContainer>
      <ControlsContainer>
        <SearchInput
          type="search"
          placeholder="Cerca receptes..."
          value={searchTerm}
          onChange={handleSearchChange}
          aria-label="Cerca Receptes"
        />
        <LimitSelector>
          <label htmlFor="recipes-per-page">Per pàgina:</label>
          <select
            id="recipes-per-page"
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
      </ControlsContainer>

      {(isLoading || isFetching) && !data && (
        <StatusMessage aria-live="polite">Carregant receptes...</StatusMessage>
      )}

      {isError && (
        <ErrorMessage aria-live="polite" role="alert">
          Error en obtenir receptes: {error?.message || 'Error desconegut'}
        </ErrorMessage>
      )}

      {!isLoading && !isError && (
        <>
          <ResultsList aria-label="Resultats de la cerca de receptes">
            {recipes.length === 0 ? (
              <NoResultsItem key="no-results" role="status">
                {debouncedSearchTerm
                  ? `No s'han trobat receptes que coincideixin amb "${debouncedSearchTerm}".`
                  : "No s'han trobat receptes."}
              </NoResultsItem>
            ) : (
              recipes.map((recipe: RecipeSearchResult) => (
                <ResultItem key={recipe._id}>
                  <RecipeName
                    onClick={() => onOpenRecipeTab(recipe._id, recipe.name)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        onOpenRecipeTab(recipe._id, recipe.name);
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Veure ${recipe.name}`}
                  >
                    {recipe.name}
                  </RecipeName>
                  <ActionButtons>
                    <SecondaryButton
                      onClick={() => onOpenRecipeEditor(recipe._id, recipe.name)}
                      aria-label={`Editar ${recipe.name}`}
                    >
                      Editar
                    </SecondaryButton>
                    <DangerButton
                      onClick={() => handleDeleteRecipe(recipe)}
                      aria-label={`Eliminar ${recipe.name}`}
                      disabled={
                        itemDeletionHook.isProcessingDelete ||
                        (itemDeletionHook.isLoadingDependencies &&
                          itemDeletionHook.currentItem?.id === recipe._id)
                      }
                    >
                      {itemDeletionHook.isProcessingDelete &&
                      itemDeletionHook.currentItem?.id === recipe._id
                        ? 'Eliminant...'
                        : itemDeletionHook.isLoadingDependencies &&
                            itemDeletionHook.currentItem?.id === recipe._id
                          ? 'Comprovant...'
                          : 'Eliminar'}
                    </DangerButton>
                  </ActionButtons>
                </ResultItem>
              ))
            )}
          </ResultsList>

          {pagination && pagination.totalPages > 1 && (
            <PaginationControls>
              <ActionButton
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={
                  currentPage === 1 ||
                  isLoading ||
                  isFetching ||
                  itemDeletionHook.isProcessingDelete ||
                  itemDeletionHook.isLoadingDependencies
                }
              >
                Anterior
              </ActionButton>
              <span>
                Pàgina {pagination.currentPage} de {pagination.totalPages}
              </span>
              <ActionButton
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, pagination.totalPages)
                  )
                }
                disabled={
                  currentPage === pagination.totalPages ||
                  isLoading ||
                  isFetching ||
                  itemDeletionHook.isProcessingDelete ||
                  itemDeletionHook.isLoadingDependencies
                }
              >
                Següent
              </ActionButton>
            </PaginationControls>
          )}
        </>
      )}

      <UnifiedDependencyModal
        isOuterModalOpen={
          itemDeletionHook.isDependencyModalOpen &&
          itemDeletionHook.currentItem?.type === 'recipe'
        }
        onOuterModalClose={itemDeletionHook.cancelDeletionProcess}
        outerItemName={itemDeletionHook.currentItem?.name || ''}
        outerItemType={itemDeletionHook.currentItem?.type || 'recipe'}
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
          itemDeletionHook.currentItem?.type === 'recipe'
        }
        onClose={
          itemDeletionHook.confirmationModalProps?.onCancel ||
          itemDeletionHook.cancelDeletionProcess
        }
        title={itemDeletionHook.confirmationModalProps?.title || 'Confirm Deletion'}
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
    </SearchContainer>
  );
};
