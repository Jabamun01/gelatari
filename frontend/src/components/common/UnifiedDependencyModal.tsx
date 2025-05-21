import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ConfirmationModal } from './ConfirmationModal';
// RecipeDetails import removed as outerItemDependentRecipes is now ItemToDelete[]
import { useItemDeletion, ItemToDelete } from '../../utils/useItemDeletion';
import {
  ModalContentWrapper,
  MessageText,
  SuccessText,
  DependentList,
  DependentListItem,
  ItemName,
  ListItemActions,
  FooterActions,
  // ListItemPrimaryButton, // No longer used
  // ListItemDangerButton, // No longer used
} from './DependencyModalStyles';
import { PrimaryButton, DangerButton } from './Button'; // Import new buttons

interface UnifiedDependencyModalProps {
  isOuterModalOpen: boolean;
  onOuterModalClose: () => void;
  outerItemName: string;
  outerItemType: ItemToDelete['type'];
  outerItemDependentRecipes: ItemToDelete[]; // Changed from RecipeDetails[]
  isLoadingOuterItemDependencies?: boolean;
  onEditRecipeInOuterModal: (itemId: string) => void; // Renamed, itemId can be recipeId or other item id
  onRefreshOuterItemDependencies: () => void; // Renamed
  outerItemError?: string | null;
}

