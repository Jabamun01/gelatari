import React from 'react'; // Import React for event types
import { styled } from '@linaria/react';
import { TabData } from '../../types/tabs';

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onOpenNewRecipeEditor: () => void;
  onOpenIngredientsTab: () => void; // Add prop for opening ingredients tab
  onOpenDefaultStepsTab: () => void; // Add prop for opening default steps tab
}

const TabBarContainer = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allow tabs to wrap to the next line */
  align-items: stretch; /* Stretch items to fill height */
  border-bottom: var(--border-width) solid var(--tab-border-color);
  background-color: var(--surface-color);
  padding: 0 var(--space-sm); /* Adjust padding */
  gap: var(--space-xs);
  box-shadow: var(--shadow-sm);
  position: relative; /* For potential absolute positioning inside */
  min-height: 50px; /* Ensure a minimum height */
`;

// Define TabButtonProps to include the isActive prop for styling
interface TabButtonProps {
  isActive: boolean;
}

// Define a dedicated styled component for the close icon (span)
const CloseIcon = styled.span`
  margin-left: var(--space-sm);
  padding: var(--space-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1em; /* Make slightly larger */
  color: var(--text-color-light);
  opacity: 0.6; /* Start slightly more transparent */
  border-radius: 50%; /* Make it circular */
  width: 20px; /* Explicit size */
  height: 20px; /* Explicit size */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background-color 0.15s ease, opacity 0.15s ease, color 0.15s ease;

  /* Make it more visible on tab hover */
  button:hover & {
      opacity: 0.8;
  }

  &:hover,
  &:focus {
    opacity: 1;
    background-color: var(--danger-color); /* Red background on hover */
    color: var(--text-on-primary); /* White icon */
    outline: none;
  }
`;


const TabButton = styled.button<TabButtonProps>`
  padding: 0 var(--space-lg); /* Adjust padding, rely on align-items stretch */
  border: none;
  border-bottom: 3px solid transparent; /* Slightly thicker indicator */
  background-color: transparent; /* Make inactive tabs transparent */
  color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'var(--text-color-light)'};
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: ${({ isActive }) => isActive ? '600' : '500'};
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  margin-bottom: -1px; /* Overlap container border slightly */
  position: relative;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  /* Style for the active tab */
  ${({ isActive }) => isActive ? `
    border-bottom-color: var(--tab-active-border-color);
    color: var(--primary-color);
    /* Optional: Slightly different background for active tab if needed */
    /* background-color: var(--surface-color-light); */
  ` : ''}

  &:hover:not(:disabled) {
    background-color: var(--tab-hover-bg); /* Use hover background */
    color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'var(--text-color)'};
    border-bottom-color: ${({ isActive }) => isActive ? 'var(--tab-active-border-color)' : 'var(--border-color-light)'}; /* Subtle border hint on hover */
  }

  &:focus {
    outline: none;
    /* Add focus ring for accessibility */
    box-shadow: inset 0 0 0 2px var(--primary-color);
    z-index: 1; /* Ensure focus ring is visible */
  }
`;

// Style for the "New Recipe" button
// Inherit base button styles and customize
// Style the "New Recipe" button as a primary action
const ActionButton = styled.button` // Generic action button style
  padding: var(--space-sm) var(--space-md);
  align-self: center; /* Center vertically */
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: 1px solid var(--primary-color); /* Ensure border is consistent */
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--surface-color), 0 0 0 4px var(--primary-color); /* Focus ring */
  }
`;

const IngredientsButton = styled(ActionButton)`
  /* Specific styles for Ingredients button if needed, e.g., different color */
  /* For now, it will inherit ActionButton styles */
`;

const NewRecipeButton = styled(ActionButton)`
  /* No specific styles here, inherits from ActionButton */
`;

const RightAlignedActionsContainer = styled.div`
  display: flex;
  align-items: center; /* Align buttons vertically */
  margin-left: auto; /* Push this container to the right */
  gap: var(--space-sm); /* Space between buttons */
`;

const DefaultStepsButton = styled(ActionButton)`
  /* Specific styles for Default Steps button if needed */
`;


export const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose, onOpenNewRecipeEditor, onOpenIngredientsTab, onOpenDefaultStepsTab }: TabBarProps) => { // Destructure new props
  return (
    <TabBarContainer>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id} // Use tab.id (which should be the recipe._id for recipe tabs)
          isActive={tab.id === activeTabId}
          onClick={() => onTabClick(tab.id)}
          title={tab.title} // Tooltip
        >
          {tab.title}
          {tab.isCloseable && (
            <CloseIcon // Use the dedicated styled component
              role="button" // Accessibility: Indicate it acts like a button
              tabIndex={0} // Accessibility: Make it focusable
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent tab click when closing
                onTabClose(tab.id);
              }}
              onKeyDown={(e: React.KeyboardEvent) => { // Accessibility: Allow closing with Enter/Space
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault(); // Prevent potential default actions
                  e.stopPropagation();
                  onTabClose(tab.id);
                }
              }}
              title={`Tanca ${tab.title}`}
              aria-label={`Tanca ${tab.title}`}
            >
              ✕
            </CloseIcon>
          )}
        </TabButton>
      ))}
      <RightAlignedActionsContainer>
        <DefaultStepsButton onClick={onOpenDefaultStepsTab} title="Gestiona els passos per defecte">
          Passos per Defecte
        </DefaultStepsButton>
        <IngredientsButton onClick={onOpenIngredientsTab} title="Mostra els ingredients">
          Ingredients
        </IngredientsButton>
        <NewRecipeButton onClick={onOpenNewRecipeEditor} title="Crea una recepta nova">
          + Nova recepta
        </NewRecipeButton>
      </RightAlignedActionsContainer>
    </TabBarContainer>
  );
};