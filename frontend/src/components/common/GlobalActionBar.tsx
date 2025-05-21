import React from 'react';
import { styled } from '@linaria/react';
import { ActionButton, PrimaryButton } from './Button'; // Assuming common buttons are in Button.tsx

interface GlobalActionBarProps {
  onOpenNewRecipeEditor: () => void;
  onOpenIngredientsTab: () => void;
  onOpenDefaultStepsTab: () => void;
}

const ActionBarContainer = styled.div`
  display: flex;
  justify-content: flex-end; /* Align buttons to the right */
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background-color: var(--surface-color); /* Or a slightly different shade like var(--surface-color-light) */
  border-bottom: var(--border-width) solid var(--border-color-light);
  box-shadow: var(--shadow-sm);
  gap: var(--space-md);
`;

export const GlobalActionBar: React.FC<GlobalActionBarProps> = ({
  onOpenNewRecipeEditor,
  onOpenIngredientsTab,
  onOpenDefaultStepsTab,
}) => {
  return (
    <ActionBarContainer>
      <ActionButton onClick={onOpenDefaultStepsTab} title="Gestiona els passos per defecte">
        Passos per Defecte
      </ActionButton>
      <ActionButton onClick={onOpenIngredientsTab} title="Mostra els ingredients">
        Ingredients
      </ActionButton>
      <PrimaryButton onClick={onOpenNewRecipeEditor} title="Crea una recepta nova">
        + Nova recepta
      </PrimaryButton>
    </ActionBarContainer>
  );
};