export const UnifiedDependencyModal: React.FC<UnifiedDependencyModalProps> = ({
  isOuterModalOpen,
  onOuterModalClose,
  outerItemName,
  outerItemType,
  outerItemDependentRecipes,
  isLoadingOuterItemDependencies,
  onEditRecipeInOuterModal,
  onRefreshOuterItemDependencies,
  outerItemError,
}) => {
  const getItemTypeDisplay = (type: string, capitalize: boolean): string => {
    let translatedType: string;
    // Ensure type is compared in a consistent case, e.g., lowercase
    switch (type.toLowerCase()) {
      case 'recipe':
        translatedType = 'recepta';
        break;
      case 'ingredient':
        translatedType = 'ingredient';
        break;
      default:
        translatedType = type; // Fallback
    }
    if (capitalize) {
      return translatedType.charAt(0).toUpperCase() + translatedType.slice(1);
    }
    return translatedType;
  };
  const [processingNestedItemTarget, setProcessingNestedItemTarget] = useState<ItemToDelete | null>(null);

  const handleNestedDeletionCycleComplete = () => {
    setProcessingNestedItemTarget(null);
    // Refresh outer item's dependencies regardless of nested success/cancel, to reflect any changes.
    onRefreshOuterItemDependencies();
  };

  const nestedItemDeletionHook = useItemDeletion({
    onDeletionCycleComplete: handleNestedDeletionCycleComplete,
  });

  useEffect(() => {
    if (processingNestedItemTarget) {
      // Ensure the hook's start function is stable or memoized if it's a dependency
      nestedItemDeletionHook.startDeletionProcess(processingNestedItemTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingNestedItemTarget]); // Only re-run if the target item changes

  const isThisModalBusy =
    !!isLoadingOuterItemDependencies || // Ensure boolean
    (processingNestedItemTarget !== null &&
      (nestedItemDeletionHook.isLoadingDependencies || nestedItemDeletionHook.isProcessingDelete));

  const modalTitle = `No es pot esborrar ${getItemTypeDisplay(outerItemType, true)}: ${outerItemName}`;

  const handleDeleteNestedItem = (itemToProcess: ItemToDelete) => {
    setProcessingNestedItemTarget(itemToProcess);
  };

  // Conditional rendering for nested deletion process
  // Ensure currentItem is available before rendering nested UDM that depends on it
  if (processingNestedItemTarget && nestedItemDeletionHook.currentItem) {
    const { confirmationModalProps: nestedConfirmProps } = nestedItemDeletionHook;
    return (
      <>
        {/* This is the "outer" modal rendering a "nested" instance of itself */}
        <UnifiedDependencyModal
          isOuterModalOpen={nestedItemDeletionHook.isDependencyModalOpen}
          onOuterModalClose={nestedItemDeletionHook.cancelDeletionProcess}
          outerItemName={nestedItemDeletionHook.currentItem.name}
          outerItemType={nestedItemDeletionHook.currentItem.type}
          outerItemDependentRecipes={nestedItemDeletionHook.dependentItems.map(recipe => ({
            id: recipe._id, // Map _id to id
            name: recipe.name,
            type: 'recipe', // Dependent items from useItemDeletion are recipes in this context
          }))}
          isLoadingOuterItemDependencies={nestedItemDeletionHook.isLoadingDependencies}
          onEditRecipeInOuterModal={(itemId) => {
            onEditRecipeInOuterModal(itemId); // Propagate to the original handler
            nestedItemDeletionHook.cancelDeletionProcess(); // Close nested deletion flow
          }}
          onRefreshOuterItemDependencies={nestedItemDeletionHook.refreshDependencies}
          outerItemError={nestedItemDeletionHook.error}
        />
        {nestedItemDeletionHook.isConfirmationModalOpen && nestedConfirmProps && (
          <ConfirmationModal
            isOpen={nestedItemDeletionHook.isConfirmationModalOpen}
            title={nestedConfirmProps.title}
            message={nestedConfirmProps.message}
            onConfirm={nestedConfirmProps.onConfirm}
            onClose={nestedConfirmProps.onCancel} // Map onCancel to onClose
            confirmButtonText={nestedConfirmProps.confirmText}
            cancelButtonText={nestedConfirmProps.cancelText}
            // confirmButtonVariant can be added if needed by ConfirmationModal and provided by hook
          />
        )}
      </>
    );
  }

  // Footer for the "outer" item's modal view
  const modalFooter = (
    <FooterActions>
    </FooterActions>
  );

  // Main content for the "outer" item's modal view
  return (
    <Modal
      isOpen={isOuterModalOpen}
      onClose={onOuterModalClose}
      title={modalTitle}
      footer={modalFooter}
    >
      <ModalContentWrapper>
        {/* Display outerItemError if present */}
        {outerItemError && (
          <MessageText style={{ color: 'var(--danger-color)' }}>
            Errada: {outerItemError}
          </MessageText>
        )}

        {isLoadingOuterItemDependencies && <MessageText>Carregant dependències...</MessageText>}

        {!isLoadingOuterItemDependencies && outerItemDependentRecipes.length > 0 && (
          <>
            <MessageText>
              L'element "{outerItemName}" ({outerItemType}) no es pot esborrar perquè el fan servir els elements següents.
              Pots editar-los o intentar esborrar-los des d'aquesta llista.
            </MessageText>
            <DependentList>
              {outerItemDependentRecipes.map((item) => (
                <DependentListItem key={item.id}>
                  <ItemName>{item.name} ({getItemTypeDisplay(item.type, false)})</ItemName>
                  <ListItemActions>
                    {item.type.toLowerCase() !== 'recipe' && (
                      <PrimaryButton // Use new PrimaryButton
                        onClick={() => onEditRecipeInOuterModal(item.id)}
                        disabled={isThisModalBusy}
                      >
                        Editar {getItemTypeDisplay(item.type, true)}
                      </PrimaryButton>
                    )}
                    <DangerButton // Use new DangerButton
                      onClick={() => handleDeleteNestedItem(item)}
                      disabled={isThisModalBusy}
                    >
                      Esborrar {getItemTypeDisplay(item.type, true)}
                    </DangerButton>
                  </ListItemActions>
                </DependentListItem>
              ))}
            </DependentList>
          </>
        )}
        {!isLoadingOuterItemDependencies && outerItemDependentRecipes.length === 0 && !outerItemError && (
          <SuccessText>
            Ja no hi ha més dependències per a "{outerItemName}". Ara el pots esborrar.
          </SuccessText>
        )}
      </ModalContentWrapper>
    </Modal>
  );
};