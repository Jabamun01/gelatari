import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecipeDependencies, deleteRecipe, DeleteRecipeResult } from '../api/recipes';
import { getIngredientDependencies, deleteIngredient } from '../api/ingredients';
import { RecipeDetails } from '../types/recipe'; // Assuming RecipeDetails is appropriate for dependent items
import { isIngredientInUseError } from '../api/ingredients'; // For ingredient conflict error

// --- Type Definitions ---

/**
 * Represents the status of a deletion cycle.
 */
export type DeletionCycleStatus = 'deleted' | 'cancelled' | 'error';

/**
 * Options for the useItemDeletion hook.
 */
export interface UseItemDeletionOptions {
  /**
   * Callback invoked when a deletion cycle (for one item) completes.
   * @param status - The final status of the deletion cycle.
   */
  onDeletionCycleComplete: (status: DeletionCycleStatus) => void;
}

/**
 * Represents an item to be processed for deletion.
 */
export interface ItemToDelete {
  id: string;
  name: string;
  type: 'recipe' | 'ingredient';
}

/**
 * Props for the confirmation modal used by the hook.
 */
export interface ConfirmationModalHookProps {
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Return type of the useItemDeletion hook.
 */
export interface UseItemDeletionReturn {
  /** The item currently being processed for deletion. */
  currentItem: ItemToDelete | null;
  /** Whether the dependency modal is open. */
  isDependencyModalOpen: boolean;
  /** Whether the confirmation modal is open. */
  isConfirmationModalOpen: boolean;
  /** List of items dependent on the currentItem. */
  dependentItems: RecipeDetails[];
  /** Whether dependencies are currently being loaded. */
  isLoadingDependencies: boolean;
  /** Whether the delete operation is currently in progress. */
  isProcessingDelete: boolean;
  /** Error message, if any occurred during the process. */
  error: string | null;
  /** Props for the confirmation modal. Null if no confirmation is active. */
  confirmationModalProps: ConfirmationModalHookProps | null;
  /**
   * Starts the deletion process for a given item.
   * @param itemToProcess - The item to delete.
   */
  startDeletionProcess: (itemToProcess: ItemToDelete) => void;
  /** Cancels the ongoing deletion process and resets the hook's state. */
  cancelDeletionProcess: () => void;
  /** Refreshes the dependency list for the currentItem. */
  refreshDependencies: () => void;
  /**
   * Called from the dependency modal to proceed to the final delete confirmation
   * after dependencies have been acknowledged or resolved.
   */
  requestConfirmDeleteItemFromDependencyModal: () => void;
}

/**
 * Custom hook to manage the deletion process for a single item (recipe or ingredient),
 * including handling dependencies and confirmation steps.
 *
 * @param options - Configuration options for the hook.
 * @returns An object containing state and functions to manage the item deletion process.
 */
export const useItemDeletion = (
  options: UseItemDeletionOptions,
): UseItemDeletionReturn => {
  const { onDeletionCycleComplete } = options;
  const queryClient = useQueryClient();

  const [currentItem, setCurrentItem] = useState<ItemToDelete | null>(null);

  const getItemTypeDisplayCatalan = (type: 'recipe' | 'ingredient', capitalize: boolean = false): string => {
    let translatedType: string;
    switch (type) {
      case 'recipe':
        translatedType = 'recepta';
        break;
      case 'ingredient':
        translatedType = 'ingredient';
        break;
      default:
        translatedType = type; // Fallback, though type is constrained
    }
    if (capitalize) {
      return translatedType.charAt(0).toUpperCase() + translatedType.slice(1);
    }
    return translatedType;
  };
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [dependentItems, setDependentItems] = useState<RecipeDetails[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationModalProps, setConfirmationModalProps] = useState<ConfirmationModalHookProps | null>(null);

  const resetFullState = useCallback(() => {
    setCurrentItem(null);
    setIsDependencyModalOpen(false);
    setIsConfirmationModalOpen(false);
    setDependentItems([]);
    setIsLoadingDependencies(false);
    setIsProcessingDelete(false);
    setError(null);
    setConfirmationModalProps(null);
  }, []);

  const cancelDeletionProcess = useCallback(() => {
    resetFullState();
    onDeletionCycleComplete('cancelled');
  }, [resetFullState, onDeletionCycleComplete]);

  const handleErrorInModal = useCallback((title: string, errorMessage: string, onConfirmAction?: () => void, onCancelAction?: () => void) => {
    setError(errorMessage);
    setConfirmationModalProps({
        title: title,
        message: errorMessage,
        onConfirm: () => {
            setIsConfirmationModalOpen(false);
            setConfirmationModalProps(null);
            if (onConfirmAction) onConfirmAction();
            else cancelDeletionProcess(); // Default to cancel
        },
        onCancel: () => {
            setIsConfirmationModalOpen(false);
            setConfirmationModalProps(null);
            if (onCancelAction) onCancelAction();
            else cancelDeletionProcess(); // Default to cancel
        },
        confirmText: onConfirmAction ? "Reintentar" : "D'acord",
        cancelText: onCancelAction ? "Cancel·lar" : (onConfirmAction ? "Cancel·lar" : undefined),
    });
    setIsConfirmationModalOpen(true);
    setIsProcessingDelete(false);
    setIsLoadingDependencies(false);
  }, [cancelDeletionProcess]);


  const fetchAndProcessDependencies = useCallback(async (itemToProcess: ItemToDelete, forceRefresh = false) => {
    if (!forceRefresh && dependentItems.length > 0 && currentItem?.id === itemToProcess.id) {
        setIsDependencyModalOpen(true);
        return;
    }

    setIsLoadingDependencies(true);
    setError(null);
    setDependentItems([]);

    try {
      let fetchedDependencies: RecipeDetails[] = [];
      if (itemToProcess.type === 'recipe') {
        fetchedDependencies = await getRecipeDependencies(itemToProcess.id);
      } else { // ingredient
        fetchedDependencies = await getIngredientDependencies(itemToProcess.id);
      }
      setDependentItems(fetchedDependencies);

      if (fetchedDependencies.length > 0) {
        setIsDependencyModalOpen(true);
      } else {
        setConfirmationModalProps({
          title: `Confirmar Esborrat`,
          message: `Estàs segur que vols esborrar ${getItemTypeDisplayCatalan(itemToProcess.type)} "${itemToProcess.name}"? Aquesta acció no es pot desfer.`,
          onConfirm: () => executeActualDeleteCallback(itemToProcess),
          onCancel: () => {
            setIsConfirmationModalOpen(false);
            setConfirmationModalProps(null);
            cancelDeletionProcess();
          },
          confirmText: "Esborrar",
          cancelText: "Cancel·lar",
        });
        setIsConfirmationModalOpen(true);
      }
    } catch (e: unknown) {
      let message = `Failed to fetch dependencies for ${itemToProcess.name}.`;
      if (e instanceof Error) {
        message = e.message;
      }
      handleErrorInModal(
        'Error en Carregar Dependències',
        message,
        () => fetchAndProcessDependencies(itemToProcess, true), // Retry
        () => cancelDeletionProcess() // Cancel
      );
    } finally {
      setIsLoadingDependencies(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ currentItem, dependentItems.length, handleErrorInModal, cancelDeletionProcess /* executeActualDelete should be added if not memoized with this*/ ]);


  const deleteRecipeMutation = useMutation<DeleteRecipeResult, Error, string>({
    mutationFn: deleteRecipe,
    onSuccess: (data, recipeId) => {
      setIsProcessingDelete(false);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
        queryClient.invalidateQueries({ queryKey: ['recipeDependencies', recipeId] });
        resetFullState();
        onDeletionCycleComplete('deleted');
      } else if (data.isConflict) {
        setError(data.error || 'Aquesta recepta està en ús i no es pot esborrar.');
        if (data.dependentParentRecipes && data.dependentParentRecipes.length > 0) {
          setDependentItems(data.dependentParentRecipes);
          setIsDependencyModalOpen(true);
        } else if (currentItem) {
          // Fallback to re-fetching if API didn't provide them but indicated conflict
          fetchAndProcessDependencies(currentItem, true); // fetchAndProcessDependencies is now defined
        } else {
          handleErrorInModal("Conflicte d'Esborrat", data.error || 'Aquesta recepta està en ús.');
          onDeletionCycleComplete('error');
        }
      } else {
        handleErrorInModal("L'esborrat ha fallat", data.error || 'No s\'ha pogut esborrar la recepta.');
        onDeletionCycleComplete('error');
      }
    },
    onError: (err) => {
      setIsProcessingDelete(false);
      const message = err.message || 'An unexpected error occurred while deleting the recipe.';
      if (currentItem && (message.toLowerCase().includes('in use') || message.toLowerCase().includes('dependency'))) {
        fetchAndProcessDependencies(currentItem, true); // fetchAndProcessDependencies is now defined
        setError(`No s'ha pogut esborrar: ${currentItem.name}. Encara podria estar en ús. Si us plau, comprova les dependències.`);
        // Don't call onDeletionCycleComplete yet
        return;
      }
      handleErrorInModal("Error d'esborrat", message);
      onDeletionCycleComplete('error');
    },
  });

  const deleteIngredientMutation = useMutation<
    // Adjusted to reflect that mutationFn will handle the void promise and transform errors
    { success: boolean; isConflict?: boolean; dependentRecipes?: RecipeDetails[]; error?: string },
    Error, // This is the error type if mutationFn re-throws or for network errors
    string // ingredientId
  >({
    mutationFn: async (ingredientId: string) => {
      try {
        await deleteIngredient(ingredientId);
        return { success: true };
      } catch (error) {
        if (isIngredientInUseError(error)) {
          return {
            success: false,
            isConflict: true,
            dependentRecipes: error.dependentRecipes,
            error: error.message,
          };
        }
        // Re-throw other errors to be caught by onError
        throw error;
      }
    },
    onSuccess: (data, ingredientId) => {
      setIsProcessingDelete(false);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        queryClient.invalidateQueries({ queryKey: ['ingredient', ingredientId] });
        queryClient.invalidateQueries({ queryKey: ['ingredientDependencies', ingredientId] });
        resetFullState();
        onDeletionCycleComplete('deleted');
      } else if (data.isConflict) {
         setError(data.error || 'Aquest ingredient està en ús i no es pot esborrar.');
         if (data.dependentRecipes && data.dependentRecipes.length > 0) {
            setDependentItems(data.dependentRecipes);
            setIsDependencyModalOpen(true);
         } else if (currentItem) {
            fetchAndProcessDependencies(currentItem, true); // fetchAndProcessDependencies is now defined
         } else {
            handleErrorInModal("Conflicte d'Esborrat", data.error || 'Aquest ingredient està en ús.');
            onDeletionCycleComplete('error');
         }
      } else {
        handleErrorInModal("L'esborrat ha fallat", data.error || 'No s\'ha pogut esborrar l\'ingredient.');
        onDeletionCycleComplete('error');
      }
    },
    onError: (err) => { // ingredientId removed as it's not used
      setIsProcessingDelete(false);
      // The mutationFn already transformed IngredientInUseError.
      // This onError handles network errors or other unexpected errors from deleteIngredient.
      const message = err.message || 'An unexpected error occurred while deleting the ingredient.';
      if (currentItem && (message.toLowerCase().includes('in use') || message.toLowerCase().includes('dependency'))) {
          fetchAndProcessDependencies(currentItem, true); // fetchAndProcessDependencies is now defined
          setError(`No s'ha pogut esborrar: ${currentItem.name}. Encara podria estar en ús. Si us plau, comprova les dependències.`);
          return;
      }
      handleErrorInModal("Error d'esborrat", message);
      onDeletionCycleComplete('error');
    },
  });

  const executeActualDeleteCallback = useCallback((item: ItemToDelete) => {
    setIsConfirmationModalOpen(false);
    setConfirmationModalProps(null);
    setIsProcessingDelete(true);
    setError(null);

    if (item.type === 'recipe') {
      deleteRecipeMutation.mutate(item.id);
    } else if (item.type === 'ingredient') {
      deleteIngredientMutation.mutate(item.id);
    }
  }, [deleteRecipeMutation, deleteIngredientMutation]);

  // Now, redefine fetchAndProcessDependencies with executeActualDeleteCallback in its scope and deps
  const fetchAndProcessDependenciesCallback = useCallback(async (itemToProcess: ItemToDelete, forceRefresh = false) => {
    if (!forceRefresh && dependentItems.length > 0 && currentItem?.id === itemToProcess.id) {
        setIsDependencyModalOpen(true);
        return;
    }

    setIsLoadingDependencies(true);
    setError(null);
    setDependentItems([]);

    try {
      let fetchedDependencies: RecipeDetails[] = [];
      if (itemToProcess.type === 'recipe') {
        fetchedDependencies = await getRecipeDependencies(itemToProcess.id);
      } else { // ingredient
        fetchedDependencies = await getIngredientDependencies(itemToProcess.id);
      }
      setDependentItems(fetchedDependencies);

      if (fetchedDependencies.length > 0) {
        setIsDependencyModalOpen(true);
      } else {
        setConfirmationModalProps({
          title: `Confirmar Esborrat`,
          message: `Estàs segur que vols esborrar ${getItemTypeDisplayCatalan(itemToProcess.type)} "${itemToProcess.name}"? Aquesta acció no es pot desfer.`,
          onConfirm: () => executeActualDeleteCallback(itemToProcess),
          onCancel: () => {
            setIsConfirmationModalOpen(false);
            setConfirmationModalProps(null);
            cancelDeletionProcess();
          },
          confirmText: "Esborrar",
          cancelText: "Cancel·lar",
        });
        setIsConfirmationModalOpen(true);
      }
    } catch (e: unknown) {
      let message = `Failed to fetch dependencies for ${itemToProcess.name}.`;
      if (e instanceof Error) {
        message = e.message;
      }
      handleErrorInModal(
        'Error en Carregar Dependències',
        message,
        () => fetchAndProcessDependenciesCallback(itemToProcess, true), // Recursive call needs to use the new name
        () => cancelDeletionProcess()
      );
    } finally {
      setIsLoadingDependencies(false);
    }
  }, [ currentItem, dependentItems.length, handleErrorInModal, cancelDeletionProcess, executeActualDeleteCallback ]);


  const startDeletionProcess = useCallback((itemToProcess: ItemToDelete) => {
    resetFullState();
    setCurrentItem(itemToProcess);
    fetchAndProcessDependenciesCallback(itemToProcess);
  }, [resetFullState, fetchAndProcessDependenciesCallback]);

  // cancelDeletionProcess is already defined above handleErrorInModal

  const refreshDependencies = useCallback(() => {
    if (currentItem) {
      fetchAndProcessDependenciesCallback(currentItem, true);
    }
  }, [currentItem, fetchAndProcessDependenciesCallback]);

  const requestConfirmDeleteItemFromDependencyModal = useCallback(() => {
    if (!currentItem) {
      setError("No s'ha seleccionat cap element per esborrar.");
      onDeletionCycleComplete('error');
      return;
    }
    setIsDependencyModalOpen(false); // Close dependency modal

    // Prepare confirmation for deleting the original item
    setConfirmationModalProps({
      title: `Confirmar Esborrat: ${currentItem.name}`,
      message: `Estàs a punt d'esborrar ${getItemTypeDisplayCatalan(currentItem.type)} "${currentItem.name}". Això pot afectar elements dependents si no s'han resolt. N'estàs segur?`,
      onConfirm: () => executeActualDeleteCallback(currentItem),
      onCancel: () => {
        setIsConfirmationModalOpen(false);
        setConfirmationModalProps(null);
        cancelDeletionProcess();
      },
      confirmText: "Esborrar Igualment",
      cancelText: "Cancel·lar",
    });
    setIsConfirmationModalOpen(true);
  }, [currentItem, executeActualDeleteCallback, onDeletionCycleComplete, cancelDeletionProcess]);


// The `handleErrorInModal` function is now used for most error displays.
// Mutations directly handle their specific conflict/success/error logic.

return {
  currentItem,
    isDependencyModalOpen,
    isConfirmationModalOpen,
    dependentItems,
    isLoadingDependencies,
    isProcessingDelete,
    error,
    confirmationModalProps,
    startDeletionProcess,
    cancelDeletionProcess,
    refreshDependencies,
    requestConfirmDeleteItemFromDependencyModal,
  };
};